"use client"

import { Button } from "@/components/ui/button"
import { useWallet } from "@/components/wallet-provider"
import { ChevronDown, Copy, ExternalLink, LogOut } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

export function WalletConnectButton() {
  const { isConnected, address, balance, connect, disconnect } = useWallet()
  const { toast } = useToast()

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address)
      toast({
        title: "Address copied",
        description: "Wallet address copied to clipboard",
      })
    }
  }

  if (!isConnected) {
    return (
      <Button
        onClick={connect}
        className="bg-gradient-to-r from-green-500 to-yellow-500 hover:from-green-600 hover:to-yellow-600 text-black font-semibold"
      >
        Log in
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="bg-gradient-to-r from-green-500 to-yellow-500 hover:from-green-600 hover:to-yellow-600 text-black font-semibold">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
            <span>{address}</span>
            <ChevronDown className="w-4 h-4" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-gray-800 border-gray-700">
        <div className="px-3 py-2">
          <div className="text-sm text-gray-400">Balance</div>
          <div className="font-semibold text-white">{balance}</div>
        </div>
        <DropdownMenuSeparator className="bg-gray-700" />
        <DropdownMenuItem onClick={copyAddress} className="text-gray-300 hover:text-white hover:bg-gray-700">
          <Copy className="w-4 h-4 mr-2" />
          Copy Address
        </DropdownMenuItem>
        <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-gray-700">
          <ExternalLink className="w-4 h-4 mr-2" />
          View on Explorer
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-gray-700" />
        <DropdownMenuItem onClick={disconnect} className="text-red-400 hover:text-red-300 hover:bg-gray-700">
          <LogOut className="w-4 h-4 mr-2" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
