"use client"

import { useState } from "react"
import { BullRunCard } from "@/components/bullrun-card"

// Mock data for demonstration
const mockBullRuns = [
  {
    id: "1",
    postTitle: "Epic NFT Collection Launch",
    postThumbnail: "/placeholder.svg?height=200&width=300",
    prizePool: 500,
    timeLeft: "2h 34m",
    lastBuyer: "alice.eth",
    status: "active" as const,
    minBuy: 1.2,
  },
  {
    id: "2",
    postTitle: "Viral Meme Contest",
    postThumbnail: "/placeholder.svg?height=200&width=300",
    prizePool: 250,
    timeLeft: "45m",
    lastBuyer: "0x1234...5678",
    status: "active" as const,
    minBuy: 0.8,
  },
  {
    id: "3",
    postTitle: "Community Art Project",
    postThumbnail: "/placeholder.svg?height=200&width=300",
    prizePool: 1000,
    timeLeft: "Ended",
    winner: "bob.eth",
    status: "ended" as const,
    minBuy: 0,
  },
  {
    id: "4",
    postTitle: "Crypto Trading Challenge",
    postThumbnail: "/placeholder.svg?height=200&width=300",
    prizePool: 750,
    timeLeft: "Ended",
    winner: "trader.eth",
    status: "ended" as const,
    minBuy: 0,
  },
  {
    id: "5",
    postTitle: "DeFi Protocol Launch",
    postThumbnail: "/placeholder.svg?height=200&width=300",
    prizePool: 2000,
    timeLeft: "Ended",
    winner: "0xabcd...efgh",
    status: "ended" as const,
    minBuy: 0,
  },
  {
    id: "6",
    postTitle: "Gaming Tournament Finals",
    postThumbnail: "/placeholder.svg?height=200&width=300",
    prizePool: 1500,
    timeLeft: "Ended",
    winner: "gamer.eth",
    status: "ended" as const,
    minBuy: 0,
  },
]

export function BullRunList() {
  const [activeTab, setActiveTab] = useState<"active" | "ended">("active")

  const filteredGames = mockBullRuns.filter((game) => game.status === activeTab)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab("active")}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              activeTab === "active"
                ? "bg-green-500/20 text-green-400 border-green-500/30"
                : "text-gray-400 border-gray-600 hover:text-white hover:border-gray-500"
            }`}
          >
            Active Games
          </button>
          <button
            onClick={() => setActiveTab("ended")}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              activeTab === "ended"
                ? "bg-green-500/20 text-green-400 border-green-500/30"
                : "text-gray-400 border-gray-600 hover:text-white hover:border-gray-500"
            }`}
          >
            Ended Games
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredGames.map((bullRun) => (
          <BullRunCard key={bullRun.id} bullRun={bullRun} />
        ))}
      </div>
    </div>
  )
}
