"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Clock, User, Users } from "lucide-react"
import { useEffect, useState } from "react"

interface GameData {
  prizePool: number
  timeLeft: number // in seconds
  lastBuyer: string
  lastBuyerAddress: string
  totalBuyers: number
}

interface GameStatsProps {
  game: GameData
}

export function GameStats({ game }: GameStatsProps) {
  const [timeLeft, setTimeLeft] = useState(game.timeLeft)

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  const isUrgent = timeLeft < 300 // Less than 5 minutes
  const isCritical = timeLeft < 60 // Less than 1 minute

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Prize Pool */}
      <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-yellow-400">
            <Trophy className="w-5 h-5" />
            <span>USDC Prize Pool</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-yellow-400">{game.prizePool}</div>
          <div className="text-sm text-gray-400 mt-1">USDC</div>
        </CardContent>
      </Card>

      {/* Countdown Timer */}
      <Card
        className={`${
          isCritical
            ? "bg-gradient-to-br from-red-500/20 to-red-600/20 border-red-500/50"
            : isUrgent
              ? "bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/30"
              : "bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30"
        }`}
      >
        <CardHeader className="pb-3">
          <CardTitle
            className={`flex items-center space-x-2 ${
              isCritical ? "text-red-400" : isUrgent ? "text-orange-400" : "text-blue-400"
            }`}
          >
            <Clock className="w-5 h-5" />
            <span>Time Left</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`text-4xl font-bold ${
              isCritical ? "text-red-400 animate-pulse" : isUrgent ? "text-orange-400" : "text-blue-400"
            }`}
          >
            {formatTime(timeLeft)}
          </div>
          <div className="text-sm text-gray-400 mt-1">
            {isCritical ? "FINAL MOMENTS!" : isUrgent ? "Hurry up!" : "Remaining"}
          </div>
        </CardContent>
      </Card>

      {/* Last Buyer */}
      <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-green-400">
            <User className="w-5 h-5" />
            <span>Current Last Bull</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-400">{game.lastBuyer}</div>
          <div className="text-sm text-gray-400 mt-1 font-mono">
            {game.lastBuyerAddress.slice(0, 6)}...{game.lastBuyerAddress.slice(-4)}
          </div>
        </CardContent>
      </Card>

      {/* Total Buyers */}
      <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-purple-400">
            <Users className="w-5 h-5" />
            <span>Total Players</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-400">{game.totalBuyers}</div>
          <div className="text-sm text-gray-400 mt-1">Participants</div>
        </CardContent>
      </Card>
    </div>
  )
}
