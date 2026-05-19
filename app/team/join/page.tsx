"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { getAllTeams, joinTeam } from "@/lib/client/api"
import type { Team } from "@/types"

export default function JoinTeamPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Team[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isRandomSearching, setIsRandomSearching] = useState(false)
  const router = useRouter()
  const { updateUser } = useAuth()
  const { toast } = useToast()

  // Search by name - instant filtering
  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (query.length > 0) {
      setIsSearching(true)
      const allTeams = await getAllTeams()
      const results = allTeams.filter((team) => team.name.toLowerCase().includes(query.toLowerCase()))
      setSearchResults(results)
      setIsSearching(false)
    } else {
      setSearchResults([])
    }
  }

  // Random matchmaking with delay
  const handleRandomSearch = async () => {
    setIsRandomSearching(true)

    // Simulate delay (1-3 seconds)
    const delay = Math.random() * 2000 + 1000
    await new Promise(resolve => setTimeout(resolve, delay))

    const allTeams = await getAllTeams()
    
    if (!allTeams || allTeams.length === 0) {
      setIsRandomSearching(false)
      toast({
        title: "No Teams Found",
        description: "No teams available to join",
        variant: "destructive",
      })
      setSearchResults([])
      return
    }

    const randomTeam = allTeams[Math.floor(Math.random() * allTeams.length)]
    setSearchResults([randomTeam])
    setIsRandomSearching(false)

    toast({
      title: "Team Found!",
      description: `We found ${randomTeam.name} for you`,
    })
  }

  // Request to join team
  const handleJoinTeam = async (team: Team) => {
    try {
      await joinTeam(team.id)

      toast({
        title: "Request Sent",
        description: `Your join request was sent to ${team.name}. The team captain will review it.`,
      })

      router.push("/team")
    } catch (error) {
      console.error("Error joining team:", error)
      toast({
        title: "Error",
        description: "Failed to send join request. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-[#121212] relative overflow-hidden flex flex-col">
      {/* Background ambient light */}
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-[#3B82F6]/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-[#FF3B3F]/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#121212]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-full transition-all text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Join Team</h1>
        </div>
      </div>

      {/* Content Wrapper */}
      <div className="flex-1 w-full max-w-2xl mx-auto px-4 py-8 animate-fade-in">
        <div className="text-center mb-10">
           <div className="w-20 h-20 bg-gradient-to-br from-[#2C2C2C] to-[#1a1a1a] rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-xl border border-white/10">
               <Search className="w-8 h-8 text-[#FF3B3F]" />
           </div>
           <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Find Your Squad</h2>
           <p className="text-sm text-gray-400">Search for a specific team or use random matchmaking to join an exciting club.</p>
        </div>

        <div className="space-y-8">
          {/* Search by Name */}
          <div className="bg-white/[0.02] border border-white/[0.05] p-6 rounded-3xl backdrop-blur-sm shadow-xl">
            <label className="text-sm font-semibold text-gray-300 block mb-3 ml-1">Search by Name</label>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-[#FF3B3F] transition-colors" />
              <Input
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Enter team name..."
                className="bg-[#121212]/80 border-white/10 text-white h-14 pl-12 rounded-2xl focus-visible:ring-1 focus-visible:ring-[#FF3B3F] focus-visible:border-[#FF3B3F] transition-all text-lg placeholder:text-gray-600 shadow-inner"
              />
            </div>
            {isSearching && (
              <div className="flex items-center justify-center mt-4">
                <Loader2 className="w-5 h-5 animate-spin text-[#FF3B3F]" />
              </div>
            )}
          </div>

          {/* Random Matchmaking */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#1E1E1E] to-[#121212] border border-white/10 p-6 rounded-3xl shadow-xl">
             <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#FF3B3F]/20 blur-3xl rounded-full" />
             <label className="text-sm font-semibold text-gray-300 block mb-3 ml-1 relative z-10">Don't know anyone?</label>
             <Button
               onClick={handleRandomSearch}
               disabled={isRandomSearching}
               className="w-full relative z-10 bg-white/5 hover:bg-white/10 border border-white/10 text-white h-14 rounded-2xl font-bold text-lg transition-all hover:border-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]"
             >
              {isRandomSearching ? (
                <>
                  <Loader2 className="w-5 h-5 mr-3 animate-spin text-[#FF3B3F]" />
                  Scanning Database...
                </>
              ) : (
                "Random Matchmaking"
              )}
            </Button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-4 pt-4 animate-slide-up">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider pl-2 border-l-2 border-[#FF3B3F]">Results found ({searchResults.length})</h3>
              <div className="space-y-3">
                {searchResults
                  .filter(team => team && team.id && team.name)
                  .map((team, idx) => (
                  <div key={team.id} className="group relative bg-[#1E1E1E]/80 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-white/5 hover:border-[#FF3B3F]/50 transition-all hover:shadow-[0_4px_20px_rgba(255,59,63,0.15)] overflow-hidden" style={{ animationDelay: `${idx * 0.1}s` }}>
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#FF3B3F] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#2C2C2C] to-[#121212] border border-white/10 flex items-center justify-center font-black text-white text-lg">
                           {team.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-lg">{team.name}</h4>
                          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                             <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                             {team.wilaya || team.baladia || 'Selected Location'}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] uppercase font-bold tracking-wider bg-[#FF3B3F]/10 text-[#FF3B3F] px-2 py-0.5 rounded-full border border-[#FF3B3F]/20">
                              Rating: {team.rating?.toFixed(1) || 'N/A'}
                            </span>
                            {team.division && (
                              <span className="text-[10px] uppercase font-bold tracking-wider bg-white/5 text-gray-300 px-2 py-0.5 rounded-full border border-white/10">
                                {team.division}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleJoinTeam(team)}
                        className="bg-gradient-to-r from-[#FF3B3F] to-red-600 hover:from-red-500 hover:to-red-700 text-white rounded-xl px-6 h-10 font-bold transition-all hover:scale-105 hover:shadow-[0_4px_15px_rgba(255,59,63,0.4)] border border-[#FF3B3F]/50"
                      >
                        Join
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchQuery && !isSearching && searchResults.length === 0 && (
            <div className="text-center py-12 px-4 rounded-3xl border border-white/5 bg-white/[0.01]">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                 <Search className="w-6 h-6 text-gray-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">No teams found</h3>
              <p className="text-sm text-gray-400">Try adjusting your search query.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
