import { useState, useEffect } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi'
import {
  BaseError,
  ContractFunctionRevertedError,
  ContractFunctionZeroDataError,
  ExecutionRevertedError,
  decodeEventLog,
  encodeAbiParameters,
  encodeFunctionData,
  formatUnits,
  parseAbiParameters,
  parseUnits,
} from 'viem'
import { sepolia } from 'wagmi/chains'
import { 
  LIQUIDITY_LAUNCHER_ADDRESS, 
  VIRTUAL_LBP_STRATEGY_FACTORY_ADDRESS,
  LBP_STRATEGY_BASIC_FACTORY_ADDRESS,
  TOKEN_FACTORY_ADDRESS,
  LIQUIDITY_LAUNCHER_ABI,
  type CreateTokenParams,
  type Distribution,
  type MigratorParameters,
  type AuctionParameters,
  encodeVirtualLBPConfigData,
  encodeLBPConfigData,
  findValidLBPSalt0,
  encodeTokenData,
  computeGraffiti,
  precomputeTokenAddress
} from '@/lib/liquidity-launcher'

// ActionConstants.MSG_SENDER = address(1)
const MSG_SENDER = "0x0000000000000000000000000000000000000001" as const;

export function useLiquidityLauncher() {
  const { user, ready, authenticated } = usePrivy()
  const { wallets } = useWallets()
  const { address: wagmiAddress, chainId, isConnected } = useAccount()
  const publicClient = usePublicClient()
  
  // Get address from Privy wallets if wagmi address is not available yet
  const privyWalletAddress = wallets.length > 0 ? wallets[0].address as `0x${string}` : null
  const address = wagmiAddress || privyWalletAddress
  
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<any>(null) // Store detailed error info
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

  // Multicall contract write (for combined createToken + distributeToken)
  const { 
    data: multicallHash, 
    writeContract: multicallWrite, 
    isPending: isMulticallPending,
    error: multicallError
  } = useWriteContract()

  // Wait for create token transaction - explicitly use Sepolia
  const { isLoading: isCreateTokenLoading, isSuccess: isCreateTokenSuccess, data: createTokenReceipt } = useWaitForTransactionReceipt({
    hash: createTokenHash,
    chainId: sepolia.id, // Force Sepolia network
  })

  // Wait for distribute token transaction - explicitly use Sepolia
  const { isLoading: isDistributeTokenLoading, isSuccess: isDistributeTokenSuccess } = useWaitForTransactionReceipt({
    hash: distributeTokenHash,
    chainId: sepolia.id, // Force Sepolia network
  })

  // Wait for multicall transaction - explicitly use Sepolia
  const { isLoading: isMulticallLoading, isSuccess: isMulticallSuccess, data: multicallReceipt } = useWaitForTransactionReceipt({
    hash: multicallHash,
    chainId: sepolia.id, // Force Sepolia network
  })

  // Extract token address from createToken transaction event
  useEffect(() => {
    if (createTokenReceipt && !createdTokenAddress) {
      const extractTokenAddress = () => {
        try {
          // Decode TokenCreated event using viem's decodeEventLog
          const tokenCreatedEvent = createTokenReceipt.logs.find(log => {
            try {
              const decoded = decodeEventLog({
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
            const decoded = decodeEventLog({
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
  }, [createTokenReceipt, createdTokenAddress])

  // Extract token address from multicall transaction event
  useEffect(() => {
    if (multicallReceipt && !createdTokenAddress) {
      const extractTokenAddress = () => {
        try {
          // Decode TokenCreated event from multicall transaction
          const tokenCreatedEvent = multicallReceipt.logs.find(log => {
            try {
              const decoded = decodeEventLog({
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
            const decoded = decodeEventLog({
              abi: LIQUIDITY_LAUNCHER_ABI,
              eventName: 'TokenCreated',
              data: tokenCreatedEvent.data,
              topics: tokenCreatedEvent.topics
            })
            setCreatedTokenAddress(decoded.args.tokenAddress as `0x${string}`)
          }
        } catch (err) {
          console.error('Error extracting token address from multicall:', err)
        }
      }
      extractTokenAddress()
    }
  }, [multicallReceipt, createdTokenAddress])

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
    // Check wallet connection with detailed error messages
    if (!ready) {
      throw new Error('Wallet provider is still initializing. Please wait...')
    }

    if (!authenticated || !user) {
      throw new Error('Please connect your wallet first using Privy')
    }

    if (!isConnected || !address) {
      throw new Error('Wallet is not connected. Please ensure your wallet is connected and try again.')
    }

    // Warn if not on Sepolia (but don't block, as chainId is specified in writeContract)
    if (chainId && chainId !== sepolia.id) {
      console.warn(`Wallet is on chain ${chainId}, but transactions will be sent to Sepolia (${sepolia.id})`)
    }

    if (!createTokenWrite) {
      throw new Error('Contract write function not available. Please try refreshing the page.')
    }

    // Declare for catch logging safety
    let factoryAddress: `0x${string}` | undefined
    let initialSupplyWei: bigint | undefined
    let tokenData: `0x${string}` | undefined

    try {
      setCurrentStep('creating-token')
      setError(null)
      setErrorDetails(null)

      // Convert initial supply to wei based on decimals
      initialSupplyWei = parseUnits(initialSupply, decimals)

      // Encode tokenData (metadata for UERC20Factory)
      tokenData = encodeTokenData(description, website, imageUri)

      factoryAddress = (tokenFactory || TOKEN_FACTORY_ADDRESS) as `0x${string}`

      // Preflight simulation (gives real revert reason instead of MetaMask "likely to fail")
      if (publicClient && address) {
        try {
          await publicClient.simulateContract({
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
            ],
            account: address,
            chain: sepolia,
          })
        } catch (simErr) {
          const details = extractErrorDetails(simErr)
          // Log full error for debugging
          console.error('❌ CreateToken simulation reverted:', {
            simErr,
            details,
            fullError: simErr instanceof Error ? {
              name: simErr.name,
              message: simErr.message,
              stack: simErr.stack,
              cause: (simErr as any).cause,
            } : simErr,
            args: {
              factoryAddress,
              name,
              symbol,
              decimals,
              initialSupply: initialSupplyWei ? initialSupplyWei.toString() : undefined,
              recipient,
              tokenDataLength: tokenData ? tokenData.length : undefined,
              tokenDataPreview: tokenData ? tokenData.substring(0, 100) + '...' : undefined,
            }
          })
          const errorMessage = details.reason 
            ? `${details.message} (Reason: ${details.reason})`
            : details.message || 'Simulation reverted'
          setError(errorMessage)
          setErrorDetails(details)
          setCurrentStep('idle')
          throw new Error(errorMessage)
        }
      }

      createTokenWrite({
        address: LIQUIDITY_LAUNCHER_ADDRESS,
        abi: LIQUIDITY_LAUNCHER_ABI,
        functionName: 'createToken',
        chainId: sepolia.id, // Force Sepolia network
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
      const errorDetails = extractErrorDetails(err)
      const errorMessage = errorDetails.message || 'Failed to create token'
      console.error('❌ CreateToken Error:', {
        error: err,
        details: errorDetails,
        args: {
          factory: factoryAddress,
          name,
          symbol,
          decimals,
          initialSupply: initialSupplyWei ? initialSupplyWei.toString() : undefined,
          recipient,
          tokenDataLength: tokenData ? tokenData.length : undefined
        }
      })
      setError(errorMessage)
      setErrorDetails(errorDetails)
      setCurrentStep('idle')
      throw new Error(errorMessage)
    }
  }

  // Distribute token via LiquidityLauncher (start auction)
  // Note: Using LBPStrategyBasicFactory (works with regular ERC20 tokens, not virtual tokens)
  const distributeToken = async (
    tokenAddress: `0x${string}`,
    totalSupply: bigint, // Total supply to distribute (uint128)
    migratorParams: MigratorParameters,
    auctionParams: AuctionParameters,
    payerIsUser: boolean = false, // Should be false when tokens are already in launcher
    salt: `0x${string}` = `0x${'0'.repeat(64)}`
  ) => {
    // Check wallet connection with detailed error messages
    if (!ready) {
      throw new Error('Wallet provider is still initializing. Please wait...')
    }

    if (!authenticated || !user) {
      throw new Error('Please connect your wallet first using Privy')
    }

    if (!isConnected || !address) {
      throw new Error('Wallet is not connected. Please ensure your wallet is connected and try again.')
    }

    // Warn if not on Sepolia (but don't block, as chainId is specified in writeContract)
    if (chainId && chainId !== sepolia.id) {
      console.warn(`Wallet is on chain ${chainId}, but transactions will be sent to Sepolia (${sepolia.id})`)
    }

    if (!distributeTokenWrite) {
      throw new Error('Contract write function not available. Please try refreshing the page.')
    }

    // Declare for catch logging safety
    let configData: `0x${string}` | undefined
    let distribution: Distribution | undefined

    try {
      setCurrentStep('distributing-token')
      setError(null)
      setErrorDetails(null)

      // Encode configData for LBPStrategyBasicFactory (no governanceAddress needed)
      configData = encodeLBPConfigData(
        migratorParams,
        auctionParams
      )

      // If salt is unset/zero, mine a CREATE2 salt that yields a valid v4 hook address.
      // Without this, the LBPStrategyBasic constructor can revert with Hooks.HookAddressNotValid(address).
      let saltToUse = salt
      const isZeroSalt = /^0x0{64}$/i.test(salt)
      if (isZeroSalt && publicClient && address) {
        try {
          console.log('🔍 Mining salt for valid LBP hook address (needs address ending in 0x2000)...')
          saltToUse = await findValidLBPSalt0({
            publicClient: publicClient as any,
            factoryAddress: LBP_STRATEGY_BASIC_FACTORY_ADDRESS,
            token: tokenAddress,
            totalSupply,
            configData,
            user: address,
            maxTries: 500, // Reduced further - should find valid salt quickly with correct bit check
            timeoutMs: 20000, // 20 second timeout
            onProgress: (current, max) => {
              if (current % 100 === 0 || current === max) {
                console.log(`⏳ Salt mining: ${current}/${max} (${Math.round((current / max) * 100)}%)`)
              }
            }
          })
          console.log('✅ Found valid LBP hook salt0:', saltToUse)
        } catch (e) {
          console.warn('⚠️ Failed to find valid LBP hook salt0, using provided salt:', { e, salt })
          // Continue with zero salt - might still work if address happens to be valid
        }
      }

      distribution = {
        strategy: LBP_STRATEGY_BASIC_FACTORY_ADDRESS,
        amount: totalSupply,
        configData
      }

      // Preflight simulation (gives real revert reason instead of MetaMask "likely to fail")
      if (publicClient && address) {
        try {
          await publicClient.simulateContract({
            address: LIQUIDITY_LAUNCHER_ADDRESS,
            abi: LIQUIDITY_LAUNCHER_ABI,
            functionName: 'distributeToken',
            args: [
              tokenAddress,
              {
                strategy: distribution.strategy,
                amount: distribution.amount,
                configData: distribution.configData
              },
              payerIsUser,
              saltToUse
            ],
            account: address,
            chain: sepolia,
          })
        } catch (simErr) {
          const details = extractErrorDetails(simErr)
          console.error('❌ DistributeToken simulation reverted:', { simErr, details })
          setError(details.message || 'Simulation reverted')
          setErrorDetails(details)
          setCurrentStep('idle')
          throw new Error(details.message || 'Simulation reverted')
        }
      }

      // Pass distribution as tuple to match ABI structure
      // The ABI expects Distribution as a tuple: (address strategy, uint128 amount, bytes configData)
      distributeTokenWrite({
        address: LIQUIDITY_LAUNCHER_ADDRESS,
        abi: LIQUIDITY_LAUNCHER_ABI,
        functionName: 'distributeToken',
        chainId: sepolia.id, // Force Sepolia network
        args: [
          tokenAddress,
          {
            strategy: distribution.strategy,
            amount: distribution.amount,
            configData: distribution.configData
          },
          payerIsUser,
          saltToUse
        ]
      })

      return {
        success: true,
        step: 'distributing-token',
        txHash: distributeTokenHash
      }

    } catch (err) {
      const errorDetails = extractErrorDetails(err)
      const errorMessage = errorDetails.message || 'Failed to distribute token'
      console.error('❌ DistributeToken Error:', {
        error: err,
        details: errorDetails,
        args: {
          tokenAddress,
          totalSupply: totalSupply.toString(),
          strategy: distribution?.strategy,
          amount: distribution?.amount ? distribution.amount.toString() : undefined,
          configDataLength: configData ? configData.length : undefined
        }
      })
      setError(errorMessage)
      setErrorDetails(errorDetails)
      setCurrentStep('idle')
      throw new Error(errorMessage)
    }
  }

  // Create token and distribute in a single multicall transaction
  const createAndDistributeToken = async (
    name: string,
    symbol: string,
    decimals: number,
    initialSupply: string, // in token units (will be converted based on decimals)
    description: string,
    website: string,
    imageUri: string,
    totalSupply: bigint, // Total supply to distribute (uint128)
    migratorParams: MigratorParameters,
    auctionParams: AuctionParameters,
    governanceAddress: `0x${string}` = address || "0x0000000000000000000000000000000000000000",
    tokenFactory?: `0x${string}`
  ) => {
    // Check wallet connection with detailed error messages
    if (!ready) {
      throw new Error('Wallet provider is still initializing. Please wait...')
    }

    if (!authenticated || !user) {
      throw new Error('Please connect your wallet first using Privy')
    }

    if (!isConnected || !address) {
      throw new Error('Wallet is not connected. Please ensure your wallet is connected and try again.')
    }

    // Warn if not on Sepolia (but don't block, as chainId is specified in writeContract)
    if (chainId && chainId !== sepolia.id) {
      console.warn(`Wallet is on chain ${chainId}, but transactions will be sent to Sepolia (${sepolia.id})`)
    }

    if (!multicallWrite) {
      throw new Error('Contract write function not available. Please try refreshing the page.')
    }

    // Declare these so the catch block never ReferenceErrors
    let createTokenCall: `0x${string}` | undefined
    let distributeTokenCall: `0x${string}` | undefined
    let precomputedTokenAddress: `0x${string}` | undefined

    try {
      setCurrentStep('creating-token')
      setError(null)
      setErrorDetails(null)

      // Convert initial supply to wei based on decimals
      const initialSupplyWei = parseUnits(initialSupply, decimals)

      // Encode tokenData (metadata for UERC20Factory)
      const tokenData = encodeTokenData(description, website, imageUri)

      const factoryAddress = tokenFactory || TOKEN_FACTORY_ADDRESS

      // Compute graffiti (same as LiquidityLauncher.getGraffiti)
      const graffiti = computeGraffiti(address)

      // Precompute token address
      precomputedTokenAddress = await precomputeTokenAddress(
        factoryAddress,
        name,
        symbol,
        decimals,
        LIQUIDITY_LAUNCHER_ADDRESS, // creator is launcher when using multicall
        graffiti
      )

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

      // Encode createToken call
      createTokenCall = encodeFunctionData({
        abi: LIQUIDITY_LAUNCHER_ABI,
        functionName: 'createToken',
        args: [
          factoryAddress,
          name,
          symbol,
          decimals,
          initialSupplyWei,
          LIQUIDITY_LAUNCHER_ADDRESS, // recipient is launcher when using multicall
          tokenData
        ]
      })

      // Encode distributeToken call
      distributeTokenCall = encodeFunctionData({
        abi: LIQUIDITY_LAUNCHER_ABI,
        functionName: 'distributeToken',
        args: [
          precomputedTokenAddress,
          // IMPORTANT: pass tuple args explicitly to avoid malformed calldata
          // distributeToken expects Distribution = (address strategy, uint128 amount, bytes configData)
          {
            strategy: distribution.strategy,
            amount: distribution.amount,
            configData: distribution.configData
          },
          false, // payerIsUser is false when tokens are in launcher
          `0x${'0'.repeat(64)}` as `0x${string}` // salt
        ]
      })

      // Preflight simulation (gives real revert reason instead of MetaMask "unknown RPC error")
      // MetaMask uses estimateGas which can surface as "unknown RPC error" when it reverts.
      // We simulate the exact multicall with the connected account on Sepolia to get decoded errors.
      if (publicClient && address) {
        try {
          await publicClient.simulateContract({
            address: LIQUIDITY_LAUNCHER_ADDRESS,
            abi: LIQUIDITY_LAUNCHER_ABI,
            functionName: 'multicall',
            args: [[createTokenCall, distributeTokenCall]],
            account: address,
            chain: sepolia,
          })
        } catch (simErr) {
          const details = extractErrorDetails(simErr)
          console.error('❌ Multicall simulation reverted:', { simErr, details })
          setError(details.message || 'Simulation reverted')
          setErrorDetails(details)
          setCurrentStep('idle')
          throw new Error(details.message || 'Simulation reverted')
        }
      }

      // Execute multicall with both calls
      multicallWrite({
        address: LIQUIDITY_LAUNCHER_ADDRESS,
        abi: LIQUIDITY_LAUNCHER_ABI,
        functionName: 'multicall',
        chainId: sepolia.id, // Force Sepolia network
        args: [[createTokenCall, distributeTokenCall]]
      })

      // Set the precomputed address immediately
      setCreatedTokenAddress(precomputedTokenAddress)

      return {
        success: true,
        step: 'creating-token',
        txHash: multicallHash,
        tokenAddress: precomputedTokenAddress
      }

    } catch (err) {
      const errorDetails = extractErrorDetails(err)
      const errorMessage = errorDetails.message || 'Failed to create and distribute token'
      console.error('❌ Multicall Error:', {
        error: err,
        details: errorDetails,
        createTokenCall: createTokenCall ? createTokenCall.substring(0, 20) + '...' : undefined,
        distributeTokenCall: distributeTokenCall ? distributeTokenCall.substring(0, 20) + '...' : undefined,
        precomputedTokenAddress
      })
      setError(errorMessage)
      setErrorDetails(errorDetails)
      setCurrentStep('idle')
      throw new Error(errorMessage)
    }
  }

  // Helper function to extract detailed error information
  function extractErrorDetails(err: unknown): { message: string; reason?: string; data?: any; code?: string } {
    if (!err) {
      return { message: 'Unknown error occurred' }
    }

    // Prefer viem BaseError tree for best revert decoding
    if (err instanceof BaseError) {
      // Try to get ContractFunctionRevertedError first (most specific)
      const reverted = err.walk((e) => e instanceof ContractFunctionRevertedError) as ContractFunctionRevertedError | null
      if (reverted) {
        // Try multiple ways to extract the reason
        const reason =
          (reverted as any).reason && (reverted as any).reason !== 'execution reverted'
            ? (reverted as any).reason
            : (reverted as any).data?.errorName 
            || (reverted as any).data?.args?.[0]?.toString()
            || (reverted as any).signature
            || (reverted as any).data?.message
        
        // Try to get error name from data
        const errorName = (reverted as any).data?.errorName || (reverted as any).data?.name
        
        return {
          message: reverted.shortMessage || err.shortMessage || 'Execution reverted',
          reason: reason || errorName || 'Unknown revert reason',
          data: (reverted as any).data,
          code: (reverted as any).code,
        }
      }
      
      // Try ExecutionRevertedError
      const exec = err.walk((e) => e instanceof ExecutionRevertedError) as ExecutionRevertedError | null
      if (exec) {
        const reason = (exec as any).reason || (exec as any).data?.errorName
        return { 
          message: exec.shortMessage || err.shortMessage || 'Execution reverted',
          reason
        }
      }
      
      // Try ContractFunctionZeroDataError
      const zero = err.walk((e) => e instanceof ContractFunctionZeroDataError) as ContractFunctionZeroDataError | null
      if (zero) {
        return { message: zero.shortMessage || err.shortMessage || 'Execution reverted (no data)' }
      }
      
      // For ContractFunctionExecutionError, try to extract more details
      if ((err as any).cause) {
        const cause = (err as any).cause
        if (cause instanceof BaseError) {
          const causeReverted = cause.walk((e) => e instanceof ContractFunctionRevertedError) as ContractFunctionRevertedError | null
          if (causeReverted) {
            const reason = (causeReverted as any).reason 
              || (causeReverted as any).data?.errorName
              || (causeReverted as any).data?.args?.[0]?.toString()
            return {
              message: err.shortMessage || err.message || 'Execution reverted',
              reason: reason || 'Unknown revert reason',
              data: (causeReverted as any).data,
            }
          }
        }
      }
      
      return { 
        message: err.shortMessage || err.message || 'Transaction failed',
        data: (err as any).data,
      }
    }

    // Handle viem/wagmi-like errors (non-BaseError objects)
    if (typeof err === 'object' && err && 'shortMessage' in err) {
      const viemError = err as any
      return {
        message: viemError.shortMessage || viemError.message || 'Transaction failed',
        reason: viemError.reason || viemError.data?.errorName,
        data: viemError.data,
        code: viemError.code,
      }
    }

    // Handle standard Error objects
    if (err instanceof Error) {
      // Try to extract revert reason from error message
      const message = err.message
      let reason = undefined
      
      // Look for common error patterns
      if (message.includes('revert')) {
        const revertMatch = message.match(/revert\s+(.+?)(?:\s+\(|$)/i)
        if (revertMatch) {
          reason = revertMatch[1]
        }
      }
      
      // Look for custom error names
      const errorMatch = message.match(/(\w+Error|Invalid\w+|RecipientCannotBeZeroAddress|TotalSupplyCannotBeZero)/i)
      if (errorMatch) {
        reason = errorMatch[1]
      }

      return {
        message: message,
        reason: reason
      }
    }

    return {
      message: String(err)
    }
  }

  // Check if both operations completed successfully
  const isSuccess = (isCreateTokenSuccess && isDistributeTokenSuccess) || isMulticallSuccess

  // Extract errors from write contract hooks
  const writeErrors = createTokenError || distributeTokenError || multicallError
  const writeErrorDetails = writeErrors ? extractErrorDetails(writeErrors) : null

  return {
    // State
    isLoading: isCreateTokenPending || isCreateTokenLoading || isDistributeTokenPending || isDistributeTokenLoading || isMulticallPending || isMulticallLoading,
    error: error || writeErrorDetails?.message || writeErrors?.message || null,
    errorDetails: errorDetails || writeErrorDetails,
    isCreateTokenSuccess,
    isDistributeTokenSuccess,
    isMulticallSuccess,
    isSuccess,
    currentStep,
    createTokenHash,
    distributeTokenHash,
    multicallHash,
    createdTokenAddress,
    
    // Actions
    createToken,
    distributeToken,
    createAndDistributeToken,
  }
}
