import { db } from "@/lib/server/firebase/firestore"
import { Timestamp } from "firebase-admin/firestore"
import type { MatchInvitation } from "@/types"

const INVITATIONS_COLLECTION = "match_invitations"
const MATCHES_COLLECTION = "matches"

// ============================================
// 🔍 Read Operations
// ============================================

/**
 * الحصول على دعوة مبارة حسب ID
 */
export async function getMatchInvitationById(invitationId: string): Promise<MatchInvitation | null> {
  try {
    const invitationRef = db.collection(INVITATIONS_COLLECTION).doc(invitationId)
    const invitationDoc = await invitationRef.get()
    
    if (!invitationDoc.exists) {
      return null
    }
    
    const data = invitationDoc.data() as any
    return {
      id: invitationDoc.id,
      matchId: data.matchId,
      fromUserId: data.fromUserId,
      toUserId: data.toUserId,
      fromTeamId: data.fromTeamId,
      toTeamId: data.toTeamId,
      status: data.status,
      originalProposedDate: data.originalProposedDate,
      originalStadium: data.originalStadium,
      suggestedDate: data.suggestedDate,
      suggestedStadium: data.suggestedStadium,
      suggestedTime: data.suggestedTime,
      bookingId: data.bookingId,
      createdAt: data.createdAt?.toDate?.()?.toISOString?.() || String(data.createdAt),
      updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || String(data.updatedAt),
    }
  } catch (error) {
    console.error("Error getting match invitation by ID:", error)
    throw new Error("Failed to get match invitation")
  }
}

/**
 * الحصول على الدعوات المعلقة للمستخدم
 */
export async function getPendingInvitationsForUser(userId: string): Promise<MatchInvitation[]> {
  try {
    const querySnapshot = await db
      .collection(INVITATIONS_COLLECTION)
      .where("toUserId", "==", userId)
      .where("status", "==", "pending")
      .orderBy("createdAt", "desc")
      .get()
    
    const invitations: MatchInvitation[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data() as any
      invitations.push({
        id: doc.id,
        matchId: data.matchId,
        fromUserId: data.fromUserId,
        toUserId: data.toUserId,
        fromTeamId: data.fromTeamId,
        toTeamId: data.toTeamId,
        status: data.status,
        originalProposedDate: data.originalProposedDate,
        originalStadium: data.originalStadium,
        suggestedDate: data.suggestedDate,
        suggestedStadium: data.suggestedStadium,
        suggestedTime: data.suggestedTime,
        bookingId: data.bookingId,
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() || String(data.createdAt),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || String(data.updatedAt),
      })
    })
    
    return invitations
  } catch (error) {
    console.error("Error getting pending invitations for user:", error)
    throw new Error("Failed to get invitations")
  }
}

/**
 * الحصول على دعوات المستخدم التي أرسلها
 */
export async function getSentInvitationsForUser(userId: string): Promise<MatchInvitation[]> {
  try {
    const querySnapshot = await db
      .collection(INVITATIONS_COLLECTION)
      .where("fromUserId", "==", userId)
      .orderBy("createdAt", "desc")
      .get()
    
    const invitations: MatchInvitation[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data() as any
      invitations.push({
        id: doc.id,
        matchId: data.matchId,
        fromUserId: data.fromUserId,
        toUserId: data.toUserId,
        fromTeamId: data.fromTeamId,
        toTeamId: data.toTeamId,
        status: data.status,
        originalProposedDate: data.originalProposedDate,
        originalStadium: data.originalStadium,
        suggestedDate: data.suggestedDate,
        suggestedStadium: data.suggestedStadium,
        suggestedTime: data.suggestedTime,
        bookingId: data.bookingId,
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() || String(data.createdAt),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || String(data.updatedAt),
      })
    })
    
    return invitations
  } catch (error) {
    console.error("Error getting sent invitations for user:", error)
    throw new Error("Failed to get invitations")
  }
}

// ============================================
// ✏️ Write Operations
// ============================================

/**
 * إنشاء دعوة مبارة جديدة بعد تأكيد الحجز
 */
export async function createMatchInvitation(input: {
  fromUserId: string
  toUserId: string
  fromTeamId?: string
  toTeamId?: string
  originalProposedDate: string
  originalStadium?: string
  bookingId?: string
}): Promise<MatchInvitation> {
  try {
    const now = new Date().toISOString()
    const invitationId = `invitation_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    
    const newInvitation: Omit<MatchInvitation, "id"> = {
      fromUserId: input.fromUserId,
      toUserId: input.toUserId,
      fromTeamId: input.fromTeamId,
      toTeamId: input.toTeamId,
      status: "pending",
      originalProposedDate: input.originalProposedDate,
      originalStadium: input.originalStadium,
      bookingId: input.bookingId,
      createdAt: now,
      updatedAt: now,
    }
    
    const invitationRef = db.collection(INVITATIONS_COLLECTION).doc(invitationId)
    await invitationRef.set({
      ...newInvitation,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
    
    console.log('[Database] Created match invitation:', invitationId)
    return { id: invitationId, ...newInvitation }
  } catch (error) {
    console.error("Error creating match invitation:", error)
    throw new Error("Failed to create match invitation")
  }
}

/**
 * تحديث حالة الدعوة
 */
export async function updateMatchInvitationStatus(
  invitationId: string,
  status: MatchInvitation["status"]
): Promise<void> {
  try {
    const invitationRef = db.collection(INVITATIONS_COLLECTION).doc(invitationId)
    await invitationRef.update({
      status,
      updatedAt: Timestamp.now(),
    })
    
    console.log('[Database] Updated match invitation status:', invitationId, status)
  } catch (error) {
    console.error("Error updating match invitation status:", error)
    throw new Error("Failed to update invitation")
  }
}

/**
 * تحديث الدعوة مع تغيير مقترح (ملعب أو وقت)
 */
export async function updateInvitationWithChanges(
  invitationId: string,
  changeType: "court" | "time",
  suggestedValue: string,
  newStatus: "court_change_requested" | "time_change_requested"
): Promise<void> {
  try {
    const updates: any = {
      status: newStatus,
      updatedAt: Timestamp.now(),
    }
    
    if (changeType === "court") {
      updates.suggestedStadium = suggestedValue
    } else if (changeType === "time") {
      updates.suggestedTime = suggestedValue
    }
    
    const invitationRef = db.collection(INVITATIONS_COLLECTION).doc(invitationId)
    await invitationRef.update(updates)
    
    console.log('[Database] Updated match invitation with change request:', invitationId, changeType)
  } catch (error) {
    console.error("Error updating invitation with changes:", error)
    throw new Error("Failed to update invitation")
  }
}

/**
 * تأكيد دعوة المبارة وحفظ المبارة في قاعدة البيانات
 */
export async function confirmMatchInvitation(
  invitationId: string,
  matchData: any
): Promise<{ invitationId: string; matchId: string }> {
  try {
    const matchId = `match_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    const now = Timestamp.now()
    
    // حفظ المبارة
    const matchRef = db.collection(MATCHES_COLLECTION).doc(matchId)
    await matchRef.set({
      team1Id: matchData.team1Id,
      team2Id: matchData.team2Id,
      team1: matchData.team1,
      team2: matchData.team2,
      stadium: matchData.stadium,
      wilaya: matchData.wilaya,
      baladia: matchData.baladia,
      dateTime: matchData.dateTime,
      status: "scheduled",
      createdByUserId: matchData.createdByUserId,
      invitationId: invitationId,
      confirmationStatus: "confirmed",
      createdAt: now,
      updatedAt: now,
    })
    
    // تحديث حالة الدعوة
    const invitationRef = db.collection(INVITATIONS_COLLECTION).doc(invitationId)
    await invitationRef.update({
      status: "accepted",
      matchId: matchId,
      updatedAt: now,
    })
    
    console.log('[Database] Confirmed match invitation and created match:', matchId)
    return { invitationId, matchId }
  } catch (error) {
    console.error("Error confirming match invitation:", error)
    throw new Error("Failed to confirm invitation")
  }
}

/**
 * قبول طلب تغيير الملعب أو الوقت
 */
export async function acceptChangeRequest(
  invitationId: string,
  changeType: "court" | "time",
  originalMatchId?: string
): Promise<void> {
  try {
    const invitationRef = db.collection(INVITATIONS_COLLECTION).doc(invitationId)
    const invitationDoc = await invitationRef.get()
    
    if (!invitationDoc.exists) {
      throw new Error("Invitation not found")
    }
    
    const data = invitationDoc.data() as any
    const updates: any = {
      status: "accepted",
      updatedAt: Timestamp.now(),
    }
    
    // تطبيق التغيير على البيانات الأصلية
    if (changeType === "court" && data.suggestedStadium) {
      updates.originalStadium = data.suggestedStadium
    } else if (changeType === "time" && data.suggestedTime) {
      // سيتم تحديث الوقت في المبارة الأصلية
    }
    
    await invitationRef.update(updates)
    
    console.log('[Database] Accepted change request for invitation:', invitationId)
  } catch (error) {
    console.error("Error accepting change request:", error)
    throw new Error("Failed to accept change request")
  }
}

/**
 * رفض طلب تغيير الملعب أو الوقت
 */
export async function rejectChangeRequest(
  invitationId: string,
  changeType: "court" | "time"
): Promise<void> {
  try {
    const invitationRef = db.collection(INVITATIONS_COLLECTION).doc(invitationId)
    await invitationRef.update({
      status: "accepted", // العودة للحالة المقبولة
      suggestedStadium: null,
      suggestedTime: null,
      updatedAt: Timestamp.now(),
    })
    
    console.log('[Database] Rejected change request for invitation:', invitationId)
  } catch (error) {
    console.error("Error rejecting change request:", error)
    throw new Error("Failed to reject change request")
  }
}

/**
 * إلغاء دعوة المبارة
 */
export async function cancelMatchInvitation(invitationId: string): Promise<void> {
  try {
    const invitationRef = db.collection(INVITATIONS_COLLECTION).doc(invitationId)
    await invitationRef.update({
      status: "cancelled",
      updatedAt: Timestamp.now(),
    })
    
    console.log('[Database] Cancelled match invitation:', invitationId)
  } catch (error) {
    console.error("Error cancelling match invitation:", error)
    throw new Error("Failed to cancel invitation")
  }
}
