import { useState, useEffect } from 'react'
import { graphqlClient, GAME_DETAILS_QUERY } from '@/lib/graphql'
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

export interface TransformedGameDetail {
  id: string
  gameId: string
  postTitle: string
  postThumbnail: string
  prizePool: number
  timeLeft: string
  status: "active" | "ended"
  minBuy: number
  sponsor: string
  postCoin: string
  startTime: number
  endTime: number
  lastBuyer: string
  claimed: boolean
  refunded: boolean
  finalPhaseBuyCount: number
  totalBuyCount: number
  hasPlayer: boolean
  description?: string
  symbol?: string
}

interface GraphQLResponse {
  gameCreateds: GameCreatedEvent[]
}

export function useGame(gameId: string) {
  const [game, setGame] = useState<TransformedGameDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchGame() {
      if (!gameId) return
      
      try {
        setLoading(true)
        setError(null)
        
        console.log(`Fetching game details for game ID: ${gameId}`)
        console.log('Using GraphQL query:', GAME_DETAILS_QUERY)
        console.log('With variables:', { gameId })
        
        // Try to fetch the game data
        let gameData: GameCreatedEvent | null = null
        
        try {
          const data = await graphqlClient.request<GraphQLResponse>(GAME_DETAILS_QUERY, { gameId })
          console.log('Raw GraphQL response:', data)
          
          if (data.gameCreateds && data.gameCreateds.length > 0) {
            gameData = data.gameCreateds[0]
            console.log('Game data found:', gameData)
          } else {
            console.log('No game data found in response')
          }
        } catch (graphqlError) {
          console.error('GraphQL error details:', graphqlError)
          if (graphqlError instanceof Error) {
            console.error('Error message:', graphqlError.message)
            console.error('Error stack:', graphqlError.stack)
          }
          throw new Error(`GraphQL query failed: ${graphqlError instanceof Error ? graphqlError.message : 'Unknown error'}`)
        }
        
        if (!gameData) {
          throw new Error(`Game with ID ${gameId} not found`)
        }
        
        // Transform GraphQL data and generate missing fields
        const startTime = parseInt(gameData.blockTimestamp)
        const endTime = startTime + (24 * 60 * 60) // 24 hour games
        const isActive = isGameActive(endTime)
        const timeLeftString = formatTimeRemaining(endTime)
        
        // Try to fetch real post data from Zora
        let postTitle = generateMockPostTitle(gameData.gameId)
        let postThumbnail = `/placeholder.svg?height=200&width=300`
        let description: string | undefined
        let symbol: string | undefined
        
        try {
          console.log(`Fetching Zora data for postCoin: ${gameData.postCoin}`)
          const zoraData = await zoraService.getCoinData(gameData.postCoin)
          if (zoraData) {
            console.log(`Zora data received for ${gameData.postCoin}:`, {
              name: zoraData.name,
              hasImage: !!zoraData.imageUrl,
              hasDescription: !!zoraData.description,
              symbol: zoraData.symbol
            })
            postTitle = zoraData.name || postTitle
            postThumbnail = zoraData.imageUrl || postThumbnail
            description = zoraData.description
            symbol = zoraData.symbol
          } else {
            console.log(`No Zora data found for ${gameData.postCoin}`)
          }
        } catch (zoraError) {
          console.warn(`Failed to fetch Zora data for ${gameData.postCoin}:`, zoraError)
          // Keep fallback data
        }
        
        // Generate realistic mock data for missing fields
        const mockLastBuyer = isActive ? "0x1234567890abcdef1234567890abcdef12345678" : "0xabcdef1234567890abcdef1234567890abcdef12"
        const mockTotalBuyCount = Math.floor(Math.random() * 50) + 5
        const mockFinalPhaseBuyCount = Math.floor(mockTotalBuyCount * 0.3)
        
        const transformedGame: TransformedGameDetail = {
          id: gameData.id,
          gameId: gameData.gameId,
          postTitle,
          postThumbnail,
          prizePool: formatUSDC(gameData.prizePool),
          timeLeft: timeLeftString,
          status: isActive ? "active" : "ended",
          minBuy: calculateMinBuy(gameData.gameId, isActive),
          sponsor: gameData.sponsor,
          postCoin: gameData.postCoin,
          startTime,
          endTime,
          lastBuyer: mockLastBuyer,
          claimed: !isActive && Math.random() > 0.5, // 50% chance claimed for ended games
          refunded: !isActive && mockTotalBuyCount === 0, // Refunded if no players
          finalPhaseBuyCount: mockFinalPhaseBuyCount,
          totalBuyCount: mockTotalBuyCount,
          hasPlayer: mockTotalBuyCount > 0,
          description,
          symbol
        }
        
        console.log('Game transformed successfully:', transformedGame)
        setGame(transformedGame)
        
      } catch (err) {
        console.error('Error fetching game:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch game')
        
        // Fallback to mock data if GraphQL fails
        console.log('Using fallback mock data for game detail')
        const fallbackGame: TransformedGameDetail = {
          id: gameId,
          gameId,
          postTitle: "Epic NFT Collection Launch",
          postThumbnail: "/placeholder.svg?height=200&width=300",
          prizePool: 500,
          timeLeft: "2h 34m",
          status: "active" as const,
          minBuy: 1.2,
          sponsor: "0x1234567890abcdef1234567890abcdef12345678",
          postCoin: "0xabcdef1234567890abcdef1234567890abcdef12",
          startTime: Math.floor(Date.now() / 1000) - 3600,
          endTime: Math.floor(Date.now() / 1000) + 86400,
          lastBuyer: "0x1234567890abcdef1234567890abcdef12345678",
          claimed: false,
          refunded: false,
          finalPhaseBuyCount: 5,
          totalBuyCount: 25,
          hasPlayer: true,
          description: "An amazing NFT collection that's taking the world by storm!",
          symbol: "EPIC"
        }
        setGame(fallbackGame)
      } finally {
        setLoading(false)
      }
    }

    fetchGame()
  }, [gameId])

  return { game, loading, error }
}
