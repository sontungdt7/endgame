import { useState, useCallback } from "react"
import { zoraService, ZoraCoinData } from "@/lib/zora-service"

export function useZoraCoin() {
  const [coinData, setCoinData] = useState<ZoraCoinData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCoinData = useCallback(async (coinAddress: string) => {
    if (!coinAddress || coinAddress.trim() === "") {
      setCoinData(null)
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)
    setCoinData(null)

    try {
      const data = await zoraService.getCoinData(coinAddress)
      if (data) {
        setCoinData(data)
        setError(null)
      } else {
        setError("Coin not found or invalid address")
        setCoinData(null)
      }
    } catch (err) {
      setError("Failed to fetch coin data")
      setCoinData(null)
      console.error("Error fetching coin data:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const validateAddress = useCallback(async (address: string): Promise<boolean> => {
    try {
      return await zoraService.validateCoinAddress(address)
    } catch (err) {
      return false
    }
  }, [])

  const clearData = useCallback(() => {
    setCoinData(null)
    setError(null)
    setIsLoading(false)
  }, [])

  return {
    coinData,
    isLoading,
    error,
    fetchCoinData,
    validateAddress,
    clearData,
  }
} 