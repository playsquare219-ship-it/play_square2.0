import { NextRequest, NextResponse } from 'next/server'
import { getAllDirectChallenges, createDirectChallenge, updateDirectChallengeStatus } from '@/lib/server/db'
import type { DirectChallenge } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const challenges = await getAllDirectChallenges()
    return NextResponse.json({ challenges })
  } catch (error) {
    console.error("Error fetching direct challenges:", error)
    return NextResponse.json({ error: 'Failed to fetch challenges' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Omit<DirectChallenge, "id">
    
    const challenge = await createDirectChallenge(body)
    return NextResponse.json({ challenge }, { status: 201 })
  } catch (error) {
    console.error("Error creating direct challenge:", error)
    return NextResponse.json({ error: 'Failed to create challenge' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { challengeId, status } = await request.json() as { 
      challengeId: string
      status: 'accepted' | 'rejected' | 'cancelled'
    }

    if (!challengeId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    await updateDirectChallengeStatus(challengeId, status)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error updating challenge status:", error)
    return NextResponse.json({ error: 'Failed to update challenge' }, { status: 500 })
  }
}
