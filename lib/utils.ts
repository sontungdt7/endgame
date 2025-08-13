import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format time remaining for games
export function formatTimeRemaining(endTime: number): string {
  const now = Math.floor(Date.now() / 1000)
  const timeLeft = endTime - now
  
  if (timeLeft <= 0) {
    return "Ended"
  }
  
  const hours = Math.floor(timeLeft / 3600)
  const minutes = Math.floor((timeLeft % 3600) / 60)
  const seconds = timeLeft % 60
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  } else {
    return `${seconds}s`
  }
}

// Check if game is active
export function isGameActive(endTime: number): boolean {
  const now = Math.floor(Date.now() / 1000)
  return endTime > now
}

// Format USDC amount (assuming 6 decimals)
export function formatUSDC(amount: string | number): number {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  return numAmount / 1e6
}

// Format address for display
export function formatAddress(address: string): string {
  if (!address || address.length < 10) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

// Format time ago from block timestamp
export function formatTimeAgo(timestamp: string | number): string {
  const now = Math.floor(Date.now() / 1000)
  const blockTime = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp
  const timeDiff = now - blockTime
  
  if (timeDiff < 60) {
    return `${timeDiff}s ago`
  } else if (timeDiff < 3600) {
    const minutes = Math.floor(timeDiff / 60)
    return `${minutes}m ago`
  } else if (timeDiff < 86400) {
    const hours = Math.floor(timeDiff / 3600)
    return `${hours}h ago`
  } else {
    const days = Math.floor(timeDiff / 86400)
    return `${days}d ago`
  }
}

// Format USDC amount from buy events (assuming 6 decimals)
export function formatBuyAmount(amount: string | number): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  const usdcAmount = numAmount / 1e6
  return `$${usdcAmount.toFixed(2)}`
}

// Generate mock post title based on game ID
export function generateMockPostTitle(gameId: string): string {
  const titles = [
    "Epic NFT Collection Launch",
    "Viral Meme Contest", 
    "Community Art Project",
    "Crypto Trading Challenge",
    "DeFi Protocol Launch",
    "Gaming Tournament Finals",
    "Social Media Challenge",
    "Content Creator Contest",
    "Blockchain Innovation Hub",
    "Web3 Community Event",
    "Metaverse Experience",
    "DAO Governance Vote",
    "Yield Farming Competition",
    "NFT Marketplace Launch",
    "DeFi Yield Contest"
  ]
  
  const index = parseInt(gameId) % titles.length
  return titles[index]
}

// Calculate minimum buy amount based on game state
export function calculateMinBuy(gameId: string, isActive: boolean): number {
  if (!isActive) return 0
  
  // Generate deterministic but varied min buy amounts
  const baseAmount = 0.5
  const variation = (parseInt(gameId) % 10) * 0.1
  return Math.max(0.1, baseAmount + variation)
}
