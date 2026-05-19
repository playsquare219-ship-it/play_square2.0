"use client"

import { useEffect, useState } from "react"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import BottomNav from "@/components/bottom-nav"
import PlayerCard from "@/components/player-card"
import { useAuth } from "@/contexts/auth-context"
import { getTeamById } from "@/lib/client/api"
import type { Team, Player } from "@/types"

const MOCK_PLAYERS: Player[] = [
  { id: "p1", name: "Yacine Brahimi", rating: 87, position: "FWD", number: 10, gamesPlayed: 20, goals: 15, assists: 8 },
  { id: "p2", name: "Riyad Mahrez", rating: 89, position: "FWD", number: 7, gamesPlayed: 22, goals: 18, assists: 12 },
  {
    id: "p3",
    name: "Islam Slimani",
    rating: 85,
    position: "FWD",
    number: 9,
    gamesPlayed: 21,
    goals: 16,
    assists: 5,
  },
  {
    id: "p4",
    name: "Sofiane Feghouli",
    rating: 84,
    position: "MID",
    number: 8,
    gamesPlayed: 23,
    goals: 8,
    assists: 10,
  },
  {
    id: "p5",
    name: "Adlene Guedioura",
    rating: 82,
    position: "MID",
    number: 15,
    gamesPlayed: 19,
    goals: 5,
    assists: 7,
  },
  { id: "p6", name: "Mehdi Zeffane", rating: 80, position: "DEF", number: 2, gamesPlayed: 22, goals: 1, assists: 3 },
  { id: "p7", name: "Aissa Mandi", rating: 83, position: "DEF", number: 4, gamesPlayed: 24, goals: 2, assists: 1 },
  { id: "p8", name: "Rais Mbolhi", rating: 81, position: "GK", number: 1, gamesPlayed: 24, goals: 0, assists: 0 },
]

export default function SquadPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [team, setTeam] = useState<Team | null>(null)
  const [players, setPlayers] = useState<Player[]>([])

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth")
      return
    }

    if (!user?.teamId) {
      router.push("/home")
      return
    }

    const loadTeam = async () => {
      const loadedTeam = await getTeamById(user.teamId)
      if (loadedTeam) {
        setTeam(loadedTeam)
        // Use mock players if team has no players yet
        setPlayers(loadedTeam.players.length > 0 ? loadedTeam.players : MOCK_PLAYERS)
      }
    }
    loadTeam()
  }, [user, isAuthenticated, router])

  if (!team) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  const teamRating =
    players.length > 0 ? (players.reduce((sum, p) => sum + p.rating, 0) / players.length).toFixed(1) : "0.0"

  const forwards = players.filter((p) => p.position === "FWD").slice(0, 3)
  const midfielders = players.filter((p) => p.position === "MID").slice(0, 3)
  const defenders = players.filter((p) => p.position === "DEF").slice(0, 4)
  const goalkeeper = players.find((p) => p.position === "GK")

  return (
    <div className="min-h-screen bg-[#121212] pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#121212]/95 backdrop-blur-sm border-b border-[#2C2C2C]">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => router.back()} className="p-2 hover:bg-[#1E1E1E] rounded-lg transition-all">
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div>
                <h1 className="text-xl font-bold">Squad & Formation</h1>
                <p className="text-xs text-[#A0A0A0]">Tap and drag to reorder</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Team Overview */}
        <div className="bg-[#1E1E1E] rounded-xl p-4 border border-[#2C2C2C]">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-[#A0A0A0]">Team Rating</div>
              <div className="text-3xl font-bold text-[#FF3B3F]">{teamRating}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-[#A0A0A0]">Total Players</div>
              <div className="text-2xl font-bold text-white">
                {players.length} <span className="text-sm text-[#A0A0A0]">/ 11 Starting</span>
              </div>
            </div>
          </div>
        </div>

        {/* Formation View */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">Formation (4-3-3)</h2>

          {/* Football Field */}
          <div className="relative bg-gradient-to-b from-green-900/20 to-green-800/20 rounded-2xl p-6 border border-green-700/30 min-h-[500px]">
            {/* Field Lines */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-0 right-0 h-px bg-white/20" />
              <div className="absolute top-1/2 left-1/2 w-20 h-20 border border-white/20 rounded-full -translate-x-1/2 -translate-y-1/2" />
            </div>

            {/* Players Positioned */}
            <div className="relative z-10 space-y-8">
              {/* Forwards */}
              {forwards.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {forwards.map((player) => (
                    <PlayerCard
                      key={player.id}
                      name={player.name.split(" ").pop() || player.name}
                      rating={player.rating}
                      number={player.number}
                      position={player.position}
                      isActive
                    />
                  ))}
                </div>
              )}

              {/* Midfielders */}
              {midfielders.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-12">
                  {midfielders.map((player) => (
                    <PlayerCard
                      key={player.id}
                      name={player.name.split(" ").pop() || player.name}
                      rating={player.rating}
                      number={player.number}
                      position={player.position}
                      isActive
                    />
                  ))}
                </div>
              )}

              {/* Defenders */}
              {defenders.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-12">
                  {defenders.map((player) => (
                    <PlayerCard
                      key={player.id}
                      name={player.name.split(" ").pop() || player.name}
                      rating={player.rating}
                      number={player.number}
                      position={player.position}
                      isActive
                    />
                  ))}
                </div>
              )}

              {/* Goalkeeper */}
              {goalkeeper && (
                <div className="flex justify-center mt-12">
                  <PlayerCard
                    name={goalkeeper.name.split(" ").pop() || goalkeeper.name}
                    rating={goalkeeper.rating}
                    number={goalkeeper.number}
                    position={goalkeeper.position}
                    isActive
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* All Players List */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">All Players</h2>
          <div className="grid gap-3">
            {players.map((player) => (
              <div
                key={player.id}
                className="bg-[#1E1E1E] rounded-xl p-4 border border-[#2C2C2C] hover:border-[#FF3B3F] transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#2C2C2C] rounded-lg flex items-center justify-center font-bold text-white">
                    {player.number}
                  </div>
                  <div>
                    <div className="font-semibold text-white flex items-center gap-2">
                      {player.name}
                      <span className="text-xs px-2 py-0.5 bg-[#2C2C2C] rounded">🇩🇿</span>
                    </div>
                    <div className="text-xs text-[#A0A0A0]">{player.position}</div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-[#FF3B3F]">{player.rating}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav active="home" />
    </div>
  )
}
