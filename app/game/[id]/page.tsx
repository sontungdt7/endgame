"use client"

import { useState } from "react"
import { GameHeader } from "@/components/game-header"

// Mock data - in real app this would come from API/blockchain
const mockGameData = {
  id: "1",
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
}

export default function GameDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy")

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
                <div className="text-lg font-bold text-orange-400">2h 24m 15s</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Last Buyer</div>
                <div className="text-lg font-bold text-blue-400">{mockGameData.lastBuyer}</div>
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
              <div className="space-y-4">
                <div className="flex mb-4">
                  <button
                    onClick={() => setActiveTab("buy")}
                    className={`flex-1 py-2 px-4 rounded-l-lg font-medium transition-colors ${
                      activeTab === "buy" ? "bg-green-600 text-white" : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                    }`}
                  >
                    Buy
                  </button>
                  <button
                    onClick={() => setActiveTab("sell")}
                    className={`flex-1 py-2 px-4 rounded-r-lg font-medium transition-colors ${
                      activeTab === "sell" ? "bg-pink-600 text-white" : "bg-gray-600 text-gray-300 hover:bg-gray-500"
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
                        <span className="text-white text-xs">😊</span>
                      </div>
                    )}
                    {activeTab === "buy" && (
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">U</span>
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
                      <div className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
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
              </div>
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
