import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/server/auth/jwt'
import { getTeamByIdFromDb } from '@/lib/server/db/teams'
import { findUserById } from '@/lib/server/db/users'
import { createTeamJoinRequest, findTeamJoinRequest } from '@/lib/server/db/team-requests'
import { createNotification } from '@/lib/server/db/notifications'
import { sendJoinRequestEmail } from '@/lib/server/email/mailer'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const teamId = body.teamId

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 })
    }

    const token = cookies().get('playSquareToken')?.value
    const decoded = token ? verifyToken(token) : null
    if (!decoded) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const team = await getTeamByIdFromDb(teamId)
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    if (team.captainId === decoded.userId) {
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
          requesterUser ? `${requesterUser.firstName} ${requesterUser.lastName}` : 'A player',
          team.name
        )
      }
    }

    return NextResponse.json({ success: true, request: joinRequest })
  } catch (error) {
    console.error('❌ Error in POST /api/teams/join:', error)
    return NextResponse.json(
      {
        error: 'Failed to create join request',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
