import { db } from "@/lib/server/firebase/firestore"
import { createMatch } from "./matches"
import { getTeamByIdFromDb } from "./teams"
import { createNotification } from "./notifications"
import type { MatchRequest, Team } from "@/types"

// ============================================
// Constants
// ============================================

const MATCH_REQUESTS_COLLECTION = "match_requests"

// ============================================
// 🔍 Read Operations
// ============================================

/**
 * الحصول على جميع طلبات المقابلة المعلقة لفريق معين
 */
export function getPendingRequestsForTeam(teamId: string): MatchRequest[] {
  // Note: This is a synchronous function that returns empty array
  // For real usage, implement async version with Firestore
  console.warn("getPendingRequestsForTeam should be async. This is a placeholder.")
  return []
}

/**
 * الحصول على جميع طلبات المقابلة الصادرة من فريق معين
 */
export function getOutgoingRequestsForTeam(teamId: string): MatchRequest[] {
  // Note: This is a synchronous function that returns empty array
  // For real usage, implement async version with Firestore
  console.warn("getOutgoingRequestsForTeam should be async. This is a placeholder.")
  return []
}

/**
 * الحصول على طلب مقابلة حسب ID (نسخة غير متزامنة)
 */
export async function getMatchRequestById(requestId: string): Promise<MatchRequest | null> {
  try {
    const requestRef = db.collection(MATCH_REQUESTS_COLLECTION).doc(requestId)
    const requestDoc = await requestRef.get()
    
    if (!requestDoc.exists) {
      return null
    }
    
    return { id: requestDoc.id, ...requestDoc.data() } as MatchRequest
  } catch (error) {
    console.error("Error getting match request by ID:", error)
    return null
  }
}

function isBookingDateWithinAllowedRange(originalDateStr: string, newDateStr: string): boolean {
  const originalDate = new Date(originalDateStr)
  const newDate = new Date(newDateStr)

  if (Number.isNaN(originalDate.getTime()) || Number.isNaN(newDate.getTime())) {
    return false
  }

  const minDate = new Date(originalDate)
  const maxDate = new Date(originalDate)
  maxDate.setDate(maxDate.getDate() + 3)

  return newDate >= minDate && newDate <= maxDate
}

export async function updateMatchRequestAsync(requestId: string, updateData: Partial<Pick<MatchRequest, 'stadium' | 'wilaya' | 'baladia' | 'proposedDate'>>): Promise<void> {
  try {
    const requestRef = db.collection(MATCH_REQUESTS_COLLECTION).doc(requestId)
    const requestDoc = await requestRef.get()
    if (!requestDoc.exists) {
      throw new Error('Match request not found')
    }

    const existingRequest = { id: requestDoc.id, ...requestDoc.data() } as MatchRequest
    if (updateData.proposedDate && existingRequest.proposedDate) {
      if (!isBookingDateWithinAllowedRange(existingRequest.proposedDate, updateData.proposedDate)) {
        throw new Error('The confirmed booking date must be within 3 days of the originally requested date')
      }
    }

    await requestRef.update(updateData)
  } catch (error) {
    console.error('Error updating match request:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to update match request')
  }
}

/**
 * الحصول على جميع طلبات المقابلة المعلقة
 */
export async function getPendingRequestsForTeamAsync(teamId: string): Promise<MatchRequest[]> {
  try {
    const querySnapshot = await db
      .collection(MATCH_REQUESTS_COLLECTION)
      .where("toTeamId", "==", teamId)
      .where("status", "==", "pending")
      .orderBy("createdAt", "desc")
      .get()
    
    const requests: MatchRequest[] = []
    querySnapshot.forEach((doc) => {
      requests.push({ id: doc.id, ...doc.data() } as MatchRequest)
    })
    
    return requests
  } catch (error) {
    console.error("Error getting pending requests for team:", error)
    return []
  }
}

/**
 * الحصول على جميع طلبات المقابلة الصادرة من فريق معين
 */
export async function getOutgoingRequestsForTeamAsync(teamId: string): Promise<MatchRequest[]> {
  try {
    const querySnapshot = await db
      .collection(MATCH_REQUESTS_COLLECTION)
      .where("fromTeamId", "==", teamId)
      .orderBy("createdAt", "desc")
      .get()
    
    const requests: MatchRequest[] = []
    querySnapshot.forEach((doc) => {
      requests.push({ id: doc.id, ...doc.data() } as MatchRequest)
    })
    
    return requests
  } catch (error) {
    console.error("Error getting outgoing requests for team:", error)
    return []
  }
}

// ============================================
// ✏️ Write Operations
// ============================================

/**
 * إنشاء طلب مقابلة جديد
 */
export function createMatchRequest(input: {
  fromTeam: Team
  toTeam: Team
  kind: "random" | "direct" | "instant"
  stadium?: string
  wilaya?: string
  baladia?: string
  proposedDate: string
  createdByUserId: string
}): MatchRequest {
  // For now, this is a synchronous placeholder
  const now = new Date().toISOString()
  const requestId = `mreq_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  
  const newRequest: MatchRequest = {
    id: requestId,
    kind: input.kind,
    fromTeamId: input.fromTeam.id,
    toTeamId: input.toTeam.id,
    fromTeam: input.fromTeam,
    toTeam: input.toTeam,
    status: "pending",
    stadium: input.stadium,
    wilaya: input.wilaya,
    baladia: input.baladia,
    proposedDate: input.proposedDate,
    createdByUserId: input.createdByUserId,
    createdAt: now,
    updatedAt: now,
  }
  
  console.log('[Database] Created match request:', requestId)
  return newRequest
}

/**
 * إنشاء طلب مقابلة مع جدولة تلقائية
 */
export function createAutoScheduledMatchRequest(input: {
  fromTeam: Team
  toTeam: Team
  kind: "random" | "direct" | "instant"
  createdByUserId: string
}): MatchRequest {
  // For now, this is a synchronous placeholder
  const now = new Date().toISOString()
  const requestId = `mreq_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  
  const newRequest: MatchRequest = {
    id: requestId,
    kind: input.kind,
    fromTeamId: input.fromTeam.id,
    toTeamId: input.toTeam.id,
    fromTeam: input.fromTeam,
    toTeam: input.toTeam,
    status: "accepted", // تم قبول الطلب تلقائياً
    createdByUserId: input.createdByUserId,
    createdAt: now,
    updatedAt: now,
  }
  
  console.log('[Database] Created auto-scheduled match request:', requestId)
  return newRequest
}

/**
 * تحديث تفاصيل طلب المقابلة
 */
export function updateMatchRequestDetails(input: {
  requestId: string
  stadium?: string
  wilaya?: string
  baladia?: string
  proposedDate: string
  createdByUserId: string
}): MatchRequest {
  // For now, return a placeholder
  const now = new Date().toISOString()
  
  const updatedRequest: MatchRequest = {
    id: input.requestId,
    kind: "direct",
    fromTeamId: "",
    toTeamId: "",
    fromTeam: {} as Team,
    toTeam: {} as Team,
    status: "pending",
    stadium: input.stadium,
    wilaya: input.wilaya,
    baladia: input.baladia,
    proposedDate: input.proposedDate,
    createdByUserId: input.createdByUserId,
    createdAt: now,
    updatedAt: now,
  }
  
  console.log('[Database] Updated match request details:', input.requestId)
  return updatedRequest
}

/**
 * الرد على طلب مقابلة
 */
export function respondToMatchRequest(input: {
  requestId: string
  action: "accepted" | "rejected" | "cancelled"
  actorTeamId?: string
}): any {
  // For now, return a placeholder response
  console.log('[Database] Responded to match request:', input.requestId, input.action)
  
  return {
    success: true,
    message: `Match request ${input.action}`,
    requestId: input.requestId,
  }
}

// ============================================
// Async versions (for use in API routes)
// ============================================

/**
 * إنشاء طلب مقابلة جديد (نسخة غير متزامنة)
 */
export async function createMatchRequestAsync(input: {
  fromTeam: Team
  toTeam: Team
  kind: "random" | "direct" | "instant"
  stadium?: string
  wilaya?: string
  baladia?: string
  proposedDate: string
  createdByUserId: string
}): Promise<MatchRequest> {
  try {
    const now = new Date().toISOString()
    const requestId = `mreq_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    
    const newRequest: any = {
      kind: input.kind,
      fromTeamId: input.fromTeam.id,
      toTeamId: input.toTeam.id,
      fromTeam: input.fromTeam,
      toTeam: input.toTeam,
      status: "pending",
      proposedDate: input.proposedDate,
      createdByUserId: input.createdByUserId,
      createdAt: now,
      updatedAt: now,
    }

    if (input.stadium !== undefined) newRequest.stadium = input.stadium
    if (input.wilaya !== undefined) newRequest.wilaya = input.wilaya
    if (input.baladia !== undefined) newRequest.baladia = input.baladia

    const requestRef = db.collection(MATCH_REQUESTS_COLLECTION).doc(requestId)
    await requestRef.set(newRequest)
    
    console.log('[Database] Created match request:', requestId)
    return { id: requestId, ...newRequest }
  } catch (error) {
    console.error("Error creating match request:", error)
    throw new Error("Failed to create match request")
  }
}

/**
 * الرد على طلب مقابلة (نسخة غير متزامنة)
 */
export async function respondToMatchRequestAsync(input: {
  requestId: string
  action: "accepted" | "rejected" | "cancelled"
  actorTeamId?: string
}): Promise<any> {
  try {
    const requestRef = db.collection(MATCH_REQUESTS_COLLECTION).doc(input.requestId)
    const requestDoc = await requestRef.get()
    
    if (!requestDoc.exists) {
      throw new Error("Match request not found")
    }
    
    const request = { id: requestDoc.id, ...requestDoc.data() } as MatchRequest
    
    // Validate status based on action
    if (input.action === "accepted" || input.action === "rejected") {
      if (request.status !== "pending") {
        throw new Error("This match request has already been responded to and cannot be changed")
      }
    } else if (input.action === "cancelled") {
      if (request.status !== "pending" && request.status !== "accepted") {
        throw new Error("This match request cannot be cancelled as it has already been processed")
      }
    }
    
    if (input.action === "accepted") {
      await requestRef.update({
        status: "accepted",
        updatedAt: new Date().toISOString(),
      })

      if (request.fromTeam?.captainId) {
        await createNotification({
          userId: request.fromTeam.captainId,
          teamId: request.fromTeam.id,
          requestId: request.id,
          title: "تم قبول عرض المباراة",
          message: `تم قبول دعوتك من فريق ${request.toTeam?.name || 'الخصم'}. يمكنك الآن تأكيد حجز الملعب أو إلغاء الطلب.`, 
          type: "match_invite_accepted",
          read: false,
        })
      }

      console.log('[Database] Accepted match request:', input.requestId)
      return { success: true, message: "Match request accepted" }
    } else if (input.action === "rejected") {
      await requestRef.update({
        status: "rejected",
        updatedAt: new Date().toISOString(),
      })

      if (request.fromTeam?.captainId) {
        await createNotification({
          userId: request.fromTeam.captainId,
          teamId: request.fromTeam.id,
          requestId: request.id,
          title: "تم رفض عرض المباراة",
          message: `رفض فريق ${request.toTeam?.name || 'الخصم'} عرضك. يمكنك البحث عن فريق آخر أو تعديل العرض.`, 
          type: "match_invite_rejected",
          read: false,
        })
      }

      console.log('[Database] Rejected match request:', input.requestId)
      return { success: true, message: "Match request rejected" }
    } else if (input.action === "cancelled") {
      await requestRef.update({
        status: "cancelled",
        updatedAt: new Date().toISOString(),
      })

      const targetCaptainId = request.fromTeam?.id === input.actorTeamId ? request.toTeam?.captainId : request.fromTeam?.captainId
      const targetTeamId = request.fromTeam?.id === input.actorTeamId ? request.toTeam?.id : request.fromTeam?.id
      if (targetCaptainId) {
        await createNotification({
          userId: targetCaptainId,
          teamId: targetTeamId,
          requestId: request.id,
          title: "تم إلغاء عرض المباراة",
          message: `تم إلغاء عرض المباراة من ${request.fromTeam?.id === input.actorTeamId ? request.toTeam?.name : request.fromTeam?.name}.`, 
          type: "match_cancelled",
          read: false,
        })
      }

      console.log('[Database] Cancelled match request:', input.requestId)
      return { success: true, message: "Match request cancelled" }
    }

    return { success: false, message: "Invalid action" }
  } catch (error) {
    console.error("Error responding to match request:", error)
    throw new Error("Failed to respond to match request")
  }
}

export async function confirmMatchBookingAsync(input: {
  requestId: string
  createdByUserId: string
}): Promise<import("@/types").Match> {
  try {
    const request = await getMatchRequestById(input.requestId)
    if (!request) {
      throw new Error("Match request not found")
    }

    if (request.status !== "accepted") {
      throw new Error("Match request must be accepted before booking")
    }

    if (!request.stadium || !request.proposedDate || !request.fromTeam || !request.toTeam) {
      throw new Error("Incomplete booking information")
    }

    const match = await createMatch({
      team1: request.fromTeam,
      team2: request.toTeam,
      stadium: request.stadium,
      wilaya: request.wilaya,
      baladia: request.baladia,
      date: request.proposedDate,
      createdByUserId: input.createdByUserId,
    })

    if (request.fromTeam?.captainId) {
      await createNotification({
        userId: request.fromTeam.captainId,
        teamId: request.fromTeam.id,
        matchId: match.id,
        requestId: request.id,
        title: "تم تأكيد حجز المباراة",
        message: `تم تأكيد مباراة ${request.fromTeam.name} ضد ${request.toTeam.name} في ${match.stadium || 'الملعب'} بتاريخ ${match.dateTime}.`, 
        type: "match_confirmed",
        read: false,
      })
    }

    if (request.toTeam?.captainId) {
      await createNotification({
        userId: request.toTeam.captainId,
        teamId: request.toTeam.id,
        matchId: match.id,
        requestId: request.id,
        title: "تم تأكيد حجز المباراة",
        message: `تم تأكيد مباراة ${request.fromTeam.name} ضد ${request.toTeam.name} في ${match.stadium || 'الملعب'} بتاريخ ${match.dateTime}.`, 
        type: "match_confirmed",
        read: false,
      })
    }

    await db.collection(MATCH_REQUESTS_COLLECTION).doc(input.requestId).update({
      updatedAt: new Date().toISOString(),
      status: "accepted",
    })

    return match
  } catch (error) {
    console.error("Error confirming match booking:", error)
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to confirm match booking: ${message}`)
  }
}
