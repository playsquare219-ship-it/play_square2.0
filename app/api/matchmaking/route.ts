import { NextRequest, NextResponse } from 'next/server'
import { cancelMatchmaking, enqueueTeamForMatchmaking, getMatchmakingStatus, updateTeam } from '@/lib/server/db'
import type { Team } from '@/types'

export async function GET(request: NextRequest) {
  const teamId = request.nextUrl.searchParams.get('teamId')
  if (!teamId) {
    return NextResponse.json({ error: 'teamId is required' }, { status: 400 })
  }

  const result = getMatchmakingStatus(teamId)
  return NextResponse.json(result)
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { team?: Team; mode?: 'instant' | 'random' }
  if (!body.team || !body.mode) {
    return NextResponse.json({ error: 'team and mode are required' }, { status: 400 })
  }

  // تحديث بيانات الفريق إذا لزم الأمر
  if (body.team.id) {
    await updateTeam(body.team.id, {
      name: body.team.name,
      photoURL: body.team.photoURL,
      wilaya: body.team.wilaya,
      baladia: body.team.baladia,
    })
  }
  
  const result = enqueueTeamForMatchmaking({ team: body.team, mode: body.mode })
  return NextResponse.json(result)
}

export async function DELETE(request: NextRequest) {
  const teamId = request.nextUrl.searchParams.get('teamId')
  if (!teamId) {
    return NextResponse.json({ error: 'teamId is required' }, { status: 400 })
  }

  cancelMatchmaking(teamId)
  return NextResponse.json({ ok: true })
}
