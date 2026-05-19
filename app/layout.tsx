import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import AuthProvider from "@/contexts/AuthProvider"
import { Toaster } from "@/components/ui/toaster"
import InstallPWA from "@/components/install-pwa"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Play Square - Football Team Management",
  description: "Manage your football team, track matches, and connect with players across Algeria",
  manifest: "/manifest.json",
  themeColor: "#FF3B3F",
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.png",
  },
}

export const viewport: Viewport = {
  themeColor: "#FF3B3F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased bg-[#121212] text-white`}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
        <InstallPWA />
        <Analytics />
      </body>
    </html>
  )
}
