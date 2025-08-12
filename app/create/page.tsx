"use client"

import { useState } from "react"
import { GameHeader } from "@/components/game-header"
import { CreateBullRunForm } from "@/components/create-bullrun-form"
import { CreateConfirmation } from "@/components/create-confirmation"
import { PrivyWalletGuard } from "@/components/privy-wallet-guard"

export default function CreateBullRunPage() {
  const [step, setStep] = useState<"form" | "confirmation">("form")
  const [createdGame, setCreatedGame] = useState<{
    id: string
    gameLink: string
    prizePool: number
    duration: number
  } | null>(null)

  const handleGameCreated = (gameData: {
    id: string
    gameLink: string
    prizePool: number
    duration: number
  }) => {
    setCreatedGame(gameData)
    setStep("confirmation")
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <GameHeader />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-green-400 to-yellow-400 bg-clip-text text-transparent">
            Create Game
          </h1>
          <p className="text-gray-400">Launch a "Last Buyer Wins" game on any Zora post and watch it go viral</p>
        </div>

        <PrivyWalletGuard>
          {step === "form" && <CreateBullRunForm onGameCreated={handleGameCreated} />}
          {step === "confirmation" && createdGame && (
            <CreateConfirmation
              gameData={createdGame}
              onCreateAnother={() => {
                setStep("form")
                setCreatedGame(null)
              }}
            />
          )}
        </PrivyWalletGuard>
      </main>
    </div>
  )
}
