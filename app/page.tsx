"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import SplashScreen from "@/components/splash-screen"
import { useAuth } from "@/contexts/auth-context"

export default function Page() {
  const [showSplash, setShowSplash] = useState(true)
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false)
      router.push(isAuthenticated ? "/home" : "/auth")
    }, 2000)

    return () => clearTimeout(timer)
  }, [router, isAuthenticated])

  if (showSplash) {
    return <SplashScreen />
  }

  return null
}
