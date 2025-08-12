import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { PrivyProviderWrapper } from "@/components/privy-provider"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

export const metadata: Metadata = {
  title: "BullRun Games", // Removed ViralPost.Fun branding
  description: "Last buyer wins gaming platform", // Removed specific tagline
  generator: "v0.dev",
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
      <body className="bg-gray-900 text-white antialiased">
        <PrivyProviderWrapper>
          {children}
          <Toaster />
        </PrivyProviderWrapper>
      </body>
    </html>
  )
}
