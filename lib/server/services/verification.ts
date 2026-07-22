import { db } from "@/lib/server/firebase/firestore"
import { createNotification } from "@/lib/server/db/notifications"
import type { Match, MatchReport } from "@/types"

// ============================================
// محرك التحقق من نتيجة المباراة
// Match Result Verification Service
// ============================================

// ============================================
// الدوال النقية (Pure Functions)
// لا تأثيرات جانبية - قابلة للاستخراج للمحرك المستقبلي
// ============================================

/**
 * التحقق من صحة تقرير المباراة قبل القبول
 */
export function validateReport(
  match: Match,
  userId: string,
  currentTime: Date
): { valid: boolean; error?: string; errorCode?: number } {
  if (match.status !== "reporting") {
    return { valid: false, error: "Match is not accepting reports", errorCode: 400 }
  }

  const deadline = getReportDeadline(match)
  if (currentTime >= deadline) {
    return { valid: false, error: "Reporting deadline has passed", errorCode: 400 }
  }

  const isOnTeam1 = match.team1?.players?.includes(userId) ?? false
  const isOnTeam2 = match.team2?.players?.includes(userId) ?? false
  if (!isOnTeam1 && !isOnTeam2) {
    return { valid: false, error: "You are not a player in this match", errorCode: 403 }
  }

  return { valid: true }
}

/**
 * حساب عدد اللاعبين المؤهلين من لقطة المباراة
 */
export function calculateEligiblePlayers(match: Match): number {
  return (match.team1?.players?.length ?? 0) + (match.team2?.players?.length ?? 0)
}

/**
 * حساب الأصوات حسب نتيجة المباراة
 */
export function countVotes(
  reports: MatchReport[]
): Map<string, { team1Score: number; team2Score: number; count: number }> {
  const votes = new Map<string, { team1Score: number; team2Score: number; count: number }>()

  for (const report of reports) {
    const key = `${report.team1Score}-${report.team2Score}`
    const existing = votes.get(key)
    if (existing) {
      existing.count++
    } else {
      votes.set(key, {
        team1Score: report.team1Score,
        team2Score: report.team2Score,
        count: 1,
      })
    }
  }

  return votes
}

/**
 * تحديد النتيجة الأكثر تصويتاً
 */
export function determineLeader(
  votes: Map<string, { team1Score: number; team2Score: number; count: number }>
): {
  leadingKey: string
  leadingScore: { team1Score: number; team2Score: number }
  leadingCount: number
} | null {
  if (votes.size === 0) return null

  let leader: {
    leadingKey: string
    leadingScore: { team1Score: number; team2Score: number }
    leadingCount: number
  } | null = null

  for (const [key, value] of votes) {
    if (!leader || value.count > leader.leadingCount) {
      leader = {
        leadingKey: key,
        leadingScore: { team1Score: value.team1Score, team2Score: value.team2Score },
        leadingCount: value.count,
      }
    }
  }

  return leader
}

/**
 * التحقق من عدم إمكانية اللحاق بالنتيجة المتصدرة رياضياً
 */
export function isMathematicallyUnreachable(
  leadingCount: number,
  remainingPlayers: number
): boolean {
  return leadingCount > remainingPlayers
}

/**
 * التحقق من وجود تعادل في أعلى عدد أصوات
 */
export function checkTie(
  votes: Map<string, { team1Score: number; team2Score: number; count: number }>
): boolean {
  if (votes.size <= 1) return false

  let maxCount = 0
  let tiesAtMax = 0

  for (const [, value] of votes) {
    if (value.count > maxCount) {
      maxCount = value.count
      tiesAtMax = 1
    } else if (value.count === maxCount) {
      tiesAtMax++
    }
  }

  return tiesAtMax > 1
}

/**
 * تحديد نتيجة المباراة النهائية
 *
 * @param reports - جميع التقارير المقدمة
 * @param match - بيانات المباراة
 * @param force - true عند منتصف الليل (إجبار التحديد)، false during reporting phase
 */
export function determineResult(
  reports: MatchReport[],
  match: Match,
  force: boolean = false
): {
  ready: boolean
  status: "verified" | "disputed"
  result?: { team1Score: number; team2Score: number; winnerId?: string }
} {
  if (reports.length === 0) {
    if (force) {
      return { ready: true, status: "disputed" }
    }
    return { ready: false, status: "disputed" }
  }

  const votes = countVotes(reports)
  const leader = determineLeader(votes)

  if (!leader) {
    return { ready: true, status: "disputed" }
  }

  if (checkTie(votes)) {
    return { ready: true, status: "disputed" }
  }

  if (force) {
    return buildVerifiedResult(leader, match)
  }

  const eligiblePlayers = calculateEligiblePlayers(match)
  const submittedUserIds = new Set(reports.map((r) => r.userId))
  const remainingPlayers = eligiblePlayers - submittedUserIds.size

  if (isMathematicallyUnreachable(leader.leadingCount, remainingPlayers)) {
    return buildVerifiedResult(leader, match)
  }

  return { ready: false, status: "verified" }
}

// ============================================
// الدوال المساعدة (Helper Functions)
// ============================================

function getReportDeadline(match: Match): Date {
  const matchDate = new Date(match.dateTime)
  const deadline = new Date(matchDate)
  deadline.setDate(deadline.getDate() + 1)
  deadline.setHours(0, 0, 0, 0)
  return deadline
}

function buildVerifiedResult(
  leader: {
    leadingScore: { team1Score: number; team2Score: number }
  },
  match: Match
): {
  ready: boolean
  status: "verified"
  result: { team1Score: number; team2Score: number; winnerId?: string }
} {
  const { team1Score, team2Score } = leader.leadingScore
  let winnerId: string | undefined
  if (team1Score > team2Score) {
    winnerId = match.team1Id
  } else if (team2Score > team1Score) {
    winnerId = match.team2Id
  }
  return {
    ready: true,
    status: "verified",
    result: { team1Score, team2Score, winnerId },
  }
}

// ============================================
// المنسق (Orchestrator)
// مسؤول عن تنسيق تحديثات قاعدة البيانات والإشعارات
// مصمم ليكون متساوياً (idempotent) وآمناً من السباقات
// ============================================

/**
 * التحقق من نتيجة المباراة
 * مصمم ليكون متساوياً - لا تأثيرات جانبية إذا تم استدعاؤه عدة مرات
 *
 * @param matchId - معرّف المباراة
 * @param force - true عند منتصف الليل، false عند إرسال تقرير جديد
 */
export async function verifyMatch(
  matchId: string,
  force: boolean = false
): Promise<{
  verified: boolean
  status?: "verified" | "disputed"
  result?: { team1Score: number; team2Score: number; winnerId?: string }
}> {
  const matchRef = db.collection("matches").doc(matchId)

  const matchDoc = await matchRef.get()
  if (!matchDoc.exists) {
    return { verified: false }
  }

  const match = { id: matchDoc.id, ...matchDoc.data() } as Match

  if (
    match.status === "verified" ||
    match.status === "disputed" ||
    match.status === "completed"
  ) {
    return { verified: false }
  }

  const reportsSnapshot = await db
    .collection("match_reports")
    .where("matchId", "==", matchId)
    .get()

  const reports: MatchReport[] = reportsSnapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as MatchReport)
  )

  const determination = determineResult(reports, match, force)

  if (!determination.ready) {
    return { verified: false }
  }

  try {
    await db.runTransaction(async (transaction) => {
      const freshDoc = await transaction.get(matchRef)
      if (!freshDoc.exists) return

      const freshMatch = { id: freshDoc.id, ...freshDoc.data() } as Match
      if (
        freshMatch.status === "verified" ||
        freshMatch.status === "disputed" ||
        freshMatch.status === "completed"
      ) {
        return
      }

      transaction.update(matchRef, {
        status: determination.status,
        result: determination.result ?? null,
        verifiedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    })
  } catch {
    return { verified: false }
  }

  try {
    await updateTeamStats(match, determination.result)
  } catch (error) {
    console.error("[Verification] Failed to update team stats:", matchId, error)
  }

  try {
    await sendResultNotifications(match, determination.status, determination.result)
  } catch (error) {
    console.error("[Verification] Failed to send result notifications:", matchId, error)
  }

  return {
    verified: true,
    status: determination.status,
    result: determination.result,
  }
}

/**
 * تحديث إحصائيات الفريقين بعد التحقق
 */
async function updateTeamStats(
  match: Match,
  result?: { team1Score: number; team2Score: number; winnerId?: string }
): Promise<void> {
  if (!result) return

  const { winnerId } = result

  const team1Updates: Record<string, unknown> = { updatedAt: new Date().toISOString() }
  const team2Updates: Record<string, unknown> = { updatedAt: new Date().toISOString() }

  if (winnerId === match.team1Id) {
    team1Updates.wins = (match.team1.wins ?? 0) + 1
    team2Updates.losses = (match.team2.losses ?? 0) + 1
  } else if (winnerId === match.team2Id) {
    team2Updates.wins = (match.team2.wins ?? 0) + 1
    team1Updates.losses = (match.team1.losses ?? 0) + 1
  } else {
    team1Updates.draws = (match.team1.draws ?? 0) + 1
    team2Updates.draws = (match.team2.draws ?? 0) + 1
  }

  const batch = db.batch()
  batch.update(db.collection("teams").doc(match.team1Id), team1Updates)
  batch.update(db.collection("teams").doc(match.team2Id), team2Updates)
  await batch.commit()
}

/**
 * إرسال إشعارات النتيجة لجميع اللاعبين في الفريقين
 */
async function sendResultNotifications(
  match: Match,
  status: "verified" | "disputed",
  result?: { team1Score: number; team2Score: number; winnerId?: string }
): Promise<void> {
  const allPlayerIds = [
    ...(match.team1?.players ?? []),
    ...(match.team2?.players ?? []),
  ]

  const uniquePlayerIds = [...new Set(allPlayerIds)]

  const title =
    status === "verified" ? "Match Result Verified" : "Match Result Disputed"

  let message: string
  if (status === "verified" && result) {
    message = `${match.team1.name} ${result.team1Score} - ${result.team2Score} ${match.team2.name}`
  } else {
    message = `No consensus reached for ${match.team1.name} vs ${match.team2.name}`
  }

  const notificationType =
    status === "verified" ? "match_result_verified" : "match_result_disputed"

  for (const playerId of uniquePlayerIds) {
    try {
      await createNotification({
        userId: playerId,
        matchId: match.id,
        title,
        message,
        type: notificationType,
        read: false,
      })
    } catch (error) {
      console.error("[Verification] Failed to send notification to:", playerId, error)
    }
  }
}
