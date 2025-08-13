import { SwapPrice } from '@/hooks/use-0x-swap'
import { formatUnits } from 'viem'

interface SwapPriceDisplayProps {
  price: SwapPrice | null
  loading: boolean
  error: string | null
  sellTokenSymbol: string
  buyTokenSymbol: string
  sellAmount: string
  sellTokenDecimals: number
  buyTokenDecimals: number
}

export function SwapPriceDisplay({
  price,
  loading,
  error,
  sellTokenSymbol,
  buyTokenSymbol,
  sellAmount,
  sellTokenDecimals,
  buyTokenDecimals,
  onRefresh,
}: SwapPriceDisplayProps & { onRefresh?: () => void }) {

  // Helper function to format token amounts with appropriate decimal places
  const formatTokenAmount = (amount: string, decimals: number): string => {
    try {
      // Handle edge cases where amount might be undefined or invalid
      if (!amount || amount === '0' || amount === '') {
        return '0.00'
      }
      
      const formatted = formatUnits(BigInt(amount), decimals)
      const num = Number(formatted)
      
      // Check if the number is valid
      if (isNaN(num) || !isFinite(num)) {
        return '0.00'
      }
      
      // For tokens with 6 decimals (like USDC), show 2 decimal places
      if (decimals === 6) {
        return num.toFixed(2)
      }
      
      // For tokens with 18 decimals (like PostCoin), show 6 decimal places
      if (decimals === 18) {
        return num.toFixed(6)
      }
      
      // Default to 4 decimal places for other token types
      return num.toFixed(4)
    } catch (error) {
      console.error('Error formatting token amount:', error)
      return '0.00'
    }
  }

  // Helper function to extract price information from the route
  const getPriceInfo = () => {
    if (!price.route) return null
    
    try {
      // The route object contains the actual swap information
      const route = price.route
      
      // Extract price from the route (this is the actual swap rate)
      const priceRate = route.price || route.rate || null
      
      // Extract sources from the route
      const sources = route.sources || route.steps?.[0]?.sources || []
      
      return {
        priceRate,
        sources,
        routeData: route
      }
    } catch (error) {
      console.error('Error extracting price info from route:', error)
      return null
    }
  }
  if (loading) {
    return (
      <div className="bg-gray-700 rounded-lg p-4 mb-4">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
          <span className="text-gray-300 text-sm">Fetching price...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-4">
        <div className="text-red-400 text-sm">
          <div className="font-medium mb-1">Price Error</div>
          <div className="text-red-300">{error}</div>
          {error.includes('No liquidity') && (
            <div className="text-yellow-300 text-xs mt-2">
              This token pair may not have sufficient liquidity on 0x. Try a different amount or check if the token is supported.
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!price || !sellAmount || parseFloat(sellAmount) <= 0) {
    return null
  }

  // Debug logging to see what we actually received
  console.log('SwapPriceDisplay received price data:', price)
  console.log('Route object:', price.route)
  
  // Validate that we have the required price data
  if (!price.buyAmount || !price.route) {
    // Check if we have any useful information in the response
    const hasAnyData = Object.keys(price).length > 0
    
    return (
      <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mb-4">
        <div className="text-yellow-400 text-sm">
          <div className="font-medium mb-1">Price Data Unavailable</div>
          <div className="text-yellow-300">
            Missing required fields: buyAmount={!!price.buyAmount}, route={!!price.route}
          </div>
          {hasAnyData && (
            <div className="text-yellow-300 text-xs mt-1">
              Available fields: {Object.keys(price).join(', ')}
            </div>
          )}
          <div className="text-yellow-300 text-xs mt-2">
            This could mean: insufficient liquidity, unsupported token pair, or API error.
          </div>
        </div>
      </div>
    )
  }

  // Extract price information from the route
  const priceInfo = getPriceInfo()
  
  // Calculate price impact if we have the necessary data
  const priceImpact = priceInfo?.priceRate ? 0 : 0 // For now, set to 0 as we need to extract from route
  
  // Format the price impact with better precision
  const formattedPriceImpact = Math.abs(priceImpact) < 0.01 ? '0.00' : priceImpact.toFixed(2)

  const getPriceImpactColor = (impact: number) => {
    if (impact < 1) return 'text-green-400'
    if (impact < 3) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className="bg-gray-700 rounded-lg p-4 mb-4">
      <div className="text-sm text-gray-300 mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="flex items-center space-x-2">
            <span>Swap Rate</span>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="text-gray-400 hover:text-white transition-colors"
                title="Refresh price"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
          </span>
          <span className="text-white font-medium">
            {formatTokenAmount(price.sellAmount, sellTokenDecimals)} {sellTokenSymbol} → {formatTokenAmount(price.buyAmount, buyTokenDecimals)} {buyTokenSymbol}
          </span>
        </div>
        
        <div className="flex items-center justify-between mb-2">
          <span>You're selling</span>
          <span className="text-gray-300 font-medium">
            {sellAmount} {sellTokenSymbol}
          </span>
        </div>
        
        <div className="flex items-center justify-between mb-2">
          <span>You'll receive</span>
          <span className="text-green-400 font-medium">
            {formatTokenAmount(price.buyAmount, buyTokenDecimals)} {buyTokenSymbol}
          </span>
        </div>

        <div className="flex items-center justify-between mb-2">
          <span>Price Impact</span>
          <span className="text-gray-400 font-medium">
            N/A
          </span>
        </div>

        {price.totalNetworkFee && (
          <div className="flex items-center justify-between mb-2">
            <span>Network Fee</span>
            <span className="text-white font-medium">
              {formatTokenAmount(price.totalNetworkFee, 18)} ETH
            </span>
          </div>
        )}

        {price.gas && (
          <div className="flex items-center justify-between mb-2">
            <span>Estimated Gas</span>
            <span className="text-gray-400 font-mono text-xs">
              {Number(price.gas).toFixed(0)} gas
            </span>
          </div>
        )}

        {price.gasPrice && price.gas && (
          <div className="flex items-center justify-between mb-2">
            <span>Gas Cost (ETH)</span>
            <span className="text-gray-400 font-mono text-xs">
              {(() => {
                try {
                  const gasCost = BigInt(price.gasPrice) * BigInt(price.gas)
                  return formatTokenAmount(gasCost.toString(), 18)
                } catch (error) {
                  return '0.00'
                }
              })()} ETH
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Includes 0.1% affiliate fee</span>
          <span>Powered by 0x</span>
        </div>
      </div>

      {priceInfo?.sources && priceInfo.sources.length > 0 && (
        <div className="border-t border-gray-600 pt-3">
          <div className="text-xs text-gray-400 mb-2">Liquidity Sources</div>
          <div className="flex flex-wrap gap-1">
            {priceInfo.sources.slice(0, 3).map((source: any, index: number) => (
              <span
                key={index}
                className="bg-gray-600 text-gray-300 text-xs px-2 py-1 rounded"
                title={`${source.name || source.label}: ${source.proportion ? (parseFloat(source.proportion) * 100).toFixed(1) : 'N/A'}%`}
              >
                {source.name || source.label || `Source ${index + 1}`}
              </span>
            ))}
            {priceInfo.sources.length > 3 && (
              <span className="bg-gray-600 text-gray-300 text-xs px-2 py-1 rounded">
                +{priceInfo.sources.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

        {price.liquidityAvailable !== undefined && (
          <div className="border-t border-gray-600 pt-3">
            <div className="text-xs text-gray-400">
              Liquidity: {price.liquidityAvailable ? 'Available' : 'Limited'}
            </div>
          </div>
        )}

        {price.issues && price.issues.length > 0 && (
          <div className="border-t border-gray-600 pt-3">
            <div className="text-xs text-yellow-400 mb-1">Issues:</div>
            {price.issues.map((issue: any, index: number) => (
              <div key={index} className="text-xs text-yellow-300">
                • {issue.message || issue.reason || 'Unknown issue'}
              </div>
            ))}
          </div>
        )}

        {price.blockNumber && (
          <div className="border-t border-gray-600 pt-3">
            <div className="text-xs text-gray-400">
              Last updated: Block #{price.blockNumber}
            </div>
          </div>
        )}
    </div>
  )
}
