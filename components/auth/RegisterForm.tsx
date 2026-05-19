"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/client/hooks/useAuth"
import GoogleSignInButton from "@/components/auth/GoogleSignInButton"

const WILAYAS = ["Alger", "Oran", "Constantine", "Annaba", "Blida", "Batna", "Djelfa", "Sétif", "Sidi Bel Abbès", "Biskra", "Tébessa", "El Oued", "Skikda", "Tiaret", "Béjaïa", "Tlemcen", "Ouargla", "Béchar", "Mostaganem", "Bordj Bou Arreridj"]

const COMMUNES: Record<string, string[]> = {
  Alger: ["Bab Ezzouar", "Hydra", "Kouba", "El Harrach", "Bir Mourad Raïs", "Dely Ibrahim"],
  Oran: ["Bir El Djir", "Es Senia", "Arzew", "Bethioua", "Sidi Chami"],
  Constantine: ["El Khroub", "Ain Smara", "Zighoud Youcef", "Hamma Bouziane"],
  default: ["Centre-ville", "Commune 1", "Commune 2", "Commune 3", "Commune 4"],
}

const RegisterSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  email: z.string().min(3).max(128),
  password: z.string().min(6).max(128),
  wilaya: z.string().min(1).max(80),
  baladia: z.string().min(1).max(80),
})

export default function RegisterForm() {
  const router = useRouter()
  const { toast } = useToast()
  const { refreshSession } = useAuth()

  const [isLoading, setIsLoading] = useState(false)
  const [selectedWilaya, setSelectedWilaya] = useState<string>("")
  const [selectedBaladia, setSelectedBaladia] = useState<string>("")
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const parsed = RegisterSchema.safeParse({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
      wilaya: selectedWilaya,
      baladia: selectedBaladia,
    })

    if (!parsed.success) {
      toast({
        title: "Invalid input",
        description: "Please complete all required fields.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      })

      const data = (await res.json().catch(() => null)) as
        | { error?: { message?: string } }
        | null

      if (!res.ok) {
        throw new Error(data?.error?.message || "Registration failed")
      }

      toast({
        title: "تم التسجيل بنجاح",
        description: "تحقق من بريدك الإلكتروني لإكمال التحقق. قد تستغرق الرسالة عدة دقائق للوصول.",
        variant: "default",
      })
      // Redirect to login page, not home - user must verify email first
      router.push("/auth/login")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed"
      toast({
        title: "Registration failed",
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-white">
                First Name
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="Ahmed"
                className="bg-[#1E1E1E] border-[#2C2C2C] text-white placeholder:text-[#A0A0A0] focus:border-[#FF3B3F] focus:ring-[#FF3B3F] h-12 text-base"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-white">
                Last Name
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Benali"
                className="bg-[#1E1E1E] border-[#2C2C2C] text-white placeholder:text-[#A0A0A0] focus:border-[#FF3B3F] focus:ring-[#FF3B3F] h-12 text-base"
                required
              />
            </div>
          </div>

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

          <div className="space-y-2">
            <Label htmlFor="wilaya" className="text-white">
              Wilaya
            </Label>
            <Select
              value={selectedWilaya}
              onValueChange={(v) => {
                setSelectedWilaya(v)
                setSelectedBaladia("")
              }}
            >
              <SelectTrigger className="bg-[#1E1E1E] border-[#2C2C2C] text-white focus:border-[#FF3B3F] focus:ring-[#FF3B3F] h-12 text-base">
                <SelectValue placeholder="Select your wilaya" />
              </SelectTrigger>
              <SelectContent className="bg-[#1E1E1E] border-[#2C2C2C]">
                {WILAYAS.map((wilaya) => (
                  <SelectItem key={wilaya} value={wilaya} className="text-white hover:bg-[#2C2C2C]">
                    {wilaya}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="commune" className="text-white">
              Commune
            </Label>
            <Select
              value={selectedBaladia}
              onValueChange={setSelectedBaladia}
              disabled={!selectedWilaya}
            >
              <SelectTrigger className="bg-[#1E1E1E] border-[#2C2C2C] text-white focus:border-[#FF3B3F] focus:ring-[#FF3B3F] h-12 text-base">
                <SelectValue placeholder="Select your commune" />
              </SelectTrigger>
              <SelectContent className="bg-[#1E1E1E] border-[#2C2C2C]">
                {(COMMUNES[selectedWilaya] || COMMUNES.default).map((commune) => (
                  <SelectItem key={commune} value={commune} className="text-white hover:bg-[#2C2C2C]">
                    {commune}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#FF3B3F] hover:bg-white hover:text-[#FF3B3F] text-white font-semibold h-12 text-base transition-all duration-300 shadow-lg shadow-[#FF3B3F]/20 disabled:opacity-70"
          >
            {isLoading ? "Creating..." : "Create Account"}
          </Button>
        </form>
      </div>
    </div>
  )
}

