import { db } from '@/lib/server/firebase/firestore'
import { Timestamp } from 'firebase-admin/firestore'

async function addDefaultData() {
  console.log('Adding default data...')

  // Add wilaya
  const wilayaRef = db.collection('wilayas').doc('wilaya_tissemsilt')
  const wilayaExists = await wilayaRef.get()
  if (!wilayaExists.exists) {
    await wilayaRef.set({
      name: 'تيسمسيلت',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
    console.log('Added wilaya تيسمسيلت')
  } else {
    console.log('Wilaya تيسمسيلت already exists')
  }

  // Add baladias
  const baladias = [
    { id: 'baladia_tissemsilt', name: 'تيسمسيلت', wilayaId: 'wilaya_tissemsilt' },
    { id: 'baladia_320_skn', name: '320 سكن', wilayaId: 'wilaya_tissemsilt' },
    { id: 'baladia_119_skn', name: '119 سكن', wilayaId: 'wilaya_tissemsilt' },
  ]

  for (const baladia of baladias) {
    const baladiaRef = db.collection('baladias').doc(baladia.id)
    const baladiaExists = await baladiaRef.get()
    if (!baladiaExists.exists) {
      await baladiaRef.set({
        name: baladia.name,
        wilayaId: baladia.wilayaId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
      console.log(`Added baladia ${baladia.name}`)
    } else {
      console.log(`Baladia ${baladia.name} already exists`)
    }
  }

  // Add stadiums
  const stadiums = [
    { id: 'stadium_320_skn', name: 'حي 320 سكن', wilayaId: 'wilaya_tissemsilt', baladiaId: 'baladia_320_skn' },
    { id: 'stadium_119_skn', name: '119 سكن', wilayaId: 'wilaya_tissemsilt', baladiaId: 'baladia_119_skn' },
  ]

  for (const stadium of stadiums) {
    const stadiumRef = db.collection('stadiums').doc(stadium.id)
    const stadiumExists = await stadiumRef.get()
    if (!stadiumExists.exists) {
      await stadiumRef.set({
        name: stadium.name,
        wilayaId: stadium.wilayaId,
        baladiaId: stadium.baladiaId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
      console.log(`Added stadium ${stadium.name}`)
    } else {
      console.log(`Stadium ${stadium.name} already exists`)
    }
  }

  console.log('Finished adding default data')
}

addDefaultData().catch(console.error)