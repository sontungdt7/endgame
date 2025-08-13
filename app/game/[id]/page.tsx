"use client"

import { useState } from "react"
import { GameHeader } from "@/components/game-header"
import { PrivyWalletGuard } from "@/components/privy-wallet-guard"
import { useGame } from "@/hooks/useGame"
import { formatAddress } from "@/lib/utils"

export default function GameDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy")
  const { game, loading, error } = useGame(params.id)
  
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
                <p className="text-gray-400 text-sm">{game.postTitle}</p>
                {game.symbol && (
                  <p className="text-gray-500 text-xs">Symbol: {game.symbol}</p>
                )}
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
                  {isEnded ? (game.lastBuyer ? formatAddress(game.lastBuyer) : "No Winner") : formatAddress(game.lastBuyer)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Total Players</div>
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
                  {game.description || "Discover the most innovative NFT collection that's revolutionizing digital art. Join thousands of collectors in this groundbreaking project."}
                </p>
                <div className="text-sm text-gray-400 mb-2">
                  PostCoin: <span className="font-mono">{formatAddress(game.postCoin)}</span>
                </div>
                <div className="text-sm text-gray-400">
                  Sponsored by: <span className="font-mono">{formatAddress(game.sponsor)}</span>
                </div>
                {game.symbol && (
                  <div className="text-sm text-gray-400 mt-2">
                    Token Symbol: <span className="font-mono">{game.symbol}</span>
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
                            Winner: <span className="text-blue-400 font-medium">{formatAddress(game.lastBuyer)}</span>
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
                          {game.lastBuyer && <li>• Winner: {formatAddress(game.lastBuyer)}</li>}
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
                          Sell
                        </button>
                      </div>

                      <div className="flex justify-between items-center mb-4">
                        <span className="text-gray-400 text-sm">Balance</span>
                        <span className="text-white font-medium">{activeTab === "buy" ? "0 USDC" : "273.52"}</span>
                      </div>

                      {/* Amount Input */}
                      <div className="relative mb-4">
                        <input
                          type="number"
                          placeholder={activeTab === "buy" ? "0.000111" : "0.0"}
                          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-4 text-2xl font-bold text-white pr-20"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                          {activeTab === "sell" && (
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-black text-xs">😊</span>
                            </div>
                          )}
                          {activeTab === "buy" && (
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-black text-xs font-bold">U</span>
                            </div>
                          )}
                          <span className="text-white font-medium">{activeTab === "buy" ? "USDC" : "ETH"}</span>
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>

                      {activeTab === "buy" ? (
                        <div className="grid grid-cols-4 gap-2 mb-4">
                          <button className="bg-gray-600 hover:bg-gray-500 text-white py-2 px-3 rounded text-sm font-medium">
                            1 USDC
                          </button>
                          <button className="bg-gray-600 hover:bg-gray-500 text-white py-2 px-3 rounded text-sm font-medium">
                            5 USDC
                          </button>
                          <button className="bg-gray-600 hover:bg-gray-500 text-white py-2 px-3 rounded text-sm font-medium">
                            10 USDC
                          </button>
                          <button className="bg-gray-600 hover:bg-gray-500 text-white py-2 px-3 rounded text-sm font-medium">
                            Max
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 gap-2 mb-4">
                          <button className="bg-gray-600 hover:bg-gray-500 text-white py-2 px-3 rounded text-sm font-medium">
                            25%
                          </button>
                          <button className="bg-gray-600 hover:bg-gray-500 text-white py-2 px-3 rounded text-sm font-medium">
                            50%
                          </button>
                          <button className="bg-gray-600 hover:bg-gray-500 text-white py-2 px-3 rounded text-sm font-medium">
                            75%
                          </button>
                          <button className="bg-gray-600 hover:bg-gray-500 text-white py-2 px-3 rounded text-sm font-medium">
                            100%
                          </button>
                        </div>
                      )}

                      <button
                        className={`w-full font-bold py-3 rounded-lg transition-colors mb-4 ${
                          activeTab === "buy"
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : "bg-pink-600 hover:bg-pink-700 text-white"
                        }`}
                      >
                        {activeTab === "buy" ? "Buy" : "Sell"}
                      </button>

                      {activeTab === "buy" && (
                        <div className="flex justify-between items-center text-sm mb-4">
                          <span className="text-gray-400">Minimum received</span>
                          <div className="flex items-center space-x-1">
                            <div className="w-4 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                              <span className="text-black text-xs font-bold">G</span>
                            </div>
                            <span className="text-white font-medium">4,606</span>
                          </div>
                        </div>
                      )}

                      <div className="bg-gray-700 rounded-lg p-4">
                        <h3 className="text-lg font-bold mb-2">Game Rules</h3>
                        <ul className="text-sm text-gray-300 space-y-1">
                          <li>• Last buyer wins the entire prize pool</li>
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
            <h2 className="text-lg font-bold">Recent Activity</h2>
          </div>
          <div className="overflow-x-auto">
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
                <tr className="hover:bg-gray-700/50">
                  <td className="p-3 text-sm text-gray-300">2m ago</td>
                  <td className="p-3 text-sm">
                    <span className="text-green-400 font-medium">BUY</span>
                  </td>
                  <td className="p-3 text-sm text-white font-medium">${game.minBuy.toFixed(2)}</td>
                  <td className="p-3 text-sm text-blue-400">{formatAddress(game.lastBuyer)}</td>
                  <td className="p-3 text-sm">
                    <a href="#" className="text-gray-400 hover:text-white font-mono text-xs">
                      0x1234...5678
                    </a>
                  </td>
                </tr>
                <tr className="hover:bg-gray-700/50">
                  <td className="p-3 text-sm text-gray-300">5m ago</td>
                  <td className="p-3 text-sm">
                    <span className="text-green-400 font-medium">BUY</span>
                  </td>
                  <td className="p-3 text-sm text-white font-medium">${(game.minBuy * 0.8).toFixed(2)}</td>
                  <td className="p-3 text-sm text-blue-400">{formatAddress(game.sponsor)}</td>
                  <td className="p-3 text-sm">
                    <a href="#" className="text-gray-400 hover:text-white font-mono text-xs">
                      0xabcd...efgh
                    </a>
                  </td>
                </tr>
                <tr className="hover:bg-gray-700/50">
                  <td className="p-3 text-sm text-gray-300">8m ago</td>
                  <td className="p-3 text-sm">
                    <span className="text-green-400 font-medium">BUY</span>
                  </td>
                  <td className="p-3 text-sm text-white font-medium">${(game.minBuy * 0.6).toFixed(2)}</td>
                  <td className="p-3 text-sm text-blue-400">{formatAddress(game.postCoin)}</td>
                  <td className="p-3 text-sm">
                    <a href="#" className="text-gray-400 hover:text-white font-mono text-xs">
                      0x9876...5432
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
