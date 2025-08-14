import { getCoin, getProfile } from "@zoralabs/coins-sdk"
import { setApiKey } from "@zoralabs/coins-sdk"

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
  uniqueHolders?: number
  metadata?: any
  // Add creator profile information
  creatorProfile?: {
    handle?: string
    displayName?: string
    bio?: string
    website?: string
    avatar?: {
      small?: string
      medium?: string
      blurhash?: string
    }
    socialAccounts?: {
      instagram?: { displayName?: string }
      tiktok?: { displayName?: string }
      twitter?: { 
        username?: string
        displayName?: string
        id?: string
      }
    }
  }
}

export class ZoraService {
  private static instance: ZoraService
  private initialized = false

  private constructor() {}

  public static getInstance(): ZoraService {
    if (!ZoraService.instance) {
      ZoraService.instance = new ZoraService()
    }
    return ZoraService.instance
  }

  private initializeIfNeeded() {
    if (this.initialized) return

    const apiKey = process.env.NEXT_PUBLIC_ZORA_API_KEY
    if (apiKey) {
      setApiKey(apiKey)
      this.initialized = true
      console.log('✅ Zora service initialized successfully with API key')
    } else {
      console.warn('⚠️ Zora API key not configured. Set NEXT_PUBLIC_ZORA_API_KEY in your .env.local file to fetch real coin data.')
      console.warn('📝 Without the API key, coin descriptions and metadata will not be available.')
    }
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
    // Initialize Zora service if needed
    this.initializeIfNeeded()
    
    // If no API key, return undefined immediately
    if (!this.initialized) {
      console.warn(`🚫 Zora service not initialized. Cannot fetch data for coin: ${coinAddress}`)
      console.warn(`💡 To fix this, add NEXT_PUBLIC_ZORA_API_KEY to your .env.local file`)
      return undefined
    }

    try {
      const normalizedAddress = this.normalizeAddress(coinAddress)
      console.log('ZoraService: Fetching coin data for address:', coinAddress, 'normalized to:', normalizedAddress)
      
      // Fetch coin details
      const response = await getCoin({
        address: normalizedAddress,
      })

      console.log('ZoraService: Response received:', response)
      console.log('ZoraService: Has zora20Token:', !!response.data?.zora20Token)
      console.log('ZoraService: Full response structure:', JSON.stringify(response, null, 2))

      if (!response.data?.zora20Token) {
        console.log('ZoraService: No zora20Token found in response')
        return undefined
      }

      const coinData = response.data.zora20Token

      // Add detailed logging for debugging
      console.log('ZoraService: Raw coin data:', coinData)
      console.log('ZoraService: Description field:', {
        description: coinData.description,
        descriptionType: typeof coinData.description,
        descriptionLength: coinData.description?.length,
        hasDescription: !!coinData.description,
        isDescriptionEmpty: coinData.description === '',
        isDescriptionNull: coinData.description === null,
        isDescriptionUndefined: coinData.description === undefined
      })
      
      // Check for alternative description fields
      console.log('ZoraService: Alternative description fields:', {
        bio: (coinData as any).bio,
        about: (coinData as any).about,
        summary: (coinData as any).summary,
        details: (coinData as any).details,
        content: (coinData as any).content,
        metadata: (coinData as any).metadata
      })
      
      console.log('ZoraService: Other key fields:', {
        name: coinData.name,
        symbol: coinData.symbol,
        hasImage: !!coinData.mediaContent?.previewImage?.medium,
        imageUrl: coinData.mediaContent?.previewImage?.medium || coinData.mediaContent?.originalUri
      })

      // If no description, try to fetch creator profile bio
      let finalDescription = coinData.description
      let creatorProfile = undefined
      
      if (!finalDescription && coinData.creatorAddress) {
        try {
          console.log(`ZoraService: No description found, fetching creator profile for: ${coinData.creatorAddress}`)
          console.log(`ZoraService: Creator address from coin data:`, coinData.creatorAddress)
          
          const profileResponse = await getProfile({
            identifier: coinData.creatorAddress
          })
          
          console.log(`ZoraService: Profile response received:`, profileResponse)
          console.log(`ZoraService: Profile data structure:`, {
            hasProfile: !!profileResponse?.data?.profile,
            hasBio: !!profileResponse?.data?.profile?.bio,
            bioLength: profileResponse?.data?.profile?.bio?.length,
            profileFields: Object.keys(profileResponse?.data?.profile || {})
          })
          
          if (profileResponse?.data?.profile) {
            const profile = profileResponse.data.profile
            
            // Extract creator profile information
            creatorProfile = {
              handle: profile.handle,
              displayName: profile.displayName,
              bio: profile.bio,
              website: profile.website,
              avatar: profile.avatar,
              socialAccounts: profile.socialAccounts
            }
            
            // Use bio as description if available
            if (profile.bio) {
              finalDescription = profile.bio
              console.log(`ZoraService: Creator profile bio found:`, finalDescription)
            } else {
              console.log(`ZoraService: No creator profile bio found for: ${coinData.creatorAddress}`)
            }
            
            console.log(`ZoraService: Creator profile extracted:`, creatorProfile)
          } else {
            console.log(`ZoraService: No creator profile found for: ${coinData.creatorAddress}`)
          }
        } catch (profileError) {
          console.warn(`ZoraService: Failed to fetch creator profile for ${coinData.creatorAddress}:`, profileError)
        }
      } else if (!finalDescription) {
        console.log(`ZoraService: No description and no creator address available`)
      }

      return {
        id: coinData.id,
        name: coinData.name || "Unknown Coin",
        symbol: coinData.symbol || "UNKNOWN",
        description: finalDescription || this.generateFallbackDescription(coinData),
        imageUrl: coinData.mediaContent?.previewImage?.medium || coinData.mediaContent?.originalUri,
        marketCap: parseFloat(coinData.marketCap || "0"),
        price: undefined, // Price data not available in current API response
        volume24h: parseFloat(coinData.volume24h || "0"),
        totalSupply: parseInt(coinData.totalSupply || "0"),
        circulatingSupply: parseInt(coinData.totalSupply || "0"), // Using totalSupply as approximation
        uniqueHolders: coinData.uniqueHolders ? parseInt(coinData.uniqueHolders.toString()) : 0,
        metadata: coinData,
        creatorProfile
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

  private generateFallbackDescription(coinData: any): string {
    const fallbackSources = [
      (coinData as any).bio,
      (coinData as any).about,
      (coinData as any).summary,
      (coinData as any).details,
      (coinData as any).content,
      (coinData as any).metadata,
    ];

    for (const source of fallbackSources) {
      if (source && source.length > 0) {
        return source;
      }
    }
    
    // If we have creator address but no bio, provide a more informative fallback
    if (coinData.creatorAddress) {
      return `A Zora20 token created by ${coinData.creatorAddress.slice(0, 6)}...${coinData.creatorAddress.slice(-4)}. No description available.`;
    }
    
    return "A Zora20 token. No description available.";
  }
}

export const zoraService = ZoraService.getInstance() 