import { NextRequest, NextResponse } from "next/server"
import { getTournamentByIdFromDb } from "@/lib/server/db/tournaments"

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

    console.log("[DEBUG] API /api/tournaments/[id] response tournament:", JSON.stringify({
      id: tournament.id,
      status: tournament.status,
      statusType: typeof tournament.status,
      maxTeams: tournament.maxTeams,
      teamsCount: tournament.teams?.length,
      createdByUserId: tournament.createdByUserId,
      name: tournament.name,
      startDate: tournament.startDate,
      allKeys: Object.keys(tournament),
    }, null, 2))

    return NextResponse.json({ success: true, tournament })
  } catch (error) {
    console.error("Error in GET /api/tournaments/[id]:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch tournament" },
      { status: 500 }
    )
  }
}
