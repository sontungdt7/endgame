import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface GameData {
  postTitle: string
  postContent: string
  postCoinAddress: string
  postThumbnail: string
  status: "active" | "ended"
}

interface PostPreviewProps {
  game: GameData
}

export function PostPreview({ game }: PostPreviewProps) {
  const truncatedAddress = `${game.postCoinAddress.slice(0, 6)}...${game.postCoinAddress.slice(-4)}`

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{game.postTitle}</h1>
          <Badge
            className={
              game.status === "active"
                ? "bg-green-500/20 text-green-400 border-green-500/30"
                : "bg-gray-500/20 text-gray-400 border-gray-500/30"
            }
          >
            {game.status === "active" ? "Active" : "Ended"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Image
          src={game.postThumbnail || "/placeholder.svg"}
          alt={game.postTitle}
          width={600}
          height={400}
          className="w-full h-64 object-cover rounded-lg"
        />

        <p className="text-gray-300 leading-relaxed">{game.postContent}</p>

        <div className="bg-gray-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400 mb-1">PostCoin Address</div>
              <div className="font-mono text-sm">{truncatedAddress}</div>
            </div>
            <div className="flex space-x-2">
              <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                <Copy className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
