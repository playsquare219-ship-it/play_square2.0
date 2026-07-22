import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifySessionJwt } from "@/lib/server/auth/jwt"
import { findUserById } from "@/lib/server/db/users"
import { getTeamByIdFromDb } from "@/lib/server/db/teams"
import {
  getTournamentByIdFromDb,
  joinTournamentInDb,
} from "@/lib/server/db/tournaments"
import type { TournamentTeam } from "@/types"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params

    const cookieStore = await cookies()
    const token = cookieStore.get("playSquareToken")?.value
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    const decoded = verifySessionJwt(token)
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: "Invalid session" },
        { status: 401 }
      )
    }

    const body = (await request.json()) as { teamId?: string }
    if (!body.teamId) {
      return NextResponse.json(
        { success: false, error: "teamId is required" },
        { status: 400 }
      )
    }

    const user = await findUserById(decoded.userId)
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      )
    }

    if (!user.isTeamCaptain) {
      return NextResponse.json(
        { success: false, error: "Only team captains can register for tournaments" },
        { status: 403 }
      )
    }

    if (user.teamId !== body.teamId) {
      return NextResponse.json(
        { success: false, error: "You can only register your own team" },
        { status: 403 }
      )
    }

    const team = await getTeamByIdFromDb(body.teamId)
    if (!team) {
      return NextResponse.json(
        { success: false, error: "Team not found" },
        { status: 404 }
      )
    }

    const tournament = await getTournamentByIdFromDb(tournamentId)
    if (!tournament) {
      return NextResponse.json(
        { success: false, error: "Tournament not found" },
        { status: 404 }
      )
    }

    const closedStatuses = ["ongoing", "completed", "cancelled"]
    if (closedStatuses.includes(tournament.status)) {
      return NextResponse.json(
        { success: false, error: "Tournament registration is not open" },
        { status: 400 }
      )
    }

    const tournamentTeams = tournament.teams || []

    if (tournamentTeams.length >= (tournament.maxTeams || 0)) {
      return NextResponse.json(
        { success: false, error: "Tournament is full" },
        { status: 400 }
      )
    }

    const alreadyRegistered = tournamentTeams.some(
      (t) => t.teamId === body.teamId
    )
    if (alreadyRegistered) {
      return NextResponse.json(
        { success: false, error: "Team is already registered" },
        { status: 400 }
      )
    }

    const tournamentTeam: TournamentTeam = {
      teamId: team.id,
      teamName: team.name,
      captainId: team.captainId,
      points: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      joinedAt: new Date().toISOString(),
    }

    await joinTournamentInDb(tournamentId, tournamentTeam)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in POST /api/tournaments/[id]/join:", error)
    return NextResponse.json(
      { success: false, error: "Failed to join tournament" },
      { status: 500 }
    )
  }
}
