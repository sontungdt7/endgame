import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { PrivyProviderWrapper } from "@/components/privy-provider"
import { WagmiProviderWrapper } from "@/components/wagmi-provider"
import { MiniKitContextProvider } from "@/components/minikit-provider"
import { BottomNavigation } from "@/components/bottom-navigation"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

export async function generateMetadata(): Promise<Metadata> {
  const URL = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
  return {
    title: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || "EndGame",
    description: "EndGame Desc",
    generator: "v0.dev",
    icons: {
      icon: [
        { url: '/icon.svg', type: 'image/svg+xml' },
        { url: '/favicon.ico', sizes: 'any' }
      ],
      apple: '/apple-touch-icon.png',
    },
    manifest: '/manifest.json',
    other: {
      'fc:frame': JSON.stringify({
        version: 'next',
        imageUrl: process.env.NEXT_PUBLIC_APP_HERO_IMAGE || `${URL}/hero.png`,
        button: {
          title: `Launch ${process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || 'EndGame'}`,
          action: {
            type: 'launch_frame',
            name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || 'EndGame',
            url: URL,
            splashImageUrl: process.env.NEXT_PUBLIC_APP_SPLASH_IMAGE || `${URL}/splash.png`,
            splashBackgroundColor: process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR || '#000000',
          },
        },
      }),
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body className="bg-gray-900 text-white antialiased pb-20 md:pb-0">
        <MiniKitContextProvider>
          <PrivyProviderWrapper>
            <WagmiProviderWrapper>
              {children}
              <BottomNavigation />
              <Toaster />
            </WagmiProviderWrapper>
          </PrivyProviderWrapper>
        </MiniKitContextProvider>
      </body>
    </html>
  )
}
