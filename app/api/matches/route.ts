import { NextRequest, NextResponse } from 'next/server'
import { createMatch, getAllMatchesFromDb, upsertTeam, cancelMatch } from '@/lib/server/db'
import type { Team } from '@/types'

export async function GET() {
  try {
    // Always return all matches
    const matches = await getAllMatchesFromDb()
    return NextResponse.json({ matches })
  } catch (error) {
    console.error('Error fetching matches:', error)
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 })
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
