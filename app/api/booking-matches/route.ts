import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/server/firebase/firestore'
import { Timestamp } from 'firebase-admin/firestore'

const BOOKING_MATCHES_COLLECTION = 'booking_matches'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      requestId, 
      matchRequestId,
      teamId, 
      stadiumName, 
      date, 
      time, 
      wilaya, 
      commune,
      matchDetails 
    } = body

    if (!stadiumName || !date || !time) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Save booking match to Firestore with pending_confirmation status
    const bookingMatchRef = await db.collection(BOOKING_MATCHES_COLLECTION).add({
      requestId: requestId || null,
      matchRequestId: matchRequestId || null,
      teamId: teamId || null,
      stadiumName,
      date,
      time,
      wilaya,
      commune,
      matchDetails: matchDetails || {},
      createdAt: Timestamp.now(),
      status: 'pending_confirmation',
      isTeamBooking: true,
    })

    return NextResponse.json({
      id: bookingMatchRef.id,
      requestId,
      matchRequestId,
      teamId,
      stadiumName,
      date,
      time,
      wilaya,
      commune,
      createdAt: new Date().toISOString(),
      status: 'pending_confirmation',
      isTeamBooking: true,
    })
  } catch (error) {
    console.error('[v0] Error creating booking match:', error)
    return NextResponse.json(
      { error: 'Failed to create booking match' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')
    const requestId = searchParams.get('requestId')

    let query = db.collection(BOOKING_MATCHES_COLLECTION)

    if (teamId) {
      query = query.where('teamId', '==', teamId)
    }

    if (requestId) {
      query = query.where('requestId', '==', requestId)
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get()
    const bookings = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))

    return NextResponse.json({ bookings })
  } catch (error) {
    console.error('[v0] Error fetching booking matches:', error)
    return NextResponse.json({ bookings: [] })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { bookingId, action } = body

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Missing bookingId' },
        { status: 400 }
      )
    }

    const docRef = db.collection(BOOKING_MATCHES_COLLECTION).doc(bookingId)
    const doc = await docRef.get()

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    if (action === 'confirm') {
      // Update status to confirmed
      await docRef.update({
        status: 'confirmed',
        confirmedAt: Timestamp.now(),
      })

      const updatedDoc = await docRef.get()
      return NextResponse.json({
        id: bookingId,
        ...updatedDoc.data(),
      })
    } else if (action === 'cancel') {
      // Update status to cancelled
      await docRef.update({
        status: 'cancelled',
        cancelledAt: Timestamp.now(),
      })

      const updatedDoc = await docRef.get()
      return NextResponse.json({
        id: bookingId,
        ...updatedDoc.data(),
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[v0] Error updating booking match:', error)
    return NextResponse.json(
      { error: 'Failed to update booking match' },
      { status: 500 }
    )
  }
}
