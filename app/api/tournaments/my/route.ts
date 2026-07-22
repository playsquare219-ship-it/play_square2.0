import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifySessionJwt } from "@/lib/server/auth/jwt"
import { findUserById } from "@/lib/server/db/users"
import {
  getTournamentsByTeamIdFromDb,
  getTournamentsByCreatorFromDb,
} from "@/lib/server/db/tournaments"

export async function GET() {
  try {
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

    const user = await findUserById(decoded.userId)
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      )
    }

    const teamTournaments = user.teamId
      ? await getTournamentsByTeamIdFromDb(user.teamId)
      : []

    const createdTournaments = await getTournamentsByCreatorFromDb(user.id)

    const allIds = new Set<string>()
    const tournaments = [
      ...teamTournaments,
      ...createdTournaments,
    ].filter((t) => {
      if (allIds.has(t.id)) return false
      allIds.add(t.id)
      return true
    })

    return NextResponse.json({ success: true, tournaments })
  } catch (error) {
    console.error("Error in GET /api/tournaments/my:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch my tournaments" },
      { status: 500 }
    )
  }
}
