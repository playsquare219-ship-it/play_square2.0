"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { Trophy } from "lucide-react"
import BottomNav from "@/components/bottom-nav"
import { TournamentTopBar } from "@/components/tournaments/tournament-top-bar"
import { StepsIndicator } from "@/components/tournaments/steps-indicator"
import { SectionCard } from "@/components/tournaments/section-card"
import { InfoRow } from "@/components/tournaments/info-row"
import { PlayerRosterInput } from "@/components/tournaments/player-roster-input"
import { WarningBanner } from "@/components/tournaments/warning-banner"
import { DualButtonRow } from "@/components/tournaments/dual-button-row"
import { SuccessConfirmation } from "@/components/tournaments/success-confirmation"
import { CountdownTimer } from "@/components/tournaments/countdown-timer"
import { PlayerRosterSection } from "@/components/tournaments/player-roster-section"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { useAuth } from "@/contexts/auth-context"
import { getTournamentById, getTeamById, joinTournament, getUsersByIds } from "@/lib/client/api"
import { formatCurrency } from "@/lib/utils"
import type { Tournament, Team } from "@/types"
import { useRegistrationWizard } from "@/lib/client/hooks/use-registration-wizard"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

const STEPS = ["Team Info", "Players", "Confirm"]

function RegistrationWizardContent({
  tournament,
  team,
  userName,
  playerNames,
}: {
  tournament: Tournament
  team: Team
  userName: string
  playerNames: string[]
}) {
  const router = useRouter()
  const [success, setSuccess] = useState(false)

  const wizard = useRegistrationWizard(
    tournament,
    team.name,
    userName,
    playerNames
  )

  const handleJoin = async () => {
    wizard.setSubmitting(true)
    try {
      await joinTournament(tournament.id, team.id)
      setSuccess(true)
    } catch (err: any) {
      toast.error(err.message || "Failed to join tournament")
    } finally {
      wizard.setSubmitting(false)
    }
  }

  if (success) {
    return (
      <>
        <SuccessConfirmation
          title="Registered Successfully!"
          subtitle={`You are now registered for ${tournament.name}`}
        />

        {tournament.startDate && (
          <div className="mt-4">
            <CountdownTimer
              targetDate={tournament.startDate}
              label="Countdown to Tournament Start"
            />
          </div>
        )}

        <div className="mt-4 bg-[#1a1a1a] rounded-2xl mx-[14px] overflow-hidden">
          <PlayerRosterSection
            teamNames={(tournament.teams || []).map((t) => ({
              teamId: t.teamId,
              teamName: t.teamName,
            }))}
          />
        </div>

        <div className="px-[18px] mt-6 mb-8">
          <Button
            onClick={() => router.push("/tournaments")}
            className="w-full bg-[#e8352a] hover:bg-[#e8352a]/90 text-white rounded-[14px] py-3 h-auto text-[15px] font-semibold shadow-[0_4px_20px_rgba(232,53,42,0.25)]"
          >
            Back to Leagues
          </Button>
        </div>
      </>
    )
  }

  return (
    <>
      <StepsIndicator steps={STEPS} currentStep={wizard.step} />

      {wizard.step === 1 && (
        <div className="px-[18px] mt-4">
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-[13px] text-[#888888] mb-1.5">Team Name</label>
              <input
                type="text"
                value={wizard.teamName}
                readOnly
                aria-label="Team name"
                className="w-full bg-[#1a1a1a] border-[1.5px] border-[#2e2e2e] rounded-xl px-4 py-3 text-[14px] text-right text-white focus:border-[#e8352a] outline-none"
              />
            </div>
            <div>
              <label className="block text-[13px] text-[#888888] mb-1.5">Captain Name</label>
              <input
                type="text"
                value={wizard.captainName}
                readOnly
                aria-label="Captain name"
                className="w-full bg-[#1a1a1a] border-[1.5px] border-[#2e2e2e] rounded-xl px-4 py-3 text-[14px] text-right text-white focus:border-[#e8352a] outline-none"
              />
            </div>
          </div>

          <SectionCard title="Tournament Summary">
            <InfoRow label="Tournament" value={tournament.name} />
            <InfoRow
              label="Min / Max Players"
              value={`${wizard.minPlayers} / ${wizard.maxPlayers}`}
            />
            {tournament.registrationFee !== undefined && tournament.registrationFee > 0 && (
              <InfoRow label="Fee" value={formatCurrency(tournament.registrationFee)} highlight />
            )}
          </SectionCard>

          <DualButtonRow
            primaryLabel="Next"
            secondaryLabel="Cancel"
            onPrimary={wizard.nextStep}
            onSecondary={() => router.back()}
            primaryDisabled={!wizard.canProceedStep1}
          />
        </div>
      )}

      {wizard.step === 2 && (
        <div className="mt-4">
          <div className="px-[18px] mb-3">
            <h3 className="text-[16px] font-semibold text-white">Team Players</h3>
            <p className="text-[13px] text-[#888888]">
              {wizard.filledCount} of {wizard.maxPlayers} — Minimum {wizard.minPlayers}
            </p>
          </div>

          <div className="px-4 mb-3">
            <div className="h-1 bg-[#2e2e2e] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#e8352a] transition-all duration-300"
                style={{
                  width: `${(wizard.filledCount / wizard.maxPlayers) * 100}%`,
                }}
                role="progressbar"
                aria-valuenow={wizard.filledCount}
                aria-valuemin={0}
                aria-valuemax={wizard.maxPlayers}
                aria-label={`Player progress: ${wizard.filledCount} of ${wizard.maxPlayers}`}
              />
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {Array.from({ length: wizard.maxPlayers }).map((_, i) => (
              <PlayerRosterInput
                key={i}
                index={i}
                value={wizard.players[i] || ""}
                onChange={(val) => wizard.setPlayer(i, val)}
                readOnly={false}
              />
            ))}
          </div>

          {wizard.filledCount < wizard.minPlayers && (
            <WarningBanner
              message={`You need at least ${wizard.minPlayers - wizard.filledCount} more players to register`}
            />
          )}

          <DualButtonRow
            primaryLabel="Confirm Registration"
            secondaryLabel="Back"
            onPrimary={wizard.nextStep}
            onSecondary={wizard.prevStep}
            primaryDisabled={!wizard.canSubmit}
            primaryLoading={wizard.isSubmitting}
          />
        </div>
      )}

      {wizard.step === 3 && (
        <div className="px-[18px] mt-4">
          <SectionCard title="Registration Summary">
            <InfoRow label="Tournament" value={tournament.name} />
            <InfoRow label="Team" value={wizard.teamName} />
            <InfoRow label="Captain" value={wizard.captainName} />
            <InfoRow label="Players" value={`${wizard.filledCount} / ${wizard.maxPlayers}`} />
            {tournament.registrationFee !== undefined && tournament.registrationFee > 0 && (
              <InfoRow label="Fee" value={formatCurrency(tournament.registrationFee)} highlight />
            )}
          </SectionCard>

          <div className="mt-6 bg-[#1a1a1a] rounded-2xl p-4">
            <h4 className="text-[14px] font-medium text-white mb-2">Player List</h4>
            <div className="space-y-1">
              {wizard.players
                .filter((p): p is string => typeof p === "string" && p.trim().length > 0)
                .map((player, i) => (
                  <div key={i} className="flex items-center gap-2 text-[13px] text-[#888888]">
                    <span className="w-5 h-5 rounded-full bg-[#e8352a] flex items-center justify-center text-[11px] text-white font-bold">
                      {i + 1}
                    </span>
                    {player}
                  </div>
                ))}
            </div>
          </div>

          <DualButtonRow
            primaryLabel="Submit Registration"
            secondaryLabel="Back"
            onPrimary={handleJoin}
            onSecondary={wizard.prevStep}
            primaryLoading={wizard.isSubmitting}
          />
        </div>
      )}
    </>
  )
}

export default function RegistrationWizardPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const tournamentId = params?.id as string

  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [team, setTeam] = useState<Team | null>(null)
  const [playerNames, setPlayerNames] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!tournamentId || !user?.teamId) {
      router.push("/tournaments")
      return
    }

    let cancelled = false
    const controller = new AbortController()

    const load = async () => {
      try {
        const [t, tm] = await Promise.all([
          getTournamentById(tournamentId),
          getTeamById(user.teamId!),
        ])
        if (!cancelled) {
          setTournament(t)
          setTeam(tm)
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

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [tournamentId, user?.teamId, router])

  useEffect(() => {
    if (!team?.players || team.players.length === 0) {
      setPlayerNames([])
      return
    }
    let cancelled = false
    const resolve = async () => {
      try {
        const users = await getUsersByIds(team.players)
        if (!cancelled) {
          const names = users.map((u: any) =>
            [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email || "Player"
          )
          setPlayerNames(names)
        }
      } catch {
        if (!cancelled) setPlayerNames(team.players.map(() => "Player"))
      }
    }
    resolve()
    return () => { cancelled = true }
  }, [team])

  const userName = user ? `${user.firstName} ${user.lastName}` : ""

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] pb-20">
        <TournamentTopBar title="Registration" showBack />
        <div className="animate-pulse px-[18px] pt-6 space-y-4" aria-label="Loading registration">
          <div className="flex justify-center gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-[38px] h-[38px] bg-[#222222] rounded-full" />
            ))}
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-[#222222] rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !tournament || !team) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] pb-20">
        <TournamentTopBar title="Registration" showBack />
        <div className="flex flex-col items-center justify-center min-h-[400px] px-4" role="alert">
          <Trophy className="w-12 h-12 text-[#888888] mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Unable to register</h3>
          <p className="text-[#888888] text-sm text-center">
            {!team ? "You need a team to register for tournaments" : "Tournament not found"}
          </p>
        </div>
        <BottomNav active="tournaments" />
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#0a0a0a] pb-20">
        <TournamentTopBar title="Register Team" showBack />
        <RegistrationWizardContent
          tournament={tournament}
          team={team}
          userName={userName}
          playerNames={playerNames}
        />
        <BottomNav active="tournaments" />
      </div>
    </ErrorBoundary>
  )
}
