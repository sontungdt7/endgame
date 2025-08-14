import { useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { BULLRUN_CONTRACT_ADDRESS, BULLRUN_ABI } from '@/lib/bullrun'
import { getTokenBySymbol } from '@/lib/tokens'

export function useBullRunContract() {
  const { user, ready } = usePrivy()
  const { address } = useAccount()
  const [error, setError] = useState<string | null>(null)

  // Get USDC token info
  const usdcToken = getTokenBySymbol('USDC')
  const usdcAddress = usdcToken?.address as `0x${string}`

  // Get next game ID
  const { data: nextGameId } = useReadContract({
    address: BULLRUN_CONTRACT_ADDRESS,
    abi: BULLRUN_ABI,
    functionName: 'nextGameId',
  })

  // Get minimum budget
  const { data: minBudget } = useReadContract({
    address: BULLRUN_CONTRACT_ADDRESS,
    abi: BULLRUN_ABI,
    functionName: 'MIN_BUDGET',
  })

  // Contract write for creating a game
  const { 
    data: createGameHash, 
    writeContract, 
    isPending: isCreateGamePending,
    error: createGameError
  } = useWriteContract()

  // Wait for create game transaction
  const { isLoading: isCreateGameLoading, isSuccess: isCreateGameSuccess } = useWaitForTransactionReceipt({
    hash: createGameHash,
  })

  // Create a new BullRun game
  const createGame = async (postCoinAddress: string, prizePool: string) => {
    if (!user || !ready || !address) {
      throw new Error('Wallet not connected')
    }

    if (!usdcToken) {
      throw new Error('USDC token not found')
    }

    if (!writeContract) {
      throw new Error('Contract write function not available')
    }

    try {
      // Convert prize pool to USDC units (6 decimals)
      const prizePoolUnits = parseUnits(prizePool, 6)
      
      // Check if prize pool meets minimum requirement
      if (minBudget && prizePoolUnits < minBudget) {
        throw new Error(`Prize pool must be at least ${formatUnits(minBudget, 6)} USDC`)
      }

      // Call the contract write function
      writeContract({
        address: BULLRUN_CONTRACT_ADDRESS,
        abi: BULLRUN_ABI,
        functionName: 'createGame',
        args: [postCoinAddress as `0x${string}`, prizePoolUnits]
      })

      return {
        success: true,
        transactionHash: createGameHash,
        gameId: nextGameId ? Number(nextGameId) : undefined
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create game'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  // Get current game data
  const getGame = async (gameId: number) => {
    if (!user || !ready) {
      throw new Error('Wallet not connected')
    }

    try {
      // Use wagmi's useReadContract for reading game data
      // This is a simplified approach - in practice you'd use the hook directly
      return null
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get game data'
      throw new Error(errorMessage)
    }
  }

  return {
    // State
    isLoading: isCreateGamePending || isCreateGameLoading,
    error: error || createGameError?.message || null,
    isCreateGameSuccess,
    
    // Data
    nextGameId: nextGameId ? Number(nextGameId) : undefined,
    minBudget: minBudget ? formatUnits(minBudget, 6) : undefined,
    
    // Actions
    createGame,
    getGame,
  }
}
