"use client"

import { useState } from "react"
import { GameHeader } from "@/components/game-header"
import { PrivyWalletGuard } from "@/components/privy-wallet-guard"

// Mock data - in real app this would come from API/blockchain
const getMockGameData = (id: string) => {
  const gameId = Number.parseInt(id)
  const isEnded = gameId % 2 === 0 // Even IDs are ended games
  const hasPlayers = gameId !== 4 // Game 4 has no players for refund scenario

  if (isEnded) {
    return {
      id,
      postTitle: "Epic NFT Collection Launch",
      postContent:
        "Discover the most innovative NFT collection that's revolutionizing digital art. Join thousands of collectors in this groundbreaking project.",
      postCoinAddress: "0x1234567890abcdef1234567890abcdef12345678",
      postThumbnail: "/placeholder.svg?height=400&width=600",
      prizePool: 500,
      timeLeft: 0,
      lastBuyer: hasPlayers ? "alice.eth" : null,
      lastBuyerAddress: hasPlayers ? "0xabcd...1234" : null,
      minBuy: 1.2,
      totalBuyers: hasPlayers ? 23 : 0,
      status: "ended" as const,
      winner: hasPlayers ? "alice.eth" : null,
      currentUser: "bob.eth", // Mock current user
    }
  }

  return {
    id,
    postTitle: "Epic NFT Collection Launch",
    postContent:
      "Discover the most innovative NFT collection that's revolutionizing digital art. Join thousands of collectors in this groundbreaking project.",
    postCoinAddress: "0x1234567890abcdef1234567890abcdef12345678",
    postThumbnail: "/placeholder.svg?height=400&width=600",
    prizePool: 500,
    timeLeft: 8640, // seconds
    lastBuyer: "alice.eth",
    lastBuyerAddress: "0xabcd...1234",
    minBuy: 1.2,
    totalBuyers: 23,
    status: "active" as const,
    winner: null,
    currentUser: "bob.eth", // Mock current user
  }
}

export default function GameDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy")
  const mockGameData = getMockGameData(params.id)
  const isEnded = mockGameData.status === "ended"
  const isWinner = isEnded && mockGameData.winner === mockGameData.currentUser
  const hasNoPlayers = isEnded && mockGameData.totalBuyers === 0

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <GameHeader />

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Trading-style Token Header */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img
                src={mockGameData.postThumbnail || "/placeholder.svg"}
                alt="Game thumbnail"
                className="w-12 h-12 rounded-lg object-cover"
              />
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-bold text-white">GAME #{mockGameData.id}</h1>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-400 text-sm">Last Buyer Wins</span>
                  {isEnded && (
                    <>
                      <span className="text-gray-400">•</span>
                      <span className="text-red-400 text-sm font-medium">ENDED</span>
                    </>
                  )}
                </div>
                <p className="text-gray-400 text-sm">{mockGameData.postTitle}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-400">${mockGameData.prizePool}</div>
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
                  {isEnded ? "Ended" : "2h 24m 15s"}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400">{isEnded ? "Winner" : "Last Buyer"}</div>
                <div className="text-lg font-bold text-blue-400">
                  {isEnded ? mockGameData.winner || "No Winner" : mockGameData.lastBuyer}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Total Players</div>
                <div className="text-lg font-bold text-purple-400">{mockGameData.totalBuyers}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Min Buy</div>
                <div className="text-lg font-bold text-yellow-400">${mockGameData.minBuy}</div>
              </div>
            </div>
          </div>

          {/* Game Content Area */}
          <div className="p-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Post Preview */}
              <div className="lg:col-span-2">
                <img
                  src={mockGameData.postThumbnail || "/placeholder.svg"}
                  alt="Post preview"
                  className="w-full h-64 object-cover rounded-lg mb-4"
                />
                <h2 className="text-xl font-bold mb-2">{mockGameData.postTitle}</h2>
                <p className="text-gray-300 mb-4">{mockGameData.postContent}</p>
                <div className="text-sm text-gray-400">
                  PostCoin: <span className="font-mono">{mockGameData.postCoinAddress}</span>
                </div>
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
                            Winner: <span className="text-blue-400 font-medium">{mockGameData.winner}</span>
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
                          <li>• Prize Pool: ${mockGameData.prizePool} USDC</li>
                          <li>• Total Players: {mockGameData.totalBuyers}</li>
                          {mockGameData.winner && <li>• Winner: {mockGameData.winner}</li>}
                          {hasNoPlayers && <li>• Refund available to sponsor</li>}
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
                  <td className="p-3 text-sm text-white font-medium">$2.50</td>
                  <td className="p-3 text-sm text-blue-400">alice.eth</td>
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
                  <td className="p-3 text-sm text-white font-medium">$2.00</td>
                  <td className="p-3 text-sm text-blue-400">bob.eth</td>
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
                  <td className="p-3 text-sm text-white font-medium">$1.50</td>
                  <td className="p-3 text-sm text-blue-400">charlie.eth</td>
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
