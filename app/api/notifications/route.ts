import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/server/auth/jwt'
import { getNotificationsForTeam, getNotificationsForUser, markNotificationsReadForUser } from '@/lib/server/db/notifications'

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('playSquareToken')?.value
  const decoded = token ? verifyToken(token) : null
  if (!decoded) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const teamId = request.nextUrl.searchParams.get('teamId')
  const limitParam = request.nextUrl.searchParams.get('limit')
  const offsetParam = request.nextUrl.searchParams.get('offset')
  const limit = limitParam ? Number(limitParam) : 5
  const offset = offsetParam ? Number(offsetParam) : 0

  if (Number.isNaN(limit) || limit <= 0) {
    return NextResponse.json({ error: 'Invalid limit' }, { status: 400 })
  }

  if (Number.isNaN(offset) || offset < 0) {
    return NextResponse.json({ error: 'Invalid offset' }, { status: 400 })
  }

  if (teamId) {
    const result = await getNotificationsForTeam(teamId, limit, offset)
    return NextResponse.json({ notifications: result.notifications, hasMore: result.hasMore })
  }

  const result = await getNotificationsForUser(decoded.userId, limit, offset)
  return NextResponse.json({ notifications: result.notifications, hasMore: result.hasMore })
}

export async function PATCH(request: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('playSquareToken')?.value
  const decoded = token ? verifyToken(token) : null
  if (!decoded) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  await markNotificationsReadForUser(decoded.userId)
  return NextResponse.json({ ok: true })
}
