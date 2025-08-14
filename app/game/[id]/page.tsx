"use client"

import { useState, use } from "react"
import { GameHeader } from "@/components/game-header"
import { PrivyWalletGuard } from "@/components/privy-wallet-guard"
import { useGame } from "@/hooks/useGame"
import { formatAddress, formatTimeAgo, formatBuyAmount } from "@/lib/utils"
import { USDCBalance, useMaxBuyAmount } from "@/components/usdc-balance"
import { PostCoinBalance } from "@/components/postcoin-balance"
import { usePostCoinBalance } from "@/hooks/use-postcoin-balance"
import { use0xSwapPrice } from "@/hooks/use-0x-swap"
import { SwapPriceDisplay } from "@/components/swap-price-display"
import { parseUnits, formatUnits } from "viem"

export default function GameDetailPage({ params }: { params: Promise<{ id:string }> }) {
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy")
  const [buyAmount, setBuyAmount] = useState("")
  const [sellAmount, setSellAmount] = useState("")
  const { id } = use(params)
  const { game, loading, error } = useGame(id)
  const maxBuyAmount = useMaxBuyAmount()
  
  // Get PostCoin balance for percentage calculations
  const { balance: postCoinBalance } = usePostCoinBalance({ 
    postCoinAddress: game?.postCoin || "", 
    chainId: 8453 
  })

  // 0x Swap Price hooks
  const buySwapPrice = use0xSwapPrice({
    sellToken: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
    buyToken: game?.postCoin || "",
    sellAmount: buyAmount ? parseUnits(buyAmount, 6).toString() : "", // USDC has 6 decimals
    chainId: "8453", // Base network
    enabled: !!buyAmount && parseFloat(buyAmount) > 0 && !!game?.postCoin,
  })

  const sellSwapPrice = use0xSwapPrice({
    sellToken: game?.postCoin || "",
    buyToken: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
    sellAmount: sellAmount ? parseUnits(sellAmount, 18).toString() : "", // PostCoin has 18 decimals
    chainId: "8453", // Base network
    enabled: !!sellAmount && parseFloat(sellAmount) > 0 && !!game?.postCoin,
  })
  
  const handlePercentageSell = (percentage: number) => {
    const balance = parseFloat(postCoinBalance)
    if (balance > 0 && game) {
      const amount = (balance * percentage) / 100
      setSellAmount(amount.toFixed(6)) // 6 decimal places for tokens
      console.log(`Setting sell amount to ${amount.toFixed(6)} ${game.symbol || 'POST'} (${percentage}% of ${parseFloat(postCoinBalance).toFixed(1)})`)
    }
  }
  
  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <GameHeader />
        <main className="container mx-auto px-4 py-6 max-w-7xl">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
              <p className="text-gray-400 text-lg">Loading game details...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Show error state
  if (error || !game) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <GameHeader />
        <main className="container mx-auto px-4 py-6 max-w-7xl">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="text-red-400 text-6xl mb-4">⚠️</div>
              <p className="text-red-400 mb-2">Failed to load game</p>
              <p className="text-gray-400 text-sm">{error || 'Game not found'}</p>
              <p className="text-gray-500 text-xs mt-2">Please check the game ID and try again</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const isEnded = game.status === "ended"
  const isWinner = isEnded && game.lastBuyer === "0x1234567890abcdef1234567890abcdef12345678" // Mock current user for now
  const hasNoPlayers = isEnded && game.totalBuyCount === 0

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <GameHeader />

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Trading-style Token Header */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img
                src={game.postThumbnail || "/placeholder.svg"}
                alt="Game thumbnail"
                className="w-12 h-12 rounded-lg object-cover"
              />
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-bold text-white">GAME #{game.gameId}</h1>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-400 text-sm">Last Buyer Wins</span>
                  {isEnded && (
                    <>
                      <span className="text-gray-400">•</span>
                      <span className="text-red-400 text-sm font-medium">ENDED</span>
                    </>
                  )}
                </div>
                                
                <p className="text-gray-500 text-xs">{game.symbol}: <span className="font-mono">{formatAddress(game.postCoin)}</span></p>
                <p className="text-gray-500 text-xs">Created by: <span className="font-mono">{formatAddress(game.sponsor)}</span></p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-400">${game.prizePool.toFixed(2)}</div>
              <div className="text-sm text-gray-400">USDC Prize Pool</div>
            </div>
          </div>
        </div>

        {/* Main Game Area */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 mb-6">
          {/* Game Stats Bar */}
          <div className="p-4 border-b border-gray-700">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-400">Time Left</div>
                <div className={`text-lg font-bold ${isEnded ? "text-red-400" : "text-orange-400"}`}>
                  {isEnded ? "Ended" : game.timeLeft}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400">{isEnded ? "Winner" : "Last Buyer"}</div>
                <div className="text-lg font-bold text-blue-400">
                  {isEnded ? (game.lastBuyer ? formatAddress(game.lastBuyer) : "No Winner") : 
                    (game.lastBuyer === "0x0000000000000000000000000000000000000000" ? "No Buyers Yet" : formatAddress(game.lastBuyer))}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Total Play</div>
                <div className="text-lg font-bold text-purple-400">{game.totalBuyCount}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Min Buy</div>
                <div className="text-lg font-bold text-yellow-400">${game.minBuy.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Game Content Area */}
          <div className="p-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Post Preview */}
              <div className="lg:col-span-2">
                <img
                  src={game.postThumbnail || "/placeholder.svg"}
                  alt="Post preview"
                  className="w-full h-64 object-cover rounded-lg mb-4"
                />
                <h2 className="text-xl font-bold mb-2">{game.postTitle}</h2>            
                <p className="text-gray-300 mb-4">
                  {game.description ? (
                    game.description
                  ) : (
                    <span className="text-gray-400 italic">
                      Description not available. Please check your Zora API key configuration to display real coin descriptions.
                    </span>
                  )}
                </p>
                {game.marketCap !== undefined || game.volume24h !== undefined || game.uniqueHolders !== undefined ? (
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {game.marketCap !== undefined && (
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Market Cap</div>
                      <div className="text-lg font-bold text-green-400">
                        ${game.marketCap.toLocaleString()}
                      </div>
                    </div>
                  )}
                  {game.volume24h !== undefined && (
                    <div>
                      <div className="text-xs text-gray-400 mb-1">24h Volume</div>
                      <div className="text-lg font-bold text-blue-400">
                        ${game.volume24h.toLocaleString()}
                      </div>
                    </div>
                  )}
                  {game.uniqueHolders !== undefined && (
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Unique Holders</div>
                      <div className="text-lg font-bold text-purple-400">
                        {game.uniqueHolders.toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>                
            ) : null}
                
                {/* Creator Profile Section */}
                {game.creatorProfile && (
                  <div className="bg-gray-700/30 rounded-lg p-4 mb-4 border border-gray-600">
                    <div className="flex items-start space-x-3">
                      {game.creatorProfile.avatar?.medium && (
                        <img 
                          src={game.creatorProfile.avatar.medium} 
                          alt="Creator avatar"
                          className="w-12 h-12 rounded-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                          }}
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-white">
                            {game.creatorProfile.displayName || game.creatorProfile.handle || 'Creator'}
                          </h3>
                          {game.creatorProfile.handle && (
                            <span className="text-gray-400 text-sm">@{game.creatorProfile.handle}</span>
                          )}
                        </div>
                        
                        {/* Creator Bio */}
                        {game.creatorProfile.bio && (
                          <p className="text-gray-300 text-sm mb-3">{game.creatorProfile.bio}</p>
                        )}
                        
                        {/* Creator Links */}
                        <div className="flex items-center space-x-3">
                          {game.creatorProfile.website && (
                            <a 
                              href={game.creatorProfile.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-sm transition-colors"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-1.5 1.5a1 1 0 11-1.414-1.414l1.5-1.5a4 4 0 015.656 5.656l-1.5 1.5a1 1 0 11-1.414 1.414l1.5-1.5a2 2 0 00-2.828 0z" clipRule="evenodd" />
                              </svg>
                              <span className="max-w-32 truncate">{game.creatorProfile.website}</span>
                            </a>
                          )}
                          
                          {game.creatorProfile.socialAccounts?.twitter?.username && (
                            <a 
                              href={`https://x.com/${game.creatorProfile.socialAccounts.twitter.username}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-sm transition-colors"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                              </svg>                        
                            </a>
                          )}
                          
                          {game.creatorProfile.socialAccounts?.instagram?.displayName && (
                            <a 
                              href={`https://instagram.com/${game.creatorProfile.socialAccounts.instagram.displayName}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center space-x-1 text-pink-400 hover:text-pink-300 text-sm transition-colors"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                              </svg>
                              <span>Instagram</span>
                            </a>
                          )}
                          
                          {game.creatorProfile.socialAccounts?.tiktok?.displayName && (
                            <a 
                              href={`https://tiktok.com/@${game.creatorProfile.socialAccounts.tiktok.displayName}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center space-x-1 text-gray-400 hover:text-gray-300 text-sm transition-colors"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-.88-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                              </svg>
                              <span>TikTok</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>                    {/* Market Data Section */}                            
                  </div>
                )}

                                
                
                
              </div>

              {/* Action Panel */}
              <PrivyWalletGuard>
                <div className="space-y-4">
                  {isEnded ? (
                    // Ended Game Actions
                    <div className="space-y-4">
                      <div className="bg-gray-700 rounded-lg p-4 text-center">
                        <h3 className="text-lg font-bold mb-2 text-red-400">Game Ended</h3>
                        {hasNoPlayers ? (
                          <p className="text-gray-300 text-sm mb-4">No players joined this game</p>
                        ) : (
                          <p className="text-gray-300 text-sm mb-4">
                            Winner: <span className="text-blue-400 font-medium">
                              {game.lastBuyer === "0x0000000000000000000000000000000000000000" ? "No Winner" : formatAddress(game.lastBuyer)}
                            </span>
                          </p>
                        )}
                      </div>

                      {hasNoPlayers ? (
                        <button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 rounded-lg transition-colors">
                          Refund Prize Pool
                        </button>
                      ) : (
                        <button
                          className={`w-full font-bold py-3 rounded-lg transition-colors ${
                            isWinner
                              ? "bg-green-600 hover:bg-green-700 text-white"
                              : "bg-gray-600 text-gray-400 cursor-not-allowed"
                          }`}
                          disabled={!isWinner}
                        >
                          {isWinner ? "Claim Prize" : "Prize Claimed"}
                        </button>
                      )}

                      <div className="bg-gray-700 rounded-lg p-4">
                        <h3 className="text-lg font-bold mb-2">Game Results</h3>
                        <ul className="text-sm text-gray-300 space-y-1">
                          <li>• Prize Pool: ${game.prizePool.toFixed(2)} USDC</li>
                          <li>• Total Players: {game.totalBuyCount}</li>
                          {game.lastBuyer && game.lastBuyer !== "0x0000000000000000000000000000000000000000" && (
                            <li>• Winner: {formatAddress(game.lastBuyer)}</li>
                          )}
                          {hasNoPlayers && <li>• Refund available to sponsor</li>}
                          <li>• Final Phase Buy Count: {game.finalPhaseBuyCount}</li>
                          <li>• Game Status: {game.claimed ? "Prize Claimed" : "Prize Available"}</li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    // Active Game Trading Interface
                    <>
                      <div className="flex mb-4">
                        <button
                          onClick={() => setActiveTab("buy")}
                          className={`flex-1 py-2 px-4 rounded-l-lg font-medium transition-colors ${
                            activeTab === "buy"
                              ? "bg-green-600 text-white"
                              : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                          }`}
                        >
                          Buy
                        </button>
                        <button
                          onClick={() => setActiveTab("sell")}
                          className={`flex-1 py-2 px-4 rounded-r-lg font-medium transition-colors ${
                            activeTab === "sell"
                              ? "bg-pink-600 text-white"
                              : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                          }`}
                        >
                          <div className="flex items-center justify-center space-x-2">
                            {activeTab === "sell" && game.postThumbnail && game.postThumbnail !== "/placeholder.svg?height=200&width=300" && (
                              <img 
                                src={game.postThumbnail} 
                                alt={game.symbol || "PostCoin"} 
                                className="w-4 h-4 rounded-full object-cover"
                              />
                            )}
                            <span>Sell</span>
                          </div>
                        </button>
                      </div>

                      <div className="flex justify-between items-center mb-4">
                        <span className="text-gray-400 text-sm">Balance</span>
                        <span className="text-white font-medium">
                          {activeTab === "buy" ? (
                            <USDCBalance />
                          ) : (
                            <PostCoinBalance 
                              postCoinAddress={game.postCoin} 
                              chainId={8453}
                              symbol={game.symbol}
                            />
                          )}
                        </span>
                      </div>
                      
                      {activeTab === "buy" && (
                        <div className="text-xs text-gray-500 mb-4">
                          Minimum buy: {game.minBuy.toFixed(2)} USDC
                        </div>
                      )}

                      {/* Amount Input */}
                      <div className="relative mb-4">
                        <input
                          type="number"
                          value={activeTab === "buy" ? buyAmount : sellAmount}
                          onChange={(e) => {
                            if (activeTab === "buy") {
                              setBuyAmount(e.target.value)
                            } else {
                              setSellAmount(e.target.value)
                            }
                          }}
                          placeholder={activeTab === "buy" ? "0.000111" : "0.0"}
                          min={activeTab === "buy" ? game.minBuy : 0}
                          step="0.001"
                          className={`w-full bg-gray-800 border rounded-lg px-4 py-4 text-2xl font-bold text-white pr-20 ${
                            activeTab === "buy" && buyAmount && parseFloat(buyAmount) < game.minBuy
                              ? "border-red-500"
                              : "border-gray-600"
                          }`}
                        />
                        {activeTab === "buy" && buyAmount && parseFloat(buyAmount) < game.minBuy && (
                          <div className="text-red-400 text-sm mt-1">
                            Amount must be at least {game.minBuy.toFixed(2)} USDC
                          </div>
                        )}
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                          {activeTab === "sell" && (
                            <div className="w-6 h-6 rounded-full flex items-center justify-center overflow-hidden">
                              {game.postThumbnail && game.postThumbnail !== "/placeholder.svg?height=200&width=300" ? (
                                <img 
                                  src={game.postThumbnail} 
                                  alt={game.symbol || "PostCoin"} 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                  <span className="text-black text-xs font-bold">
                                    {game.symbol ? game.symbol.charAt(0).toUpperCase() : "P"}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                          {activeTab === "buy" && (
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-black text-xs font-bold">U</span>
                            </div>
                          )}
                          <span className="text-white font-medium">
                            {activeTab === "buy" ? "USDC" : (game.symbol || "POST")}
                          </span>
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>

                      {/* 0x Swap Price Display */}
                      

                      {activeTab === "buy" ? (
                        <div className="grid grid-cols-4 gap-2 mb-4">
                          <button 
                            onClick={() => setBuyAmount("1")}
                            className="bg-gray-600 hover:bg-gray-500 text-white py-2 px-3 rounded text-sm font-medium"
                          >
                            1 USDC
                          </button>
                          <button 
                            onClick={() => setBuyAmount("5")}
                            className="bg-gray-600 hover:bg-gray-500 text-white py-2 px-3 rounded text-sm font-medium"
                          >
                            5 USDC
                          </button>
                          <button 
                            onClick={() => setBuyAmount("10")}
                            className="bg-gray-600 hover:bg-gray-500 text-white py-2 px-3 rounded text-sm font-medium"
                          >
                            10 USDC
                          </button>
                          <button 
                            onClick={() => setBuyAmount(maxBuyAmount)}
                            className="bg-gray-600 hover:bg-gray-500 text-white py-2 px-3 rounded text-sm font-medium"
                          >
                            Max
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 gap-2 mb-4">
                          <button 
                            onClick={() => handlePercentageSell(25)}
                            className="bg-gray-600 hover:bg-gray-500 text-white py-2 px-3 rounded text-sm font-medium"
                          >
                            25%
                          </button>
                          <button 
                            onClick={() => handlePercentageSell(50)}
                            className="bg-gray-600 hover:bg-gray-500 text-white py-2 px-3 rounded text-sm font-medium"
                          >
                            50%
                          </button>
                          <button 
                            onClick={() => handlePercentageSell(75)}
                            className="bg-gray-600 hover:bg-gray-500 text-white py-2 px-3 rounded text-sm font-medium"
                          >
                            75%
                          </button>
                          <button 
                            onClick={() => handlePercentageSell(100)}
                            className="bg-gray-600 hover:bg-gray-500 text-white py-2 px-3 rounded text-sm font-medium"
                          >
                            100%
                          </button>
                        </div>
                      )}                                                            

                      {activeTab === "buy" && (
                        <div className="flex justify-between items-center text-sm mb-4">
                          <span className="text-gray-400">Minimum received</span>
                          <div className="flex items-center space-x-1">
                            {buySwapPrice.price ? (
                              <>
                                <div className="w-4 h-6 bg-blue-500 rounded-full flex items-center justify-center overflow-hidden">
                                  {game.postThumbnail && game.postThumbnail !== "/placeholder.svg?height=200&width=300" ? (
                                    <img 
                                      src={game.postThumbnail} 
                                      alt={game.symbol || "PostCoin"} 
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-black text-xs font-bold">
                                      {game.symbol ? game.symbol.charAt(0).toUpperCase() : "P"}
                                    </span>
                                  )}
                                </div>
                                <span className="text-white font-medium">
                                  {buySwapPrice.price.buyAmount ? 
                                    Number(formatUnits(BigInt(buySwapPrice.price.buyAmount), 18)).toFixed(1) : 
                                    '0.0'
                                  } {game.symbol || "POST"}
                                </span>
                              </>
                            ) : (
                              <>
                                <div className="w-4 h-6 bg-gray-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">?</span>
                                </div>
                                <span className="text-gray-400 font-medium">Loading...</span>
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      {activeTab === "sell" && (
                        <div className="flex justify-between items-center text-sm mb-4">
                          <span className="text-gray-400">You'll receive</span>
                          <div className="flex items-center space-x-1">
                            {sellSwapPrice.price ? (
                              <>
                                <div className="w-4 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                  <span className="text-black text-xs font-bold">U</span>
                                </div>
                                <span className="text-white font-medium">
                                  {sellSwapPrice.price.buyAmount ? 
                                    Number(formatUnits(BigInt(sellSwapPrice.price.buyAmount), 6)).toFixed(1) : 
                                    '0.0'
                                  } USDC
                                </span>
                              </>
                            ) : (
                              <>
                                <div className="w-4 h-6 bg-gray-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">?</span>
                                </div>
                                <span className="text-gray-400 font-medium">Loading...</span>
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      <button
                        className={`w-full font-bold py-3 rounded-lg transition-colors ${
                          activeTab === "buy"
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : "bg-pink-600 hover:bg-pink-700 text-white"
                        }`}
                        disabled={
                          (activeTab === "buy" && (!buyAmount || parseFloat(buyAmount) < game.minBuy)) ||
                          (activeTab === "sell" && (!sellAmount || parseFloat(sellAmount) <= 0))
                        }
                      >
                        {activeTab === "buy" ? "Buy" : "Sell"}
                      </button>









                      <div className="bg-gray-700 rounded-lg p-4">
                        <h3 className="text-lg font-bold mb-2">Game Rules</h3>
                        <ul className="text-sm text-gray-300 space-y-1">
                          <li>• Last buyer before the timer hits zero wins the USDC prize.</li>
                          <li>• Each buy extends timer by 30 seconds</li>
                          <li>• Minimum buy increases with each purchase</li>
                          <li>• Winner can claim prize when timer ends</li>
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              </PrivyWalletGuard>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-lg font-bold">Recent Buy</h2>
          </div>
          <div className="overflow-x-auto">
            {game.buyEvents && game.buyEvents.length > 0 ? (
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium text-gray-300">Time</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-300">Type</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-300">Amount</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-300">From</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-300">TX</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {game.buyEvents.map((buyEvent, index) => (
                    <tr key={buyEvent.id} className="hover:bg-gray-700/50">
                      <td className="p-3 text-sm text-gray-300">
                        {formatTimeAgo(buyEvent.blockTimestamp)}
                      </td>
                      <td className="p-3 text-sm">
                        <span className="text-green-400 font-medium">BUY</span>
                      </td>
                      <td className="p-3 text-sm text-white font-medium">
                        {formatBuyAmount(buyEvent.amount)}
                      </td>
                      <td className="p-3 text-sm text-blue-400">
                        {formatAddress(buyEvent.buyer)}
                      </td>
                      <td className="p-3 text-sm">
                        <a 
                          href={`https://basescan.org/tx/${buyEvent.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-white font-mono text-xs"
                        >
                          {formatAddress(buyEvent.transactionHash)}
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center">
                <div className="text-gray-400 text-lg mb-2">No Buy Events Yet</div>
                <div className="text-gray-500 text-sm">This game hasn't had any buyers yet. Be the first to join!</div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}