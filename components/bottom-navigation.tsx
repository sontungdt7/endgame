"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Plus, User } from "lucide-react"

export function BottomNavigation() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur border-t border-gray-800 md:hidden">
      <div className="flex items-center justify-around py-2">
        <Link
          href="/"
          className={`flex flex-col items-center p-3 rounded-lg transition-colors ${
            pathname === "/"
              ? "text-green-400 bg-gray-800/50"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Home className="w-5 h-5 mb-1" />
          <span className="text-xs font-medium">Home</span>
        </Link>
        
        <Link
          href="/create"
          className={`flex flex-col items-center p-3 rounded-lg transition-colors ${
            pathname === "/create"
              ? "text-green-400 bg-gray-800/50"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Plus className="w-5 h-5 mb-1" />
          <span className="text-xs font-medium">Create Game</span>
        </Link>

        <Link
          href="/profile"
          className={`flex flex-col items-center p-3 rounded-lg transition-colors ${
            pathname === "/profile"
              ? "text-green-400 bg-gray-800/50"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <User className="w-5 h-5 mb-1" />
          <span className="text-xs font-medium">Profile</span>
        </Link>
      </div>
    </nav>
  )
}
