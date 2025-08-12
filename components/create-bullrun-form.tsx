"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Rocket, DollarSign, Link } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
    postCoinAddress: "",
    prizePool: "100",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Validate PostCoin address
    if (!formData.postCoinAddress) {
      newErrors.postCoinAddress = "PostCoin address is required"
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(formData.postCoinAddress)) {
      newErrors.postCoinAddress = "Invalid Ethereum address format"
    }

    // Validate prize pool
    const prizePool = Number.parseFloat(formData.prizePool)
    if (!formData.prizePool || Number.isNaN(prizePool)) {
      newErrors.prizePool = "Prize pool is required"
    } else if (prizePool < 100) {
      newErrors.prizePool = "Minimum prize pool is 100 USDC"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)

    try {
      // Simulate smart contract interaction
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const gameId = Math.random().toString(36).substring(7)
      const gameData = {
        id: gameId,
        gameLink: `${window.location.origin}/game/${gameId}`,
        prizePool: Number.parseFloat(formData.prizePool),
        duration: 24,
      }

      onGameCreated(gameData)
    } catch (error) {
      console.error("Failed to create game:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* PostCoin Address */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Link className="w-5 h-5 text-blue-400" />
            <span>Target Post</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="postCoinAddress">PostCoin Address</Label>
            <Input
              id="postCoinAddress"
              placeholder="0x1234567890abcdef1234567890abcdef12345678"
              value={formData.postCoinAddress}
              onChange={(e) => setFormData({ ...formData, postCoinAddress: e.target.value })}
              className="bg-gray-700 border-gray-600 font-mono"
            />
            {errors.postCoinAddress && <p className="text-red-400 text-sm">{errors.postCoinAddress}</p>}
          </div>

          <Alert className="border-blue-500/30 bg-blue-500/10">
            <AlertCircle className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-300">
              Enter the PostCoin contract address from the Zora post you want to make viral. You can find this in the
              post's details or transaction history.
            </AlertDescription>
          </Alert>
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
              min="100"
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
              <strong>Minimum:</strong> 100 USDC
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
                <span>Creating Game...</span>
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
