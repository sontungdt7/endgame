'use client'

import { usePostCoinBalance } from '@/hooks/use-postcoin-balance'

interface PostCoinBalanceProps {
  postCoinAddress: string
  chainId?: number
  symbol?: string
}

export function PostCoinBalance({ postCoinAddress, chainId, symbol }: PostCoinBalanceProps) {
  const { balance, isLoading, error, isConnected } = usePostCoinBalance({ 
    postCoinAddress, 
    chainId 
  })

  if (!isConnected) {
    return <span className="text-gray-500">Connect Wallet</span>
  }

  if (isLoading) {
    return (
      <span className="text-gray-400">
        <div className="inline-block w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2"></div>
        Loading...
      </span>
    )
  }

  if (error) {
    return <span className="text-red-400">Error loading balance</span>
  }

  // Show loading state for symbol if not available yet
  if (!symbol) {
    return (
      <span className="text-gray-400">
        {balance} <span className="text-gray-500">Loading...</span>
      </span>
    )
  }

  return <span>{balance} {symbol}</span>
}
