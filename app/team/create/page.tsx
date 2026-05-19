"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { createTeam } from "@/lib/client/api"

const WILAYAS = [
  "Alger",
  "Oran",
  "Constantine",
  "Annaba",
  "Blida",
  "Batna",
  "Djelfa",
  "Sétif",
  "Sidi Bel Abbès",
  "Biskra",
]

export default function CreateTeamPage() {
  const [teamName, setTeamName] = useState("")
  const [location, setLocation] = useState("")
  const [wilaya, setWilaya] = useState("")
  const router = useRouter()
  const { user, updateUser } = useAuth()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!teamName || !location || !wilaya) {
      toast({
        title: "Error",
        description: "Please fill all fields",
        variant: "destructive",
      })
      return
    }

    try {
      const newTeamPayload = {
        name: teamName,
        captainId: user?.id || "",
        wilaya,
        baladia: location,
      }

      // Create new team on the server and use the generated team ID.
      const createdTeam = await createTeam(newTeamPayload)

      // Update user with the actual saved team ID
      updateUser({
        teamId: createdTeam.id,
        isTeamCaptain: true,
      })

      toast({
        title: "Team Created!",
        description: `${teamName} has been created successfully`,
      })

      router.push("/team")
    } catch (error) {
      console.error("Error creating team:", error)
      toast({
        title: "Error",
        description: "Failed to create team. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-[#121212] relative overflow-hidden flex flex-col">
      {/* Background ambient light */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#FF3B3F]/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#3B82F6]/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#121212]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-full transition-all text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Create Team</h1>
        </div>
      </div>

      {/* Form Wrapper */}
      <div className="flex-1 w-full max-w-2xl mx-auto px-4 py-8 animate-fade-in">
        <div className="text-center mb-10">
           <div className="w-20 h-20 bg-gradient-to-br from-[#FF3B3F] to-[#d92226] rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,59,63,0.3)] border-t border-white/20">
               {teamName ? <span className="text-3xl font-black text-white">{teamName.substring(0, 2).toUpperCase()}</span> : <span className="text-3xl font-black text-white">FC</span>}
           </div>
           <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Build Your Legacy</h2>
           <p className="text-sm text-gray-400">Fill in the details to establish your new team.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white/[0.02] border border-white/[0.05] p-6 sm:p-8 rounded-3xl backdrop-blur-sm shadow-2xl">
          <div className="space-y-3">
            <Label htmlFor="teamName" className="text-gray-300 font-medium ml-1">Team Name</Label>
            <Input
              id="teamName"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter a unique team name"
              className="bg-[#121212]/50 border-white/10 text-white h-14 rounded-2xl focus-visible:ring-1 focus-visible:ring-[#FF3B3F] focus-visible:border-[#FF3B3F] transition-all px-4 placeholder:text-gray-600"
              required
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="location" className="text-gray-300 font-medium ml-1">Neighborhood / Commune</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Bab Ezzouar"
              className="bg-[#121212]/50 border-white/10 text-white h-14 rounded-2xl focus-visible:ring-1 focus-visible:ring-[#FF3B3F] focus-visible:border-[#FF3B3F] transition-all px-4 placeholder:text-gray-600"
              required
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="wilaya" className="text-gray-300 font-medium ml-1">Wilaya</Label>
            <Select value={wilaya} onValueChange={setWilaya} required>
              <SelectTrigger className="bg-[#121212]/50 border-white/10 text-white h-14 rounded-2xl focus:ring-1 focus:ring-[#FF3B3F] transition-all px-4">
                <SelectValue placeholder="Select wilaya" />
              </SelectTrigger>
              <SelectContent className="bg-[#1E1E1E] border-[#2C2C2C] rounded-xl shadow-2xl">
                {WILAYAS.map((w) => (
                  <SelectItem key={w} value={w} className="text-white hover:bg-[#2C2C2C] cursor-pointer">
                    {w}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full bg-gradient-to-r from-[#FF3B3F] to-red-600 hover:from-red-500 hover:to-red-700 text-white shadow-[0_4px_20px_rgba(255,59,63,0.3)] hover:shadow-[0_4px_30px_rgba(255,59,63,0.5)] h-14 rounded-2xl font-bold text-lg mt-8 transition-all hover:-translate-y-0.5 border border-[#FF3B3F]/50">
            Create Team
          </Button>
        </form>
      </div>
    </div>
  )
}
