import { useState, useEffect } from 'react'
import { graphqlClient, GAME_CREATEDS_QUERY } from '@/lib/graphql'
import { zoraService } from '@/lib/zora-service'
import { 
  formatTimeRemaining, 
  isGameActive, 
  formatUSDC, 
  generateMockPostTitle, 
  calculateMinBuy 
} from '@/lib/utils'

export interface GameCreatedEvent {
  id: string
  gameId: string
  sponsor: string
  postCoin: string
  prizePool: string
  blockNumber: string
  blockTimestamp: string
  transactionHash: string
}

export interface TransformedGame {
  id: string
  postTitle: string
  postThumbnail: string
  prizePool: number
  timeLeft: string
  lastBuyer?: string
  winner?: string
  status: "active" | "ended"
  minBuy: number
  sponsor: string
  postCoin: string
  startTime: number
  endTime: number
  totalBuyCount: number
  hasPlayer: boolean
}

interface GraphQLResponse {
  gameCreateds: GameCreatedEvent[]
}

export function useGames() {
  const [games, setGames] = useState<TransformedGame[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchGames() {
      try {
        setLoading(true)
        setError(null)
        
        console.log('Fetching games from GraphQL...')
        const data = await graphqlClient.request<GraphQLResponse>(GAME_CREATEDS_QUERY)
        const gameEvents = data.gameCreateds || []
        console.log(`Found ${gameEvents.length} games from GraphQL`)
        
        // Transform GraphQL data to match our game card structure
        const transformedGames: TransformedGame[] = await Promise.all(
          gameEvents.map(async (event: GameCreatedEvent, index: number) => {
            const startTime = parseInt(event.blockTimestamp)
            const endTime = startTime + (24 * 60 * 60) // 24 hour games
            const isActive = isGameActive(endTime)
            const timeLeftString = formatTimeRemaining(endTime)
            
            // Try to fetch real post data from Zora
            let postTitle = generateMockPostTitle(event.gameId)
            let postThumbnail = `/placeholder.svg?height=200&width=300`
            
            console.log(`[${index + 1}/${gameEvents.length}] Fetching Zora data for postCoin: ${event.postCoin}`)
            
            try {
              const zoraData = await zoraService.getCoinData(event.postCoin)
              if (zoraData) {
                console.log(`Zora data received for ${event.postCoin}:`, {
                  name: zoraData.name,
                  hasImage: !!zoraData.imageUrl
                })
                postTitle = zoraData.name || postTitle
                postThumbnail = zoraData.imageUrl || postThumbnail
              } else {
                console.log(`No Zora data found for ${event.postCoin}`)
              }
            } catch (zoraError) {
              console.warn(`Failed to fetch Zora data for ${event.postCoin}:`, zoraError)
              // Keep fallback data
            }
            
            return {
              id: event.gameId,
              postTitle,
              postThumbnail,
              prizePool: formatUSDC(event.prizePool),
              timeLeft: timeLeftString,
              lastBuyer: isActive ? "0x1234...5678" : undefined,
              winner: !isActive ? "0xabcd...efgh" : undefined,
              status: isActive ? "active" : "ended",
              minBuy: calculateMinBuy(event.gameId, isActive),
              sponsor: event.sponsor,
              postCoin: event.postCoin,
              startTime: startTime,
              endTime: endTime,
              totalBuyCount: Math.floor(Math.random() * 50) + 5, // Random player count
              hasPlayer: Math.random() > 0.3 // 70% chance of having players
            }
          })
        )
        
        console.log('All games transformed successfully:', transformedGames.length)
        setGames(transformedGames)
      } catch (err) {
        console.error('Error fetching games:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch games')
        
        // Fallback to mock data if GraphQL fails
        console.log('Using fallback mock data')
        const fallbackGames: TransformedGame[] = [
          {
            id: "1",
            postTitle: "Epic NFT Collection Launch",
            postThumbnail: "/placeholder.svg?height=200&width=300",
            prizePool: 500,
            timeLeft: "2h 34m",
            lastBuyer: "alice.eth",
            status: "active" as const,
            minBuy: 1.2,
            sponsor: "0x1234...5678",
            postCoin: "0xabcd...efgh",
            startTime: Math.floor(Date.now() / 1000) - 3600,
            endTime: Math.floor(Date.now() / 1000) + 86400,
            totalBuyCount: 25,
            hasPlayer: true
          },
          {
            id: "2",
            postTitle: "Viral Meme Contest",
            postThumbnail: "/placeholder.svg?height=200&width=300",
            prizePool: 250,
            timeLeft: "45m",
            lastBuyer: "0x1234...5678",
            status: "active" as const,
            minBuy: 0.8,
            sponsor: "0x5678...9abc",
            postCoin: "0xefgh...ijkl",
            startTime: Math.floor(Date.now() / 1000) - 82800,
            endTime: Math.floor(Date.now() / 1000) + 3600,
            totalBuyCount: 15,
            hasPlayer: true
          }
        ]
        setGames(fallbackGames)
      } finally {
        setLoading(false)
      }
    }

    fetchGames()
  }, [])

  return { games, loading, error }
}
