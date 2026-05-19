import { db } from "@/lib/server/firebase/firestore"
import type { Team, MatchmakingQueue } from "@/types"

// ============================================
// Constants
// ============================================

const MATCHMAKING_QUEUE_COLLECTION = "matchmaking_queue"

// In-memory matchmaking state (for demo purposes)
// In production, you'd use a more robust solution like Cloud Tasks or Pub/Sub
const matchmakingState = new Map<string, { team: Team; mode: "instant" | "random"; timestamp: number }>()

// ============================================
// 🔍 Read Operations
// ============================================

/**
 * الحصول على حالة المطابقة لفريق معين
 */
export function getMatchmakingStatus(teamId: string) {
  const status = matchmakingState.get(teamId)
  return {
    isActive: !!status,
    status: status ? { teamId, mode: status.mode, since: new Date(status.timestamp).toISOString() } : null,
  }
}

/**
 * الحصول على فريق من طابور المطابقة
 */
export async function getQueuedTeam(teamId: string): Promise<MatchmakingQueue | null> {
  try {
    const queueRef = db.collection(MATCHMAKING_QUEUE_COLLECTION).doc(teamId)
    const queueDoc = await queueRef.get()
    
    if (!queueDoc.exists) {
      return null
    }
    
    return { id: queueDoc.id, ...queueDoc.data() } as MatchmakingQueue
  } catch (error) {
    console.error("Error getting queued team:", error)
    return null
  }
}

/**
 * الحصول على جميع الفريقات المنتظرة في الطابور (وضع المطابقة العشوائية)
 */
export async function getRandomMatchmakingQueue(): Promise<MatchmakingQueue[]> {
  try {
    const querySnapshot = await db
      .collection(MATCHMAKING_QUEUE_COLLECTION)
      .where("mode", "==", "random")
      .orderBy("createdAt", "asc")
      .get()
    
    const teams: MatchmakingQueue[] = []
    querySnapshot.forEach((doc) => {
      teams.push({ id: doc.id, ...doc.data() } as MatchmakingQueue)
    })
    
    return teams
  } catch (error) {
    console.error("Error getting random matchmaking queue:", error)
    return []
  }
}

/**
 * الحصول على جميع الفريقات المنتظرة في الطابور (وضع المطابقة الفورية)
 */
export async function getInstantMatchmakingQueue(): Promise<MatchmakingQueue[]> {
  try {
    const querySnapshot = await db
      .collection(MATCHMAKING_QUEUE_COLLECTION)
      .where("mode", "==", "instant")
      .orderBy("createdAt", "asc")
      .get()
    
    const teams: MatchmakingQueue[] = []
    querySnapshot.forEach((doc) => {
      teams.push({ id: doc.id, ...doc.data() } as MatchmakingQueue)
    })
    
    return teams
  } catch (error) {
    console.error("Error getting instant matchmaking queue:", error)
    return []
  }
}

// ============================================
// ✏️ Write Operations
// ============================================

/**
 * إضافة فريق إلى طابور المطابقة
 */
export function enqueueTeamForMatchmaking(input: { team: Team; mode: "instant" | "random" }) {
  try {
    const now = Date.now()
    matchmakingState.set(input.team.id, {
      team: input.team,
      mode: input.mode,
      timestamp: now,
    })
    
    console.log(`[Database] Team ${input.team.id} enqueued for ${input.mode} matchmaking`)
    
    return {
      teamId: input.team.id,
      mode: input.mode,
      joinedAt: new Date(now).toISOString(),
    }
  } catch (error) {
    console.error("Error enqueuing team for matchmaking:", error)
    throw new Error("Failed to enqueue team for matchmaking")
  }
}

/**
 * إلغاء المطابقة لفريق معين
 */
export function cancelMatchmaking(teamId: string): void {
  try {
    matchmakingState.delete(teamId)
    console.log(`[Database] Cancelled matchmaking for team ${teamId}`)
  } catch (error) {
    console.error("Error cancelling matchmaking:", error)
    throw new Error("Failed to cancel matchmaking")
  }
}

/**
 * جد مطابقة لفريق في الطابور (مطابقة عشوائية)
 * هذا تطبيق بسيط. في الإنتاج، قد تحتاج إلى استخدام Cloud Tasks أو Pub/Sub
 */
export async function findRandomMatch(teamId: string): Promise<Team | null> {
  try {
    const queuedTeams = await getRandomMatchmakingQueue()
    
    // ابحث عن فريق آخر في الطابور
    for (const queueItem of queuedTeams) {
      if (queueItem.id !== teamId) {
        // وجدنا مطابقة
        return queueItem.team
      }
    }
    
    // لم نجد مطابقة حتى الآن
    return null
  } catch (error) {
    console.error("Error finding random match:", error)
    return null
  }
}

/**
 * جد مطابقة فورية لفريق
 */
export async function findInstantMatch(teamId: string): Promise<Team | null> {
  try {
    const queuedTeams = await getInstantMatchmakingQueue()
    
    // ابحث عن فريق آخر في الطابور
    for (const queueItem of queuedTeams) {
      if (queueItem.id !== teamId) {
        // وجدنا مطابقة
        return queueItem.team
      }
    }
    
    // لم نجد مطابقة حتى الآن
    return null
  } catch (error) {
    console.error("Error finding instant match:", error)
    return null
  }
}

/**
 * تسجيل المطابقة (نقل الفريقين من الطابور)
 */
export async function recordMatchmakingMatch(team1Id: string, team2Id: string): Promise<void> {
  try {
    matchmakingState.delete(team1Id)
    matchmakingState.delete(team2Id)
    
    // حذف من Firestore أيضاً
    await db.collection(MATCHMAKING_QUEUE_COLLECTION).doc(team1Id).delete()
    await db.collection(MATCHMAKING_QUEUE_COLLECTION).doc(team2Id).delete()
    
    console.log(`[Database] Recorded matchmaking match between ${team1Id} and ${team2Id}`)
  } catch (error) {
    console.error("Error recording matchmaking match:", error)
    throw new Error("Failed to record matchmaking match")
  }
}
