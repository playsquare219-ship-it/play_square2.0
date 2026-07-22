import { NextRequest, NextResponse } from "next/server"
import { getTournamentByIdFromDb } from "@/lib/server/db/tournaments"
import { getMatchesByTournamentIdFromDb } from "@/lib/server/db/matches"

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

    const matches = await getMatchesByTournamentIdFromDb(id)
    return NextResponse.json({ success: true, matches })
  } catch (error) {
    console.error("Error in GET /api/tournaments/[id]/matches:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch tournament matches" },
      { status: 500 }
    )
  }
}
