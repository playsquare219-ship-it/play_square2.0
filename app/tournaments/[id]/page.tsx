"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Calendar, MapPin, Users, Trophy } from "lucide-react"
import BottomNav from "@/components/bottom-nav"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { TournamentTopBar } from "@/components/tournaments/tournament-top-bar"
import { TournamentHero } from "@/components/tournaments/tournament-hero"
import { SectionCard } from "@/components/tournaments/section-card"
import { InfoRow } from "@/components/tournaments/info-row"
import { CountdownTimer } from "@/components/tournaments/countdown-timer"
import { PlayerRosterSection } from "@/components/tournaments/player-roster-section"
import { getTournamentById } from "@/lib/client/api"
import { useAuth } from "@/contexts/auth-context"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { Tournament } from "@/types"
import { Button } from "@/components/ui/button"

export default function TournamentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const tournamentId = params?.id as string

  useEffect(() => {
    if (!tournamentId) return
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const data = await getTournamentById(tournamentId)
        if (!cancelled) {
          if (data) {
            setTournament(data)
          } else {
            setError(true)
          }
          setLoading(false)
        }
      } catch {
        if (!cancelled) {
          setError(true)
          setLoading(false)
        }
      }
    }
    load()
    return () => { cancelled = true }
  }, [tournamentId])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] pb-20">
        <TournamentTopBar title="Tournament" showBack />
        <div className="animate-pulse" aria-label="Loading tournament details">
          <div className="h-[210px] bg-[#222222]" />
          <div className="space-y-3 p-4">
            <div className="h-6 bg-[#222222] rounded w-3/4" />
            <div className="h-4 bg-[#222222] rounded w-full" />
            <div className="h-4 bg-[#222222] rounded w-5/6" />
          </div>
          <div className="mx-[14px] bg-[#1a1a1a] rounded-2xl p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-5 bg-[#222222] rounded" />
            ))}
          </div>
        </div>
        <BottomNav active="tournaments" />
      </div>
    )
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] pb-20">
        <TournamentTopBar title="Tournament" showBack />
        <div className="flex flex-col items-center justify-center min-h-[400px] px-4" role="alert">
          <Trophy className="w-12 h-12 text-[#888888] mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Tournament not found</h3>
          <p className="text-[#888888] text-sm text-center mb-4">
            This tournament may have been removed or is unavailable.
          </p>
          <Button
            onClick={() => router.push("/tournaments")}
            className="bg-[#e8352a] hover:bg-[#e8352a]/90 text-white"
          >
            Back to Tournaments
          </Button>
        </div>
        <BottomNav active="tournaments" />
      </div>
    )
  }

  const teams = tournament.teams || []
  const closedStatuses = ["ongoing", "completed", "cancelled"] as const
  const isRegistrationOpen = !closedStatuses.includes(tournament.status as any)
  const isFull = (tournament.maxTeams || 0) > 0 && teams.length >= tournament.maxTeams
  const isAlreadyRegistered = teams.some((t) => t.captainId === user?.id)
  const isCreator = tournament.createdByUserId === user?.id
  const canRegister =
    isAuthenticated && isRegistrationOpen && !isFull && !isAlreadyRegistered

  console.log("[DEBUG] ===== TOURNAMENT DETAIL PAGE CONDITIONS =====")
  console.log("[DEBUG] tournament.id:", tournament.id)
  console.log("[DEBUG] tournament.name:", tournament.name)
  console.log("[DEBUG] tournament.status:", JSON.stringify(tournament.status), "type:", typeof tournament.status)
  console.log("[DEBUG] tournament.maxTeams:", tournament.maxTeams)
  console.log("[DEBUG] tournament.teams.length:", teams.length)
  console.log("[DEBUG] tournament.createdByUserId:", tournament.createdByUserId)
  console.log("[DEBUG] tournament.allKeys:", Object.keys(tournament))
  console.log("[DEBUG] user:", user ? { id: user.id, teamId: user.teamId, isTeamCaptain: user.isTeamCaptain } : null)
  console.log("[DEBUG] isAuthenticated:", isAuthenticated)
  console.log("[DEBUG] --- CONDITION BREAKDOWN ---")
  console.log("[DEBUG] isRegistrationOpen:", isRegistrationOpen, "(status NOT IN closedStatuses) →", tournament.status, "not in", closedStatuses)
  console.log("[DEBUG] isFull:", isFull, "(", teams.length, ">=", tournament.maxTeams || 0, ")")
  console.log("[DEBUG] isAlreadyRegistered:", isAlreadyRegistered)
  console.log("[DEBUG] isCreator:", isCreator)
  console.log("[DEBUG] canRegister:", canRegister)
  console.log("[DEBUG] --- BUTTON DECISION ---")
  if (canRegister) console.log("[DEBUG] → SHOULD SHOW: Register Team button")
  else if (isAlreadyRegistered) console.log("[DEBUG] → SHOULD SHOW: Already Registered")
  else if (isFull) console.log("[DEBUG] → SHOULD SHOW: Tournament Full")
  else if (!isRegistrationOpen) console.log("[DEBUG] → SHOULD SHOW: Registration Closed (status is ongoing/completed/cancelled)")
  else console.log("[DEBUG] → SHOULD SHOW: Login to Register (unauthenticated)")
  console.log("[DEBUG] =================================================")

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#0a0a0a] pb-20">
        <TournamentTopBar title="Tournament" showBack />

        <TournamentHero tournament={tournament} />

        {tournament.description && (
          <p className="text-[14px] text-[#888888] leading-[1.65] px-[18px] mt-4">
            {tournament.description}
          </p>
        )}

        <SectionCard title="Tournament Info" icon={<Trophy className="w-5 h-5 text-[#e8352a]" />}>
          <InfoRow
            label="Teams"
            value={`${teams.length} / ${tournament.maxTeams || 0}`}
          />
          <InfoRow
            label="Players per team"
            value={`${tournament.minPlayersPerTeam || 10} – ${tournament.maxPlayersPerTeam || 15}`}
          />
          {tournament.registrationFee !== undefined && tournament.registrationFee > 0 && (
            <InfoRow label="Fee" value={formatCurrency(tournament.registrationFee)} highlight />
          )}
          {tournament.prize !== undefined && tournament.prize > 0 && (
            <InfoRow label="Prize" value={formatCurrency(tournament.prize)} highlight />
          )}
          <InfoRow label="Start date" value={formatDate(tournament.startDate)} />
          {tournament.endDate && (
            <InfoRow label="End date" value={formatDate(tournament.endDate)} />
          )}
        </SectionCard>

        {isRegistrationOpen && (
          <div className="mt-4">
            <CountdownTimer
              targetDate={tournament.startDate}
              label="Time left to register"
            />
          </div>
        )}

        <div className="mt-4 bg-[#1a1a1a] rounded-2xl mx-[14px] overflow-hidden">
          <PlayerRosterSection
            teamNames={teams.map((t) => ({
              teamId: t.teamId,
              teamName: t.teamName,
            }))}
          />
        </div>

        <div className="mt-4 mb-4 px-[14px]">
          {canRegister ? (
            <Button
              onClick={() => router.push(`/tournaments/${tournamentId}/register`)}
              className="w-full bg-[#e8352a] hover:bg-[#e8352a]/90 text-white rounded-[14px] py-3 h-auto text-[15px] font-semibold shadow-[0_4px_20px_rgba(232,53,42,0.25)]"
            >
              Register Team
            </Button>
          ) : isAlreadyRegistered ? (
            <div className="w-full bg-[#2ecc71]/10 border border-[#2ecc71]/20 text-[#2ecc71] rounded-[14px] py-3 text-center text-[15px] font-semibold">
              Already Registered
            </div>
          ) : isFull ? (
            <div className="w-full bg-[#555555]/10 border border-[#555555]/20 text-[#888888] rounded-[14px] py-3 text-center text-[15px] font-semibold">
              Tournament Full
            </div>
          ) : !isRegistrationOpen ? (
            <div className="w-full bg-[#555555]/10 border border-[#555555]/20 text-[#888888] rounded-[14px] py-3 text-center text-[15px] font-semibold">
              Registration Closed
            </div>
          ) : (
            <Button
              onClick={() => router.push("/auth/login")}
              className="w-full bg-[#e8352a] hover:bg-[#e8352a]/90 text-white rounded-[14px] py-3 h-auto text-[15px] font-semibold shadow-[0_4px_20px_rgba(232,53,42,0.25)]"
            >
              Login to Register
            </Button>
          )}
        </div>

        <BottomNav active="tournaments" />
      </div>
    </ErrorBoundary>
  )
}
