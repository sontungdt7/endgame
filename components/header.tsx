import Link from "next/link"
import { PrivyWalletConnectButton } from "@/components/privy-wallet-connect-button"

export function Header() {
  return (
    <header className="border-b border-gray-800 bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-gray-900/60">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link href="/" className="text-xl font-bold text-white hover:text-green-400 transition-colors">
            ViralPost
          </Link>
          <nav className="flex items-center space-x-4">
            <Link href="/" className="text-gray-300 hover:text-white transition-colors">
              Explore
            </Link>
            <Link href="/create" className="text-gray-300 hover:text-white transition-colors">
              Create Game
            </Link>
          </nav>
        </div>

        <PrivyWalletConnectButton />
      </div>
    </header>
  )
}
