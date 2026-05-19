import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/server/auth/jwt'
import {
  createAutoScheduledMatchRequest,
  createMatchRequestAsync,
  getMatchRequestById,
  getOutgoingRequestsForTeamAsync,
  getPendingRequestsForTeamAsync,
  getTeamByIdFromDb,
  respondToMatchRequestAsync,
  updateMatchRequestAsync,
  updateTeam,
  confirmMatchBookingAsync,
  createNotification,
} from '@/lib/server/db'
import type { Team } from '@/types'

export async function GET(request: NextRequest) {
  const requestId = request.nextUrl.searchParams.get('requestId')
  if (requestId) {
    const requestData = await getMatchRequestById(requestId)
    return NextResponse.json({ request: requestData })
  }

  const teamId = request.nextUrl.searchParams.get('teamId')
  const scope = request.nextUrl.searchParams.get('scope') ?? 'incoming'

  if (!teamId) {
    return NextResponse.json({ error: 'teamId is required' }, { status: 400 })
  }

  const requests = scope === 'outgoing' ? await getOutgoingRequestsForTeamAsync(teamId) : await getPendingRequestsForTeamAsync(teamId)
  return NextResponse.json({ requests })
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      requestId?: string
      fromTeam?: Team
      toTeamId?: string
      kind?: 'random' | 'direct' | 'instant'
      stadium?: string
      autoSchedule?: boolean
      wilaya?: string
      baladia?: string
      proposedDate?: string
      createdByUserId?: string
      confirmBooking?: boolean
    }

    if (body.confirmBooking && body.requestId) {
      const cookieStore = await cookies()
      const token = cookieStore.get('playSquareToken')?.value
      const decoded = token ? verifyToken(token) : null
      if (!decoded) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      const request = await getMatchRequestById(body.requestId)
      if (!request) {
        return NextResponse.json({ error: 'Match request not found' }, { status: 404 })
      }

      if (request.createdByUserId !== decoded.userId) {
        return NextResponse.json({ error: 'Only the request sender may confirm booking' }, { status: 403 })
      }

      const bookingUpdate: any = {}
      if (body.stadium !== undefined) bookingUpdate.stadium = body.stadium
      if (body.wilaya !== undefined) bookingUpdate.wilaya = body.wilaya
      if (body.baladia !== undefined) bookingUpdate.baladia = body.baladia
      if (body.proposedDate !== undefined) bookingUpdate.proposedDate = body.proposedDate
      if (Object.keys(bookingUpdate).length > 0) {
        await updateMatchRequestAsync(body.requestId, bookingUpdate)
      }

      const match = await confirmMatchBookingAsync({ requestId: body.requestId, createdByUserId: decoded.userId })
      return NextResponse.json({ match }, { status: 201 })
    }

    if (!body.fromTeam || !body.toTeamId || !body.createdByUserId) {
      return NextResponse.json({ error: 'fromTeam, toTeamId and createdByUserId are required' }, { status: 400 })
    }

    if (body.fromTeam.id && !body.fromTeam.id.startsWith('booking_')) {
      const updateData: Partial<Omit<Team, 'id' | 'createdAt'>> = {}
      if (body.fromTeam.name !== undefined) updateData.name = body.fromTeam.name
      if (body.fromTeam.photoURL !== undefined) updateData.photoURL = body.fromTeam.photoURL
      if (body.fromTeam.wilaya !== undefined) updateData.wilaya = body.fromTeam.wilaya
      if (body.fromTeam.baladia !== undefined) updateData.baladia = body.fromTeam.baladia

      if (Object.keys(updateData).length > 0) {
        await updateTeam(body.fromTeam.id, updateData)
      }
    }

    const toTeam = await getTeamByIdFromDb(body.toTeamId)
    if (!toTeam) {
      return NextResponse.json({ error: 'Opponent team not found' }, { status: 404 })
    }

    const created = body.autoSchedule
      ? await createAutoScheduledMatchRequest({
          fromTeam: body.fromTeam,
          toTeam,
          kind: body.kind ?? 'direct',
          createdByUserId: body.createdByUserId,
        })
      : await createMatchRequestAsync({
          fromTeam: body.fromTeam,
          toTeam,
          kind: body.kind ?? 'direct',
          stadium: body.stadium,
          wilaya: body.wilaya,
          baladia: body.baladia,
          proposedDate: body.proposedDate || new Date().toISOString(),
          createdByUserId: body.createdByUserId,
        })

    if (created && toTeam?.captainId) {
      await createNotification({
        userId: toTeam.captainId,
        teamId: toTeam.id,
        requestId: created.id,
        title: 'New Match Invitation',
        message: `You have received a match invitation from team ${body.fromTeam.name}. Click accept to respond.`,
        type: 'match_invite',
        read: false,
      })
    }

    return NextResponse.json({ request: created }, { status: 201 })
  } catch (error) {
    console.error('Error in match-requests POST:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('playSquareToken')?.value
  const decoded = token ? verifyToken(token) : null
  if (!decoded) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const body = (await request.json()) as { requestId?: string; action?: 'accepted' | 'rejected' | 'cancelled' }
  if (!body.requestId || !body.action) {
    return NextResponse.json({ error: 'requestId and action are required' }, { status: 400 })
  }

  const requestData = await getMatchRequestById(body.requestId)
  if (!requestData) {
    return NextResponse.json({ error: 'Match request not found' }, { status: 404 })
  }

  let actorTeamId: string | undefined

  if (body.action === 'cancelled') {
    if (requestData.createdByUserId !== decoded.userId) {
      return NextResponse.json({ error: 'Only the request sender may cancel this match request' }, { status: 403 })
    }
    // Can only cancel if status is 'pending' or 'accepted'
    if (requestData.status !== 'pending' && requestData.status !== 'accepted') {
      return NextResponse.json({ error: 'This match request cannot be cancelled as it has already been processed' }, { status: 400 })
    }
    actorTeamId = requestData.fromTeam?.id
  } else {
    if (requestData.toTeam?.captainId !== decoded.userId) {
      return NextResponse.json({ error: 'Only the opponent team captain may respond to this match request' }, { status: 403 })
    }
    // Can only respond if status is 'pending'
    if (requestData.status !== 'pending') {
      return NextResponse.json({ error: 'This match request has already been responded to and cannot be changed' }, { status: 400 })
    }
    actorTeamId = requestData.toTeam?.id
  }

  const result = await respondToMatchRequestAsync({ requestId: body.requestId, action: body.action, actorTeamId })
  return NextResponse.json(result)
}
