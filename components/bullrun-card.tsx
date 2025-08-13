import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, User, Crown, Clock, Wallet, Image as ImageIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { TransformedGame } from "@/hooks/useGames"
import { formatAddress } from "@/lib/utils"

interface BullRunCardProps {
  bullRun: TransformedGame
}

export function BullRunCard({ bullRun }: BullRunCardProps) {
  const isActive = bullRun.status === "active"
  const isUrgent = bullRun.timeLeft.includes("m") && !bullRun.timeLeft.includes("h")
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  const handleImageLoad = () => {
    setImageLoading(false)
  }

  const handleImageError = () => {
    setImageError(true)
    setImageLoading(false)
  }

  const getImageSrc = () => {
    if (imageError || !bullRun.postThumbnail || bullRun.postThumbnail.includes('placeholder')) {
      return "/placeholder.svg?height=200&width=300"
    }
    return bullRun.postThumbnail
  }

  return (
    <Card className="bg-gray-800 border-gray-700 hover:border-green-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20">
      <CardHeader className="p-0">
        <div className="relative">
          <div className="relative w-full h-48 bg-gray-700 rounded-t-lg overflow-hidden">
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
              </div>
            )}
            <Image
              src={getImageSrc()}
              alt={bullRun.postTitle}
              width={300}
              height={200}
              className={`w-full h-48 object-cover rounded-t-lg transition-opacity duration-300 ${
                imageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
            {imageError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                <div className="text-center text-gray-400">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                  <span className="text-xs">Image unavailable</span>
                </div>
              </div>
            )}
          </div>
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
            <span className="text-xl font-bold text-yellow-400">{bullRun.prizePool.toFixed(2)} USDC</span>
          </div>

          {isActive ? (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-gray-400">Total Players</span>
                </div>
                <span className="font-semibold text-green-400">{bullRun.totalBuyCount}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-gray-400">Time Left</span>
                </div>
                <span className={`font-semibold ${isUrgent ? "text-red-400" : "text-green-400"}`}>
                  {bullRun.timeLeft}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Wallet className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-gray-400">Min Buy</span>
                </div>
                <span className="font-semibold text-purple-400">{bullRun.minBuy.toFixed(2)} USDC</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-400">Time Left</span>
                </div>
                <span className="font-semibold text-gray-400">Ended</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Crown className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-gray-400">Winner</span>
                </div>
                <span className="font-semibold text-yellow-400 truncate max-w-24">{bullRun.winner}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-400">Final Players</span>
                </div>
                <span className="font-semibold text-gray-400">{bullRun.totalBuyCount}</span>
              </div>
            </>
          )}

          <div className="pt-2 border-t border-gray-700">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Sponsored by:</span>
              <span className="font-mono">{formatAddress(bullRun.sponsor)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
              <span>Post Coin:</span>
              <span className="font-mono">{formatAddress(bullRun.postCoin)}</span>
            </div>
          </div>
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
          <Link href={`/game/${bullRun.id}`} className="w-full">
            <Button className="w-full font-semibold bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black">
              View Game
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  )
}
