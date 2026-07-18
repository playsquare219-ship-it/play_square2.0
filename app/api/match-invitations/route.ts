import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
  createMatchInvitation,
  getMatchInvitationById,
  updateMatchInvitationStatus,
  updateInvitationWithChanges,
  confirmMatchInvitation,
  getPendingInvitationsForUser,
  acceptChangeRequest,
  rejectChangeRequest,
  cancelMatchInvitation,
} from '@/lib/server/db/match-invitations'
import { createNotification } from '@/lib/server/db/notifications'
import { verifyToken } from '@/lib/server/auth/jwt'
import { findUserById } from '@/lib/server/db/users'
import type { MatchInvitation } from '@/types'

// ============================================
// POST: Create new match invitation after booking
// ============================================
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('playSquareToken')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const {
      toUserId,
      fromTeamId,
      toTeamId,
      originalProposedDate,
      originalStadium,
      bookingId,
      matchData,
    } = body

    if (!toUserId || !originalProposedDate) {
      return NextResponse.json(
        { error: 'Missing required fields: toUserId, originalProposedDate' },
        { status: 400 }
      )
    }

    // Create the invitation
    const invitation = await createMatchInvitation({
      fromUserId: decoded.userId,
      toUserId,
      fromTeamId,
      toTeamId,
      originalProposedDate,
      originalStadium,
      bookingId,
    })

    // Get invitee details for notification
    const invitee = await findUserById(toUserId)
    const inviter = await findUserById(decoded.userId)

    // Create notification for invitee
    try {
      await createNotification({
        userId: toUserId,
        title: 'تم إرسال دعوة للعب مباراة',
        message: `${inviter?.firstName} ${inviter?.lastName} يدعوك للعب مباراة في ${originalStadium || 'ملعب'}`,
        type: 'match_invitation',
        invitationId: invitation.id,
        matchDetails: {
          stadium: originalStadium,
          dateTime: originalProposedDate,
          fromUser: `${inviter?.firstName} ${inviter?.lastName}`,
          fromTeamId,
          toTeamId,
        },
      })
    } catch (notifError) {
      console.error('[API] Failed to create invitation notification:', notifError)
    }

    return NextResponse.json({ invitation }, { status: 201 })
  } catch (error) {
    console.error('[API /match-invitations POST] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================
// GET: Fetch pending invitations for current user
// ============================================
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('playSquareToken')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'pending' // 'pending' or 'sent'

    let invitations: MatchInvitation[]

    if (type === 'sent') {
      const { getSentInvitationsForUser } = await import('@/lib/server/db/match-invitations')
      invitations = await getSentInvitationsForUser(decoded.userId)
    } else {
      invitations = await getPendingInvitationsForUser(decoded.userId)
    }

    return NextResponse.json({ invitations })
  } catch (error) {
    console.error('[API /match-invitations GET] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================
// PATCH: Respond to invitation
// ============================================
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('playSquareToken')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { invitationId, action, matchData, suggestedValue } = body

    if (!invitationId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: invitationId, action' },
        { status: 400 }
      )
    }

    // Get the invitation
    const invitation = await getMatchInvitationById(invitationId)
    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
    }

    // Verify user is the recipient
    if (invitation.toUserId !== decoded.userId) {
      return NextResponse.json({ error: 'Not authorized to respond to this invitation' }, { status: 403 })
    }

    const inviter = await findUserById(invitation.fromUserId)

    // Handle different actions
    switch (action) {
      case 'accept': {
        // Confirm the match and booking
        if (!matchData) {
          return NextResponse.json({ error: 'matchData is required for accept action' }, { status: 400 })
        }

        const result = await confirmMatchInvitation(invitationId, matchData)

        // Confirm the booking if bookingId exists
        if (invitation.bookingId) {
          try {
            const { db } = await import('@/lib/server/firebase/firestore')
            await db.collection('booking_matches').doc(invitation.bookingId).update({
              status: 'confirmed',
              confirmedAt: (await import('firebase-admin/firestore')).Timestamp.now(),
            })
            console.log('[API] Booking confirmed:', invitation.bookingId)
          } catch (bookingError) {
            console.error('[API] Failed to confirm booking:', bookingError)
          }
        }

        // Send notifications
        try {
          const invitee = await findUserById(decoded.userId)
          
          // Notify organizer that booking needs to download PDF
          await createNotification({
            userId: invitation.fromUserId,
            title: 'تم قبول الحجز - حمّل معلومات المباراة',
            message: `${invitee?.firstName} ${invitee?.lastName} قبل دعوة المباراة. يرجى تحميل معلومات الحجز`,
            type: 'match_confirmed_both',
            invitationId,
            matchId: result.matchId,
            matchDetails: {
              ...matchData,
              toUser: `${invitee?.firstName} ${invitee?.lastName}`,
              bookingId: invitation.bookingId,
            },
            actionType: 'approve',
          })

          // Notify invitee that match is confirmed
          await createNotification({
            userId: decoded.userId,
            title: 'تم تأكيد المباراة',
            message: `تم تأكيد المباراة مع ${inviter?.firstName} ${inviter?.lastName}`,
            type: 'match_confirmed_both',
            invitationId,
            matchId: result.matchId,
            matchDetails: {
              ...matchData,
              fromUser: `${inviter?.firstName} ${inviter?.lastName}`,
              bookingId: invitation.bookingId,
            },
          })
        } catch (notifError) {
          console.error('[API] Failed to create confirmation notifications:', notifError)
        }

        return NextResponse.json({ success: true, result })
      }

      case 'reject': {
        await updateMatchInvitationStatus(invitationId, 'rejected')

        // Notify organizer of rejection
        try {
          const invitee = await findUserById(decoded.userId)
          await createNotification({
            userId: invitation.fromUserId,
            title: 'تم رفض دعوة المباراة',
            message: `${invitee?.firstName} ${invitee?.lastName} رفض دعوة المباراة`,
            type: 'match_invitation_rejected',
            invitationId,
          })
        } catch (notifError) {
          console.error('[API] Failed to create rejection notification:', notifError)
        }

        return NextResponse.json({ success: true })
      }

      case 'change_court': {
        if (!suggestedValue) {
          return NextResponse.json({ error: 'suggestedValue is required for change_court action' }, { status: 400 })
        }

        await updateInvitationWithChanges(
          invitationId,
          'court',
          suggestedValue,
          'court_change_requested'
        )

        // Notify organizer of court change request
        try {
          const invitee = await findUserById(decoded.userId)
          await createNotification({
            userId: invitation.fromUserId,
            title: 'طلب تغيير الملعب',
            message: `${invitee?.firstName} ${invitee?.lastName} يطلب تغيير الملعب إلى ${suggestedValue}`,
            type: 'match_invitation_court_change_requested',
            invitationId,
            actionType: 'change_court',
          })
        } catch (notifError) {
          console.error('[API] Failed to create change court notification:', notifError)
        }

        return NextResponse.json({ success: true })
      }

      case 'change_time': {
        if (!suggestedValue) {
          return NextResponse.json({ error: 'suggestedValue is required for change_time action' }, { status: 400 })
        }

        await updateInvitationWithChanges(
          invitationId,
          'time',
          suggestedValue,
          'time_change_requested'
        )

        // Notify organizer of time change request
        try {
          const invitee = await findUserById(decoded.userId)
          await createNotification({
            userId: invitation.fromUserId,
            title: 'طلب تغيير التوقيت',
            message: `${invitee?.firstName} ${invitee?.lastName} يطلب تغيير التوقيت إلى ${suggestedValue}`,
            type: 'match_invitation_time_change_requested',
            invitationId,
            actionType: 'change_time',
          })
        } catch (notifError) {
          console.error('[API] Failed to create change time notification:', notifError)
        }

        return NextResponse.json({ success: true })
      }

      case 'cancel': {
        await cancelMatchInvitation(invitationId)

        // Notify organizer of cancellation
        try {
          const invitee = await findUserById(decoded.userId)
          await createNotification({
            userId: invitation.fromUserId,
            title: 'تم إلغاء المباراة',
            message: `${invitee?.firstName} ${invitee?.lastName} ألغى دعوة المباراة`,
            type: 'match_cancelled_invitation',
            invitationId,
          })
        } catch (notifError) {
          console.error('[API] Failed to create cancellation notification:', notifError)
        }

        return NextResponse.json({ success: true })
      }

      case 'accept_change': {
        const changeType = body.changeType as 'court' | 'time'
        if (!changeType) {
          return NextResponse.json(
            { error: 'changeType is required for accept_change action' },
            { status: 400 }
          )
        }

        await acceptChangeRequest(invitationId, changeType)

        // Notify invitee of accepted change
        try {
          await createNotification({
            userId: invitation.toUserId,
            title: 'تم قبول طلب التغيير',
            message: `تم قبول طلب تغيير ${changeType === 'court' ? 'الملعب' : 'التوقيت'}`,
            type: 'match_change_request_accepted',
            invitationId,
            actionType: changeType === 'court' ? 'change_court' : 'change_time',
          })
        } catch (notifError) {
          console.error('[API] Failed to create accept change notification:', notifError)
        }

        return NextResponse.json({ success: true })
      }

      case 'reject_change': {
        const changeType = body.changeType as 'court' | 'time'
        if (!changeType) {
          return NextResponse.json(
            { error: 'changeType is required for reject_change action' },
            { status: 400 }
          )
        }

        await rejectChangeRequest(invitationId, changeType)

        // Notify invitee of rejected change
        try {
          await createNotification({
            userId: invitation.toUserId,
            title: 'تم رفض طلب التغيير',
            message: `تم رفض طلب تغيير ${changeType === 'court' ? 'الملعب' : 'التوقيت'}`,
            type: 'match_change_request_rejected',
            invitationId,
            actionType: changeType === 'court' ? 'change_court' : 'change_time',
          })
        } catch (notifError) {
          console.error('[API] Failed to create reject change notification:', notifError)
        }

        return NextResponse.json({ success: true })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('[API /match-invitations PATCH] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
