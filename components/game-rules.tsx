import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Info } from "lucide-react"

export function GameRules() {
  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Info className="w-5 h-5 text-blue-400" />
          <span>Game Rules</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <p className="text-blue-300 font-semibold mb-2">How to Win:</p>
          <p className="text-gray-300 text-sm leading-relaxed">
            Be the last buyer before the timer hits zero to win the USDC prize.
          </p>
        </div>

        <div className="space-y-2 text-sm text-gray-400">
          <div className="flex items-start space-x-2">
            <span className="text-green-400 font-bold">•</span>
            <span>Each buy extends the timer and increases the minimum buy amount</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-green-400 font-bold">•</span>
            <span>You must buy more than the current minimum to take the lead</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-green-400 font-bold">•</span>
            <span>Winner takes the entire USDC prize pool</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-green-400 font-bold">•</span>
            <span>All purchases are final and non-refundable</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
