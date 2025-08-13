import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'

export interface SwapPrice {
  // Core amounts
  sellAmount: string
  buyAmount: string
  sellToken: string
  buyToken: string
  
  // Price information (from route)
  price?: string
  grossPrice?: string
  
  // Fees and gas
  fees?: any
  gas: string
  gasPrice: string
  totalNetworkFee: string
  
  // Route information
  route?: any
  
  // Liquidity and validation
  liquidityAvailable: boolean
  minBuyAmount: string
  
  // Metadata
  blockNumber: string
  tokenMetadata?: any
  
  // Additional fields
  issues?: any[]
  zid?: string
}

export interface SwapQuote extends SwapPrice {
  to: string
  data: string
  value: string
  allowanceTarget: string
  sellTokenToEthRate: string
  buyTokenToEthRate: string
  guaranteedPrice: string
  guaranteedPriceUsd: string
}

export interface Use0xSwapOptions {
  sellToken: string
  buyToken: string
  sellAmount: string
  chainId: string
  enabled?: boolean
}

export function use0xSwapPrice(options: Use0xSwapOptions) {
  const [price, setPrice] = useState<SwapPrice | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { address } = useAccount()

  const fetchPrice = useCallback(async () => {
    if (!options.enabled || !options.sellAmount || parseFloat(options.sellAmount) <= 0) {
      setPrice(null)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        sellToken: options.sellToken,
        buyToken: options.buyToken,
        sellAmount: options.sellAmount,
        chainId: options.chainId,
        ...(address && { taker: address }),
      })

      const response = await fetch(`/api/swap/price?${params.toString()}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('0x API response data:', data)
      setPrice(data)
    } catch (err) {
      console.error('Error fetching 0x price:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch price')
      setPrice(null)
    } finally {
      setLoading(false)
    }
  }, [options.sellToken, options.buyToken, options.sellAmount, options.chainId, options.enabled, address])

  useEffect(() => {
    fetchPrice()
  }, [fetchPrice])

  return {
    price,
    loading,
    error,
    refetch: fetchPrice,
  }
}

export function use0xSwapQuote(options: Use0xSwapOptions) {
  const [quote, setQuote] = useState<SwapQuote | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { address } = useAccount()

  const fetchQuote = useCallback(async () => {
    if (!options.enabled || !options.sellAmount || parseFloat(options.sellAmount) <= 0) {
      setQuote(null)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        sellToken: options.sellToken,
        buyToken: options.buyToken,
        sellAmount: options.sellAmount,
        chainId: options.chainId,
        ...(address && { taker: address }),
      })

      const response = await fetch(`/api/swap/quote?${params.toString()}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setQuote(data)
    } catch (err) {
      console.error('Error fetching 0x quote:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch quote')
      setQuote(null)
    } finally {
      setLoading(false)
    }
  }, [options.sellToken, options.buyToken, options.sellAmount, options.chainId, options.enabled, address])

  return {
    quote,
    loading,
    error,
    fetchQuote,
  }
}
