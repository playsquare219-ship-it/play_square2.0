"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/client/hooks/useAuth"
import GoogleSignInButton from "@/components/auth/GoogleSignInButton"

const LoginSchema = z.object({
  email: z.string().min(3).max(128),
  password: z.string().min(6).max(128),
})

export default function LoginForm() {
  const router = useRouter()
  const { toast } = useToast()
  const { refreshSession } = useAuth()

  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const parsed = LoginSchema.safeParse({
      email: formData.email,
      password: formData.password,
    })

    if (!parsed.success) {
      toast({
        title: "Invalid input",
        description: "Please check your email/phone and password.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      })

      const data = (await res.json().catch(() => null)) as
        | { error?: { message?: string } }
        | null

      if (!res.ok) {
        throw new Error(data?.error?.message || "Login failed")
      }

      await refreshSession()
      toast({
        title: "Logged in",
        description: "Welcome back!",
      })
      router.push("/home")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed"
      toast({
        title: "Login failed",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full">
      <div className="space-y-6">
        <GoogleSignInButton />

        <div className="flex items-center gap-3">
          <div className="h-px bg-[#2C2C2C] flex-1" />
          <p className="text-xs text-[#A0A0A0] shrink-0">or</p>
          <div className="h-px bg-[#2C2C2C] flex-1" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">
              Email or Phone
            </Label>
            <Input
              id="email"
              type="text"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="example@email.com or +213 555 123 456"
              className="bg-[#1E1E1E] border-[#2C2C2C] text-white placeholder:text-[#A0A0A0] focus:border-[#FF3B3F] focus:ring-[#FF3B3F] h-12 text-base"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-white">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="••••••••"
              className="bg-[#1E1E1E] border-[#2C2C2C] text-white placeholder:text-[#A0A0A0] focus:border-[#FF3B3F] focus:ring-[#FF3B3F] h-12 text-base"
              required
            />
          </div>

          <div className="text-right">
            <a href="#" className="text-sm text-white hover:text-[#FF3B3F] transition-colors">
              Forgot Password?
            </a>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#FF3B3F] hover:bg-white hover:text-[#FF3B3F] text-white font-semibold h-12 text-base transition-all duration-300 shadow-lg shadow-[#FF3B3F]/20 disabled:opacity-70"
          >
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </div>
    </div>
  )
}

