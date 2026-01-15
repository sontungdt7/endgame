import { useState, useEffect } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi'
import { parseUnits, encodeAbiParameters, parseAbiParameters } from 'viem'
import { 
  LIQUIDITY_LAUNCHER_ADDRESS, 
  VIRTUAL_LBP_STRATEGY_FACTORY_ADDRESS,
  TOKEN_FACTORY_ADDRESS,
  LIQUIDITY_LAUNCHER_ABI,
  type CreateTokenParams,
  type Distribution,
  type MigratorParameters,
  type AuctionParameters,
  encodeVirtualLBPConfigData,
  encodeTokenData
} from '@/lib/liquidity-launcher'

// ActionConstants.MSG_SENDER = address(1)
const MSG_SENDER = "0x0000000000000000000000000000000000000001" as const;

export function useLiquidityLauncher() {
  const { user, ready } = usePrivy()
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState<'idle' | 'creating-token' | 'distributing-token' | 'success'>('idle')
  const [createdTokenAddress, setCreatedTokenAddress] = useState<`0x${string}` | null>(null)

  // Create token contract write
  const { 
    data: createTokenHash, 
    writeContract: createTokenWrite, 
    isPending: isCreateTokenPending,
    error: createTokenError
  } = useWriteContract()

  // Distribute token contract write
  const { 
    data: distributeTokenHash, 
    writeContract: distributeTokenWrite, 
    isPending: isDistributeTokenPending,
    error: distributeTokenError
  } = useWriteContract()

  // Wait for create token transaction
  const { isLoading: isCreateTokenLoading, isSuccess: isCreateTokenSuccess, data: createTokenReceipt } = useWaitForTransactionReceipt({
    hash: createTokenHash,
  })

  // Wait for distribute token transaction
  const { isLoading: isDistributeTokenLoading, isSuccess: isDistributeTokenSuccess } = useWaitForTransactionReceipt({
    hash: distributeTokenHash,
  })

  // Extract token address from createToken transaction event
  useEffect(() => {
    if (createTokenReceipt && publicClient && !createdTokenAddress) {
      const extractTokenAddress = async () => {
        try {
          // Decode TokenCreated event
          const tokenCreatedEvent = createTokenReceipt.logs.find(log => {
            try {
              const decoded = publicClient.decodeEventLog({
                abi: LIQUIDITY_LAUNCHER_ABI,
                eventName: 'TokenCreated',
                data: log.data,
                topics: log.topics
              })
              return decoded
            } catch {
              return false
            }
          })

          if (tokenCreatedEvent) {
            const decoded = publicClient.decodeEventLog({
              abi: LIQUIDITY_LAUNCHER_ABI,
              eventName: 'TokenCreated',
              data: tokenCreatedEvent.data,
              topics: tokenCreatedEvent.topics
            })
            setCreatedTokenAddress(decoded.args.tokenAddress as `0x${string}`)
          }
        } catch (err) {
          console.error('Error extracting token address:', err)
        }
      }
      extractTokenAddress()
    }
  }, [createTokenReceipt, publicClient, createdTokenAddress])

  // Create a new token via LiquidityLauncher
  const createToken = async (
    name: string,
    symbol: string,
    decimals: number,
    initialSupply: string, // in token units (will be converted based on decimals)
    recipient: `0x${string}`, // Should be LiquidityLauncher address when using multicall
    description: string,
    website: string,
    imageUri: string,
    tokenFactory?: `0x${string}`
  ) => {
    if (!user || !ready || !address) {
      throw new Error('Wallet not connected')
    }

    if (!createTokenWrite) {
      throw new Error('Contract write function not available')
    }

    try {
      setCurrentStep('creating-token')
      setError(null)

      // Convert initial supply to wei based on decimals
      const initialSupplyWei = parseUnits(initialSupply, decimals)

      // Encode tokenData (metadata for UERC20Factory)
      const tokenData = encodeTokenData(description, website, imageUri)

      const factoryAddress = tokenFactory || TOKEN_FACTORY_ADDRESS

      createTokenWrite({
        address: LIQUIDITY_LAUNCHER_ADDRESS,
        abi: LIQUIDITY_LAUNCHER_ABI,
        functionName: 'createToken',
        args: [
          factoryAddress,
          name,
          symbol,
          decimals,
          initialSupplyWei,
          recipient,
          tokenData
        ]
      })

      return {
        success: true,
        step: 'creating-token',
        txHash: createTokenHash
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create token'
      setError(errorMessage)
      setCurrentStep('idle')
      throw new Error(errorMessage)
    }
  }

  // Distribute token via LiquidityLauncher (start auction)
  const distributeToken = async (
    tokenAddress: `0x${string}`,
    totalSupply: bigint, // Total supply to distribute (uint128)
    migratorParams: MigratorParameters,
    auctionParams: AuctionParameters,
    governanceAddress: `0x${string}` = address || "0x0000000000000000000000000000000000000000",
    payerIsUser: boolean = false, // Should be false when tokens are already in launcher
    salt: `0x${string}` = `0x${'0'.repeat(64)}`
  ) => {
    if (!user || !ready || !address) {
      throw new Error('Wallet not connected')
    }

    if (!distributeTokenWrite) {
      throw new Error('Contract write function not available')
    }

    try {
      setCurrentStep('distributing-token')
      setError(null)

      // Encode configData for VirtualLBPStrategyFactory
      const configData = encodeVirtualLBPConfigData(
        governanceAddress,
        migratorParams,
        auctionParams
      )

      const distribution: Distribution = {
        strategy: VIRTUAL_LBP_STRATEGY_FACTORY_ADDRESS,
        amount: totalSupply,
        configData
      }

      distributeTokenWrite({
        address: LIQUIDITY_LAUNCHER_ADDRESS,
        abi: LIQUIDITY_LAUNCHER_ABI,
        functionName: 'distributeToken',
        args: [
          tokenAddress,
          distribution,
          payerIsUser,
          salt
        ]
      })

      return {
        success: true,
        step: 'distributing-token',
        txHash: distributeTokenHash
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to distribute token'
      setError(errorMessage)
      setCurrentStep('idle')
      throw new Error(errorMessage)
    }
  }

  // Check if both operations completed successfully
  const isSuccess = isCreateTokenSuccess && isDistributeTokenSuccess

  return {
    // State
    isLoading: isCreateTokenPending || isCreateTokenLoading || isDistributeTokenPending || isDistributeTokenLoading,
    error: error || createTokenError?.message || distributeTokenError?.message || null,
    isCreateTokenSuccess,
    isDistributeTokenSuccess,
    isSuccess,
    currentStep,
    createTokenHash,
    distributeTokenHash,
    createdTokenAddress,
    
    // Actions
    createToken,
    distributeToken,
  }
}
