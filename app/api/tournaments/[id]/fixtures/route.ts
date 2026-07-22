import { NextRequest, NextResponse } from "next/server"
import { getTournamentByIdFromDb } from "@/lib/server/db/tournaments"
import { getFixturesByTournamentIdFromDb } from "@/lib/server/db/tournament-fixtures"

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

    const fixtures = await getFixturesByTournamentIdFromDb(id)
    return NextResponse.json({ success: true, fixtures })
  } catch (error) {
    console.error("Error in GET /api/tournaments/[id]/fixtures:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch fixtures" },
      { status: 500 }
    )
  }
}
