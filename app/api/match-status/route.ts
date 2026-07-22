import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/server/auth/jwt'
import { getMatchById, updateMatch } from '@/lib/server/db/matches'
import { createNotification } from '@/lib/server/db/notifications'
import type { Match } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('playSquareToken')?.value
    const decoded = token ? verifyToken(token) : null
    if (!decoded) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = (await request.json()) as {
      matchId?: string
      action?: 'start' | 'end'
    }

    if (!body.matchId || !body.action) {
      return NextResponse.json({ error: 'matchId and action are required' }, { status: 400 })
    }

    const matchDoc = await getMatchById(body.matchId)
    if (!matchDoc) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    const match = matchDoc as Match

    const isCaptain =
      match.team1?.captainId === decoded.userId ||
      match.team2?.captainId === decoded.userId

    if (!isCaptain) {
      return NextResponse.json({ error: 'Only team captains can update match status' }, { status: 403 })
    }

    if (body.action === 'start') {
      if (match.status !== 'scheduled') {
        return NextResponse.json({ error: 'Match can only be started from scheduled status' }, { status: 400 })
      }

      const durationMinutes = match.durationMinutes ?? 90
      const matchStart = new Date(match.dateTime)
      const endTime = new Date(matchStart.getTime() + durationMinutes * 60 * 1000)

      await updateMatch(body.matchId, {
        status: 'live',
        durationMinutes,
        endTime: endTime.toISOString(),
      })

      return NextResponse.json({ success: true, status: 'live' })
    }

    if (body.action === 'end') {
      if (match.status !== 'live') {
        return NextResponse.json({ error: 'Match can only be ended from live status' }, { status: 400 })
      }

      await updateMatch(body.matchId, {
        status: 'reporting',
      })

      const allPlayerIds = [
        ...(match.team1?.players ?? []),
        ...(match.team2?.players ?? []),
      ]
      const uniquePlayerIds = [...new Set(allPlayerIds)]

      for (const playerId of uniquePlayerIds) {
        try {
          await createNotification({
            userId: playerId,
            matchId: match.id,
            title: 'Match Report Required',
            message: `Please submit your report for ${match.team1.name} vs ${match.team2.name}. Reporting closes at midnight.`,
            type: 'match_report_request',
            read: false,
          })
        } catch (notifError) {
          console.error('[Match Status] Failed to send report request notification to:', playerId, notifError)
        }
      }

      return NextResponse.json({ success: true, status: 'reporting' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error in match-status POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
