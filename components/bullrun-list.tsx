"use client"

import { useState } from "react"
import { BullRunCard } from "@/components/bullrun-card"
import { useGames } from "@/hooks/useGames"

export function BullRunList() {
  const [activeTab, setActiveTab] = useState<"active" | "ended">("active")
  const { games, loading, error } = useGames()

  const filteredGames = games.filter((game) => game.status === activeTab)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center">
          <div className="flex space-x-2">
            <button
              disabled
              className="px-4 py-2 rounded-lg border text-gray-400 border-gray-600 cursor-not-allowed"
            >
              Active Games
            </button>
            <button
              disabled
              className="px-4 py-2 rounded-lg border text-gray-400 border-gray-600 cursor-not-allowed"
            >
              Ended Games
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading games...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center">
          <div className="flex space-x-2">
            <button
              disabled
              className="px-4 py-2 rounded-lg border text-gray-400 border-gray-600 cursor-not-allowed"
            >
              Active Games
            </button>
            <button
              disabled
              className="px-4 py-2 rounded-lg border text-gray-400 border-gray-600 cursor-not-allowed"
            >
              Ended Games
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-red-400 text-6xl mb-4">⚠️</div>
            <p className="text-red-400 mb-2">Failed to load games</p>
            <p className="text-gray-400 text-sm">{error}</p>
            <p className="text-gray-500 text-xs mt-2">Showing fallback data</p>
          </div>
        </div>
      </div>
    )
  }

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
            Active Games ({games.filter(g => g.status === "active").length})
          </button>
          <button
            onClick={() => setActiveTab("ended")}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              activeTab === "ended"
                ? "bg-green-500/20 text-green-400 border-green-500/30"
                : "text-gray-400 border-gray-600 hover:text-white hover:border-gray-500"
            }`}
          >
            Ended Games ({games.filter(g => g.status === "ended").length})
          </button>
        </div>
      </div>

      {filteredGames.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-gray-400 text-6xl mb-4">🎮</div>
            <p className="text-gray-400 mb-2">No {activeTab} games found</p>
            <p className="text-gray-500 text-sm">
              {activeTab === "active" 
                ? "Check back later for new games!" 
                : "No completed games yet."
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredGames.map((bullRun) => (
            <BullRunCard key={bullRun.id} bullRun={bullRun} />
          ))}
        </div>
      )}
    </div>
  )
}
