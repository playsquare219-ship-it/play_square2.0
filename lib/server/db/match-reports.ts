import { db } from "@/lib/server/firebase/firestore"
import type { MatchReport } from "@/types"

// ============================================
// ثوابت (Constants)
// ============================================

const MATCH_REPORTS_COLLECTION = "match_reports"

// ============================================
// عمليات القراءة (Read Operations)
// ============================================

/**
 * الحصول على جميع تقارير مباراة معينة
 */
export async function getReportsByMatchId(matchId: string): Promise<MatchReport[]> {
  try {
    const querySnapshot = await db
      .collection(MATCH_REPORTS_COLLECTION)
      .where("matchId", "==", matchId)
      .get()

    const reports: MatchReport[] = []
    querySnapshot.forEach((doc) => {
      reports.push({ id: doc.id, ...doc.data() } as MatchReport)
    })

    return reports
  } catch (error) {
    console.error("Error getting reports by match ID:", error)
    throw new Error("Failed to get match reports")
  }
}

/**
 * الحصول على تقرير مستخدم معين في مباراة معينة
 */
export async function getReportByUserAndMatch(
  userId: string,
  matchId: string
): Promise<MatchReport | null> {
  try {
    const querySnapshot = await db
      .collection(MATCH_REPORTS_COLLECTION)
      .where("userId", "==", userId)
      .where("matchId", "==", matchId)
      .limit(1)
      .get()

    if (querySnapshot.empty) {
      return null
    }

    const doc = querySnapshot.docs[0]
    return { id: doc.id, ...doc.data() } as MatchReport
  } catch (error) {
    console.error("Error getting report by user and match:", error)
    throw new Error("Failed to get match report")
  }
}

// ============================================
// عمليات الكتابة (Write Operations)
// ============================================

/**
 * إنشاء تقرير مباراة جديد
 */
export async function createMatchReport(
  input: Omit<MatchReport, "id" | "createdAt">
): Promise<MatchReport> {
  try {
    const now = new Date().toISOString()
    const reportId = `report_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

    const newReport: Omit<MatchReport, "id"> = {
      matchId: input.matchId,
      userId: input.userId,
      teamId: input.teamId,
      team1Score: input.team1Score,
      team2Score: input.team2Score,
      createdAt: now,
    }

    const reportRef = db.collection(MATCH_REPORTS_COLLECTION).doc(reportId)
    await reportRef.set(newReport)

    console.log("[Database] Created match report:", reportId)
    return { id: reportId, ...newReport }
  } catch (error) {
    console.error("Error creating match report:", error)
    throw new Error("Failed to create match report")
  }
}
