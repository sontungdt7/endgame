'use client';

import { useEffect } from 'react';
import { useMiniKit } from '@coinbase/onchainkit/minikit';
import { Header } from "@/components/header"
import { BullRunList } from "@/components/bullrun-list"

export default function HomePage() {
  const { setFrameReady, isFrameReady } = useMiniKit();

  // The setFrameReady() function is called when your mini-app is ready to be shown
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <BullRunList />
      </main>
    </div>
  )
}
