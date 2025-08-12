'use client'

import { usePrivy } from '@privy-io/react-auth'
import { Button } from '@/components/ui/button'
import { Wallet, LogOut } from 'lucide-react'

export function PrivyWalletConnectButton() {
  const { login, logout, authenticated, user, ready } = usePrivy()
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
        <Button
          variant="outline"
          size="sm"
          onClick={logout}
          className="flex items-center gap-2 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Disconnect
        </Button>
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
