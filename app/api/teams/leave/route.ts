import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/server/auth/jwt'
import { getTeamByIdFromDb, removePlayerFromTeam } from '@/lib/server/db/teams'
import { findUserById, updateUser } from '@/lib/server/db/users'
import { createNotification } from '@/lib/server/db/notifications'

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

    if (team.captainId === decoded.userId) {
      return NextResponse.json({ error: 'Captain cannot leave own team' }, { status: 400 })
    }

    if (!team.players?.includes(decoded.userId)) {
      return NextResponse.json({ error: 'You are not a member of this team' }, { status: 400 })
    }

    const user = await findUserById(decoded.userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    await removePlayerFromTeam(teamId, decoded.userId)
    await updateUser(decoded.userId, { teamId: null, isTeamCaptain: false })

    const captainUser = await findUserById(team.captainId)
    if (captainUser) {
      await createNotification({
        userId: captainUser.id,
        teamId: team.id,
        title: 'غادر لاعب الفريق',
        message: `${user.firstName} ${user.lastName} غادر فريقك ${team.name}`,
        type: 'team_request_response',
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Error in POST /api/teams/leave:', error)
    return NextResponse.json(
      {
        error: 'Failed to leave team',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
