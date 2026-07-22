import { NextRequest, NextResponse } from "next/server"
import { getTournamentByIdFromDb } from "@/lib/server/db/tournaments"
import type { TournamentStanding } from "@/types"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tournament = await getTournamentByIdFromDb(id)

    if (!tournament) {
      return NextResponse.json(
        { success: false, error: "Tournament not found" },
        { status: 404 }
      )
    }

    const standings: TournamentStanding[] = (tournament.teams || []).map((team) => ({
      teamId: team.teamId,
      teamName: team.teamName,
      played: team.wins + team.draws + team.losses,
      wins: team.wins,
      draws: team.draws,
      losses: team.losses,
      goalsFor: team.goalsFor,
      goalsAgainst: team.goalsAgainst,
      goalDifference: team.goalsFor - team.goalsAgainst,
      points: team.points,
    }))

    standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
      return b.goalsFor - a.goalsFor
    })

    return NextResponse.json({ success: true, standings })
  } catch (error) {
    console.error("Error in GET /api/tournaments/[id]/standings:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch standings" },
      { status: 500 }
    )
  }
}
