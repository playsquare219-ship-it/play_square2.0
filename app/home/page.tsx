"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Bell, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import StatsCard from "@/components/stats-card"
import MatchCard from "@/components/match-card"
import BottomNav from "@/components/bottom-nav"
import { useAuth } from "@/contexts/auth-context"
import { getAllMatches, getTeamById, cancelMatch } from "@/lib/client/api"
import type { Match, Team } from "@/types"

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("all")
  const [matches, setMatches] = useState<Match[]>([])
  const [userTeam, setUserTeam] = useState<Team | null>(null)
  const [cancellingMatchIds, setCancellingMatchIds] = useState<string[]>([])
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth")
      return
    }
    const loadData = async () => {
      const data = await getAllMatches()
      setMatches(data)
      if (user?.teamId) {
        const team = await getTeamById(user.teamId)
        setUserTeam(team)
      }
    }
    loadData()
  }, [isAuthenticated, router, user?.teamId])

  const handleCancelMatch = async (matchId: string) => {
    setCancellingMatchIds((prev) => [...prev, matchId])
    try {
      await cancelMatch(matchId)
      setMatches((prev) => prev.map((item) => item.id === matchId ? { ...item, status: 'cancelled' } : item))
    } catch (error) {
      console.error('Failed to cancel match:', error)
    } finally {
      setCancellingMatchIds((prev) => prev.filter((id) => id !== matchId))
    }
  }

  const filteredMatches = matches.filter((match) => {
    const bookingWithoutTeam = match.team1?.id?.startsWith("booking_") || match.team2?.id?.startsWith("booking_opponent_")

    if (activeTab === "all") {
      return !bookingWithoutTeam
    }

    if (activeTab === "upcoming") {
      return match.status === "upcoming" || match.status === "scheduled"
    }

    if (activeTab === "my") {
      const isUserMatch = userTeam
        ? match.team1?.name === userTeam.name || match.team2?.name === userTeam.name
        : false
      const isCreatedByUser = match.createdByUserId === user?.id
      return isUserMatch || isCreatedByUser
    }

    return true
  })

  const handleMyTeamClick = () => {
    router.push("/team")
  }

  const handleCreateMatchClick = () => {
    router.push("/matches/create")
  }

  const stats = {
    rating: userTeam?.rating.toFixed(1) || "0.0",
    matches: userTeam ? (userTeam.wins + userTeam.draws + userTeam.losses).toString() : "0",
    points: userTeam ? (userTeam.wins * 3 + userTeam.draws).toString() : "0",
  }

  return (
    <div className="min-h-screen bg-[#121212] pb-20 animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#121212]/95 backdrop-blur-sm border-b border-[#2C2C2C]">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                Play <span className="text-[#FF3B3F]">Square</span>
              </h1>
              <p className="text-sm text-[#A0A0A0] flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
                Algiers, Algeria
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => router.push('/notifications')} className="p-2 hover:bg-[#1E1E1E] rounded-lg transition-all hover:scale-110">
                <Bell className="w-5 h-5 text-white" />
              </button>
              <button onClick={() => router.push('/settings')} className="p-2 hover:bg-[#1E1E1E] rounded-lg transition-all hover:scale-110">
                <Settings className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-6">
        <StatsCard rating={stats.rating} matches={stats.matches} points={stats.points} />

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={handleCreateMatchClick}
            className="h-14 bg-[#FF3B3F] hover:bg-white hover:text-[#FF3B3F] font-semibold text-base shadow-lg shadow-[#FF3B3F]/20 transition-all duration-300 hover:scale-105"
          >
            Create Match
          </Button>
          <Button
            onClick={handleMyTeamClick}
            className="h-14 bg-[#2C2C2C] hover:bg-[#3C3C3C] font-semibold text-base transition-all duration-300 hover:scale-105"
          >
            My Team
          </Button>
        </div>

        {/* Match History */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">Match History</h2>

          {/* Tabs */}
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setActiveTab("all")}
              className={`min-w-[130px] h-12 px-5 rounded-2xl font-semibold whitespace-nowrap transition-all ${
                activeTab === "all" ? "bg-[#FF3B3F] text-white shadow-lg shadow-[#FF3B3F]/20" : "bg-[#1E1E1E] text-[#A0A0A0] hover:text-white"
              }`}
            >
              All Matches
            </button>
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`min-w-[130px] h-12 px-5 rounded-2xl font-semibold whitespace-nowrap transition-all ${
                activeTab === "upcoming" ? "bg-[#FF3B3F] text-white shadow-lg shadow-[#FF3B3F]/20" : "bg-[#1E1E1E] text-[#A0A0A0] hover:text-white"
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setActiveTab("my")}
              className={`min-w-[130px] h-12 px-5 rounded-2xl font-semibold whitespace-nowrap transition-all ${
                activeTab === "my" ? "bg-[#FF3B3F] text-white shadow-lg shadow-[#FF3B3F]/20" : "bg-[#1E1E1E] text-[#A0A0A0] hover:text-white"
              }`}
            >
              My Matches
            </button>
          </div>

          {/* Match Cards */}
          <div className="space-y-3">
            {filteredMatches.length > 0 ? (
              filteredMatches.map((match) => (
                <div key={match.id} className="space-y-3">
                  <div className="relative">
                <MatchCard
                  team1={match.team1?.name || "Unknown"}
                  team2={match.team2?.name || "Unknown"}
                  score1={match.result?.team1Score ?? 0}
                  score2={match.result?.team2Score ?? 0}
                  stadium={match.stadium || "Unknown"}
                  date={match.dateTime ?? ""}
                  status={match.status === "scheduled" ? "upcoming" : match.status}
                />
                {user?.id === match.createdByUserId && match.status === 'scheduled' && (
                  <Button
                    onClick={() => handleCancelMatch(match.id)}
                    disabled={cancellingMatchIds.includes(match.id)}
                    className="absolute bottom-3 right-3 h-10 px-4 text-sm font-semibold rounded-full bg-[#1E1E1E] border border-[#ef4444] text-[#ef4444] hover:bg-[#2C2C2C] shadow-lg shadow-[#ef4444]/25 transition-all duration-300"
                  >
                    {cancellingMatchIds.includes(match.id) ? 'جارٍ الإلغاء...' : 'إلغاء'}
                  </Button>
                )}
              </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-[#A0A0A0]">No matches found</div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav active="home" />
    </div>
  )
}
