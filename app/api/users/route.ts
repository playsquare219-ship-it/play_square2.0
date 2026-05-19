import { NextRequest, NextResponse } from 'next/server'
import { getUsersByIds } from '@/lib/server/db/users'

export async function GET(request: NextRequest) {
  try {
    const ids = request.nextUrl.searchParams.get('ids')
    if (!ids) {
      return NextResponse.json({ error: 'ids are required' }, { status: 400 })
    }

    const userIds = ids.split(',').map((id) => id.trim()).filter(Boolean)
    const users = await getUsersByIds(userIds)

    return NextResponse.json({ users })
  } catch (error) {
    console.error('❌ Error in GET /api/users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}
