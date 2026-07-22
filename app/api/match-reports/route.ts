import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/server/auth/jwt'
import { getMatchById } from '@/lib/server/db/matches'
import {
  createMatchReport,
  getReportsByMatchId,
  getReportByUserAndMatch,
} from '@/lib/server/db/match-reports'
import { validateReport, verifyMatch } from '@/lib/server/services/verification'
import type { Match } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const matchId = request.nextUrl.searchParams.get('matchId')
    const userId = request.nextUrl.searchParams.get('userId')

    if (!matchId) {
      return NextResponse.json({ error: 'matchId is required' }, { status: 400 })
    }

    if (userId) {
      const report = await getReportByUserAndMatch(userId, matchId)
      return NextResponse.json({ report })
    }

    const reports = await getReportsByMatchId(matchId)
    return NextResponse.json({ reports })
  } catch (error) {
    console.error('Error in match-reports GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
      team1Score?: number
      team2Score?: number
    }

    if (!body.matchId || body.team1Score === undefined || body.team2Score === undefined) {
      return NextResponse.json({ error: 'matchId, team1Score, and team2Score are required' }, { status: 400 })
    }

    if (body.team1Score < 0 || body.team2Score < 0) {
      return NextResponse.json({ error: 'Scores cannot be negative' }, { status: 400 })
    }

    const matchDoc = await getMatchById(body.matchId)
    if (!matchDoc) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    const match = matchDoc as Match

    const validation = validateReport(match, decoded.userId, new Date())
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: validation.errorCode ?? 400 })
    }

    const existingReport = await getReportByUserAndMatch(decoded.userId, body.matchId)
    if (existingReport) {
      return NextResponse.json({ error: 'You have already submitted a report for this match' }, { status: 409 })
    }

    const isOnTeam1 = match.team1?.players?.includes(decoded.userId) ?? false
    const teamId = isOnTeam1 ? match.team1Id : match.team2Id

    const report = await createMatchReport({
      matchId: body.matchId,
      userId: decoded.userId,
      teamId,
      team1Score: body.team1Score,
      team2Score: body.team2Score,
    })

    let verificationResult = null
    try {
      verificationResult = await verifyMatch(body.matchId, false)
    } catch (verifyError) {
      console.error('[Match Reports] Verification failed after report submission:', verifyError)
    }

    return NextResponse.json({ report, verification: verificationResult }, { status: 201 })
  } catch (error) {
    console.error('Error in match-reports POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
