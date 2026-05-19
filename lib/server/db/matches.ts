import { db } from "@/lib/server/firebase/firestore"
import { createNotification } from "@/lib/server/db/notifications"
import type { Match, Team } from "@/types"

// ============================================
// Constants
// ============================================

const MATCHES_COLLECTION = "matches"

// ============================================
// 🔍 Read Operations
// ============================================

/**
 * الحصول على جميع المباريات
 */
export async function getAllMatchesFromDb(): Promise<Match[]> {
  try {
    const querySnapshot = await db
      .collection(MATCHES_COLLECTION)
      .orderBy("dateTime", "desc")
      .get()
    
    const matches: Match[] = []
    querySnapshot.forEach((doc) => {
      matches.push({ id: doc.id, ...doc.data() } as Match)
    })
    
    return matches
  } catch (error) {
    console.error("Error getting all matches:", error)
    throw new Error("Failed to get matches")
  }
}

/**
 * الحصول على مبارة حسب ID
 */
export async function getMatchById(matchId: string): Promise<Match | null> {
  try {
    const matchRef = db.collection(MATCHES_COLLECTION).doc(matchId)
    const matchDoc = await matchRef.get()
    
    if (!matchDoc.exists) {
      return null
    }
    
    return { id: matchDoc.id, ...matchDoc.data() } as Match
  } catch (error) {
    console.error("Error getting match by ID:", error)
    throw new Error("Failed to get match")
  }
}

/**
 * الحصول على المباريات الخاصة بفريق معين
 */
export async function getMatchesByTeamId(teamId: string): Promise<Match[]> {
  try {
    const querySnapshot = await db
      .collection(MATCHES_COLLECTION)
      .where("team1Id", "==", teamId)
      .get()
    
    const querySnapshot2 = await db
      .collection(MATCHES_COLLECTION)
      .where("team2Id", "==", teamId)
      .get()
    
    const matches: Match[] = []
    
    querySnapshot.forEach((doc) => {
      matches.push({ id: doc.id, ...doc.data() } as Match)
    })
    
    querySnapshot2.forEach((doc) => {
      matches.push({ id: doc.id, ...doc.data() } as Match)
    })
    
    // إزالة التكراري وترتيب حسب التاريخ
    const uniqueMatches = Array.from(new Map(matches.map(m => [m.id, m])).values())
    return uniqueMatches.sort((a, b) => 
      new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
    )
  } catch (error) {
    console.error("Error getting matches by team ID:", error)
    throw new Error("Failed to get matches")
  }
}

/**
 * الحصول على المباريات الخاصة بمستخدم معين (كقائد فريق)
 */
export async function getMatchesByCreatedByUserId(userId: string): Promise<Match[]> {
  try {
    const querySnapshot = await db
      .collection(MATCHES_COLLECTION)
      .where("createdByUserId", "==", userId)
      .orderBy("dateTime", "desc")
      .get()
    
    const matches: Match[] = []
    querySnapshot.forEach((doc) => {
      matches.push({ id: doc.id, ...doc.data() } as Match)
    })
    
    return matches
  } catch (error) {
    console.error("Error getting matches by created by user ID:", error)
    throw new Error("Failed to get matches")
  }
}

/**
 * الحصول على المباريات القادمة (بحالة scheduled)
 */
export async function getUpcomingMatches(): Promise<Match[]> {
  try {
    const now = new Date().toISOString()
    const querySnapshot = await db
      .collection(MATCHES_COLLECTION)
      .where("status", "==", "scheduled")
      .where("dateTime", ">=", now)
      .orderBy("dateTime", "asc")
      .get()
    
    const matches: Match[] = []
    querySnapshot.forEach((doc) => {
      matches.push({ id: doc.id, ...doc.data() } as Match)
    })
    
    return matches
  } catch (error) {
    console.error("Error getting upcoming matches:", error)
    throw new Error("Failed to get matches")
  }
}

// ============================================
// ✏️ Write Operations
// ============================================

/**
 * إنشاء مبارة جديدة
 */
export async function createMatch(input: {
  team1: Team
  team2: Team
  stadium?: string
  wilaya?: string
  baladia?: string
  date: string
  createdByUserId: string
}): Promise<Match> {
  try {
    const now = new Date().toISOString()
    const matchId = `match_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    
    const newMatch: Omit<Match, "id"> = {
      team1Id: input.team1.id,
      team2Id: input.team2.id,
      team1: input.team1,
      team2: input.team2,
      stadium: input.stadium,
      wilaya: input.wilaya,
      baladia: input.baladia,
      dateTime: input.date,
      status: "scheduled",
      createdByUserId: input.createdByUserId,
      createdAt: now,
      updatedAt: now,
    }
    
    const matchRef = db.collection(MATCHES_COLLECTION).doc(matchId)
    await matchRef.set(newMatch)
    
    // إنشاء إشعار
    try {
      await createNotification({
        userId: input.createdByUserId,
        title: "تم إنشاء المباراة بنجاح",
        message: `تم إنشاء مباراة بين ${input.team1.name} و ${input.team2.name} في ${input.stadium || 'ملعب غير محدد'}`,
        type: "match_created",
      })
      console.log('[Database] Notification created for match:', matchId)
    } catch (notificationError) {
      console.error('[Database] Failed to create notification for match:', matchId, notificationError)
      // لا نتوقف عن إنشاء المباراة إذا فشل الإشعار
    }
    
    console.log('[Database] Created match:', matchId)
    return { id: matchId, ...newMatch }
  } catch (error) {
    console.error("Error creating match:", error)
    throw new Error("Failed to create match")
  }
}

/**
 * تحديث بيانات المبارة
 */
export async function updateMatch(matchId: string, updates: Partial<Omit<Match, "id" | "createdAt">>): Promise<void> {
  try {
    const matchRef = db.collection(MATCHES_COLLECTION).doc(matchId)
    await matchRef.update({
      ...updates,
      updatedAt: new Date().toISOString(),
    })
    
    console.log('[Database] Updated match:', matchId)
  } catch (error) {
    console.error("Error updating match:", error)
    throw new Error("Failed to update match")
  }
}

/**
 * تسجيل نتيجة المبارة
 */
export async function recordMatchResult(
  matchId: string,
  team1Score: number,
  team2Score: number,
  winnerId?: string
): Promise<void> {
  try {
    const matchRef = db.collection(MATCHES_COLLECTION).doc(matchId)
    await matchRef.update({
      status: "completed",
      result: {
        team1Score,
        team2Score,
        winnerId: winnerId || (team1Score > team2Score ? "team1" : team2Score > team1Score ? "team2" : undefined),
      },
      updatedAt: new Date().toISOString(),
    })
    
    console.log('[Database] Recorded match result:', matchId)
  } catch (error) {
    console.error("Error recording match result:", error)
    throw new Error("Failed to record match result")
  }
}

/**
 * إلغاء مبارة
 */
export async function cancelMatch(matchId: string): Promise<void> {
  try {
    const matchRef = db.collection(MATCHES_COLLECTION).doc(matchId)
    await matchRef.delete()

    console.log('[Database] Deleted match:', matchId)
  } catch (error) {
    console.error("Error deleting match:", error)
    throw new Error("Failed to delete match")
  }
}

/**
 * حذف مبارة
 */
export async function deleteMatch(matchId: string): Promise<void> {
  try {
    const matchRef = db.collection(MATCHES_COLLECTION).doc(matchId)
    await matchRef.delete()
    
    console.log('[Database] Deleted match:', matchId)
  } catch (error) {
    console.error("Error deleting match:", error)
    throw new Error("Failed to delete match")
  }
}
