"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CheckCircle, Copy, Share2, Twitter, MessageCircle, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CreateConfirmationProps {
  gameData: {
    id: string
    gameLink: string
    prizePool: number
    duration: number
  }
  onCreateAnother: () => void
}

export function CreateConfirmation({ gameData, onCreateAnother }: CreateConfirmationProps) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast({
        title: "Copied!",
        description: "Game link copied to clipboard",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const shareOnTwitter = () => {
    const text = `🎯 New BullRun Campaign Live!\n\n💰 ${gameData.prizePool} USDC Prize Pool\n⏰ ${gameData.duration}h Duration\n🏆 Last Buyer Wins!\n\nJoin the game:`
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(gameData.gameLink)}`
    window.open(url, "_blank")
  }

  const shareOnTelegram = () => {
    const text = `🎯 New BullRun Campaign Live!\n\n💰 ${gameData.prizePool} USDC Prize Pool\n⏰ ${gameData.duration}h Duration\n🏆 Last Buyer Wins!\n\nJoin: ${gameData.gameLink}`
    const url = `https://t.me/share/url?url=${encodeURIComponent(gameData.gameLink)}&text=${encodeURIComponent(text)}`
    window.open(url, "_blank")
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-3 mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
            <div>
              <h2 className="text-2xl font-bold text-green-400">Campaign Created!</h2>
              <p className="text-gray-300">Your BullRun game is now live and ready for players</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="text-sm text-gray-400">Prize Pool</div>
              <div className="text-xl font-bold text-yellow-400">{gameData.prizePool} USDC</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="text-sm text-gray-400">Duration</div>
              <div className="text-xl font-bold text-blue-400">{gameData.duration}h</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="text-sm text-gray-400">Game ID</div>
              <div className="text-xl font-bold text-purple-400">#{gameData.id}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Game Link */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle>Game Link</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input value={gameData.gameLink} readOnly className="bg-gray-700 border-gray-600 font-mono text-sm" />
            <Button
              onClick={() => copyToClipboard(gameData.gameLink)}
              variant="outline"
              className="border-gray-600 hover:border-green-500"
            >
              {copied ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-sm text-gray-400">Share this link to let players join your BullRun campaign</p>
        </CardContent>
      </Card>

      {/* Share Campaign */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Share2 className="w-5 h-5" />
            <span>Share Campaign</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <Button onClick={shareOnTwitter} className="bg-blue-500 hover:bg-blue-600 text-white">
              <Twitter className="w-4 h-4 mr-2" />
              Share on Twitter
            </Button>
            <Button onClick={shareOnTelegram} className="bg-blue-600 hover:bg-blue-700 text-white">
              <MessageCircle className="w-4 h-4 mr-2" />
              Share on Telegram
            </Button>
          </div>
          <p className="text-sm text-gray-400 mt-3">The more you share, the more viral your post becomes!</p>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex space-x-4">
        <Button
          onClick={onCreateAnother}
          variant="outline"
          className="flex-1 border-gray-600 hover:border-green-500 bg-transparent"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Another Campaign
        </Button>
        <Button
          onClick={() => window.open(gameData.gameLink, "_blank")}
          className="flex-1 bg-gradient-to-r from-green-500 to-yellow-500 hover:from-green-600 hover:to-yellow-600 text-black font-semibold"
        >
          View Live Game
        </Button>
      </div>
    </div>
  )
}
