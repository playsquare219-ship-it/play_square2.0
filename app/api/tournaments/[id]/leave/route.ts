import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifySessionJwt } from "@/lib/server/auth/jwt"
import { findUserById } from "@/lib/server/db/users"
import {
  getTournamentByIdFromDb,
  leaveTournamentInDb,
} from "@/lib/server/db/tournaments"

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
        { success: false, error: "Only team captains can leave tournaments" },
        { status: 403 }
      )
    }

    if (user.teamId !== body.teamId) {
      return NextResponse.json(
        { success: false, error: "You can only leave with your own team" },
        { status: 403 }
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
        { success: false, error: "Cannot leave tournament after it has started" },
        { status: 400 }
      )
    }

    const isRegistered = (tournament.teams || []).some(
      (t) => t.teamId === body.teamId
    )
    if (!isRegistered) {
      return NextResponse.json(
        { success: false, error: "Team is not registered in this tournament" },
        { status: 400 }
      )
    }

    await leaveTournamentInDb(tournamentId, body.teamId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in POST /api/tournaments/[id]/leave:", error)
    return NextResponse.json(
      { success: false, error: "Failed to leave tournament" },
      { status: 500 }
    )
  }
}
