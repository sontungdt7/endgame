"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TrendingUp, DollarSign } from "lucide-react"
import { useState } from "react"
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { PrivyWalletConnectButton } from "@/components/privy-wallet-connect-button"

interface GameData {
  minBuy: number
  status: "active" | "ended"
}

interface GameActionsProps {
  game: GameData
}

export function GameActions({ game }: GameActionsProps) {
  const [buyAmount, setBuyAmount] = useState(game.minBuy.toString())
  const { authenticated } = usePrivy()
  const { wallets } = useWallets()
  
  const isConnected = authenticated && wallets.length > 0

  const handleBuyNow = () => {
    // This would trigger the smart contract interaction
    console.log(`Buying ${buyAmount} USDC worth of PostCoin`)
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-green-400" />
          <span>Join the BullRun</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Dynamic Minimum Buy Indicator */}
        <div className="bg-gradient-to-r from-green-500/20 to-yellow-500/20 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-300">Min Buy to Take Lead</span>
            <DollarSign className="w-4 h-4 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-green-400">{game.minBuy} USDC</div>
        </div>

        {!isConnected ? (
          <div className="text-center space-y-4">
            <p className="text-gray-400 text-sm">Connect your wallet to join the BullRun</p>
            <PrivyWalletConnectButton />
          </div>
        ) : (
          <>
            {/* Buy Amount Input */}
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Buy Amount (USDC)</label>
              <Input
                type="number"
                value={buyAmount}
                onChange={(e) => setBuyAmount(e.target.value)}
                min={game.minBuy}
                step="0.1"
                className="bg-gray-700 border-gray-600 text-white"
                disabled={game.status !== "active"}
              />
              <div className="text-xs text-gray-500">Minimum: {game.minBuy} USDC</div>
            </div>

            {/* Buy Button */}
            <Button
              onClick={handleBuyNow}
              disabled={game.status !== "active" || Number.parseFloat(buyAmount) < game.minBuy}
              className="w-full bg-gradient-to-r from-green-500 to-yellow-500 hover:from-green-600 hover:to-yellow-600 text-black font-bold py-3 text-lg"
            >
              {game.status === "active" ? "Buy Now & Take Lead!" : "Game Ended"}
            </Button>

            {/* Quick Buy Options */}
            {game.status === "active" && (
              <div className="grid grid-cols-3 gap-2">
                {[game.minBuy, game.minBuy * 2, game.minBuy * 5].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setBuyAmount(amount.toString())}
                    className="border-gray-600 text-gray-300 hover:border-green-500 hover:text-green-400"
                  >
                    {amount} USDC
                  </Button>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
