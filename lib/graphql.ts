import { GraphQLClient } from 'graphql-request'

const GRAPHQL_ENDPOINT = 'https://api.studio.thegraph.com/query/88583/viralpost/0.0.1'

export const graphqlClient = new GraphQLClient(GRAPHQL_ENDPOINT)

// GraphQL query for gameCreateds events
export const GAME_CREATEDS_QUERY = `
  query GetGameCreateds($first: Int = 100, $skip: Int = 0) {
    gameCreateds(first: $first, skip: $skip, orderBy: blockNumber, orderDirection: desc) {
      id
      gameId
      sponsor
      postCoin
      prizePool
      blockNumber
      blockTimestamp
      transactionHash
    }
  }
`

// GraphQL query for individual game details - using gameCreateds with filter
export const GAME_DETAILS_QUERY = `
  query GetGame($gameId: String!) {
    gameCreateds(where: { gameId: $gameId }, first: 1, orderBy: blockNumber, orderDirection: desc) {
      id
      gameId
      sponsor
      postCoin
      prizePool
      blockNumber
      blockTimestamp
      transactionHash
    }
  }
`

// Debug query to see what's available
export const DEBUG_QUERY = `
  query {
    __schema {
      types {
        name
        fields {
          name
          type {
            name
          }
        }
      }
    }
  }
`

// GraphQL query for game state data - including lastBuyer and totalBuyCount
export const GAME_STATE_QUERY = `
  query GetGameState($gameId: String!) {
    buyPostCoins(where: { gameId: $gameId }, orderBy: blockTimestamp, orderDirection: desc) {
      id
      gameId
      buyer
      amount
      newEndTime
      blockNumber
      blockTimestamp
      transactionHash
    }
  }
`

// GraphQL query for prize claimed events
export const PRIZE_CLAIMED_QUERY = `
  query GetPrizeClaimed($gameId: String!) {
    prizeClaimeds(where: { gameId: $gameId }, first: 1, orderBy: blockNumber, orderDirection: desc) {
      id
      gameId
      winner
      amount
      blockNumber
      blockTimestamp
      transactionHash
    }
  }
`

// GraphQL query for refund issued events
export const REFUND_ISSUED_QUERY = `
  query GetRefundIssued($gameId: String!) {
    refundIssueds(where: { gameId: $gameId }, first: 1, orderBy: blockNumber, orderDirection: desc) {
      id
      gameId
      sponsor
      amount
      blockNumber
      blockTimestamp
      transactionHash
    }
  }
`
