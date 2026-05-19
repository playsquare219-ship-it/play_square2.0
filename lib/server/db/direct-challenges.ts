import { db } from "@/lib/server/firebase/firestore"
import type { DirectChallenge } from "@/types"

// ============================================
// Constants
// ============================================

const DIRECT_CHALLENGES_COLLECTION = "direct_challenges"

// ============================================
// 🔍 Read Operations
// ============================================

/**
 * الحصول على جميع التحديات المباشرة
 */
export async function getAllDirectChallenges(): Promise<DirectChallenge[]> {
  try {
    const querySnapshot = await db
      .collection(DIRECT_CHALLENGES_COLLECTION)
      .orderBy("createdAt", "desc")
      .get()
    
    const challenges: DirectChallenge[] = []
    querySnapshot.forEach((doc) => {
      challenges.push({ id: doc.id, ...doc.data() } as DirectChallenge)
    })
    
    return challenges
  } catch (error) {
    console.error("Error getting all direct challenges:", error)
    return []
  }
}

/**
 * الحصول على التحديات المباشرة المعلقة لفريق معين
 */
export async function getPendingDirectChallengesForTeam(teamId: string): Promise<DirectChallenge[]> {
  try {
    const querySnapshot = await db
      .collection(DIRECT_CHALLENGES_COLLECTION)
      .where("toTeamId", "==", teamId)
      .where("status", "==", "pending")
      .orderBy("createdAt", "desc")
      .get()
    
    const challenges: DirectChallenge[] = []
    querySnapshot.forEach((doc) => {
      challenges.push({ id: doc.id, ...doc.data() } as DirectChallenge)
    })
    
    return challenges
  } catch (error) {
    console.error("Error getting pending challenges for team:", error)
    return []
  }
}

/**
 * الحصول على التحديات المباشرة المرسلة من فريق معين
 */
export async function getSentDirectChallengesFromTeam(teamId: string): Promise<DirectChallenge[]> {
  try {
    const querySnapshot = await db
      .collection(DIRECT_CHALLENGES_COLLECTION)
      .where("fromTeamId", "==", teamId)
      .orderBy("createdAt", "desc")
      .get()
    
    const challenges: DirectChallenge[] = []
    querySnapshot.forEach((doc) => {
      challenges.push({ id: doc.id, ...doc.data() } as DirectChallenge)
    })
    
    return challenges
  } catch (error) {
    console.error("Error getting sent challenges from team:", error)
    return []
  }
}

// ============================================
// ✏️ Write Operations
// ============================================

/**
 * إنشاء تحدي مباشر جديد
 */
export async function createDirectChallenge(challenge: Omit<DirectChallenge, "id">): Promise<DirectChallenge> {
  try {
    const challengeId = `challenge_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    const challengeRef = db.collection(DIRECT_CHALLENGES_COLLECTION).doc(challengeId)
    
    await challengeRef.set(challenge)
    
    console.log('[Database] Created direct challenge:', challengeId)
    return { id: challengeId, ...challenge }
  } catch (error) {
    console.error("Error creating direct challenge:", error)
    throw new Error("Failed to create direct challenge")
  }
}

/**
 * تحديث حالة التحدي (قبول/رفض/إلغاء)
 */
export async function updateDirectChallengeStatus(
  challengeId: string,
  status: 'accepted' | 'rejected' | 'cancelled'
): Promise<void> {
  try {
    const challengeRef = db.collection(DIRECT_CHALLENGES_COLLECTION).doc(challengeId)
    await challengeRef.update({
      status,
      updatedAt: new Date().toISOString(),
    })
    
    console.log('[Database] Updated direct challenge status:', challengeId, status)
  } catch (error) {
    console.error("Error updating direct challenge status:", error)
    throw new Error("Failed to update challenge status")
  }
}

/**
 * حذف تحدي مباشر
 */
export async function deleteDirectChallenge(challengeId: string): Promise<void> {
  try {
    const challengeRef = db.collection(DIRECT_CHALLENGES_COLLECTION).doc(challengeId)
    await challengeRef.delete()
    
    console.log('[Database] Deleted direct challenge:', challengeId)
  } catch (error) {
    console.error("Error deleting direct challenge:", error)
    throw new Error("Failed to delete direct challenge")
  }
}
