"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Rocket, DollarSign, Image as ImageIcon, Clock, TrendingUp } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useLiquidityLauncher } from "@/hooks/use-liquidity-launcher"
import { TOKEN_FACTORY_ADDRESS, LIQUIDITY_LAUNCHER_ADDRESS, CONTINUOUS_CLEARING_AUCTION_FACTORY_ADDRESS, type MigratorParameters, type AuctionParameters, computeGraffiti, precomputeTokenAddress } from "@/lib/liquidity-launcher"
import { getTokenBySymbol } from "@/lib/tokens"
import { encodeAbiParameters, parseAbiParameters, encodePacked } from "viem"
import { useAccount, useBlockNumber } from "wagmi"
import { usePrivy } from "@privy-io/react-auth"
import { uploadToIPFS } from "@/lib/ipfs"
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
  const safeStringify = (value: unknown) =>
    JSON.stringify(
      value,
      (_key, val) => (typeof val === "bigint" ? val.toString() : val),
      2
    )

  const txUrl = (hash?: string) => (hash ? `https://sepolia.etherscan.io/tx/${hash}` : "")

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
  
  const { address, isConnected, chainId } = useAccount()
  const { ready: privyReady, authenticated, user } = usePrivy()
  const { data: currentBlockNumber } = useBlockNumber({ watch: true, chainId: 11155111 }) // Sepolia chainId

  const {
    createToken: createLiquidityToken,
    distributeToken: distributeLiquidityToken,
    isLoading,
    error: liquidityLauncherError,
    errorDetails: liquidityLauncherErrorDetails,
    isCreateTokenSuccess,
    isDistributeTokenSuccess,
    currentStep,
    createTokenHash,
    distributeTokenHash,
    createdTokenAddress
  } = useLiquidityLauncher()

  // Store form data for the second step
  const [pendingGameData, setPendingGameData] = useState<{
    prizePool: string;
  } | null>(null)

  const [launchDialogOpen, setLaunchDialogOpen] = useState(false)
  const [launchStep, setLaunchStep] = useState<
    "idle" | "uploading" | "createToken_wallet" | "createToken_confirming" | "distribute_wallet" | "distribute_confirming" | "done" | "error"
  >("idle")
  const [pendingLaunch, setPendingLaunch] = useState<{
    tokenAddress: `0x${string}`
    totalSupplyWei: bigint
    migratorParams: MigratorParameters
    auctionParams: AuctionParameters
  } | null>(null)

  // Store created token address
  const [tokenAddress, setTokenAddress] = useState<`0x${string}` | null>(null)
  
  // Store IPFS URL for the uploaded image
  const [ipfsImageUrl, setIpfsImageUrl] = useState<string>("")

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
    let encoded = "0x" as `0x${string}`
    for (const step of steps) {
      // Bounds checks (uint24, uint40)
      if (step.mps < 0 || step.mps > 0xFFFFFF) {
        throw new Error(`auction step mps out of range (uint24): ${step.mps}`)
      }
      if (step.blockDelta < 0 || step.blockDelta > 0xFFFFFFFFFF) {
        throw new Error(`auction step blockDelta out of range (uint40): ${step.blockDelta}`)
      }
      // This matches Solidity exactly:
      // abi.encodePacked(uint24(mps), uint40(blockDelta))
      const packed = encodePacked(
        ["uint24", "uint40"],
        [step.mps, step.blockDelta]
      ) as `0x${string}`
      encoded = (encoded + packed.slice(2)) as `0x${string}`
    }
    return encoded as `0x${string}`
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
        false // payerIsUser - false when tokens are in launcher
      )

    } catch (error) {
      console.error("Failed to distribute token:", error)
      toast.error(`Failed to start auction: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Handle successful distributeToken (2-step flow)
  useEffect(() => {
    if (isDistributeTokenSuccess && pendingGameData) {
      toast.success("🚀 Token created and auction started successfully!")
      const gameId = Math.random().toString(36).substring(7) // Temporary fallback
      const gameData = {
        id: gameId,
        gameLink: `${window.location.origin}/game/${gameId}`,
        prizePool: Number.parseFloat(pendingGameData.prizePool),
        duration: formData.auctionDuration,
      }
      onGameCreated(gameData)
    }
  }, [isDistributeTokenSuccess, pendingGameData, formData.auctionDuration, onGameCreated])

  // Handle liquidity launcher errors (already handled in form, this is for toast notifications)
  useEffect(() => {
    if (liquidityLauncherError && !isLoading) {
      // Error toast is already shown in the error display card
      // This effect can be used for additional notifications if needed
    }
  }, [liquidityLauncherError, isLoading])

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

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    // Check wallet connection before proceeding
    if (!privyReady) {
      toast.error("Wallet provider is still initializing. Please wait...")
      return
    }

    if (!authenticated || !user) {
      toast.error("Please connect your wallet first")
      return
    }

    if (!isConnected || !address) {
      toast.error("Wallet is not connected. Please ensure your wallet is connected and try again.")
      return
    }

    try {
      // Store the game data for later use
      setPendingGameData({
        prizePool: formData.prizePool
      })

      // Step 1: Upload image to IPFS
      let imageUri = ""
      if (formData.imageFile) {
        setLaunchDialogOpen(true)
        setLaunchStep("uploading")
        toast.info("Uploading image to IPFS...")
        try {
          // Use Pinata as preferred service since it's configured
          const ipfsResult = await uploadToIPFS(formData.imageFile, "pinata")
          imageUri = ipfsResult.ipfsUrl // Use ipfs:// URL for token metadata
          setIpfsImageUrl(ipfsResult.gatewayUrl) // Store gateway URL for display
          toast.success(`✅ Image uploaded to IPFS: ${ipfsResult.ipfsHash.substring(0, 10)}...`)
        } catch (ipfsError) {
          console.error("Failed to upload image to IPFS:", ipfsError)
          const errorMessage = ipfsError instanceof Error ? ipfsError.message : 'Unknown error'
          
          // Check for common error types
          if (errorMessage.includes("maintenance") || errorMessage.includes("undergoing")) {
            toast.error(
              `IPFS service is undergoing maintenance. Please configure Pinata as backup ` +
              `(NEXT_PUBLIC_PINATA_API_KEY and NEXT_PUBLIC_PINATA_API_SECRET) or try again later.`,
              { duration: 10000 }
            )
          } else if (errorMessage.includes("Both IPFS services failed") || errorMessage.includes("No Storacha space")) {
            toast.error(
              `IPFS upload failed: ${errorMessage}. ` +
              `Please configure Pinata credentials (NEXT_PUBLIC_PINATA_API_KEY and NEXT_PUBLIC_PINATA_API_SECRET) ` +
              `or set up Storacha account first.`,
              { duration: 10000 }
            )
          } else if (errorMessage.includes("@storacha/client")) {
            toast.error(
              `Storacha client not installed. Please run: npm install @storacha/client ` +
              `or configure Pinata credentials as alternative.`,
              { duration: 10000 }
            )
          } else {
            toast.error(`Failed to upload image to IPFS: ${errorMessage}`, { duration: 8000 })
          }
          
          setPendingGameData(null)
          setLaunchStep("error")
          return
        }
      } else if (formData.image) {
        // If image is already a URL (fallback), use it directly
        imageUri = formData.image
      }

      setLaunchDialogOpen(true)
      setLaunchStep("createToken_wallet")
      toast.info("Creating token via LiquidityLauncher...")
      
      // Calculate total supply (e.g., 1 billion tokens with 18 decimals)
      const totalSupply = "1000000000" // 1B tokens
      const decimals = 18
      const totalSupplyWei = BigInt("1000000000000000000000000000") // 1B tokens with 18 decimals
      
      // Get USDC address for Sepolia (chainId 11155111)
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

      // Precompute token address (deterministic)
      const graffiti = computeGraffiti(address as `0x${string}`)
      const precomputedAddress = await precomputeTokenAddress(
        TOKEN_FACTORY_ADDRESS,
        formData.coinName,
        formData.ticker,
        decimals,
        LIQUIDITY_LAUNCHER_ADDRESS,
        graffiti
      )

      setTokenAddress(precomputedAddress)
      setPendingLaunch({
        tokenAddress: precomputedAddress,
        totalSupplyWei,
        migratorParams,
        auctionParams,
      })

      // Create token (minted to LiquidityLauncher). We will wait for confirmation before distribute.
      await createLiquidityToken(
        formData.coinName,
        formData.ticker,
        decimals,
        totalSupply,
        LIQUIDITY_LAUNCHER_ADDRESS,
        `A token for ${formData.coinName} game`,
        window.location.origin, // website
        imageUri,
        TOKEN_FACTORY_ADDRESS
      )

      setLaunchStep("createToken_confirming")
      toast.info("Token creation submitted. Waiting for confirmation...")

    } catch (error) {
      console.error("❌ Failed to create token and start auction:", error)
      setLaunchStep("error")
      
      // Extract detailed error information
      let errorMessage = 'Unknown error occurred'
      let errorReason = undefined
      
      if (error instanceof Error) {
        errorMessage = error.message
        
        // Try to extract revert reason
        if (error.message.includes('revert')) {
          const revertMatch = error.message.match(/revert\s+(.+?)(?:\s+\(|$)/i)
          if (revertMatch) {
            errorReason = revertMatch[1]
          }
        }
        
        // Check for common error patterns
        if (error.message.includes('insufficient funds')) {
          errorReason = 'Insufficient ETH for gas fees'
        } else if (error.message.includes('user rejected')) {
          errorReason = 'Transaction was rejected by user'
        } else if (error.message.includes('nonce')) {
          errorReason = 'Transaction nonce error - try again'
        }
      }
      
      // Show detailed error toast
      toast.error(
        `Failed to create token: ${errorMessage}`,
        {
          duration: 12000,
          description: errorReason ? `Reason: ${errorReason}` : undefined,
          action: {
            label: 'View Details',
            onClick: () => {
              console.log('Full error details:', error)
              alert(`Error Details:\n\n${errorMessage}\n\n${errorReason ? `Reason: ${errorReason}` : ''}\n\nCheck browser console for more details.`)
            }
          }
        }
      )
      
      setPendingGameData(null)
    }
  }

  // After createToken confirms, call distributeToken (tx 2)
  useEffect(() => {
    const run = async () => {
      if (!pendingLaunch) return
      if (!isCreateTokenSuccess) return
      if (launchStep !== "createToken_confirming") return

      try {
        setLaunchStep("distribute_wallet")
        toast.info("Preparing auction distribution (this may take a moment)...", {
          description: "Finding valid deployment address for auction contract..."
        })

        await distributeLiquidityToken(
          pendingLaunch.tokenAddress,
          pendingLaunch.totalSupplyWei,
          pendingLaunch.migratorParams,
          pendingLaunch.auctionParams,
          false // payerIsUser - false when tokens are in launcher
        )

        setLaunchStep("distribute_confirming")
        toast.success("Auction distribution ready! Please confirm transaction in wallet.")
      } catch (e) {
        console.error("❌ Failed to distribute token:", e)
        setLaunchStep("error")
        toast.error("Failed to start auction distribution", {
          description: e instanceof Error ? e.message : "Unknown error occurred"
        })
      }
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCreateTokenSuccess])

  // When distribute confirms, mark done
  useEffect(() => {
    if (isDistributeTokenSuccess && launchDialogOpen) {
      setLaunchStep("done")
    }
  }, [isDistributeTokenSuccess, launchDialogOpen])

  return (
    <>
      {launchDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-xl border border-gray-700 bg-gray-900 p-5 text-white shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-semibold">Launching your token + auction</div>
                <div className="text-sm text-gray-300 mt-1">
                  Step-by-step progress. Please keep this tab open.
                </div>
              </div>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-200"
                onClick={() => {
                  // allow closing only if not actively signing/confirming
                  if (isLoading) return
                  setLaunchDialogOpen(false)
                }}
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <div className={launchStep === "uploading" ? "text-blue-300" : "text-gray-300"}>
                  1) Upload image to IPFS
                </div>
                <div className="text-gray-400">
                  {launchStep === "uploading" ? "In progress…" : ipfsImageUrl ? "Done" : "—"}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className={launchStep.startsWith("createToken") ? "text-blue-300" : "text-gray-300"}>
                  2) Create token (tx 1)
                </div>
                <div className="text-gray-400">
                  {launchStep === "createToken_wallet"
                    ? "Waiting for wallet…"
                    : launchStep === "createToken_confirming"
                    ? "Confirming…"
                    : isCreateTokenSuccess
                    ? "Confirmed"
                    : "—"}
                </div>
              </div>
              {createTokenHash && (
                <a className="text-xs text-blue-400 underline" href={txUrl(createTokenHash)} target="_blank" rel="noreferrer">
                  View tx 1 on Etherscan
                </a>
              )}

              <div className="flex items-center justify-between">
                <div className={launchStep.startsWith("distribute") ? "text-blue-300" : "text-gray-300"}>
                  3) Start auction / distribute token (tx 2)
                </div>
                <div className="text-gray-400">
                  {launchStep === "distribute_wallet"
                    ? "Waiting for wallet…"
                    : launchStep === "distribute_confirming"
                    ? "Confirming…"
                    : isDistributeTokenSuccess
                    ? "Confirmed"
                    : "—"}
                </div>
              </div>
              {distributeTokenHash && (
                <a className="text-xs text-blue-400 underline" href={txUrl(distributeTokenHash)} target="_blank" rel="noreferrer">
                  View tx 2 on Etherscan
                </a>
              )}

              {tokenAddress && (
                <div className="mt-2 text-xs text-gray-300">
                  Token address (precomputed): <span className="font-mono">{tokenAddress}</span>
                </div>
              )}

              {launchStep === "done" && (
                <div className="mt-3 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-green-200">
                  Success! Token created and auction started.
                </div>
              )}

              {launchStep === "error" && (
                <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-200">
                  Launch failed. Check the error card below and browser console for details.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
              <strong>Minimum:</strong> 0 USDC
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Higher prize pools attract more players and create more viral potential
            </div>
          </div>
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
                 'Processing...'}
              </div>
              <div className="text-sm text-blue-200">
                {currentStep === 'creating-token' 
                  ? 'Creating your token via LiquidityLauncher...'
                  : currentStep === 'distributing-token'
                  ? 'Starting the token auction via LiquidityLauncher...'
                  : 'Processing your request...'
                }
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {liquidityLauncherError && !isLoading && (
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <div className="text-red-300 font-medium">
                  Transaction Failed
                </div>
              </div>
              <div className="text-sm text-red-200">
                {liquidityLauncherError}
              </div>
              {liquidityLauncherErrorDetails && (
                <div className="mt-3 p-3 bg-red-900/20 rounded border border-red-500/20">
                  <div className="text-xs text-red-300 font-mono space-y-1">
                    {liquidityLauncherErrorDetails.reason && (
                      <div>
                        <span className="text-red-400">Reason:</span> {liquidityLauncherErrorDetails.reason}
                      </div>
                    )}
                    {liquidityLauncherErrorDetails.code && (
                      <div>
                        <span className="text-red-400">Error Code:</span> {liquidityLauncherErrorDetails.code}
                      </div>
                    )}
                    {liquidityLauncherErrorDetails.data && (
                      <div className="mt-2">
                        <span className="text-red-400">Data:</span>
                        <pre className="mt-1 text-xs overflow-x-auto">
                          {safeStringify(liquidityLauncherErrorDetails.data)}
                        </pre>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      console.log('Full error details:', liquidityLauncherErrorDetails)
                      alert(`Full Error Details:\n\n${safeStringify(liquidityLauncherErrorDetails)}\n\nCheck browser console for more information.`)
                    }}
                    className="mt-2 text-xs text-red-400 hover:text-red-300 underline"
                  >
                    View Full Error Details
                  </button>
                </div>
              )}
              <div className="text-xs text-red-200/70 mt-2">
                💡 Tip: Check the browser console (F12) for detailed error logs
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Message */}
      {isDistributeTokenSuccess && (
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <div className="w-8 h-8 bg-green-400 rounded-full flex items-center justify-center mx-auto">
                <span className="text-green-900 text-xl">✓</span>
              </div>
              <div className="text-green-300 font-medium">Token & Auction Created Successfully!</div>
              <div className="text-sm text-green-200">
                Your token and auction are now live on the blockchain!
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
                   'Processing...'}
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
    </>
  )
}
