"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Rocket, DollarSign, Link, Search, ExternalLink, TrendingUp, Users } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useZoraCoin } from "@/hooks/use-zora-coin"
import { useBullRunContract } from "@/hooks/use-bullrun-contract"
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
    coinAddress: "",
    prizePool: "3",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const { coinData, isLoading: isCoinLoading, error: coinError, fetchCoinData, clearData } = useZoraCoin()
  const { 
    createGame, 
    createGameAfterApproval,
    isLoading, 
    error: contractError, 
    isCreateGameSuccess,
    currentStep,
    minBudget 
  } = useBullRunContract()

  // Store form data for the second step
  const [pendingGameData, setPendingGameData] = useState<{
    coinAddress: string;
    prizePool: string;
  } | null>(null)

  // Fetch coin data when address changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.coinAddress && formData.coinAddress.trim() !== "") {
        fetchCoinData(formData.coinAddress)
      } else {
        clearData()
      }
    }, 500) // Debounce for 500ms

    return () => clearTimeout(timeoutId)
  }, [formData.coinAddress, fetchCoinData, clearData])

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
        duration: 24,
      }
      onGameCreated(gameData)
    }
  }, [isCreateGameSuccess, formData.prizePool, onGameCreated])

  // Handle contract errors
  useEffect(() => {
    if (contractError) {
      toast.error(`Contract Error: ${contractError}`)
    }
  }, [contractError])

  // Auto-create game after USDC approval succeeds
  useEffect(() => {
    if (currentStep === 'approving' && pendingGameData) {
      // Wait a bit for the approval transaction to be confirmed
      const timer = setTimeout(() => {
        if (pendingGameData) {
          createGameAfterApproval(pendingGameData.coinAddress, pendingGameData.prizePool)
        }
      }, 2000) // Wait 2 seconds for approval confirmation

      return () => clearTimeout(timer)
    }
  }, [currentStep, pendingGameData, createGameAfterApproval])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Validate Coin address
    if (!formData.coinAddress) {
      newErrors.coinAddress = "Coin address is required"
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(formData.coinAddress)) {
      newErrors.coinAddress = "Invalid Ethereum address format"
    } else if (coinError) {
      newErrors.coinAddress = coinError
    }

    // Validate prize pool
    const prizePool = Number.parseFloat(formData.prizePool)
    if (!formData.prizePool || Number.isNaN(prizePool)) {
      newErrors.prizePool = "Prize pool is required"
    } else if (prizePool < 3) {
      newErrors.prizePool = "Minimum prize pool is 3 USDC"
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
      // Store the game data for the second step
      setPendingGameData({
        coinAddress: formData.coinAddress,
        prizePool: formData.prizePool
      })

      // Call the smart contract to approve USDC and create the game
      const result = await createGame(formData.coinAddress, formData.prizePool)
      
      if (result?.success) {
        if (result.step === 'approving') {
          toast.success("USDC approval submitted! Waiting for confirmation...")
        }
      }
    } catch (error) {
      console.error("Failed to create game:", error)
      toast.error(`Failed to create game: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setPendingGameData(null)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Coin Address */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Link className="w-5 h-5 text-blue-400" />
            <span>Target Coin</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="coinAddress">Zora Creator Coin or Post Coin Address</Label>
            <div className="relative">
              <Input
                id="coinAddress"
                placeholder="0x1234567890abcdef1234567890abcdef12345678"
                value={formData.coinAddress}
                onChange={(e) => setFormData({ ...formData, coinAddress: e.target.value })}
                className="bg-gray-700 border-gray-600 font-mono pr-10"
              />
              {isCoinLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
                </div>
              )}
              {!isCoinLoading && formData.coinAddress && (
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              )}
            </div>
            {errors.coinAddress && <p className="text-red-400 text-sm">{errors.coinAddress}</p>}
            {coinError && <p className="text-red-400 text-sm">{coinError}</p>}
          </div>

          {/* Coin Information Display */}
          {coinData && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {coinData.imageUrl && (
                    <img 
                      src={coinData.imageUrl} 
                      alt={coinData.name}
                      className="w-12 h-12 rounded-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                      }}
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-white">{coinData.name}</h3>
                    <p className="text-blue-300 text-sm">{coinData.symbol}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-blue-400 hover:text-blue-300"
                  onClick={() => window.open(`https://zora.co/coin/${coinData.id}`, '_blank')}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
              
              {coinData.description && (
                <p className="text-gray-300 text-sm mb-3 line-clamp-2">{coinData.description}</p>
              )}
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                {coinData.marketCap && coinData.marketCap > 0 && (
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300">Market Cap:</span>
                    <span className="text-white">${coinData.marketCap.toLocaleString()}</span>
                  </div>
                )}
                {coinData.volume24h && coinData.volume24h > 0 && (
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-yellow-400" />
                    <span className="text-gray-300">24h Volume:</span>
                    <span className="text-white">${coinData.volume24h.toLocaleString()}</span>
                  </div>
                )}
                {coinData.totalSupply && coinData.totalSupply > 0 && (
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-purple-400" />
                    <span className="text-gray-300">Total Supply:</span>
                    <span className="text-white">{coinData.totalSupply.toLocaleString()}</span>
                  </div>
                )}
                {coinData.price && coinData.price > 0 && (
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300">Price:</span>
                    <span className="text-white">${coinData.price.toFixed(6)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
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
              min="3"
              step="1"
              placeholder="100"
              value={formData.prizePool}
              onChange={(e) => setFormData({ ...formData, prizePool: e.target.value })}
              className="bg-gray-700 border-gray-600"
            />
            {errors.prizePool && <p className="text-red-400 text-sm">{errors.prizePool}</p>}
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
            <div className="text-sm text-yellow-300">
              <strong>Minimum:</strong> {minBudget ? `${minBudget} USDC (contract)` : '100 USDC'}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Higher prize pools attract more players and create more viral potential
            </div>
            {minBudget && (
              <div className="text-xs text-blue-300 mt-1">
                Contract requirement: {minBudget} USDC minimum
              </div>
            )}
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
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
              <p>
                <strong>Viral Mechanics:</strong> More buyers = more engagement = more viral potential for the post
              </p>
            </div>
          </div>

          <Alert className="border-green-500/30 bg-green-500/10">
            <AlertCircle className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-300">
              Games run for 24 hours by default. The timer extends with each purchase to maintain excitement and
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
                {currentStep === 'approving' ? 'Approving USDC...' : 'Creating Game...'}
              </div>
              <div className="text-sm text-blue-200">
                {currentStep === 'approving' 
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
                  {currentStep === 'approving' ? 'Approving USDC...' : 'Creating Game...'}
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
