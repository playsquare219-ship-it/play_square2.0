import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/server/firebase/firestore'
import { Timestamp } from 'firebase-admin/firestore'

const BOOKINGS_COLLECTION = 'bookings'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const stadiumId = searchParams.get('stadiumId')
    const date = searchParams.get('date')

    if (!stadiumId || !date) {
      return NextResponse.json({ bookedSlots: [] })
    }

    // Query bookings from Firestore
    const snapshot = await db
      .collection(BOOKINGS_COLLECTION)
      .where('stadiumId', '==', parseInt(stadiumId))
      .where('date', '==', date)
      .get()

    const bookedSlots = snapshot.docs.map(doc => doc.data().time)

    return NextResponse.json({ bookedSlots })
  } catch (error) {
    console.error('[v0] Error fetching bookings:', error)
    return NextResponse.json({ bookedSlots: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { stadiumId, stadiumName, date, time, wilaya, commune } = body

    if (!stadiumId || !date || !time) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if slot is already booked
    const existingBooking = await db
      .collection(BOOKINGS_COLLECTION)
      .where('stadiumId', '==', parseInt(stadiumId))
      .where('date', '==', date)
      .where('time', '==', time)
      .limit(1)
      .get()

    if (!existingBooking.empty) {
      return NextResponse.json(
        { error: 'This slot is already booked' },
        { status: 409 }
      )
    }

    // Save booking to Firestore
    const bookingRef = await db.collection(BOOKINGS_COLLECTION).add({
      stadiumId: parseInt(stadiumId),
      stadiumName,
      date,
      time,
      wilaya,
      commune,
      createdAt: Timestamp.now(),
      status: 'confirmed',
    })

    return NextResponse.json({
      id: bookingRef.id,
      stadiumId,
      stadiumName,
      date,
      time,
      wilaya,
      commune,
      createdAt: new Date().toISOString(),
      status: 'confirmed',
    })
  } catch (error) {
    console.error('[v0] Error creating booking:', error)
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}
