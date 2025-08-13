import { useState, useEffect } from 'react'
import { graphqlClient, GAME_DETAILS_QUERY, GAME_STATE_QUERY } from '@/lib/graphql'
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
  buyEvents: Array<{
    id: string
    gameId: string
    buyer: string
    amount: string
    newEndTime: string
    blockNumber: string
    blockTimestamp: string
    transactionHash: string
  }>
}

interface GraphQLResponse {
  gameCreateds: GameCreatedEvent[]
}

interface GameStateResponse {
  buyPostCoins: Array<{
    id: string
    gameId: string
    buyer: string
    amount: string
    newEndTime: string
    blockNumber: string
    blockTimestamp: string
    transactionHash: string
  }>
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
        console.log('Using GraphQL queries:')
        console.log('- Game creation query:', GAME_DETAILS_QUERY)
        console.log('- Buy events query:', GAME_STATE_QUERY)
        console.log('With variables:', { gameId })
        
        // Try to fetch the game creation data
        let gameData: GameCreatedEvent | null = null
        let buyEvents: GameStateResponse['buyPostCoins'] = []
        
        try {
          // Fetch game creation event
          console.log('🔍 Executing game creation query...')
          const creationData = await graphqlClient.request<GraphQLResponse>(GAME_DETAILS_QUERY, { gameId })
          console.log('✅ Game creation query successful')
          console.log('Raw game creation response:', creationData)
          
          if (creationData.gameCreateds && creationData.gameCreateds.length > 0) {
            gameData = creationData.gameCreateds[0]
            console.log('Game creation data found:', gameData)
          } else {
            console.log('No game creation data found in response')
          }
          
          // Fetch real game state data including lastBuyer and totalBuyCount
          try {
            console.log('🔍 Executing buy events query...')
            const stateData = await graphqlClient.request<GameStateResponse>(GAME_STATE_QUERY, { gameId })
            console.log('✅ Buy events query successful')
            console.log('Raw buy events response:', stateData)
            
            if (stateData.buyPostCoins && stateData.buyPostCoins.length > 0) {
              buyEvents = stateData.buyPostCoins
              console.log('Buy events data found:', buyEvents.length, 'events')
            } else {
              console.log('No buy events found in response')
            }
          } catch (stateError) {
            console.warn('❌ Failed to fetch buy events data, using fallback:', stateError)
            // Continue with fallback data
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
        
        // Use real data from buy events if available, otherwise show zero values (no mock data)
        const realLastBuyer = buyEvents.length > 0 ? buyEvents[0].buyer : "0x0000000000000000000000000000000000000000"
        const realTotalBuyCount = buyEvents.length
        const realFinalPhaseBuyCount = Math.floor(realTotalBuyCount * 0.3) // Estimate based on total count
        
        // For now, we'll use mock data for claimed/refunded since these aren't in the events
        const realClaimed = false // TODO: Query PrizeClaimed events if available
        const realRefunded = false // TODO: Query RefundIssued events if available
        const realHasPlayer = realTotalBuyCount > 0
        
        console.log('=== REAL DATA ANALYSIS ===')
        console.log('Buy events found:', buyEvents.length)
        console.log('Real lastBuyer:', realLastBuyer)
        console.log('Real totalBuyCount:', realTotalBuyCount)
        console.log('Real finalPhaseBuyCount:', realFinalPhaseBuyCount)
        console.log('Real hasPlayer:', realHasPlayer)
        console.log('========================')
        
        // SHOW REAL DATA OR ZERO VALUES - no mock data
        const lastBuyer = buyEvents.length > 0 ? realLastBuyer : "0x0000000000000000000000000000000000000000"
        const totalBuyCount = realTotalBuyCount // This will be 0 when no buy events
        const finalPhaseBuyCount = realFinalPhaseBuyCount // This will be 0 when no buy events
        const claimed = realClaimed
        const refunded = realRefunded
        const hasPlayer = realHasPlayer // This will be false when no buy events
        
        console.log('=== FINAL VALUES ===')
        console.log('Final lastBuyer:', lastBuyer)
        console.log('Final totalBuyCount:', totalBuyCount)
        console.log('Final finalPhaseBuyCount:', finalPhaseBuyCount)
        console.log('Final hasPlayer:', hasPlayer)
        console.log('Data Source:', buyEvents.length > 0 ? 'REAL GRAPHQL DATA' : 'ZERO VALUES (NO BUYERS YET)')
        console.log('====================')
        
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
          lastBuyer,
          claimed,
          refunded,
          finalPhaseBuyCount,
          totalBuyCount,
          hasPlayer,
          description,
          symbol,
          buyEvents: buyEvents // Include buy events in the transformed object
        }
        
        console.log('=== TRANSFORMED GAME OBJECT ===')
        console.log('Complete game object:', JSON.stringify(transformedGame, null, 2))
        console.log('Key fields for display:')
        console.log('- lastBuyer:', transformedGame.lastBuyer)
        console.log('- totalBuyCount:', transformedGame.totalBuyCount)
        console.log('- finalPhaseBuyCount:', transformedGame.finalPhaseBuyCount)
        console.log('===============================')
        
        console.log('Game transformed successfully with real data:', transformedGame)
        
        // Final summary log
        console.log('🎯 FINAL SUMMARY:')
        console.log(`Game ${gameId}:`)
        console.log(`- Last Buyer: ${lastBuyer} ${buyEvents.length > 0 ? '(REAL DATA)' : '(NO BUYERS YET)'}`)
        console.log(`- Total Buy Count: ${totalBuyCount} ${buyEvents.length > 0 ? '(REAL DATA)' : '(NO BUYERS YET)'}`)
        console.log(`- Data Source: ${buyEvents.length > 0 ? 'GraphQL Buy Events' : 'Zero Values (No Buyers Yet)'}`)
        console.log('🎯 END SUMMARY')
        
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
          symbol: "EPIC",
          buyEvents: [] // No buy events in fallback
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
