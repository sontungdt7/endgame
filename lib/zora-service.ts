import { getCoin } from "@zoralabs/coins-sdk"

export interface ZoraCoinData {
  id: string
  name: string
  symbol: string
  description?: string
  imageUrl?: string
  marketCap?: number
  price?: number
  volume24h?: number
  totalSupply?: number
  circulatingSupply?: number
  metadata?: any
}

export class ZoraService {
  private static instance: ZoraService

  private constructor() {}

  public static getInstance(): ZoraService {
    if (!ZoraService.instance) {
      ZoraService.instance = new ZoraService()
    }
    return ZoraService.instance
  }

  private normalizeAddress(address: string): string {
    // Handle full Zora URLs
    if (address.includes('zora.co/coin/')) {
      const urlParts = address.split('zora.co/coin/')
      if (urlParts.length > 1) {
        address = urlParts[1]
      }
    }
    
    // Remove network prefix if present (e.g., "base:" or "ethereum:")
    if (address.includes(':')) {
      return address.split(':')[1]
    }
    return address
  }

  async getCoinData(coinAddress: string): Promise<ZoraCoinData | undefined> {
    try {
      const normalizedAddress = this.normalizeAddress(coinAddress)
      console.log('ZoraService: Fetching coin data for address:', coinAddress, 'normalized to:', normalizedAddress)
      
      // Fetch coin details
      const response = await getCoin({
        address: normalizedAddress,
      })

      console.log('ZoraService: Response received:', response)
      console.log('ZoraService: Has zora20Token:', !!response.data?.zora20Token)

      if (!response.data?.zora20Token) {
        console.log('ZoraService: No zora20Token found in response')
        return undefined
      }

      const coinData = response.data.zora20Token

      return {
        id: coinData.id,
        name: coinData.name || "Unknown Coin",
        symbol: coinData.symbol || "UNKNOWN",
        description: coinData.description,
        imageUrl: coinData.mediaContent?.previewImage?.medium || coinData.mediaContent?.originalUri,
        marketCap: parseFloat(coinData.marketCap || "0"),
        price: coinData.tokenPrice?.priceInUsdc ? parseFloat(coinData.tokenPrice.priceInUsdc) : undefined,
        volume24h: parseFloat(coinData.volume24h || "0"),
        totalSupply: parseInt(coinData.totalSupply || "0"),
        circulatingSupply: parseInt(coinData.totalSupply || "0"), // Using totalSupply as approximation
        metadata: coinData,
      }
    } catch (error) {
      console.error("Error fetching coin data:", error)
      return undefined
    }
  }

  async validateCoinAddress(address: string): Promise<boolean> {
    try {
      const coinData = await this.getCoinData(address)
      return coinData !== undefined
    } catch (error) {
      return false
    }
  }
}

export const zoraService = ZoraService.getInstance() 