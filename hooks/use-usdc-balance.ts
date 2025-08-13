import { useBalance } from 'wagmi'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { tokens } from '@/lib/tokens'

export function useUSDCBalance() {
  const { authenticated } = usePrivy()
  const { wallets } = useWallets()
  
  const isConnected = authenticated && wallets.length > 0
  const walletAddress = wallets[0]?.address

  // Get USDC token configuration
  const usdcToken = tokens.find(token => token.symbol === 'USDC')
  
  const { data: balance, isLoading, error } = useBalance({
    address: walletAddress as `0x${string}`,
    token: usdcToken?.address as `0x${string}`,
    chainId: usdcToken?.chainId,
    enabled: isConnected && !!walletAddress && !!usdcToken,
  })

  return {
    balance: balance?.formatted || '0',
    symbol: balance?.symbol || 'USDC',
    decimals: balance?.decimals || 6,
    isLoading,
    error,
    isConnected,
    walletAddress,
    maxBuyAmount: balance?.formatted || '0',
  }
}
