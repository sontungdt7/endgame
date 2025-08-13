import { useBalance } from 'wagmi'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useEffect, useState } from 'react'

interface UsePostCoinBalanceProps {
  postCoinAddress: string
  chainId?: number
}

export function usePostCoinBalance({ postCoinAddress, chainId = 8453 }: UsePostCoinBalanceProps) {
  const { authenticated } = usePrivy()
  const { wallets } = useWallets()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  const isConnected = authenticated && wallets.length > 0
  const walletAddress = wallets[0]?.address

  const { data: balance, isLoading, error } = useBalance({
    address: walletAddress as `0x${string}`,
    token: postCoinAddress as `0x${string}`,
    chainId,
    enabled: isConnected && !!walletAddress && !!postCoinAddress && mounted,
  })

  return {
    balance: balance?.formatted || '0',
    symbol: balance?.symbol || 'POST',
    decimals: balance?.decimals || 18,
    isLoading: isLoading || !mounted,
    error,
    isConnected,
    walletAddress,
    tokenSymbol: balance?.symbol || 'POST',
  }
}
