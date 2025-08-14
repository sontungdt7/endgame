import { useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { BULLRUN_CONTRACT_ADDRESS, BULLRUN_ABI } from '@/lib/bullrun'
import { getTokenBySymbol } from '@/lib/tokens'

// USDC ABI for approval function
const USDC_ABI = [
  {
    "type": "function",
    "name": "approve",
    "inputs": [
      {
        "name": "spender",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "amount",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "nonpayable"
  }
] as const

export function useBullRunContract() {
  const { user, ready } = usePrivy()
  const { address } = useAccount()
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState<'idle' | 'approving' | 'creating' | 'success'>('idle')

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

  // USDC approval contract write
  const { 
    data: approveHash, 
    writeContract: approveUSDC, 
    isPending: isApprovePending,
    error: approveError
  } = useWriteContract()

  // Game creation contract write
  const { 
    data: createGameHash, 
    writeContract: createGameWrite, 
    isPending: isCreateGamePending,
    error: createGameError
  } = useWriteContract()

  // Refund contract write
  const { 
    data: refundHash, 
    writeContract: refundWrite, 
    isPending: isRefundPending,
    error: refundError
  } = useWriteContract()

  // Claim prize contract write
  const { 
    data: claimPrizeHash, 
    writeContract: claimPrizeWrite, 
    isPending: isClaimPrizePending,
    error: claimPrizeError
  } = useWriteContract()

  // Wait for USDC approval transaction
  const { isLoading: isApproveLoading, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
  })

  // Wait for create game transaction
  const { isLoading: isCreateGameLoading, isSuccess: isCreateGameSuccess } = useWaitForTransactionReceipt({
    hash: createGameHash,
  })

  // Wait for refund transaction
  const { isLoading: isRefundLoading, isSuccess: isRefundSuccess } = useWaitForTransactionReceipt({
    hash: refundHash,
  })

  // Wait for claim prize transaction
  const { isLoading: isClaimPrizeLoading, isSuccess: isClaimPrizeSuccess } = useWaitForTransactionReceipt({
    hash: claimPrizeHash,
  })

  // Create a new BullRun game with USDC approval
  const createGame = async (postCoinAddress: string, prizePool: string) => {
    if (!user || !ready || !address) {
      throw new Error('Wallet not connected')
    }

    if (!usdcToken) {
      throw new Error('USDC token not found')
    }

    if (!approveUSDC || !createGameWrite) {
      throw new Error('Contract write functions not available')
    }

    try {
      // Convert prize pool to USDC units (6 decimals)
      const prizePoolUnits = parseUnits(prizePool, 6)
      
      // Check if prize pool meets minimum requirement
      if (minBudget && prizePoolUnits < minBudget) {
        throw new Error(`Prize pool must be at least ${formatUnits(minBudget, 6)} USDC`)
      }

      setCurrentStep('approving')
      setError(null)

      // Step 1: Approve USDC spending
      approveUSDC({
        address: usdcAddress,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [BULLRUN_CONTRACT_ADDRESS, prizePoolUnits]
      })

      // The approval success will trigger the game creation in the useEffect below
      
      return {
        success: true,
        step: 'approving',
        gameId: nextGameId ? Number(nextGameId) : undefined
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create game'
      setError(errorMessage)
      setCurrentStep('idle')
      throw new Error(errorMessage)
    }
  }

  // Auto-create game after USDC approval succeeds
  const createGameAfterApproval = async (postCoinAddress: string, prizePool: string) => {
    if (!createGameWrite) return

    try {
      setCurrentStep('creating')
      const prizePoolUnits = parseUnits(prizePool, 6)

      // Step 2: Create the game
      createGameWrite({
        address: BULLRUN_CONTRACT_ADDRESS,
        abi: BULLRUN_ABI,
        functionName: 'createGame',
        args: [postCoinAddress as `0x${string}`, prizePoolUnits]
      })
    } catch (err) {
      setError('Failed to create game after approval')
      setCurrentStep('idle')
    }
  }

  // Refund prize pool when no players join
  const refundPrizePool = async (gameId: number) => {
    console.log('refundPrizePool called with gameId:', gameId)
    console.log('User state:', { user: !!user, ready, address })
    console.log('Refund write function:', !!refundWrite)
    
    if (!user || !ready || !address) {
      console.log('Wallet not connected - throwing error')
      throw new Error('Wallet not connected')
    }

    if (!refundWrite) {
      console.log('Refund function not available - throwing error')
      throw new Error('Refund function not available')
    }

    try {
      console.log('Setting error to null and calling refundWrite')
      setError(null)

      // Call the refund function
      refundWrite({
        address: BULLRUN_CONTRACT_ADDRESS,
        abi: BULLRUN_ABI,
        functionName: 'refund',
        args: [BigInt(gameId)]
      })

      console.log('refundWrite called successfully')
      
      // Return success immediately after submitting the transaction
      return {
        success: true,
        message: 'Refund transaction submitted successfully'
      }

    } catch (err) {
      console.log('Error in refundPrizePool:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to refund prize pool'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  // Claim prize when game ends and user is the winner
  const claimPrize = async (gameId: number) => {
    console.log('claimPrize called with gameId:', gameId)
    console.log('User state:', { user: !!user, ready, address })
    console.log('Claim prize write function:', !!claimPrizeWrite)
    
    if (!user || !ready || !address) {
      console.log('Wallet not connected - throwing error')
      throw new Error('Wallet not connected')
    }

    if (!claimPrizeWrite) {
      console.log('Claim prize function not available - throwing error')
      throw new Error('Claim prize function not available')
    }

    try {
      console.log('Setting error to null and calling claimPrizeWrite')
      setError(null)

      // Call the claim prize function
      claimPrizeWrite({
        address: BULLRUN_CONTRACT_ADDRESS,
        abi: BULLRUN_ABI,
        functionName: 'claimPrize',
        args: [BigInt(gameId)]
      })

      console.log('claimPrizeWrite called successfully')
      
      // Return success immediately after submitting the transaction
      return {
        success: true,
        message: 'Claim prize transaction submitted successfully'
      }

    } catch (err) {
      console.log('Error in claimPrize:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to claim prize'
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
    isLoading: isApprovePending || isApproveLoading || isCreateGamePending || isCreateGameLoading || isRefundPending || isRefundLoading || isClaimPrizePending || isClaimPrizeLoading,
    error: error || approveError?.message || createGameError?.message || refundError?.message || claimPrizeError?.message || null,
    isCreateGameSuccess,
    isRefundSuccess,
    isRefundPending,
    isClaimPrizeSuccess,
    isClaimPrizePending,
    isClaimPrizeLoading,
    currentStep,
    
    // Data
    nextGameId: nextGameId ? Number(nextGameId) : undefined,
    minBudget: minBudget ? formatUnits(minBudget, 6) : undefined,
    
    // Actions
    createGame,
    createGameAfterApproval,
    refundPrizePool,
    claimPrize,
    getGame,
  }
}
