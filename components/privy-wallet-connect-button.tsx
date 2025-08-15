'use client'

import { usePrivy } from '@privy-io/react-auth'
import { Button } from '@/components/ui/button'
import { Wallet } from 'lucide-react'

export function PrivyWalletConnectButton() {
  const { login, authenticated, user, ready } = usePrivy()
  const address = user?.wallet?.address
  const isConnected = authenticated && !!address

  if (!ready) {
    return (
      <Button disabled className="bg-gradient-to-r from-green-500 to-yellow-500 hover:from-green-600 hover:to-yellow-600 text-black font-semibold">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
        Loading...
      </Button>
    )
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-300">
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </span>
      </div>
    )
  }

  return (
    <Button
      onClick={login}
      className="bg-gradient-to-r from-green-500 to-yellow-500 hover:from-green-600 hover:to-yellow-600 text-black font-semibold"
    >
      <Wallet className="h-4 w-4 mr-2" />
      Connect Wallet
    </Button>
  )
}
