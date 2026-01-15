"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Rocket, DollarSign, Image as ImageIcon, Clock, TrendingUp } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useBullRunContract } from "@/hooks/use-bullrun-contract"
import { useLiquidityLauncher } from "@/hooks/use-liquidity-launcher"
import { TOKEN_FACTORY_ADDRESS, LIQUIDITY_LAUNCHER_ADDRESS, CONTINUOUS_CLEARING_AUCTION_FACTORY_ADDRESS, type MigratorParameters, type AuctionParameters } from "@/lib/liquidity-launcher"
import { getTokenBySymbol } from "@/lib/tokens"
import { encodeAbiParameters, parseAbiParameters } from "viem"
import { useAccount, useBlockNumber } from "wagmi"
import { toast } from "sonner"

interface CreateBullRunFormProps {
  onGameCreated: (gameData: {
    id: string
    gameLink: string
    prizePool: number
    duration: number
  }) => void
}

export function CreateBullRunForm({ onGameCreated }: CreateBullRunFormProps) {
  const [formData, setFormData] = useState({
    coinName: "",
    ticker: "",
    image: "", // Will store data URL for preview
    imageFile: null as File | null,
    auctionDuration: 24, // hours
    priceFloor: "",
    prizePool: "0",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const { address } = useAccount()
  const { data: currentBlockNumber } = useBlockNumber({ watch: true })
  
  const { 
    createGame, 
    createGameAfterApproval,
    isLoading: isBullRunLoading, 
    error: contractError, 
    isCreateGameSuccess,
    currentStep: bullRunStep,
    minBudget 
  } = useBullRunContract()

  const {
    createToken: createLiquidityToken,
    distributeToken: distributeLiquidityToken,
    isLoading: isLiquidityLauncherLoading,
    error: liquidityLauncherError,
    isCreateTokenSuccess,
    isDistributeTokenSuccess,
    currentStep: liquidityStep,
    createTokenHash,
    distributeTokenHash,
    createdTokenAddress
  } = useLiquidityLauncher()

  const isLoading = isBullRunLoading || isLiquidityLauncherLoading
  const currentStep = liquidityStep !== 'idle' ? liquidityStep : bullRunStep

  // Store form data for the second step
  const [pendingGameData, setPendingGameData] = useState<{
    prizePool: string;
  } | null>(null)

  // Store created token address
  const [tokenAddress, setTokenAddress] = useState<`0x${string}` | null>(null)

  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors({ ...errors, image: "Please select a valid image file" })
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, image: "Image file size must be less than 5MB" })
        return
      }

      // Create preview URL
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData({
          ...formData,
          image: reader.result as string,
          imageFile: file
        })
        // Clear image error if file is valid
        if (errors.image) {
          const newErrors = { ...errors }
          delete newErrors.image
          setErrors(newErrors)
        }
      }
      reader.onerror = () => {
        setErrors({ ...errors, image: "Failed to read image file" })
      }
      reader.readAsDataURL(file)
    }
  }

  // Helper function to encode auction steps data
  // Format: Each step is encoded as abi.encodePacked(uint24 mps, uint40 blockDelta)
  // Solidity uses big-endian encoding for integers in abi.encodePacked
  // uint24 = 3 bytes, uint40 = 5 bytes, total = 8 bytes per step
  // Steps should be monotonically increasing in token issuance rate
  const encodeAuctionSteps = (steps: Array<{ mps: number; blockDelta: number }>): `0x${string}` => {
    let encoded = '0x' as `0x${string}`
    for (const step of steps) {
      // Encode uint24 mps (3 bytes, big-endian)
      const mps = BigInt(step.mps) & BigInt(0xFFFFFF)
      const mpsBytes = new Uint8Array(3)
      for (let i = 0; i < 3; i++) {
        mpsBytes[2 - i] = Number((mps >> BigInt(i * 8)) & BigInt(0xFF))
      }
      
      // Encode uint40 blockDelta (5 bytes, big-endian)
      const blockDelta = BigInt(step.blockDelta) & BigInt(0xFFFFFFFFFF)
      const blockDeltaBytes = new Uint8Array(5)
      for (let i = 0; i < 5; i++) {
        blockDeltaBytes[4 - i] = Number((blockDelta >> BigInt(i * 8)) & BigInt(0xFF))
      }
      
      // Concatenate: mps (3 bytes) + blockDelta (5 bytes) = 8 bytes total
      const stepBytes = new Uint8Array([...mpsBytes, ...blockDeltaBytes])
      const hex = Array.from(stepBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
      encoded = (encoded + hex) as `0x${string}`
    }
    return encoded
  }

  // Helper function to start distribution after token is created
  const startDistribution = async (tokenAddr: `0x${string}`, totalSupplyWei: bigint) => {
    if (!address) {
      toast.error("Wallet not connected")
      return
    }

    try {
      // Get USDC address for Sepolia (chainId 11155111)
      // TODO: Add Sepolia USDC to tokens.ts or use a constant
      const usdcAddress = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" as `0x${string}` // Sepolia USDC
      
      // Get current block number (use actual block number if available, otherwise estimate)
      const currentBlock = currentBlockNumber ? BigInt(currentBlockNumber.toString()) : BigInt(0)
      if (currentBlock === BigInt(0)) {
        throw new Error("Unable to get current block number. Please try again.")
      }
      
      // Calculate block numbers
      // Sepolia has ~12 seconds per block, so auctionDurationBlocks = duration_hours * 3600 / 12
      const auctionDurationBlocks = BigInt(Math.floor(formData.auctionDuration * 3600 / 12))
      const startBlock = currentBlock + BigInt(5) // Start 5 blocks from now (buffer for transaction confirmation)
      const endBlock = startBlock + auctionDurationBlocks
      const claimBlock = endBlock + BigInt(10) // 10 blocks after end for claiming
      const migrationBlock = endBlock + BigInt(100) // 100 blocks after end for migration
      const sweepBlock = migrationBlock + BigInt(1000) // 1000 blocks after migration for sweeping

      // Calculate token split (80% to auction, 20% to reserve)
      // tokenSplitToAuction is in mps (1e7 = 100%), so 80% = 8e6
      const tokenSplitToAuction = 8e6 // 80%

      // Create auction steps (monotonically increasing as recommended)
      // Steps should increase issuance rate over time
      // Each step: (mps per block, block delta)
      // mps is in 1e7 basis, so 1e6 = 0.1% per block, 1e5 = 0.01% per block
      const totalBlocks = Number(auctionDurationBlocks)
      const step1Blocks = Math.floor(totalBlocks * 0.4) // First 40% of auction
      const step2Blocks = Math.floor(totalBlocks * 0.4) // Next 40%
      const step3Blocks = totalBlocks - step1Blocks - step2Blocks // Final 20% (most important for price discovery)
      
      // Issuance rates: start low, increase over time
      // Step 1: 0.05% per block (5e5 mps)
      // Step 2: 0.1% per block (1e6 mps)  
      // Step 3: 0.15% per block (1.5e6 mps) - higher rate at end for better price discovery
      const auctionSteps = encodeAuctionSteps([
        { mps: 5e5, blockDelta: step1Blocks }, // 0.05% per block for first 40%
        { mps: 1e6, blockDelta: step2Blocks }, // 0.1% per block for next 40%
        { mps: 15e5, blockDelta: step3Blocks } // 0.15% per block for final 20% (critical for final price)
      ])

      // Build MigratorParameters
      const migratorParams: MigratorParameters = {
        migrationBlock,
        currency: usdcAddress,
        poolLPFee: 3000, // 0.3% fee (in hundredths of a bip, so 3000 = 0.3%)
        poolTickSpacing: 60, // Standard tick spacing
        tokenSplitToAuction,
        auctionFactory: CONTINUOUS_CLEARING_AUCTION_FACTORY_ADDRESS,
        positionRecipient: address,
        sweepBlock,
        operator: address,
        createOneSidedTokenPosition: false,
        createOneSidedCurrencyPosition: false
      }

      // Build AuctionParameters
      // fundsRecipient should be MSG_SENDER (address(1)) which means the strategy will receive funds
      const MSG_SENDER = "0x0000000000000000000000000000000000000001" as `0x${string}`
      
      // Floor price in Q96 format (multiply by 2^96)
      // Price is: currency per token, so if priceFloor is in USDC, we need to convert
      // Q96 = 2^96 = 79228162514264337593543950336
      const Q96 = BigInt("79228162514264337593543950336")
      // floorPrice in USDC (6 decimals) per token (18 decimals)
      // For Q96: price = (currencyAmount * 1e6) * Q96 / (tokenAmount * 1e18)
      // Simplified: if priceFloor is "0.001" USDC per token:
      // price = 0.001 * 1e6 * Q96 / 1e18 = 0.001 * Q96 / 1e12
      const priceFloorValue = Number.parseFloat(formData.priceFloor)
      const floorPriceQ96 = BigInt(Math.floor(priceFloorValue * 1e6)) * Q96 / BigInt(1e18)
      
      // Tick spacing: should be at least 1 basis point (0.01%) of floor price
      // Recommended: 1% or 10% of floor price for gas efficiency
      // Using 1% = 0.01 * floorPriceQ96 / 100 = floorPriceQ96 / 10000
      // But tick spacing is a uint256, so we'll use a reasonable fixed value
      // Documentation suggests at least 1 basis point, 1% or 10% is reasonable
      // Using 1% of floor price as tick spacing
      const tickSpacing = floorPriceQ96 / BigInt(10000) // 1% of floor price
      
      const auctionParams: AuctionParameters = {
        currency: usdcAddress,
        tokensRecipient: address, // Leftover tokens go to user
        fundsRecipient: MSG_SENDER, // Must be MSG_SENDER for LBP strategy
        startBlock,
        endBlock,
        claimBlock,
        tickSpacing, // Calculated as 1% of floor price
        validationHook: "0x0000000000000000000000000000000000000000" as `0x${string}`, // No validation hook
        floorPrice: floorPriceQ96, // In Q96 format
        requiredCurrencyRaised: BigInt(0), // No minimum required (can be set if needed)
        auctionStepsData: auctionSteps
      }

      toast.info("Starting token distribution (auction)...")

      await distributeLiquidityToken(
        tokenAddr,
        totalSupplyWei,
        migratorParams,
        auctionParams,
        address // governanceAddress
      )

    } catch (error) {
      console.error("Failed to distribute token:", error)
      toast.error(`Failed to start auction: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Handle successful token creation - extract token address and start distribution
  useEffect(() => {
    if (isCreateTokenSuccess && createTokenHash && !tokenAddress) {
      toast.success("✅ Token created successfully!")
      
      // Try to get token address from the hook
      if (createdTokenAddress) {
        setTokenAddress(createdTokenAddress)
        // Calculate total supply in wei (1B tokens with 18 decimals)
        const totalSupplyWei = BigInt("1000000000000000000000000000")
        // Start distribution automatically
        startDistribution(createdTokenAddress, totalSupplyWei)
      } else {
        // If we don't have the address yet, show a message
        toast.info("Token created! Extracting token address from transaction...")
      }
    }
  }, [isCreateTokenSuccess, createTokenHash, createdTokenAddress, tokenAddress, address, formData.auctionDuration, formData.priceFloor])

  // Handle successful token distribution - then create BullRun game
  useEffect(() => {
    if (isDistributeTokenSuccess && tokenAddress && pendingGameData) {
      toast.success("🚀 Auction started successfully!")
      // Now create the BullRun game with the token address
      // First approve USDC, then create game
      createGame(tokenAddress, pendingGameData.prizePool)
    }
  }, [isDistributeTokenSuccess, tokenAddress, pendingGameData, createGame])

  // Handle successful game creation
  useEffect(() => {
    if (isCreateGameSuccess) {
      toast.success("🎮 Game created successfully!")
      // You might want to get the actual game ID from the contract here
      const gameId = Math.random().toString(36).substring(7) // Temporary fallback
      const gameData = {
        id: gameId,
        gameLink: `${window.location.origin}/game/${gameId}`,
        prizePool: Number.parseFloat(formData.prizePool),
        duration: formData.auctionDuration,
      }
      onGameCreated(gameData)
    }
  }, [isCreateGameSuccess, formData.prizePool, formData.auctionDuration, onGameCreated])

  // Handle contract errors
  useEffect(() => {
    if (contractError) {
      toast.error(`Contract Error: ${contractError}`)
    }
    if (liquidityLauncherError) {
      toast.error(`LiquidityLauncher Error: ${liquidityLauncherError}`)
    }
  }, [contractError, liquidityLauncherError])

  // Auto-create game after USDC approval succeeds
  useEffect(() => {
    if (currentStep === 'approving' && pendingGameData) {
      // Wait a bit for the approval transaction to be confirmed
      const timer = setTimeout(() => {
        if (pendingGameData) {
          // Note: Contract still requires coinAddress, using placeholder
          const placeholderCoinAddress = "0x0000000000000000000000000000000000000000"
          createGameAfterApproval(placeholderCoinAddress, pendingGameData.prizePool)
        }
      }, 2000) // Wait 2 seconds for approval confirmation

      return () => clearTimeout(timer)
    }
  }, [currentStep, pendingGameData, createGameAfterApproval])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Validate Coin name
    if (!formData.coinName || formData.coinName.trim() === "") {
      newErrors.coinName = "Coin name is required"
    }

    // Validate Ticker
    if (!formData.ticker || formData.ticker.trim() === "") {
      newErrors.ticker = "Ticker is required"
    } else if (formData.ticker.length > 10) {
      newErrors.ticker = "Ticker must be 10 characters or less"
    }

    // Validate Image
    if (!formData.imageFile && !formData.image) {
      newErrors.image = "Image is required"
    }

    // Validate Auction Duration (already validated by slider, but check range)
    if (formData.auctionDuration < 1 || formData.auctionDuration > 168) {
      newErrors.auctionDuration = "Auction duration must be between 1 and 168 hours"
    }

    // Validate Price Floor
    if (!formData.priceFloor || formData.priceFloor.trim() === "") {
      newErrors.priceFloor = "Price floor is required"
    } else {
      const priceFloor = Number.parseFloat(formData.priceFloor)
      if (Number.isNaN(priceFloor) || priceFloor < 0) {
        newErrors.priceFloor = "Price floor must be a valid positive number"
      }
    }

    // Validate prize pool
    const prizePool = Number.parseFloat(formData.prizePool)
    if (!formData.prizePool || Number.isNaN(prizePool)) {
      newErrors.prizePool = "Prize pool is required"
    } else if (prizePool < 0) {
      newErrors.prizePool = "Prize pool cannot be negative"
    }

    // Check against contract minimum if available
    if (minBudget && prizePool < Number(minBudget)) {
      newErrors.prizePool = `Minimum prize pool is ${minBudget} USDC (contract requirement)`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      // Store the game data for later use
      setPendingGameData({
        prizePool: formData.prizePool
      })

      // Step 1: Create token via LiquidityLauncher
      toast.info("Creating token via LiquidityLauncher...")
      
      // Calculate total supply (e.g., 1 billion tokens with 18 decimals)
      const totalSupply = "1000000000" // 1B tokens
      const decimals = 18
      
      // Recipient should be LiquidityLauncher address when using multicall
      // For now, we'll use the launcher address so tokens go there first
      const recipient = LIQUIDITY_LAUNCHER_ADDRESS

      // Create token
      await createLiquidityToken(
        formData.coinName,
        formData.ticker,
        decimals,
        totalSupply,
        recipient,
        `A token for ${formData.coinName} game`,
        window.location.origin, // website
        formData.image || "", // imageUri
        TOKEN_FACTORY_ADDRESS // tokenFactory - update TOKEN_FACTORY_ADDRESS in lib/liquidity-launcher.ts
      )
      
      toast.info("Token creation submitted! Waiting for confirmation...")
      
    } catch (error) {
      console.error("Failed to create token:", error)
      toast.error(`Failed to create token: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setPendingGameData(null)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Coin Information */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <span>Coin Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Coin Name */}
          <div className="space-y-2">
            <Label htmlFor="coinName">Coin Name</Label>
            <Input
              id="coinName"
              placeholder="e.g., My Awesome Coin"
              value={formData.coinName}
              onChange={(e) => setFormData({ ...formData, coinName: e.target.value })}
              className="bg-gray-700 border-gray-600"
            />
            {errors.coinName && <p className="text-red-400 text-sm">{errors.coinName}</p>}
          </div>

          {/* Ticker */}
          <div className="space-y-2">
            <Label htmlFor="ticker">Ticker Symbol</Label>
            <Input
              id="ticker"
              placeholder="e.g., MAC"
              value={formData.ticker}
              onChange={(e) => setFormData({ ...formData, ticker: e.target.value.toUpperCase() })}
              className="bg-gray-700 border-gray-600 uppercase"
              maxLength={10}
            />
            {errors.ticker && <p className="text-red-400 text-sm">{errors.ticker}</p>}
          </div>

          {/* Image File Upload */}
          <div className="space-y-2">
            <Label htmlFor="image">Coin Image</Label>
            <div className="relative">
              <input
                type="file"
                id="image"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <label
                htmlFor="image"
                className="flex items-center justify-center w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <ImageIcon className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-300">
                    {formData.imageFile ? formData.imageFile.name : "Choose image file"}
                  </span>
                </div>
              </label>
            </div>
            {errors.image && <p className="text-red-400 text-sm">{errors.image}</p>}
            {formData.image && (
              <div className="mt-2">
                <img
                  src={formData.image}
                  alt="Coin preview"
                  className="w-20 h-20 rounded-lg object-cover border border-gray-600"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                  }}
                />
              </div>
            )}
            <p className="text-xs text-gray-400">Accepted formats: JPG, PNG, GIF, WebP (max 5MB)</p>
          </div>
        </CardContent>
      </Card>

      {/* Auction Settings */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-orange-400" />
            <span>Auction Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Auction Duration Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="auctionDuration">Auction Duration</Label>
              <span className="text-lg font-bold text-orange-400">{formData.auctionDuration} hours</span>
            </div>
            <input
              type="range"
              id="auctionDuration"
              min="1"
              max="168"
              step="1"
              value={formData.auctionDuration}
              onChange={(e) => setFormData({ ...formData, auctionDuration: Number.parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>1 hour</span>
              <span>84 hours</span>
              <span>168 hours (7 days)</span>
            </div>
            {errors.auctionDuration && <p className="text-red-400 text-sm">{errors.auctionDuration}</p>}
          </div>

          {/* Price Floor */}
          <div className="space-y-2">
            <Label htmlFor="priceFloor">Price Floor (USDC)</Label>
            <Input
              id="priceFloor"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={formData.priceFloor}
              onChange={(e) => setFormData({ ...formData, priceFloor: e.target.value })}
              className="bg-gray-700 border-gray-600"
            />
            {errors.priceFloor && <p className="text-red-400 text-sm">{errors.priceFloor}</p>}
            <p className="text-xs text-gray-400">Minimum price per token in USDC</p>
          </div>
        </CardContent>
      </Card>

      {/* Prize Pool */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-yellow-400" />
            <span>Prize Pool</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prizePool">USDC Amount</Label>
            <Input
              id="prizePool"
              type="number"
              min="0"
              step="1"
              placeholder="0"
              value={formData.prizePool}
              onChange={(e) => setFormData({ ...formData, prizePool: e.target.value })}
              className="bg-gray-700 border-gray-600"
            />
            {errors.prizePool && <p className="text-red-400 text-sm">{errors.prizePool}</p>}
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
            <div className="text-sm text-yellow-300">
              <strong>Minimum:</strong> {minBudget ? `${minBudget} USDC (contract)` : '0 USDC'}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Higher prize pools attract more players and create more viral potential
            </div>
            
          </div>
        </CardContent>
      </Card>

      {/* Game Rules */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-green-400" />
            <span>Game Rules</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm text-gray-300">
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
              <p>
                <strong>Last Buyer Wins:</strong> The final person to buy before the timer expires wins the entire prize
                pool
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
              <p>
                <strong>Timer Extension:</strong> Each purchase adds time to the countdown, keeping the game active
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
              <p>
                <strong>Minimum Buy:</strong> Players must meet the minimum purchase amount to participate
              </p>
            </div>            
          </div>

          <Alert className="border-green-500/30 bg-green-500/10">
            <AlertCircle className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-300">
              The auction duration you set determines the initial timer. The timer extends with each purchase to maintain excitement and
              engagement.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Transaction Status */}
      {isLoading && (
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <div className="w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mx-auto"></div>
              <div className="text-blue-300 font-medium">
                {currentStep === 'creating-token' ? 'Creating Token...' :
                 currentStep === 'distributing-token' ? 'Starting Auction...' :
                 currentStep === 'approving' ? 'Approving USDC...' : 
                 'Creating Game...'}
              </div>
              <div className="text-sm text-blue-200">
                {currentStep === 'creating-token' 
                  ? 'Creating your token via LiquidityLauncher...'
                  : currentStep === 'distributing-token'
                  ? 'Starting the token auction via LiquidityLauncher...'
                  : currentStep === 'approving' 
                  ? 'Approving USDC spending for the BullRun contract...'
                  : 'Creating your BullRun game on the blockchain...'
                }
              </div>
              {currentStep === 'approving' && (
                <div className="text-xs text-blue-100">
                  This step is required before creating the game
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Message */}
      {isCreateGameSuccess && (
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <div className="w-8 h-8 bg-green-400 rounded-full flex items-center justify-center mx-auto">
                <span className="text-green-900 text-xl">✓</span>
              </div>
              <div className="text-green-300 font-medium">Game Created Successfully!</div>
              <div className="text-sm text-green-200">
                Your BullRun game is now live on the blockchain!
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Launch Button */}
      <Card className="bg-gradient-to-r from-green-500/10 to-yellow-500/10 border-green-500/30">
        <CardContent className="pt-6">
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-green-500 to-yellow-500 hover:from-green-600 hover:to-yellow-600 text-black font-bold py-3 text-lg"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                <span>
                  {currentStep === 'creating-token' ? 'Creating Token...' :
                   currentStep === 'distributing-token' ? 'Starting Auction...' :
                   currentStep === 'approving' ? 'Approving USDC...' : 
                   'Creating Game...'}
                </span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Rocket className="w-5 h-5" />
                <span>Launch Game</span>
              </div>
            )}
          </Button>

          <div className="mt-4 text-center text-sm text-gray-400">
            By launching, you agree to deposit {formData.prizePool || "100"} USDC into the smart contract
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
