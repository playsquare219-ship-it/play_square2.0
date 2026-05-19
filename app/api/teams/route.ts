// app/api/teams/route.ts - النسخة المصححة
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/server/auth/jwt'
import { getAllTeamsFromDb, createTeam, getTeamByIdFromDb, getTeamsByPlayerId } from '@/lib/server/db/teams'
import { findUserById, updateUser } from '@/lib/server/db/users'
import type { TeamCreateInput } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query')?.trim() ?? ''
    const id = searchParams.get('id') ?? undefined
    const mine = searchParams.get('mine') ?? undefined
    const playerId = searchParams.get('playerId') ?? undefined
    const excludeTeamId = searchParams.get('excludeTeamId') ?? undefined

    if (id) {
      const team = await getTeamByIdFromDb(id)
      return NextResponse.json({ team: team || null })
    }

    if (mine === 'true') {
      const cookieStore = await cookies()
      const token = cookieStore.get('playSquareToken')?.value
      const decoded = token ? verifyToken(token) : null
      if (!decoded) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }
      const teams = await getTeamsByPlayerId(decoded.userId)
      return NextResponse.json({ teams })
    }

    let teams = playerId ? await getTeamsByPlayerId(playerId) : await getAllTeamsFromDb()

    if (query) {
      teams = teams.filter(t =>
        t.name.toLowerCase().includes(query.toLowerCase()) ||
        t.wilaya?.toLowerCase().includes(query.toLowerCase())
      )
    }

    if (excludeTeamId) {
      teams = teams.filter(t => t.id !== excludeTeamId)
    }

    return NextResponse.json({ teams })
  } catch (error) {
    console.error('Error in GET /api/teams:', error)
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const teamData = body.team || body
    const cookieStore = await cookies()
    const token = cookieStore.get('playSquareToken')?.value
    const decoded = token ? verifyToken(token) : null
    const currentUserId = decoded?.userId

    console.log('📥 POST /api/teams - Received:', {
      name: teamData.name,
      captainId: teamData.captainId,
      wilaya: teamData.wilaya,
      currentUserId,
    })

    if (!teamData.name) {
      return NextResponse.json(
        { error: 'Team name is required' },
        { status: 400 }
      )
    }

    const captainId = currentUserId || teamData.captainId
    if (!captainId) {
      return NextResponse.json(
        { error: 'Captain ID is required' },
        { status: 400 }
      )
    }

    const input: TeamCreateInput = {
      name: teamData.name.trim(),
      captainId,
      wilaya: teamData.wilaya || '',
      baladia: teamData.location || teamData.baladia || '',
    }

    const newTeam = await createTeam(input)

    if (currentUserId) {
      await updateUser(currentUserId, {
        teamId: newTeam.id,
        isTeamCaptain: true,
      })
    }

    return NextResponse.json(
      {
        success: true,
        team: newTeam,
        message: 'Team created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('❌ Error in POST /api/teams:', error)
    return NextResponse.json(
      {
        error: 'Failed to create team',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

// ✅ إضافة PUT للتحديث (اختياري)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      )
    }

    // استيراد updateTeam من server/db
    const { updateTeam } = await import('@/lib/server/db/teams')
    await updateTeam(id, updates)

    return NextResponse.json({ 
      success: true,
      message: 'Team updated successfully' 
    })

  } catch (error) {
    console.error('❌ Error in PUT /api/teams:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete team',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

// ✅ إضافة DELETE للحذف (اختياري)
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const token = cookieStore.get('playSquareToken')?.value
    const decoded = token ? verifyToken(token) : null
    if (!decoded) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { deleteTeam } = await import('@/lib/server/db/teams')

    const team = await getTeamByIdFromDb(id)
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    if (team.captainId !== decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    console.log('📌 DELETE /api/teams - deleting team', { teamId: id, playerCount: team.players?.length ?? 0 })

    const playerUpdates = team.players?.map(async (playerId: string) => {
      const player = await findUserById(playerId)
      if (!player) {
        console.warn(`Skipping update for missing user ${playerId}`)
        return
      }
      await updateUser(playerId, { teamId: null, isTeamCaptain: false })
    })

    if (playerUpdates) {
      await Promise.all(playerUpdates)
    }

    await deleteTeam(id)

    return NextResponse.json({ 
      success: true,
      message: 'Team deleted successfully' 
    })

  } catch (error) {
    console.error('❌ Error in DELETE /api/teams:', error)
    return NextResponse.json(
      { error: 'Failed to delete team' },
      { status: 500 }
    )
  }
}