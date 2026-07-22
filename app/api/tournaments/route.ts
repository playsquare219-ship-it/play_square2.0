import { NextRequest, NextResponse } from "next/server"
import {
  getAllTournamentsFromDb,
  getTournamentByIdFromDb,
} from "@/lib/server/db/tournaments"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const status = searchParams.get("status")

    if (id) {
      const tournament = await getTournamentByIdFromDb(id)
      if (!tournament) {
        return NextResponse.json(
          { success: false, error: "Tournament not found" },
          { status: 404 }
        )
      }
      return NextResponse.json({ success: true, tournament })
    }

    const tournaments = await getAllTournamentsFromDb(status ?? undefined)
    return NextResponse.json({ success: true, tournaments })
  } catch (error) {
    console.error("Error in GET /api/tournaments:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch tournaments" },
      { status: 500 }
    )
  }
}
