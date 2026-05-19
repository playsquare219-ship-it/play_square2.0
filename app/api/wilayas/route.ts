import { NextResponse } from 'next/server'
import { getWilayas } from '@/lib/server/db/locations'

export async function GET() {
  try {
    const wilayas = await getWilayas()
    return NextResponse.json({ wilayas })
  } catch (error) {
    console.error('Error fetching wilayas:', error)
    return NextResponse.json({ error: 'Failed to fetch wilayas' }, { status: 500 })
  }
}
