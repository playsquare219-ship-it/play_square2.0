import { db } from "@/lib/server/firebase/firestore"
import { Timestamp } from "firebase-admin/firestore"
import type { Team, TeamCreateInput } from "@/types"

// ============================================
// Constants
// ============================================

const TEAMS_COLLECTION = "teams"

// ============================================
// 🔍 Read Operations
// ============================================

/**
 * البحث عن فريق بواسطة ID
 */
export async function getTeamByIdFromDb(teamId: string): Promise<Team | null> {
  try {
    const teamRef = db.collection(TEAMS_COLLECTION).doc(teamId)
    const teamDoc = await teamRef.get()
    
    if (!teamDoc.exists) {
      return null
    }
    
    return { id: teamDoc.id, ...teamDoc.data() } as Team
  } catch (error) {
    console.error("Error getting team by ID:", error)
    throw new Error("Failed to get team")
  }
}

/**
 * الحصول على جميع الفريقات
 */
export async function getAllTeamsFromDb(): Promise<Team[]> {
  try {
    const querySnapshot = await db.collection(TEAMS_COLLECTION).get()
    
    const teams: Team[] = []
    querySnapshot.forEach((doc) => {
      teams.push({ id: doc.id, ...doc.data() } as Team)
    })
    
    return teams
  } catch (error) {
    console.error("Error getting all teams:", error)
    throw new Error("Failed to get teams")
  }
}

/**
 * البحث عن فريق حسب الاسم أو الموقع
 */
export function searchTeams(query: string, excludeTeamId?: string): Team[] {
  // Note: This is a synchronous function that only searches in-memory
  // For a real search, you should use Firestore queries
  // This is a placeholder implementation
  console.warn("searchTeams is a synchronous placeholder. Consider implementing Firestore search.")
  return []
}

/**
 * البحث عن الفريقات حسب معرّف المستخدم (قائد الفريق)
 */
export async function getTeamsByCaptainId(captainId: string): Promise<Team[]> {
  try {
    const querySnapshot = await db
      .collection(TEAMS_COLLECTION)
      .where("captainId", "==", captainId)
      .get()
    
    const teams: Team[] = []
    querySnapshot.forEach((doc) => {
      teams.push({ id: doc.id, ...doc.data() } as Team)
    })
    
    return teams
  } catch (error) {
    console.error("Error getting teams by captain ID:", error)
    throw new Error("Failed to get teams")
  }
}

/**
 * البحث عن الفريقات حسب معرّف اللاعب
 */
export async function getTeamsByPlayerId(playerId: string): Promise<Team[]> {
  try {
    const querySnapshot = await db
      .collection(TEAMS_COLLECTION)
      .where("players", "array-contains", playerId)
      .get()
    
    const teams: Team[] = []
    querySnapshot.forEach((doc) => {
      teams.push({ id: doc.id, ...doc.data() } as Team)
    })
    
    return teams
  } catch (error) {
    console.error("Error getting teams by player ID:", error)
    throw new Error("Failed to get teams")
  }
}

// ============================================
// ✏️ Write Operations
// ============================================

/**
 * إنشاء فريق جديد
 */
export async function createTeam(input: TeamCreateInput): Promise<Team> {
  try {
    const now = new Date().toISOString()
    const teamId = `team_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    
    const newTeam: Omit<Team, "id"> = {
      name: input.name,
      captainId: input.captainId,
      players: [input.captainId], // إضافة قائد الفريق كلاعب
      wilaya: input.wilaya,
      baladia: input.baladia,
      division: "Division 1", // Default division
      rating: 1000, // Default rating (ELO-style starting point)
      wins: 0,
      draws: 0,
      losses: 0,
      createdAt: now,
      updatedAt: now,
    }
    
    const teamRef = db.collection(TEAMS_COLLECTION).doc(teamId)
    await teamRef.set(newTeam)
    
    console.log('[Database] Created team:', teamId)
    return { id: teamId, ...newTeam }
  } catch (error) {
    console.error("Error creating team:", error)
    throw new Error("Failed to create team")
  }
}

/**
 * تحديث أو إدراج فريق (Upsert)
 */
export async function upsertTeam(team: Team): Promise<Team> {
  // For now, this is synchronous and returns the team as-is
  // In a real implementation, you would call Firestore
  console.log('[Database] Upserting team:', team.id)
  return team
}

/**
 * تحديث بيانات الفريق
 */
export async function updateTeam(teamId: string, updates: Partial<Omit<Team, "id" | "createdAt">>): Promise<void> {
  try {
    const teamRef = db.collection(TEAMS_COLLECTION).doc(teamId)
    await teamRef.update({
      ...updates,
      updatedAt: new Date().toISOString(),
    })
    
    console.log('[Database] Updated team:', teamId)
  } catch (error) {
    console.error("Error updating team:", error)
    throw new Error("Failed to update team")
  }
}

/**
 * إضافة لاعب إلى الفريق
 */
export async function addPlayerToTeam(teamId: string, playerId: string): Promise<void> {
  try {
    const teamRef = db.collection(TEAMS_COLLECTION).doc(teamId)
    const { FieldValue } = require("firebase-admin/firestore")
    await teamRef.update({
      players: FieldValue.arrayUnion(playerId),
      updatedAt: new Date().toISOString(),
    })
    
    console.log('[Database] Added player to team:', teamId, playerId)
  } catch (error) {
    console.error("Error adding player to team:", error)
    throw new Error("Failed to add player")
  }
}

/**
 * إزالة لاعب من الفريق
 */
export async function removePlayerFromTeam(teamId: string, playerId: string): Promise<void> {
  try {
    const teamRef = db.collection(TEAMS_COLLECTION).doc(teamId)
    const { FieldValue } = require("firebase-admin/firestore")
    await teamRef.update({
      players: FieldValue.arrayRemove(playerId),
      updatedAt: new Date().toISOString(),
    })
    
    console.log('[Database] Removed player from team:', teamId, playerId)
  } catch (error) {
    console.error("Error removing player from team:", error)
    throw new Error("Failed to remove player")
  }
}

/**
 * حذف فريق
 */
export async function deleteTeam(teamId: string): Promise<void> {
  try {
    const teamRef = db.collection(TEAMS_COLLECTION).doc(teamId)
    await teamRef.delete()
    
    console.log('[Database] Deleted team:', teamId)
  } catch (error) {
    console.error("Error deleting team:", error)
    throw new Error("Failed to delete team")
  }
}
