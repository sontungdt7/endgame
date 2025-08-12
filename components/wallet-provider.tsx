"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface WalletContextType {
  isConnected: boolean
  address: string | null
  balance: string | null
  connect: () => Promise<void>
  disconnect: () => void
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  return context
}

interface WalletProviderProps {
  children: ReactNode
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const [balance, setBalance] = useState<string | null>(null)

  // Check if wallet is already connected on mount
  useEffect(() => {
    const savedAddress = localStorage.getItem("wallet_address")
    if (savedAddress) {
      setAddress(savedAddress)
      setIsConnected(true)
      setBalance("1.234 ETH") // Mock balance
    }
  }, [])

  const connect = async () => {
    try {
      // In a real app, this would use window.ethereum or other wallet providers
      // For demo purposes, we'll simulate wallet connection
      const mockAddress = "0x1234567890abcdef1234567890abcdef12345678"
      const shortAddress = `${mockAddress.slice(0, 6)}...${mockAddress.slice(-4)}`

      setAddress(shortAddress)
      setBalance("1.234 ETH")
      setIsConnected(true)

      // Save to localStorage for persistence
      localStorage.setItem("wallet_address", shortAddress)

      // Simulate async wallet connection
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } catch (error) {
      console.error("Failed to connect wallet:", error)
    }
  }

  const disconnect = () => {
    setAddress(null)
    setBalance(null)
    setIsConnected(false)
    localStorage.removeItem("wallet_address")
  }

  const value = {
    isConnected,
    address,
    balance,
    connect,
    disconnect,
  }

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}
