import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createMatch, getAllMatchesFromDb, upsertTeam, getMatchesByTeamId, cancelMatch } from '@/lib/server/db'
import { verifyToken } from '@/lib/server/auth/jwt'
import { findUserById } from '@/lib/server/db/users'
import type { Team } from '@/types'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('playSquareToken')?.value
    
    // إذا لم يكن هناك توكن، جلب جميع المباريات
    if (!token) {
      console.log('[API /matches] No token provided, fetching all matches')
      const matches = await getAllMatchesFromDb()
      return NextResponse.json({ matches })
    }
    
    const decoded = verifyToken(token)
    
    // إذا كان التوكن غير صالح، جلب جميع المباريات
    if (!decoded) {
      console.log('[API /matches] Invalid token, fetching all matches')
      const matches = await getAllMatchesFromDb()
      return NextResponse.json({ matches })
    }
    
    // الحصول على بيانات المستخدم
    let user
    try {
      user = await findUserById(decoded.userId)
    } catch (userError) {
      console.warn('[API /matches] Failed to fetch user details:', userError)
      user = null
    }
    
    // إذا لم يكن للمستخدم فريق أو فشل جلب المستخدم، جلب جميع المباريات
    if (!user || !user.teamId) {
      console.log('[API /matches] User has no team or user not found, fetching all matches')
      const matches = await getAllMatchesFromDb()
      return NextResponse.json({ matches })
    }
    
    // حاول جلب المباريات الخاصة بفريق المستخدم
    try {
      console.log('[API /matches] Fetching matches for team:', user.teamId)
      const matches = await getMatchesByTeamId(user.teamId)
      return NextResponse.json({ matches })
    } catch (teamError) {
      console.warn('[API /matches] Failed to fetch team matches, falling back to all matches:', teamError)
      const matches = await getAllMatchesFromDb()
      return NextResponse.json({ matches })
    }
  } catch (error) {
    console.error('[API /matches] Fatal error fetching matches:', error)
    try {
      const matches = await getAllMatchesFromDb()
      return NextResponse.json({ matches })
    } catch (fallbackError) {
      console.error('[API /matches] Fallback to all matches also failed:', fallbackError)
      return NextResponse.json({ matches: [], error: 'Failed to fetch matches' }, { status: 500 })
    }
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as { matchId?: string; action?: string }
    if (!body.matchId || body.action !== 'cancel') {
      return NextResponse.json({ error: 'matchId and cancel action are required' }, { status: 400 })
    }

    await cancelMatch(body.matchId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error cancelling match:', error)
    return NextResponse.json({ error: 'Failed to cancel match' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      team1Id?: string
      team2Id?: string
      team1?: Team
      team2?: Team
      stadium?: string
      wilaya?: string
      baladia?: string
      dateTime?: string
      createdByUserId?: string
    }

    console.log('API /matches POST - Received body:', body)

    if (!body.team1 || !body.team2 || !body.team1Id || !body.team2Id || !body.dateTime || !body.createdByUserId) {
      console.log('API /matches POST - Missing required fields')
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    console.log('API /matches POST - Upserting teams...')
    await upsertTeam(body.team1)
    await upsertTeam(body.team2)

    console.log('API /matches POST - Creating match...')
    const match = await createMatch({
      team1: body.team1,
      team2: body.team2,
      stadium: body.stadium,
      wilaya: body.wilaya,
      baladia: body.baladia,
      date: body.dateTime,
      createdByUserId: body.createdByUserId,
    })

    console.log('API /matches POST - Match created successfully:', match.id)
    return NextResponse.json({ match }, { status: 201 })
  } catch (error) {
    console.error('API /matches POST - Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
