import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { TransformedGame } from "@/hooks/useGames"
import { formatAddress } from "@/lib/utils"

interface PostPreviewProps {
  game: TransformedGame
}

export function PostPreview({ game }: PostPreviewProps) {
  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{game.postTitle}</h1>
          <Badge
            className={
              game.status === "active"
                ? "bg-green-500/20 text-green-400 border-green-500/30"
                : "bg-gray-500/20 text-gray-400 border-green-500/30"
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

        <p className="text-gray-300 leading-relaxed">
          {game.description ? (
            game.description
          ) : (
            <span className="text-gray-400 italic">
              Description not available. Please check your Zora API key configuration to display real coin descriptions.
            </span>
          )}
        </p>

        {/* Creator Profile Section */}
        {game.creatorProfile && (
          <div className="bg-gray-700/30 rounded-lg p-3 border border-gray-600">
            <div className="flex items-center space-x-2 mb-2">
              {game.creatorProfile.avatar?.medium && (
                <img 
                  src={game.creatorProfile.avatar.medium} 
                  alt="Creator avatar"
                  className="w-8 h-8 rounded-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                  }}
                />
              )}
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-white text-sm">
                    {game.creatorProfile.displayName || game.creatorProfile.handle || 'Creator'}
                  </span>
                  {game.creatorProfile.handle && (
                    <span className="text-gray-400 text-xs">@{game.creatorProfile.handle}</span>
                  )}
                </div>
                
                {/* Creator Links - Compact Version */}
                <div className="flex items-center space-x-2 mt-1">
                  {game.creatorProfile.website && (
                    <a 
                      href={game.creatorProfile.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-xs transition-colors"
                    >
                      🌐 {game.creatorProfile.website.length > 20 ? game.creatorProfile.website.substring(0, 20) + '...' : game.creatorProfile.website}
                    </a>
                  )}
                  
                  {game.creatorProfile.socialAccounts?.twitter?.username && (
                    <a 
                      href={`https://x.com/${game.creatorProfile.socialAccounts.twitter.username}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-xs transition-colors"
                    >
                      𝕏 @{game.creatorProfile.socialAccounts.twitter.username}
                    </a>
                  )}
                  
                  {game.creatorProfile.socialAccounts?.instagram?.displayName && (
                    <a 
                      href={`https://instagram.com/${game.creatorProfile.socialAccounts.instagram.displayName}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-pink-400 hover:text-pink-300 text-xs transition-colors"
                    >
                      📷 Instagram
                    </a>
                  )}
                  
                  {game.creatorProfile.socialAccounts?.tiktok?.displayName && (
                    <a 
                      href={`https://tiktok.com/@${game.creatorProfile.socialAccounts.tiktok.displayName}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-gray-300 text-xs transition-colors"
                    >
                      🎵 TikTok
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Market Data Section */}
        {game.marketCap !== undefined || game.volume24h !== undefined || game.uniqueHolders !== undefined ? (
          <div className="bg-gray-700/30 rounded-lg p-3 border border-gray-600">
            <h3 className="text-xs font-semibold text-gray-300 mb-2">Market Data</h3>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {game.marketCap !== undefined && (
                <div>
                  <div className="text-gray-400 mb-1">Market Cap</div>
                  <div className="font-bold text-green-400">
                    ${game.marketCap.toLocaleString()}
                  </div>
                </div>
              )}
              {game.volume24h !== undefined && (
                <div>
                  <div className="text-gray-400 mb-1">24h Vol</div>
                  <div className="font-bold text-blue-400">
                    ${game.volume24h.toLocaleString()}
                  </div>
                </div>
              )}
              {game.uniqueHolders !== undefined && (
                <div>
                  <div className="text-gray-400 mb-1">Holders</div>
                  <div className="font-bold text-purple-400">
                    {game.uniqueHolders.toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}

        <div className="bg-gray-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400 mb-1">PostCoin Address</div>
              <div className="font-mono text-sm">{formatAddress(game.postCoin)}</div>
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
