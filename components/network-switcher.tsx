'use client'

import { useChainId, useSwitchChain, useAccount } from 'wagmi'
import { base, sepolia } from 'wagmi/chains'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { ChevronDown, Network } from 'lucide-react'
import { useState } from 'react'

const chains = [
  { id: base.id, name: 'Base' },
  { id: sepolia.id, name: 'Sepolia' },
]

export function NetworkSwitcher() {
  const chainId = useChainId()
  const { switchChain, isPending } = useSwitchChain()
  const { isConnected } = useAccount()
  const [open, setOpen] = useState(false)

  const currentChain = chains.find((chain) => chain.id === chainId) || chains[0]

  const handleSwitchChain = (targetChainId: number) => {
    if (!isConnected) {
      return
    }
    if (targetChainId !== chainId) {
      switchChain({ chainId: targetChainId })
      setOpen(false)
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
          disabled={isPending || !isConnected}
        >
          <Network className="h-4 w-4" />
          <span className="hidden sm:inline">
            {isConnected ? currentChain.name : 'Not Connected'}
          </span>
          {isConnected && <ChevronDown className="h-4 w-4" />}
        </Button>
      </DropdownMenuTrigger>
      {isConnected && (
        <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
          {chains.map((chain) => (
            <DropdownMenuItem
              key={chain.id}
              onClick={() => handleSwitchChain(chain.id)}
              className={`cursor-pointer ${
                chain.id === chainId
                  ? 'bg-gray-700 text-green-400'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {chain.name}
              {chain.id === chainId && (
                <span className="ml-2 text-xs">✓</span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      )}
    </DropdownMenu>
  )
}
