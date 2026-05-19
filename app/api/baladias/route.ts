import { NextResponse } from 'next/server'
import { getBaladias } from '@/lib/server/db/locations'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const wilayaId = url.searchParams.get('wilayaId')
    const baladias = await getBaladias(wilayaId ?? undefined)
    return NextResponse.json({ baladias })
  } catch (error) {
    console.error('Error fetching baladias:', error)
    return NextResponse.json({ error: 'Failed to fetch baladias' }, { status: 500 })
  }
}