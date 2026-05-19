import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/server/auth/jwt'
import {
  createTeamJoinRequest,
  getTeamJoinRequestById,
  getTeamJoinRequests,
  updateTeamJoinRequestStatus,
  findTeamJoinRequest,
  deleteTeamJoinRequest,
} from '@/lib/server/db/team-requests'
import { getTeamByIdFromDb, addPlayerToTeam } from '@/lib/server/db/teams'
import { findUserById, getUsersByIds, updateUser } from '@/lib/server/db/users'
import { createNotification } from '@/lib/server/db/notifications'
import { sendJoinRequestEmail, sendJoinRequestResponseEmail } from '@/lib/server/email/mailer'

export async function GET(request: NextRequest) {
  try {
    const teamId = request.nextUrl.searchParams.get('teamId')
    if (!teamId) {
      return NextResponse.json({ error: 'teamId is required' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const token = cookieStore.get('playSquareToken')?.value
    const decoded = token ? verifyToken(token) : null
    if (!decoded) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const team = await getTeamByIdFromDb(teamId)
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    if (team.captainId !== decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const requests = await getTeamJoinRequests(teamId)
    const requesterIds = requests.map((request) => request.requesterId)
    const users = await getUsersByIds(requesterIds)
    const requestsWithNames = requests.map((request) => {
      const requester = users.find((user) => user.id === request.requesterId)
      return {
        ...request,
        requesterName: requester ? `${requester.firstName} ${requester.lastName}` : request.requesterId,
        requesterEmail: requester?.phoneOrEmail || '',
      }
    })

    return NextResponse.json({ requests: requestsWithNames })
  } catch (error) {
    console.error('❌ Error in GET /api/team-requests:', error)
    return NextResponse.json({ error: 'Failed to fetch team requests' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const teamId = body.teamId
    if (!teamId) {
      return NextResponse.json({ error: 'teamId is required' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const token = cookieStore.get('playSquareToken')?.value
    const decoded = token ? verifyToken(token) : null
    if (!decoded) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const team = await getTeamByIdFromDb(teamId)
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    if (decoded.userId === team.captainId) {
      return NextResponse.json({ error: 'Captain cannot request to join own team' }, { status: 400 })
    }

    const existingRequest = await findTeamJoinRequest(teamId, decoded.userId)
    if (existingRequest) {
      return NextResponse.json({ error: 'Join request already pending' }, { status: 409 })
    }

    const joinRequest = await createTeamJoinRequest(teamId, decoded.userId)
    const captainUser = await findUserById(team.captainId)
    const requesterUser = await findUserById(decoded.userId)

    if (captainUser) {
      await createNotification({
        userId: captainUser.id,
        teamId: team.id,
        requestId: joinRequest.id,
        title: 'New Join Request',
        message: `${requesterUser?.firstName || 'A player'} requested to join your team ${team.name}`,
        type: 'team_request',
      })

      if (captainUser.email) {
        await sendJoinRequestEmail(
          captainUser.email,
          captainUser.firstName,
          requesterUser ? `${requesterUser.firstName} ${requesterUser.lastName}` : 'a player',
          team.name
        )
      }
    }

    return NextResponse.json({ success: true, request: joinRequest })
  } catch (error) {
    console.error('❌ Error in POST /api/team-requests:', error)
    return NextResponse.json(
      {
        error: 'Failed to create join request',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { requestId, status } = body as { requestId?: string; status?: 'accepted' | 'rejected' }

    if (!requestId || !status) {
      return NextResponse.json({ error: 'requestId and status are required' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const token = cookieStore.get('playSquareToken')?.value
    const decoded = token ? verifyToken(token) : null
    if (!decoded) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const teamRequest = await getTeamJoinRequestById(requestId)
    if (!teamRequest) {
      return NextResponse.json({ error: 'Team request not found' }, { status: 404 })
    }

    const team = await getTeamByIdFromDb(teamRequest.teamId)
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    if (team.captainId !== decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (teamRequest.status !== 'pending') {
      return NextResponse.json({ error: 'Request is already processed' }, { status: 400 })
    }

    const updatedRequest = await updateTeamJoinRequestStatus(requestId, status)
    const requesterUser = await findUserById(teamRequest.requesterId)

    if (status === 'accepted') {
      await addPlayerToTeam(team.id, teamRequest.requesterId)
      await updateUser(teamRequest.requesterId, {
        teamId: team.id,
        isTeamCaptain: false,
      })

      await createNotification({
        userId: teamRequest.requesterId,
        teamId: team.id,
        title: 'Join Request Accepted',
        message: `Your request to join team ${team.name} has been accepted`,
        type: 'team_request_response',
      })

      if (requesterUser?.email) {
        await sendJoinRequestResponseEmail(
          requesterUser.email,
          requesterUser.firstName,
          team.name,
          true
        )
      }
    } else {
      await createNotification({
        userId: teamRequest.requesterId,
        teamId: team.id,
        title: 'Join Request Rejected',
        message: `Your request to join team ${team.name} has been rejected`,
        type: 'team_request_response',
      })

      if (requesterUser?.email) {
        await sendJoinRequestResponseEmail(
          requesterUser.email,
          requesterUser.firstName,
          team.name,
          false
        )
      }
    }

    return NextResponse.json({ success: true, request: updatedRequest })
  } catch (error) {
    console.error('❌ Error in PATCH /api/team-requests:', error)
    return NextResponse.json({ error: 'Failed to update join request' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const requestId = body.requestId
    if (!requestId) {
      return NextResponse.json({ error: 'requestId is required' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const token = cookieStore.get('playSquareToken')?.value
    const decoded = token ? verifyToken(token) : null
    if (!decoded) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const teamRequest = await getTeamJoinRequestById(requestId)
    if (!teamRequest) {
      return NextResponse.json({ error: 'Team request not found' }, { status: 404 })
    }

    const team = await getTeamByIdFromDb(teamRequest.teamId)
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    if (team.captainId !== decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Can only delete pending requests
    if (teamRequest.status !== 'pending') {
      return NextResponse.json({ error: 'This request has already been processed and cannot be deleted' }, { status: 400 })
    }

    await deleteTeamJoinRequest(requestId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Error in DELETE /api/team-requests:', error)
    return NextResponse.json({ error: 'Failed to delete join request', details: error instanceof Error ? error.message : String(error) }, { status: 500 })
  }
}
