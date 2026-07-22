import { db } from "@/lib/server/firebase/firestore"
import type { TournamentFixture } from "@/types"

// ============================================
// Constants
// ============================================

const FIXTURES_COLLECTION = "tournament_fixtures"

// ============================================
// Read Operations
// ============================================

/**
 * Get all fixtures for a tournament
 */
export async function getFixturesByTournamentIdFromDb(
  tournamentId: string
): Promise<TournamentFixture[]> {
  try {
    const querySnapshot = await db
      .collection(FIXTURES_COLLECTION)
      .where("tournamentId", "==", tournamentId)
      .orderBy("round", "asc")
      .orderBy("matchIndex", "asc")
      .get()

    const fixtures: TournamentFixture[] = []
    querySnapshot.forEach((doc: any) => {
      fixtures.push({ id: doc.id, ...doc.data() } as TournamentFixture)
    })

    return fixtures
  } catch (error) {
    console.error("Error getting fixtures by tournament ID:", error)
    throw new Error("Failed to get fixtures")
  }
}
