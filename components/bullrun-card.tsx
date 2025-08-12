import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, User, Crown } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface BullRun {
  id: string
  postTitle: string
  postThumbnail: string
  prizePool: number
  timeLeft: string
  lastBuyer?: string
  winner?: string
  status: "active" | "ended"
  minBuy: number
}

interface BullRunCardProps {
  bullRun: BullRun
}

const mockTotalPlayers = Math.floor(Math.random() * 50) + 5 // Random number between 5-54

export function BullRunCard({ bullRun }: BullRunCardProps) {
  const isActive = bullRun.status === "active"
  const isUrgent = bullRun.timeLeft.includes("m") && !bullRun.timeLeft.includes("h")

  return (
    <Card className="bg-gray-800 border-gray-700 hover:border-green-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20">
      <CardHeader className="p-0">
        <div className="relative">
          <Image
            src={bullRun.postThumbnail || "/placeholder.svg"}
            alt={bullRun.postTitle}
            width={300}
            height={200}
            className="w-full h-48 object-cover rounded-t-lg"
          />
          <Badge className="absolute top-2 right-2 bg-blue-500/20 text-blue-400 border-blue-500/30">
            Game #{bullRun.id}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-3 line-clamp-2">{bullRun.postTitle}</h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-gray-400">Prize Pool</span>
            </div>
            <span className="text-xl font-bold text-yellow-400">{bullRun.prizePool} USDC</span>
          </div>

          {isActive ? (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-gray-400">Total Players</span>
                </div>
                <span className="font-semibold text-green-400">{mockTotalPlayers}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Time Left</span>
                <span className={`font-semibold ${isUrgent ? "text-red-400" : "text-green-400"}`}>
                  {bullRun.timeLeft}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Time Left</span>
                <span className="font-semibold text-gray-400">Ended</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Crown className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-gray-400">Winner</span>
                </div>
                <span className="font-semibold text-yellow-400 truncate max-w-24">{bullRun.winner}</span>
              </div>
            </>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        {isActive ? (
          <Link href={`/game/${bullRun.id}`} className="w-full">
            <Button className="w-full font-semibold bg-gradient-to-r from-green-500 to-yellow-500 hover:from-green-600 hover:to-yellow-600 text-black">
              View Game
            </Button>
          </Link>
        ) : (
          <Button className="w-full font-semibold bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black">
            View Game
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
