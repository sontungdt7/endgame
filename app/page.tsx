import { Header } from "@/components/header"
import { BullRunList } from "@/components/bullrun-list"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <BullRunList />
      </main>
    </div>
  )
}
