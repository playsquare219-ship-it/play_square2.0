"use client"

import { useState, useEffect, useMemo } from "react"
import { Trophy } from "lucide-react"
import BottomNav from "@/components/bottom-nav"
import { TournamentTopBar } from "@/components/tournaments/tournament-top-bar"
import { HeroTitle } from "@/components/tournaments/hero-title"
import { FilterTabs } from "@/components/tournaments/filter-tabs"
import { TournamentCard } from "@/components/tournaments/tournament-card"
import { getTournaments } from "@/lib/client/api"
import type { Tournament } from "@/types"

const FILTER_TABS = [
  { id: "all", label: "All" },
  { id: "upcoming", label: "Upcoming" },
  { id: "ongoing", label: "Ongoing" },
  { id: "past", label: "Past" },
]

const UPCOMING_STATUSES = ["registration", "registration_open", "registration_closed", "draft"]
const ONGOING_STATUSES = ["ongoing"]
const PAST_STATUSES = ["completed", "cancelled", "archived"]

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const data = await getTournaments()
        if (!cancelled) {
          setTournaments(data)
          setLoading(false)
        }
      } catch {
        if (!cancelled) {
          setTournaments([])
          setLoading(false)
        }
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const filteredTournaments = useMemo(() => {
    if (activeTab === "all") return tournaments
    if (activeTab === "upcoming") return tournaments.filter((t) => UPCOMING_STATUSES.includes(t.status))
    if (activeTab === "ongoing") return tournaments.filter((t) => ONGOING_STATUSES.includes(t.status))
    if (activeTab === "past") return tournaments.filter((t) => PAST_STATUSES.includes(t.status))
    return tournaments
  }, [tournaments, activeTab])

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-20">
      <TournamentTopBar title="Football Leagues" />
      <HeroTitle>Football Leagues</HeroTitle>

      <div className="mb-4">
        <FilterTabs tabs={FILTER_TABS} activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {loading ? (
        <div className="space-y-4 px-[14px]" aria-label="Loading tournaments" role="status">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#1a1a1a] rounded-2xl overflow-hidden animate-pulse">
              <div className="h-[190px] bg-[#222222]" />
              <div className="p-4 space-y-2">
                <div className="h-5 bg-[#222222] rounded w-3/4" />
                <div className="h-4 bg-[#222222] rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredTournaments.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] px-4" role="status">
          <div className="w-16 h-16 bg-[#e8352a]/10 rounded-full flex items-center justify-center mb-4">
            <Trophy className="w-8 h-8 text-[#e8352a]" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">No tournaments found</h3>
          <p className="text-[#888888] text-sm text-center">
            {activeTab === "all"
              ? "No tournaments available yet"
              : `No ${activeTab} tournaments found`}
          </p>
        </div>
      ) : (
        <div className="space-y-4 px-[14px]">
          {filteredTournaments.map((tournament) => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
        </div>
      )}

      <BottomNav active="tournaments" />
    </div>
  )
}
