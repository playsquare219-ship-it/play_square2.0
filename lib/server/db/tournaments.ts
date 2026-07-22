import { db } from "@/lib/server/firebase/firestore"
import { FieldValue } from "firebase-admin/firestore"
import type { Tournament, TournamentTeam } from "@/types"

// ============================================
// Constants
// ============================================

const TOURNAMENTS_COLLECTION = "tournaments"

// ============================================
// Read Operations
// ============================================

/**
 * Get all tournaments, optionally filtered by status
 */
export async function getAllTournamentsFromDb(status?: string): Promise<Tournament[]> {
  try {
    let query: any = db.collection(TOURNAMENTS_COLLECTION)

    if (status && status !== "all") {
      query = query.where("status", "==", status)
    }

    const querySnapshot = await query.orderBy("createdAt", "desc").get()

    const tournaments: Tournament[] = []
    querySnapshot.forEach((doc: any) => {
      const data = doc.data()
      tournaments.push({
        id: doc.id,
        ...data,
        teams: data.teams || [],
        groups: data.groups || [],
        rounds: data.rounds || [],
      } as Tournament)
    })

    return tournaments
  } catch (error) {
    console.error("Error getting all tournaments:", error)
    throw new Error("Failed to get tournaments")
  }
}

/**
 * Get a single tournament by ID
 */
export async function getTournamentByIdFromDb(tournamentId: string): Promise<Tournament | null> {
  try {
    const docRef = db.collection(TOURNAMENTS_COLLECTION).doc(tournamentId)
    const doc = await docRef.get()

    if (!doc.exists) {
      return null
    }

    const raw = doc.data()
    console.log("[DEBUG] getTournamentByIdFromDb raw Firestore document:", JSON.stringify(raw, null, 2))
    console.log("[DEBUG] raw.status:", raw?.status, "type:", typeof raw?.status)
    console.log("[DEBUG] raw.maxTeams:", raw?.maxTeams)
    console.log("[DEBUG] raw.teams:", Array.isArray(raw?.teams) ? raw.teams.length : "NOT_ARRAY")
    console.log("[DEBUG] raw keys:", raw ? Object.keys(raw) : "null")
    return { id: doc.id, ...raw, teams: raw?.teams || [], groups: raw?.groups || [], rounds: raw?.rounds || [] } as Tournament
  } catch (error) {
    console.error("Error getting tournament by ID:", error)
    throw new Error("Failed to get tournament")
  }
}

/**
 * Get tournaments where the user's team is registered (via teams[] embedded array)
 * Note: Firestore array-contains does partial object matching, so we fetch all
 * and filter client-side to ensure correctness.
 */
export async function getTournamentsByTeamIdFromDb(teamId: string): Promise<Tournament[]> {
  try {
    const querySnapshot = await db
      .collection(TOURNAMENTS_COLLECTION)
      .orderBy("createdAt", "desc")
      .get()

    const tournaments: Tournament[] = []
    querySnapshot.forEach((doc: any) => {
      const data = doc.data() as any
      if (Array.isArray(data.teams) && data.teams.some((t: any) => t.teamId === teamId)) {
        tournaments.push({
          id: doc.id,
          ...data,
          teams: data.teams || [],
          groups: data.groups || [],
          rounds: data.rounds || [],
        } as Tournament)
      }
    })

    return tournaments
  } catch (error) {
    console.error("Error getting tournaments by team ID:", error)
    throw new Error("Failed to get tournaments")
  }
}

/**
 * Get tournaments created by a specific user
 */
export async function getTournamentsByCreatorFromDb(userId: string): Promise<Tournament[]> {
  try {
    const querySnapshot = await db
      .collection(TOURNAMENTS_COLLECTION)
      .where("createdByUserId", "==", userId)
      .orderBy("createdAt", "desc")
      .get()

    const tournaments: Tournament[] = []
    querySnapshot.forEach((doc: any) => {
      const data = doc.data()
      tournaments.push({
        id: doc.id,
        ...data,
        teams: data.teams || [],
        groups: data.groups || [],
        rounds: data.rounds || [],
      } as Tournament)
    })

    return tournaments
  } catch (error) {
    console.error("Error getting tournaments by creator:", error)
    throw new Error("Failed to get tournaments")
  }
}

// ============================================
// Write Operations
// ============================================

/**
 * Join a tournament (add team to teams[] via arrayUnion)
 * Uses a transaction to prevent TOCTOU race conditions on capacity
 */
export async function joinTournamentInDb(
  tournamentId: string,
  team: TournamentTeam
): Promise<void> {
  try {
    const docRef = db.collection(TOURNAMENTS_COLLECTION).doc(tournamentId)

    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(docRef)
      if (!doc.exists) {
        throw new Error("Tournament not found")
      }

      const data = doc.data() as any
      const teams = data.teams || []

      if (teams.some((t: any) => t.teamId === team.teamId)) {
        throw new Error("Team is already registered")
      }

      if (teams.length >= (data.maxTeams || 0)) {
        throw new Error("Tournament is full")
      }

      transaction.update(docRef, {
        teams: FieldValue.arrayUnion(team),
        updatedAt: new Date().toISOString(),
      })
    })

    console.log("[Database] Team joined tournament:", tournamentId, team.teamId)
  } catch (error) {
    console.error("Error joining tournament:", error)
    throw new Error("Failed to join tournament")
  }
}

/**
 * Leave a tournament (remove team from teams[] via arrayRemove)
 * Uses a transaction to prevent TOCTOU race conditions
 */
export async function leaveTournamentInDb(
  tournamentId: string,
  teamId: string
): Promise<void> {
  try {
    const docRef = db.collection(TOURNAMENTS_COLLECTION).doc(tournamentId)

    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(docRef)
      if (!doc.exists) {
        throw new Error("Tournament not found")
      }

      const data = doc.data() as any
      const teams = data.teams || []
      const teamToRemove = teams.find((t: any) => t.teamId === teamId)
      if (!teamToRemove) {
        throw new Error("Team not registered in this tournament")
      }

      transaction.update(docRef, {
        teams: FieldValue.arrayRemove(teamToRemove),
        updatedAt: new Date().toISOString(),
      })
    })

    console.log("[Database] Team left tournament:", tournamentId, teamId)
  } catch (error) {
    console.error("Error leaving tournament:", error)
    throw new Error("Failed to leave tournament")
  }
}
