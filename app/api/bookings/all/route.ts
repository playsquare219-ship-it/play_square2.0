import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/server/firebase/firestore'

const BOOKINGS_COLLECTION = 'bookings'

export async function GET(request: NextRequest) {
  try {
    // Get all bookings from Firestore (sorted by date, newest first)
    const snapshot = await db
      .collection(BOOKINGS_COLLECTION)
      .orderBy('createdAt', 'desc')
      .get()

    const bookings = snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        stadiumName: data.stadiumName,
        date: data.date,
        time: data.time,
        wilaya: data.wilaya,
        commune: data.commune,
        createdAt: data.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
        status: data.status || 'confirmed',
      }
    })

    return NextResponse.json({ bookings })
  } catch (error) {
    console.error('[v0] Error fetching all bookings:', error)
    return NextResponse.json({ bookings: [] })
  }
}
