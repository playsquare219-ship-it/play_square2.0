"use client"

import { useState } from "react"
import { signInWithPopup } from "firebase/auth"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { getFirebaseAuth, getGoogleProvider } from "@/lib/client/firebase/client"
import { useAuth } from "@/lib/client/hooks/useAuth"
import { siGoogle } from "simple-icons"

export default function GoogleSignInButton() {
  const router = useRouter()
  const { toast } = useToast()
  const { refreshSession } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogle = async () => {
    if (isLoading) return
    setIsLoading(true)
    try {
      const auth = getFirebaseAuth()
      const provider = getGoogleProvider()

      const result = await signInWithPopup(auth, provider)
      const idToken = await result.user.getIdToken()

      const res = await fetch("/api/auth/google", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      })

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: { message?: string } } | null
        throw new Error(data?.error?.message || "Google sign-in failed")
      }

      await refreshSession()
      router.push("/home")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Google sign-in failed"
      toast({
        title: "Google Sign-In Failed",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      type="button"
      onClick={handleGoogle}
      disabled={isLoading}
      className="w-full bg-[#1E1E1E] hover:bg-[#2C2C2C] text-white font-semibold h-12 text-base transition-all duration-300 border border-[#2C2C2C]"
    >
      <span
        aria-hidden="true"
        className="inline-flex h-5 w-5 items-center justify-center [&>svg]:h-5 [&>svg]:w-5"
        // `simple-icons` provides raw SVG markup.
        dangerouslySetInnerHTML={{ __html: siGoogle.svg }}
      />
      {isLoading ? "Signing in..." : "Continue with Google"}
    </Button>
  )
}

