"use client"

import { useWallet } from "@/components/wallet-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { WalletConnectButton } from "@/components/wallet-connect-button"
import { Wallet } from "lucide-react"
import type { ReactNode } from "react"

interface WalletGuardProps {
  children: ReactNode
  fallback?: ReactNode
}

export function WalletGuard({ children, fallback }: WalletGuardProps) {
  const { isConnected } = useWallet()

  if (!isConnected) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="bg-gray-800 border-gray-700 max-w-md w-full">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center space-x-2">
                <Wallet className="w-6 h-6 text-yellow-400" />
                <span>Connect Your Wallet</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-400">You need to connect your wallet to access this feature.</p>
              <WalletConnectButton />
            </CardContent>
          </Card>
        </div>
      )
    )
  }

  return <>{children}</>
}
