import { NextResponse } from 'next/server'
import { db } from '@/lib/server/firebase/firestore'
import { Timestamp } from 'firebase-admin/firestore'

export async function POST() {
  try {
    console.log('Adding default data...')

    // Add wilaya
    const wilayaRef = db.collection('wilayas').doc('wilaya_tissemsilt')
    await wilayaRef.set({
      name: 'تيسمسيلت',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
    console.log('Added wilaya تيسمسيلت')

    // Add baladias
    const baladias = [
      { id: 'baladia_tissemsilt', name: 'تيسمسيلت', wilayaId: 'wilaya_tissemsilt' },
    ]

    for (const baladia of baladias) {
      const baladiaRef = db.collection('baladias').doc(baladia.id)
      await baladiaRef.set({
        name: baladia.name,
        wilayaId: baladia.wilayaId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
      console.log(`Added baladia ${baladia.name}`)
    }

    // Add stadiums
    const stadiums = [
      { id: 'stadium_320_skn', name: '320 سكن', wilayaId: 'wilaya_tissemsilt', baladiaId: 'baladia_tissemsilt' },
      { id: 'stadium_119_skn', name: '119 سكن', wilayaId: 'wilaya_tissemsilt', baladiaId: 'baladia_tissemsilt' },
    ]

    for (const stadium of stadiums) {
      const stadiumRef = db.collection('stadiums').doc(stadium.id)
      await stadiumRef.set({
        name: stadium.name,
        wilayaId: stadium.wilayaId,
        baladiaId: stadium.baladiaId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
      console.log(`Added stadium ${stadium.name}`)
    }

    console.log('Finished adding default data')
    return NextResponse.json({ message: 'Default data added successfully' })
  } catch (error) {
    console.error('Error adding default data:', error)
    return NextResponse.json({ error: 'Failed to add default data' }, { status: 500 })
  }
}