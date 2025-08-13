'use client'

import { useState, useEffect } from 'react'
import { WagmiConfig } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from '@/lib/wagmi'

interface WagmiProviderProps {
  children: React.ReactNode
}

export function WagmiProvider({ children }: WagmiProviderProps) {
  const [queryClient] = useState(() => new QueryClient())
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={config}>
        {children}
      </WagmiConfig>
    </QueryClientProvider>
  )
}
