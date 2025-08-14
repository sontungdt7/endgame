import { useState, useEffect } from 'react'
import { graphqlClient, GAME_CREATEDS_QUERY, PRIZE_CLAIMED_QUERY, REFUND_ISSUED_QUERY } from '@/lib/graphql'
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
  description?: string
  creatorProfile?: any
  marketCap?: number
  volume24h?: number
  uniqueHolders?: number
  isClaimed?: boolean
  isRefunded?: boolean
}

interface GraphQLResponse {
  gameCreateds: GameCreatedEvent[]
}

interface PrizeClaimedResponse {
  prizeClaimeds: Array<{
    id: string
    gameId: string
    winner: string
    amount: string
    blockNumber: string
    blockTimestamp: string
    transactionHash: string
  }>
}

interface RefundIssuedResponse {
  refundIssueds: Array<{
    id: string
    gameId: string
    sponsor: string
    amount: string
    blockNumber: string
    blockTimestamp: string
    transactionHash: string
  }>
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
            
            // Fetch real-time game status
            let isClaimed = false
            let isRefunded = false
            
            try {
              // Check if prize was claimed
              const prizeData = await graphqlClient.request<PrizeClaimedResponse>(PRIZE_CLAIMED_QUERY, { gameId: event.gameId })
              isClaimed = prizeData.prizeClaimeds && prizeData.prizeClaimeds.length > 0
              
              // Check if refund was issued
              const refundData = await graphqlClient.request<RefundIssuedResponse>(REFUND_ISSUED_QUERY, { gameId: event.gameId })
              isRefunded = refundData.refundIssueds && refundData.refundIssueds.length > 0
              
              console.log(`Game ${event.gameId} status: claimed=${isClaimed}, refunded=${isRefunded}`)
            } catch (statusError) {
              console.warn(`Failed to fetch status for game ${event.gameId}:`, statusError)
              // Keep default values
            }
            
            // Try to fetch real post data from Zora
            let postTitle = generateMockPostTitle(event.gameId)
            let postThumbnail = `/placeholder.svg?height=200&width=300`
            let creatorProfile: any = undefined
            let marketCap: number | undefined = undefined
            let volume24h: number | undefined = undefined
            let uniqueHolders: number | undefined = undefined
            
            console.log(`[${index + 1}/${gameEvents.length}] Fetching Zora data for postCoin: ${event.postCoin}`)
            
            try {
              const zoraData = await zoraService.getCoinData(event.postCoin)
              if (zoraData) {
                console.log(`Zora data received for ${event.postCoin}:`, {
                  name: zoraData.name,
                  hasImage: !!zoraData.imageUrl,
                  hasCreatorProfile: !!zoraData.creatorProfile,
                  marketCap: zoraData.marketCap,
                  volume24h: zoraData.volume24h,
                  uniqueHolders: zoraData.uniqueHolders
                })
                postTitle = zoraData.name || postTitle
                postThumbnail = zoraData.imageUrl || postThumbnail
                creatorProfile = zoraData.creatorProfile
                marketCap = zoraData.marketCap
                volume24h = zoraData.volume24h
                uniqueHolders = zoraData.uniqueHolders
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
              lastBuyer: isActive ? "0x1234567890abcdef1234567890abcdef12345678" : undefined,
              winner: !isActive ? "0xabcdef1234567890abcdef1234567890abcdef12" : undefined,
              status: isActive ? "active" : "ended",
              minBuy: calculateMinBuy(event.gameId, isActive),
              sponsor: event.sponsor,
              postCoin: event.postCoin,
              startTime: startTime,
              endTime: endTime,
              totalBuyCount: Math.floor(Math.random() * 50) + 5, // Random player count
              hasPlayer: Math.random() > 0.3, // 70% chance of having players
              isClaimed,
              isRefunded,
              creatorProfile: creatorProfile,
              marketCap: marketCap,
              volume24h: volume24h,
              uniqueHolders: uniqueHolders
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
            lastBuyer: "0x1234567890abcdef1234567890abcdef12345678",
            status: "active" as const,
            minBuy: 1.2,
            sponsor: "0x1234567890abcdef1234567890abcdef12345678",
            postCoin: "0xabcdef1234567890abcdef1234567890abcdef12",
            startTime: Math.floor(Date.now() / 1000) - 3600,
            endTime: Math.floor(Date.now() / 1000) + 86400,
            totalBuyCount: 25,
            hasPlayer: true,
            isClaimed: false,
            isRefunded: false
          },
          {
            id: "2",
            postTitle: "Viral Meme Contest",
            postThumbnail: "/placeholder.svg?height=200&width=300",
            prizePool: 250,
            timeLeft: "45m",
            lastBuyer: "0xabcdef1234567890abcdef1234567890abcdef12",
            status: "active" as const,
            minBuy: 0.8,
            sponsor: "0x5678901234567890abcdef1234567890abcdef12",
            postCoin: "0xefgh1234567890abcdef1234567890abcdef1234",
            startTime: Math.floor(Date.now() / 1000) - 82800,
            endTime: Math.floor(Date.now() / 1000) + 3600,
            totalBuyCount: 15,
            hasPlayer: true,
            isClaimed: false,
            isRefunded: false
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
