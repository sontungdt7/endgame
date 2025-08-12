"use client"

import { usePrivy, useWallets } from '@privy-io/react-auth'
import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"

interface PrivyWalletGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function PrivyWalletGuard({ children, fallback }: PrivyWalletGuardProps) {
  const { authenticated, ready: privyReady, login } = usePrivy()
  const { ready: walletsReady, wallets } = useWallets()
  
  const isConnected = authenticated && wallets.length > 0
  const ready = privyReady && walletsReady

  // Show loading state while Privy is initializing
  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading wallet...</p>
        </div>
      </div>
    )
  }

  // If not connected, show fallback or default login prompt
  if (!isConnected) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] space-y-4">
        <div className="text-center">
          <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Wallet Required</h3>
          <p className="text-gray-400 mb-6">
            Please connect your wallet to access this feature
          </p>
          <Button
            onClick={() => login()}
            className="bg-gradient-to-r from-green-500 to-yellow-500 hover:from-green-600 hover:to-yellow-600 text-black font-semibold"
          >
            <Wallet className="w-4 h-4 mr-2" />
            Connect Wallet
          </Button>
        </div>
      </div>
    )
  }

  // If connected, render children
  return <>{children}</>
}
