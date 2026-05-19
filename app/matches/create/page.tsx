"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import {
  Search,
  Zap,
  Shuffle,
  Clock,
  MapPin,
  Calendar,
  ArrowLeft,
  Trophy,
  Users,
  Swords,
  ChevronLeft,
  X,
  Target,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { getAllTeams, getMyTeams, getTeamById, saveMatch, saveMatchRequest, getMatchRequestById, confirmMatchBooking, getWilayas, fetchBaladias, getStadiums } from "@/lib/client/api"
import type { Team, Match, MatchRequest } from "@/types"

const COMMUNES: Record<string, string[]> = {
  Alger: ["Bab Ezzouar", "Hydra", "Kouba", "El Harrach"],
  Oran: ["Bir El Djir", "Es Senia", "Arzew"],
  // ... defaults
}

type SearchMode = "instant" | "random" | "search" | null
type MatchState = "selecting" | "searching" | "found" | "details" | "confirmed"

export default function CreateMatchPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()

  // State
  const [userTeam, setUserTeam] = useState<Team | null>(null)
  const [myTeams, setMyTeams] = useState<Team[]>([])
  const [selectedUserTeam, setSelectedUserTeam] = useState<Team | null>(null)
  const [mode, setMode] = useState<SearchMode>(null)
  const [matchState, setMatchState] = useState<MatchState>("selecting")
  const [opponent, setOpponent] = useState<Team | null>(null)

  // Search specific state
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Team[]>([])

  // Match Details
  const [matchDetails, setMatchDetails] = useState({
    stadium: "",
    wilaya: "",
    baladia: "",
    date: "",
    time: ""
  })

  // Animation states
  const [isAnimating, setIsAnimating] = useState(false)
  const [randomCards, setRandomCards] = useState<Team[]>([])
  const [matchRequest, setMatchRequest] = useState<MatchRequest | null>(null)
  const [invitationSent, setInvitationSent] = useState(false)
  const [requestLoading, setRequestLoading] = useState(false)
  const [wilayas, setWilayas] = useState<string[]>([])
  const [baladias, setBaladias] = useState<Array<{ id: string; name: string }>>([])
  const [stadiums, setStadiums] = useState<Array<{ id: string; name: string }>>([])
  const [isTimeConfirmed, setIsTimeConfirmed] = useState(false)
  const [dateRange, setDateRange] = useState({ min: "", max: "" })
  const searchParams = useSearchParams()

  const canConfirmBooking = matchRequest && user?.id === matchRequest.createdByUserId

  // Load User Team
  useEffect(() => {
    const loadTeam = async () => {
      if (user?.teamId) {
        const team = await getTeamById(user.teamId)
        setUserTeam(team)
        setSelectedUserTeam(team)
      }
      const teams = await getMyTeams()
      setMyTeams(teams)
    }

    const loadLocationData = async () => {
      const fetchedWilayas = await getWilayas()
      setWilayas(fetchedWilayas.map((item) => item.name || item.id))
    }

    loadTeam()
    loadLocationData()
  }, [user])

  useEffect(() => {
    const requestId = searchParams.get('requestId')
    if (!requestId) return

    const loadRequest = async () => {
      setRequestLoading(true)
      const data = await getMatchRequestById(requestId)
      setRequestLoading(false)
      if (data) {
        setMatchRequest(data)
        setSelectedUserTeam(data.fromTeam)
        setOpponent(data.toTeam)
        const dateTime = data.proposedDate || ''
        const [dateValue, ...timeParts] = dateTime.includes('T')
          ? dateTime.split('T')
          : dateTime.split(' ')
        let timeValue = timeParts.join(' ')
        if (timeValue.includes('Z')) {
          timeValue = timeValue.split('Z')[0]
        }
        if (timeValue.includes('+')) {
          timeValue = timeValue.split('+')[0]
        }
        setMatchDetails({
          stadium: data.stadium || '',
          wilaya: data.wilaya || '',
          baladia: data.baladia || '',
          date: dateValue || '',
          time: timeValue.slice(0, 5) || '',
        })
        if (data.status === 'accepted') {
          setMatchState('details')
        }
      }
    }

    loadRequest()
  }, [searchParams])

  useEffect(() => {
    const loadBaladias = async () => {
      if (!matchDetails.wilaya) {
        setBaladias([])
        return
      }

      const allWilayas = await getWilayas()
      const selectedWilaya = allWilayas.find((item) => item.name === matchDetails.wilaya)
      const wilayaId = selectedWilaya?.id
      if (!wilayaId) {
        setBaladias([])
        return
      }

      const fetchedBaladias = await fetchBaladias(wilayaId)
      setBaladias(fetchedBaladias.map((item) => ({ id: item.id, name: item.name })))
    }

    loadBaladias()
  }, [matchDetails.wilaya])

  const selectedBaladiaId = useMemo(
    () => baladias.find((item) => item.name === matchDetails.baladia)?.id,
    [baladias, matchDetails.baladia]
  )

  useEffect(() => {
    const loadStadiums = async () => {
      if (!selectedBaladiaId || !matchDetails.date || !matchDetails.time || !isTimeConfirmed) {
        setStadiums([])
        return
      }

      const fetchedStadiums = await getStadiums(undefined, selectedBaladiaId, matchDetails.date, matchDetails.time)
      setStadiums(fetchedStadiums.map((item) => ({ id: item.id, name: item.name })))
    }

    loadStadiums()
  }, [selectedBaladiaId, matchDetails.date, matchDetails.time, isTimeConfirmed])

  useEffect(() => {
    if (!matchRequest?.proposedDate) {
      setDateRange({ min: "", max: "" })
      return
    }

    const baseDate = new Date(matchRequest.proposedDate)
    const min = baseDate.toISOString().slice(0, 10)
    const maxDate = new Date(baseDate)
    maxDate.setDate(maxDate.getDate() + 3)
    const max = maxDate.toISOString().slice(0, 10)
    setDateRange({ min, max })
  }, [matchRequest])

  const enforceRequestedDateRange = (dateValue: string) => {
    if (!matchRequest?.proposedDate) return true
    const requestedDate = new Date(matchRequest.proposedDate)
    const selectedDate = new Date(dateValue)
    const maxDate = new Date(requestedDate)
    maxDate.setDate(maxDate.getDate() + 3)
    return selectedDate >= requestedDate && selectedDate <= maxDate
  }

  // Functions
  const handleModeSelect = async (selectedMode: SearchMode) => {
    if (!selectedUserTeam) {
      toast({
        title: "Select a team first",
        description: "Please select your team or book without a team before starting.",
        variant: "destructive",
      })
      return
    }

    setMode(selectedMode)
    setMatchState("searching")

    if (selectedMode === "instant") {
      // Simulate Instant Search
      setTimeout(async () => {
        const teams = await getAllTeams()
        const filteredTeams = teams.filter(t => t.id !== selectedUserTeam?.id)
        const randomTeam = filteredTeams[Math.floor(Math.random() * filteredTeams.length)]
        setOpponent(randomTeam)
        setMatchState("found")
      }, 3000)
    } else if (selectedMode === "random") {
      // Simulate Random Search shuffle
      const teams = await getAllTeams()
      const filteredTeams = teams.filter(t => t.id !== selectedUserTeam?.id)
      setRandomCards(filteredTeams.slice(0, 5)) // Show 5 random cards shuffling

      setTimeout(() => {
        const randomTeam = filteredTeams[Math.floor(Math.random() * filteredTeams.length)]
        setOpponent(randomTeam)
        setMatchState("found")
      }, 4000)
    }
  }

  const handleNameSearch = async (query: string) => {
    setSearchQuery(query)
    if (query.length > 1) {
      const teams = await getAllTeams()
      const results = teams.filter(t =>
        t.id !== selectedUserTeam?.id &&
        t.name.toLowerCase().includes(query.toLowerCase())
      )
      setSearchResults(results)
    } else {
      setSearchResults([])
    }
  }

  const confirmOpponent = async () => {
    if (opponent && !opponent.id.startsWith('booking_')) {
      await sendMatchInvitation()
      return
    }
    setMatchState("details")
  }

  const sendMatchInvitation = async () => {
    if (!selectedUserTeam || !opponent) return

    if (!user?.id) {
      toast({
        title: "Not logged in",
        description: "You must be logged in to send an invitation.",
        variant: "destructive"
      })
      return
    }

    try {
      const proposedDate = matchDetails.date && matchDetails.time
        ? `${matchDetails.date} ${matchDetails.time}`
        : new Date().toISOString()

      const requestPayload: any = {
        fromTeam: selectedUserTeam,
        fromTeamId: selectedUserTeam.id,
        toTeamId: opponent.id,
        kind: "direct",
        proposedDate,
        createdByUserId: user.id,
      }

      if (matchDetails.stadium) requestPayload.stadium = matchDetails.stadium
      if (matchDetails.wilaya) requestPayload.wilaya = matchDetails.wilaya
      if (matchDetails.baladia) requestPayload.baladia = matchDetails.baladia

      const request = await saveMatchRequest(requestPayload)

      setMatchRequest(request)
      setInvitationSent(true)
      setMatchState("found")

      toast({
        title: "Invitation Sent",
        description: "Match invitation has been sent to the other team.",
      })

      setTimeout(() => router.push("/home"), 1000)
    } catch (error) {
      console.error("Error sending match invitation:", error)
      toast({
        title: "Error",
        description: "Failed to send invitation. Try again.",
        variant: "destructive"
      })
    }
  }

  const finalizeMatch = async () => {
    if (!selectedUserTeam) return

    if (!matchDetails.wilaya || !matchDetails.baladia || !matchDetails.time || (stadiums.length > 0 && !matchDetails.stadium)) {
      toast({
        title: "Missing Details",
        description: "Please fill out all match details including wilaya, baladia, time" + (stadiums.length > 0 ? ", and stadium" : ""),
        variant: "destructive"
      })
      return
    }

    if (matchRequest && matchRequest.proposedDate && !enforceRequestedDateRange(matchDetails.date)) {
      toast({
        title: "Invalid date",
        description: "The booking date must be within 3 days of the requested date.",
        variant: "destructive"
      })
      return
    }

    if (matchRequest) {
      try {
        await confirmMatchBooking(matchRequest.id, {
          stadium: matchDetails.stadium,
          wilaya: matchDetails.wilaya,
          baladia: matchDetails.baladia,
          date: matchDetails.date,
          time: matchDetails.time,
        })
        toast({
          title: "Booking Confirmed!",
          description: "Match created successfully.",
        })
        setTimeout(() => router.push("/home"), 1000)
      } catch (error) {
        console.error("Error confirming booking:", error)
        toast({
          title: "Error",
          description: "Failed to confirm booking. Try again.",
          variant: "destructive"
        })
      }
      return
    }

    try {
      const now = new Date().toISOString()
      const fallbackOpponent = opponent || {
        id: `booking_opponent_${Date.now()}`,
        name: "No opponent",
        captainId: "",
        players: [],
        createdAt: now,
        updatedAt: now,
        rating: 0,
        division: "",
        wins: 0,
        draws: 0,
        losses: 0,
      }
      // Create and save match using Firebase
      await saveMatch({
        team1Id: selectedUserTeam.id,
        team2Id: fallbackOpponent.id,
        team1: selectedUserTeam,
        team2: fallbackOpponent,
        stadium: matchDetails.stadium,
        wilaya: matchDetails.wilaya,
        baladia: matchDetails.baladia,
        dateTime: matchDetails.date + (matchDetails.time ? ` ${matchDetails.time}` : ""),
        createdByUserId: user?.id || "",
      })

      toast({
        title: "Match Scheduled!",
        description: "Match saved successfully",
      })

      // Animate out or redirect
      setTimeout(() => router.push("/home"), 1000)
    } catch (error) {
      console.error("Error creating match:", error)
      toast({
        title: "Error",
        description: "Failed to create match. Try again.",
        variant: "destructive"
      })
    }
  }

  // --- RENDER HELPERS ---

  // 1. SELECT MODE
  if (matchState === "selecting") {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col p-4 animate-fade-in pb-20">
        <header className="flex items-center gap-4 mb-8 pt-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-white">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Find an Opponent
          </h1>
        </header>

        <div className="flex-1 space-y-6">
          <section className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#FF3B3F]/10 blur-[60px] rounded-full pointer-events-none" />
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 relative z-10">
                 <Users className="w-6 h-6 text-[#FF3B3F]" />
                 Team Selection
              </h2>
              <div className="grid gap-4 relative z-10">
                {selectedUserTeam ? (
                  <div className="rounded-2xl border border-[#FF3B3F]/30 bg-gradient-to-r from-[#FF3B3F]/10 to-transparent p-5 flex items-center justify-between gap-4 shadow-[0_0_20px_rgba(255,59,63,0.1)]">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-xl bg-[#121212] border border-[#FF3B3F]/50 flex items-center justify-center font-bold text-white shadow-inner text-lg">
                          {selectedUserTeam.name.substring(0, 2).toUpperCase()}
                       </div>
                       <div>
                         <p className="text-[10px] text-[#FF3B3F] font-bold uppercase tracking-widest mb-1">Playing As</p>
                         <p className="font-bold text-white text-lg leading-none">{selectedUserTeam.name}</p>
                       </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setSelectedUserTeam(null)} className="text-gray-400 hover:text-white hover:bg-white/10 rounded-xl">
                      Change
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myTeams.length > 0 ? (
                      <div className="grid gap-3">
                        <Label className="text-gray-400 text-xs uppercase tracking-widest font-semibold ml-1">Select an existing team</Label>
                        {myTeams.map((team) => (
                          <Button
                            key={team.id}
                            variant="outline"
                            className="justify-between h-14 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 hover:border-[#FF3B3F]/50 text-white transition-all shadow-sm"
                            onClick={() => setSelectedUserTeam(team)}
                          >
                            <span className="font-semibold text-base">{team.name}</span>
                            <span className="text-xs bg-white/10 px-2.5 py-1 rounded-md text-gray-300">Your Team</span>
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
                         <p className="text-sm text-gray-400">You don't have saved teams yet. You can still play by booking a stadium without a registered team.</p>
                      </div>
                    )}

                    <div className="relative py-2">
                       <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-white/10" />
                       </div>
                       <div className="relative flex justify-center">
                          <span className="backdrop-blur-xl px-4 text-xs font-semibold text-gray-500 uppercase tracking-widest bg-transparent">or</span>
                       </div>
                    </div>

                    <Button 
                      className="w-full h-14 rounded-xl bg-[#2C2C2C] hover:bg-[#3C3C3C] hover:border-white/30 border border-white/10 text-white font-semibold transition-all hover:scale-[1.02] shadow-[0_4px_10px_rgba(0,0,0,0.2)]"
                      onClick={() => {
                        setSelectedUserTeam({
                          id: `booking_${Date.now()}`,
                          name: "Book without team",
                          captainId: user?.id || "",
                          players: [],
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString(),
                          rating: 0,
                          division: "",
                          wins: 0,
                          draws: 0,
                          losses: 0,
                        })
                        setMatchState("details")
                    }}>
                      Book Stadium Without a Team
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Instant Search Card */}
          <button
            onClick={() => handleModeSelect("instant")}
            className="w-full relative group overflow-hidden rounded-2xl bg-gradient-to-br from-[#1E1E1E] to-[#121212] border border-[#2C2C2C] p-6 text-left transition-all duration-300 hover:border-[#FF3B3F] hover:shadow-[0_0_20px_rgba(255,59,63,0.15)]"
          >
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <Zap className="w-24 h-24 text-[#FF3B3F]" />
            </div>
            <div className="relative z-10 flex flex-col h-full">
              <div className="bg-[#FF3B3F]/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Zap className="w-6 h-6 text-[#FF3B3F]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Instant Search</h3>
              <p className="text-sm text-gray-400">Find a team online now and ready to play.</p>
              <div className="mt-4 flex items-center text-xs text-[#FF3B3F] font-medium">
                <div className="w-2 h-2 rounded-full bg-[#FF3B3F] mr-2 animate-pulse" />
                Fastest way to play
              </div>
            </div>
          </button>

          {/* Random Search Card */}
          <button
            onClick={() => handleModeSelect("random")}
            className="w-full relative group overflow-hidden rounded-2xl bg-gradient-to-br from-[#1E1E1E] to-[#121212] border border-[#2C2C2C] p-6 text-left transition-all duration-300 hover:border-[#3B82F6] hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]"
          >
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <Shuffle className="w-24 h-24 text-[#3B82F6]" />
            </div>
            <div className="relative z-10 flex flex-col h-full">
              <div className="bg-[#3B82F6]/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform duration-300">
                <Shuffle className="w-6 h-6 text-[#3B82F6]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Random Search</h3>
              <p className="text-sm text-gray-400">Let luck choose your opponent from available teams.</p>
            </div>
          </button>

          {/* Name Search Card */}
          <button
            onClick={() => handleModeSelect("search")}
            className="w-full relative group overflow-hidden rounded-2xl bg-gradient-to-br from-[#1E1E1E] to-[#121212] border border-[#2C2C2C] p-6 text-left transition-all duration-300 hover:border-[#10B981] hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]"
          >
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <Search className="w-24 h-24 text-[#10B981]" />
            </div>
            <div className="relative z-10 flex flex-col h-full">
              <div className="bg-[#10B981]/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Search className="w-6 h-6 text-[#10B981]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Search by Team Name</h3>
              <p className="text-sm text-gray-400">Search for a specific team and challenge them directly.</p>
            </div>
          </button>
        </div>
      </div>
    )
  }

  // 2. SEARCHING ANIMATION
  if (matchState === "searching") {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center p-6 relative overflow-hidden">

        {/* Instant Search Animation */}
        {mode === "instant" && (
          <div className="flex flex-col items-center z-10">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <div className="absolute inset-0 bg-[#FF3B3F]/20 rounded-full animate-ping" />
              <div className="absolute inset-0 bg-[#FF3B3F]/10 rounded-full animate-pulse-glow" />
              <div className="relative z-10 bg-[#1E1E1E] border-2 border-[#FF3B3F] w-24 h-24 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,59,63,0.3)]">
                <Zap className="w-10 h-10 text-[#FF3B3F] animate-pulse" />
              </div>
              {/* Radar Scan Effect */}
              <div className="absolute inset-0 rounded-full border border-[#FF3B3F]/30 border-t-[#FF3B3F] animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-white mt-8 mb-2">Searching for opponent...</h2>
            <p className="text-gray-400 text-sm animate-pulse">Scanning for currently active teams</p>
          </div>
        )}

        {/* Random Search Animation */}
        {mode === "random" && (
          <div className="flex flex-col items-center z-10 w-full max-w-sm">
            <div className="relative h-48 w-full perspective-1000">
              {/* Simulated shuffling cards */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-40 bg-gradient-to-br from-[#1E1E1E] to-[#2C2C2C] border-2 border-[#3B82F6] rounded-xl flex items-center justify-center shadow-2xl animate-bounce">
                  <Shuffle className="w-12 h-12 text-[#3B82F6] animate-spin-slow" />
                </div>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mt-8 mb-2">Random selection...</h2>
            <p className="text-gray-400 text-sm">The system is choosing a suitable opponent for you</p>
          </div>
        )}

        {/* Name Search UI */}
        {mode === "search" && (
          <div className="w-full h-full flex flex-col pt-10">
            <div className="flex items-center gap-4 mb-8">
              <Button variant="ghost" size="icon" onClick={() => setMatchState("selecting")} className="text-white">
                <ArrowLeft className="w-6 h-6" />
              </Button>
              <h1 className="text-xl font-bold">Search for Team</h1>
            </div>

            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                autoFocus
                placeholder="Enter team name..."
                className="pl-12 py-6 bg-[#1E1E1E] border-[#2C2C2C] text-lg rounded-xl focus:border-[#10B981] transition-colors"
                value={searchQuery}
                onChange={(e) => handleNameSearch(e.target.value)}
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {searchResults.map(team => (
                <button
                  key={team.id}
                  onClick={() => {
                    setOpponent(team)
                    setMatchState("found") // Go to VS screen first
                  }}
                  className="w-full flex items-center gap-4 p-4 bg-[#1E1E1E] rounded-xl border border-[#2C2C2C] hover:border-[#10B981] animate-slide-up transition-all"
                >
                  <div className="w-12 h-12 rounded-full bg-[#2C2C2C] flex items-center justify-center font-bold text-lg text-[#10B981]">
                    {team.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-bold text-white">{team.name}</h3>
                    <p className="text-xs text-gray-400">{team.wilaya || team.baladia || 'Selected'}</p>
                  </div>
                  <div className="text-[#10B981] font-bold text-sm">
                    Challenge
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Cancel Button (for animations) */}
        {mode !== "search" && (
          <Button
            variant="outline"
            className="fixed top-6 right-6 z-50 h-11 px-4 rounded-full border border-[#2C2C2C] bg-[#121212]/95 text-sm text-gray-300 hover:bg-[#1E1E1E] hover:text-white shadow-lg shadow-black/20 transition-all"
            onClick={() => {
              setMatchState("selecting")
              setMode(null)
            }}
          >
            Cancel
          </Button>
        )}
      </div>
    )
  }

  // 3. VS SCREEN (MATCH FOUND)
  if (matchState === "found" && opponent) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center relative overflow-hidden p-6 z-50">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[#FF3B3F]/5 z-0" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#FF3B3F]/10 rounded-full blur-[100px] animate-pulse" />

        <div className="relative z-10 w-full flex flex-col items-center">

          {/* Teams Container */}
          <div className="flex items-center justify-between w-full max-w-md mb-12">

            {/* User Team */}
            <div className="flex flex-col items-center animate-slide-up opacity-0" style={{ animationDelay: '0.2s' }}>
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-[#FF3B3F] bg-[#1E1E1E] flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(255,59,63,0.3)] animate-logo-float">
                <span className="text-3xl font-bold text-white">{selectedUserTeam?.name.substring(0, 2).toUpperCase()}</span>
              </div>
              <h2 className="text-xl font-bold text-white text-center">{selectedUserTeam?.name}</h2>
              <p className="text-sm text-gray-400">{selectedUserTeam?.wilaya || selectedUserTeam?.baladia || 'Selected'}</p>
            </div>

            {/* VS Badge */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[80%] z-20 animate-vs-reveal opacity-0">
              <div className="text-7xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                VS
              </div>
              <Swords className="w-16 h-16 text-[#FF3B3F] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 opacity-50" />
            </div>

            {/* Opponent Team */}
            <div className="flex flex-col items-center animate-slide-up opacity-0" style={{ animationDelay: '0.6s' }}>
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white bg-[#1E1E1E] flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(255,255,255,0.1)] animate-logo-float" style={{ animationDelay: '-1.5s' }}>
                <span className="text-3xl font-bold text-white">{opponent.name.substring(0, 2).toUpperCase()}</span>
              </div>
              <h2 className="text-xl font-bold text-white text-center">{opponent.name}</h2>
              <p className="text-sm text-gray-400">{opponent.wilaya || opponent.baladia || 'Selected'}</p>
            </div>
          </div>

          <div className="w-full max-w-xs space-y-3 animate-slide-up opacity-0" style={{ animationDelay: '1s' }}>
            <Button
              className="w-full bg-[#FF3B3F] hover:bg-[#FF3B3F]/90 text-white font-bold text-lg py-6 shadow-[0_0_20px_rgba(255,59,63,0.4)]"
              onClick={confirmOpponent}
              disabled={!!matchRequest}
            >
              {matchRequest ? 'Invitation Sent' : 'Send Invitation'}
            </Button>
            {!matchRequest && (
              <Button
                variant="ghost"
                className="w-full text-gray-400 hover:text-white"
                onClick={() => setMatchState("selecting")}
              >
                Search for another opponent
              </Button>
            )}
            {matchRequest && (
              <div className="rounded-2xl border border-[#2C2C2C] bg-[#121212] p-4 text-center text-[#A0A0A0]">
                Invitation sent. Waiting for the other team's acceptance.
              </div>
            )}
            {invitationSent && (
              <div className="rounded-2xl border border-[#10B981] bg-[#031B12] p-4 text-center text-[#A7F3D0]">
                Invitation sent successfully. You can stay here or return later.
              </div>
            )}
          </div>

        </div>
      </div>
    )
  }

  // 4. MATCH DETAILS FORM
  if (matchState === "details") {
    return (
      <div className="min-h-screen bg-[#121212] text-white p-4 animate-fade-in pb-20">
        <header className="flex items-center gap-4 mb-6 pt-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMatchState(opponent ? "found" : "selecting")}
            className="text-white"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-bold">Match Details</h1>
        </header>

        <div className="space-y-6 max-w-md mx-auto">
          <div className="bg-[#1E1E1E] border border-[#2C2C2C] rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#2C2C2C] flex items-center justify-center text-xs font-bold">
                {opponent?.name ? opponent.name.substring(0, 2) : "NA"}
              </div>
              <div>
                <p className="text-xs text-gray-400">Opponent</p>
                <p className="font-bold">{opponent?.name || "No opponent"}</p>
                {!opponent && <p className="text-xs text-gray-500">Book a stadium and time without an opposing team</p>}
              </div>
            </div>
            <div className="text-[#FF3B3F] font-bold text-sm">{opponent ? "Change" : "Confirm"}</div>
          </div>

          <div className="space-y-4">
            {/* Location */}
            <div className="space-y-2">
              <Label className="text-gray-300">Wilaya</Label>
              <Select
                value={matchDetails.wilaya}
                onValueChange={(val) => {
                  setMatchDetails({ ...matchDetails, wilaya: val, baladia: '', stadium: '' })
                  setIsTimeConfirmed(false)
                }}
              >
                <SelectTrigger className="bg-[#1E1E1E] border-[#2C2C2C] text-white py-6">
                  <SelectValue placeholder="Select Wilaya" />
                </SelectTrigger>
                <SelectContent className="bg-[#1E1E1E] border-[#2C2C2C]">
                  {wilayas.map((w) => (
                    <SelectItem key={w} value={w} className="text-right">{w}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Baladia</Label>
              <Select
                value={matchDetails.baladia}
                disabled={!matchDetails.wilaya}
                onValueChange={(val) => {
                  setMatchDetails({ ...matchDetails, baladia: val, stadium: '' })
                  setIsTimeConfirmed(false)
                }}
              >
                <SelectTrigger className="bg-[#1E1E1E] border-[#2C2C2C] text-white py-6">
                  <SelectValue placeholder="Select Baladia" />
                </SelectTrigger>
                <SelectContent className="bg-[#1E1E1E] border-[#2C2C2C]">
                  {baladias.map((baladia) => (
                    <SelectItem key={baladia.id} value={baladia.name} className="text-right">
                      {baladia.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Date</Label>
                <Input
                  type="date"
                  className="bg-[#1E1E1E] border-[#2C2C2C] py-6"
                  value={matchDetails.date}
                  min={dateRange.min || undefined}
                  max={dateRange.max || undefined}
                  onChange={(e) => {
                    const selectedDate = e.target.value
                    if (dateRange.min && dateRange.max && !enforceRequestedDateRange(selectedDate)) {
                      return
                    }
                    setMatchDetails({ ...matchDetails, date: selectedDate, stadium: '' })
                    setIsTimeConfirmed(false)
                  }}
                />
                {matchRequest?.proposedDate ? (
                  <p className="text-xs text-gray-400">
                    Booking date must be between {dateRange.min} and {dateRange.max}.
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Time (Hour)</Label>
                <Select
                  value={matchDetails.time}
                  onValueChange={(val) => {
                    setMatchDetails({ ...matchDetails, time: val, stadium: '' })
                    setIsTimeConfirmed(false)
                  }}
                >
                  <SelectTrigger className="bg-[#1E1E1E] border-[#2C2C2C] text-white py-6">
                    <SelectValue placeholder="Select Hour" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1E1E1E] border-[#2C2C2C]">
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = String(i).padStart(2, '0')
                      return (
                        <SelectItem key={hour} value={`${hour}:00`} className="text-right">
                          {hour}:00
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4">
              <Button
                onClick={async () => {
                  if (!selectedBaladiaId || !matchDetails.date || !matchDetails.time) {
                    toast({
                      title: 'Please complete location and time',
                      description: 'Select baladia, date, and time before confirming.',
                      variant: 'destructive',
                    })
                    return
                  }
                  setIsTimeConfirmed(true)
                }}
                disabled={!selectedBaladiaId || !matchDetails.date || !matchDetails.time}
                className="w-full bg-[#FF3B3F] hover:bg-[#FF3B3F]/90 text-white font-bold py-6"
              >
                تأكيد التوقيت
              </Button>
              {isTimeConfirmed ? (
                <p className="text-sm text-green-400 mt-2 text-right">
                  تم تأكيد التوقيت: {matchDetails.date} {matchDetails.time}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Stadium Name</Label>
              <Select
                value={matchDetails.stadium}
                onValueChange={(val) => setMatchDetails({ ...matchDetails, stadium: val })}
                disabled={!matchDetails.baladia || !matchDetails.date || !matchDetails.time || !isTimeConfirmed || stadiums.length === 0}
              >
                <SelectTrigger className="bg-[#1E1E1E] border-[#2C2C2C] text-white py-6">
                  <SelectValue
                    placeholder={
                      !matchDetails.date || !matchDetails.time
                        ? "Select date and time first"
                        : !isTimeConfirmed
                        ? "Confirm time to load stadiums"
                        : stadiums.length > 0
                        ? "Select Stadium"
                        : "No stadiums available at selected time"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="bg-[#1E1E1E] border-[#2C2C2C]">
                  {stadiums.map((stadium) => (
                    <SelectItem key={stadium.id} value={stadium.name} className="text-right">
                      {stadium.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {matchRequest ? (
            <Button
              onClick={finalizeMatch}
              disabled={matchRequest.status !== 'accepted' || !canConfirmBooking}
              className="w-full bg-[#FF3B3F] hover:bg-[#FF3B3F]/90 text-white font-bold py-6 mt-8 shadow-lg shadow-[#FF3B3F]/20"
            >
              {matchRequest.status !== 'accepted'
                ? "Waiting for the other team's acceptance"
                : canConfirmBooking
                ? 'Confirm Booking'
                : 'Not authorized to confirm'}
            </Button>
          ) : opponent && !opponent.id.startsWith('booking_') ? (
            <Button
              onClick={sendMatchInvitation}
              className="w-full bg-[#FF3B3F] hover:bg-[#FF3B3F]/90 text-white font-bold py-6 mt-8 shadow-lg shadow-[#FF3B3F]/20"
            >
              Send Match Invitation
            </Button>
          ) : (
            <Button
              onClick={finalizeMatch}
              className="w-full bg-[#FF3B3F] hover:bg-[#FF3B3F]/90 text-white font-bold py-6 mt-8 shadow-lg shadow-[#FF3B3F]/20"
            >
              Confirm Match
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#FF3B3F] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
