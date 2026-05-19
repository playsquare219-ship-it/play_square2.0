import { NextResponse } from 'next/server'
import { getStadiums } from '@/lib/server/db/locations'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const wilayaId = url.searchParams.get('wilayaId')
    const baladiaId = url.searchParams.get('baladiaId')
    const dateTime = url.searchParams.get('dateTime')
    const stadiums = await getStadiums(wilayaId ?? undefined, baladiaId ?? undefined, dateTime ?? undefined)
    return NextResponse.json({ stadiums })
  } catch (error) {
    console.error('Error fetching stadiums:', error)
    return NextResponse.json({ error: 'Failed to fetch stadiums' }, { status: 500 })
  }
}
