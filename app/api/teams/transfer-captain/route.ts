import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/server/auth/jwt'
import { getTeamByIdFromDb, updateTeam } from '@/lib/server/db/teams'
import { findUserById, updateUser } from '@/lib/server/db/users'
import { createNotification } from '@/lib/server/db/notifications'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { teamId, newCaptainId } = body

    if (!teamId || !newCaptainId) {
      return NextResponse.json({ error: 'teamId and newCaptainId are required' }, { status: 400 })
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

    if (team.captainId === newCaptainId) {
      return NextResponse.json({ error: 'Already the current captain' }, { status: 400 })
    }

    if (!team.players?.includes(newCaptainId)) {
      return NextResponse.json({ error: 'New captain must be a member of the team' }, { status: 400 })
    }

    const newCaptainUser = await findUserById(newCaptainId)
    if (!newCaptainUser) {
      return NextResponse.json({ error: 'New captain user not found' }, { status: 404 })
    }

    const previousCaptainUser = await findUserById(team.captainId)

    await updateTeam(teamId, { captainId: newCaptainId })
    await updateUser(newCaptainId, { isTeamCaptain: true })

    if (previousCaptainUser) {
      await updateUser(previousCaptainUser.id, { isTeamCaptain: false })
    }

    await createNotification({
      userId: newCaptainId,
      teamId: team.id,
      title: 'تم اختيارك كابتن جديد',
      message: `تم اختيارك لتكون الكابتن الجديد لفريق ${team.name}`,
      type: 'team_captain_transfer',
      read: false,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Error in POST /api/teams/transfer-captain:', error)
    return NextResponse.json(
      {
        error: 'Failed to transfer captain',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
