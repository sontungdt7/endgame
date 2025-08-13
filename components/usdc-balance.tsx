'use client'

import { useUSDCBalance } from '@/hooks/use-usdc-balance'

export function USDCBalance() {
  const { balance, isLoading, error, isConnected } = useUSDCBalance()

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

  return <span>{balance} USDC</span>
}

// Hook to get max buy amount from USDC balance
export function useMaxBuyAmount() {
  const { maxBuyAmount } = useUSDCBalance()
  return maxBuyAmount
}
