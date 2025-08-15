"use client"

import { useAccount } from "wagmi"
import { usePrivy } from '@privy-io/react-auth'
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { USDCBalance } from "@/components/usdc-balance"
import { PrivyWalletGuard } from "@/components/privy-wallet-guard"
import { formatAddress } from "@/lib/utils"
import { LogOut } from "lucide-react"

export default function ProfilePage() {
  const { address } = useAccount()
  const { logout } = usePrivy()

  const handleDisconnect = () => {
    logout()
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-green-400 to-yellow-400 bg-clip-text text-transparent">
            Profile
          </h1>
          <p className="text-gray-400">Manage your wallet connection and view account information.</p>
        </div>

        <PrivyWalletGuard>
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {address ? address.slice(2, 4).toUpperCase() : "??"}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Wallet Address</h2>
                  <p className="text-gray-400 font-mono text-sm break-all">
                    {address ? formatAddress(address) : "Not connected"}
                  </p>
                </div>
              </div>
            </div>

            {/* USDC Balance */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-bold text-white mb-4">USDC Balance</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">U</span>
                  </div>
                  <span className="text-gray-300">USDC</span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-400">
                    <USDCBalance />
                  </div>
                  <div className="text-sm text-gray-400">Available Balance</div>
                </div>
              </div>
            </div>

            {/* Additional Profile Info */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-bold text-white mb-4">Account Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Network</span>
                  <span className="text-white font-medium">Base</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Connection Status</span>
                  <span className="text-green-400 font-medium">Connected</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Wallet Type</span>
                  <span className="text-white font-medium">Privy</span>
                </div>
              </div>
            </div>

            {/* Disconnect Button */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-bold text-white mb-4">Account Actions</h3>
              <Button
                onClick={handleDisconnect}
                variant="outline"
                size="lg"
                className="w-full border-red-600 text-red-400 hover:bg-red-600 hover:text-white transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Disconnect Wallet
              </Button>
            </div>
          </div>
        </PrivyWalletGuard>
      </main>
    </div>
  )
}
