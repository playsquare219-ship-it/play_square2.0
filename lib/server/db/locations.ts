import { db } from '@/lib/server/firebase/firestore'
import { Timestamp } from 'firebase-admin/firestore'
import type { Stadium, Wilaya, Baladia } from '@/types'

const WILAYAS_COLLECTION = 'wilayas'
const BALADIAS_COLLECTION = 'baladias'
const STADIUMS_COLLECTION = 'stadiums'

const DEFAULT_WILAYAS: Array<Omit<Wilaya, 'id' | 'createdAt' | 'updatedAt'>> = [
  { name: 'تيسمسيلت' },
]

const DEFAULT_BALADIAS: Array<Omit<Baladia, 'id' | 'createdAt' | 'updatedAt'>> = [
  {
    name: 'تيسمسيلت',
    wilayaId: 'wilaya_tissemsilt',
  },
]

const DEFAULT_STADIUMS: Array<Omit<Stadium, 'id' | 'createdAt' | 'updatedAt'>> = [
  {
    name: '320 سكن',
    wilayaId: 'wilaya_tissemsilt',
    baladiaId: 'baladia_tissemsilt',
  },
  {
    name: '119 سكن',
    wilayaId: 'wilaya_tissemsilt',
    baladiaId: 'baladia_tissemsilt',
  },
]

async function ensureDefaultWilayas(): Promise<void> {
  const wilayaRef = db.collection(WILAYAS_COLLECTION)
  const existing = await wilayaRef.doc('wilaya_tissemsilt').get()
  if (!existing.exists) {
    const now = Timestamp.now()
    await wilayaRef.doc('wilaya_tissemsilt').set({
      name: 'تيسمسيلت',
      createdAt: now,
      updatedAt: now,
    })
  }
}

async function ensureDefaultBaladias(): Promise<void> {
  const baladiaRef = db.collection(BALADIAS_COLLECTION)
  for (const baladia of DEFAULT_BALADIAS) {
    const docId = baladia.wilayaId === 'wilaya_tissemsilt' && baladia.name === 'تيسمسيلت'
      ? 'baladia_tissemsilt'
      : `baladia_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

    try {
      const existing = await baladiaRef.doc(docId).get()
      if (!existing.exists) {
        const now = Timestamp.now()
        await baladiaRef.doc(docId).set({
          name: baladia.name,
          wilayaId: baladia.wilayaId,
          createdAt: now,
          updatedAt: now,
        })
      }
    } catch (error) {
      console.error(`Error ensuring baladia ${baladia.name}:`, error)
    }
  }
}

async function ensureDefaultStadiums(): Promise<void> {
  const stadiumRef = db.collection(STADIUMS_COLLECTION)
  for (const stadium of DEFAULT_STADIUMS) {
    const docId = stadium.wilayaId === 'wilaya_tissemsilt' && stadium.name === '320 سكن'
      ? 'stadium_320_skn'
      : stadium.wilayaId === 'wilaya_tissemsilt' && stadium.name === '119 سكن'
      ? 'stadium_119_skn'
      : `stadium_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

    const existing = await stadiumRef.doc(docId).get()
    if (!existing.exists) {
      const now = Timestamp.now()
      await stadiumRef.doc(docId).set({
        name: stadium.name,
        wilayaId: stadium.wilayaId,
        baladiaId: stadium.baladiaId,
        createdAt: now,
        updatedAt: now,
      })
    }
  }
}

export async function getWilayas(): Promise<Wilaya[]> {
  await ensureDefaultWilayas()

  const querySnapshot = await db.collection(WILAYAS_COLLECTION).orderBy('name', 'asc').get()
  return querySnapshot.docs.map((doc) => {
    const data = doc.data() as any
    return {
      id: doc.id,
      name: data.name,
      createdAt: data.createdAt?.toDate?.()?.toISOString?.() || String(data.createdAt),
      updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || String(data.updatedAt),
    }
  })
}

export async function getBaladias(wilayaId?: string): Promise<Baladia[]> {
  await ensureDefaultWilayas()
  await ensureDefaultBaladias()

  let collection = db.collection(BALADIAS_COLLECTION)
  if (wilayaId) {
    collection = collection.where('wilayaId', '==', wilayaId)
  } else {
    collection = collection.orderBy('name', 'asc')
  }

  const querySnapshot = await collection.get()
  const baladias = querySnapshot.docs.map((doc) => {
    const data = doc.data() as any
    return {
      id: doc.id,
      name: data.name,
      wilayaId: data.wilayaId,
      createdAt: data.createdAt?.toDate?.()?.toISOString?.() || String(data.createdAt),
      updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || String(data.updatedAt),
    }
  })

  if (wilayaId) {
    baladias.sort((a, b) => a.name.localeCompare(b.name))
  }

  return baladias
}

export async function getStadiums(wilayaId?: string, baladiaId?: string): Promise<Stadium[]> {
  await ensureDefaultWilayas()
  await ensureDefaultBaladias()
  await ensureDefaultStadiums()

  let collection = db.collection(STADIUMS_COLLECTION)
  if (wilayaId) {
    collection = collection.where('wilayaId', '==', wilayaId)
  }
  if (baladiaId) {
    collection = collection.where('baladiaId', '==', baladiaId)
  }

  const querySnapshot = await collection.get()
  const stadiums = querySnapshot.docs.map((doc) => {
    const data = doc.data() as any
    return {
      id: doc.id,
      name: data.name,
      wilayaId: data.wilayaId,
      baladiaId: data.baladiaId,
      createdAt: data.createdAt?.toDate?.()?.toISOString?.() || String(data.createdAt),
      updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || String(data.updatedAt),
    }
  })

  stadiums.sort((a, b) => a.name.localeCompare(b.name))
  return stadiums
}

export async function getStadiumById(stadiumId: string): Promise<Stadium | null> {
  const stadiumDoc = await db.collection(STADIUMS_COLLECTION).doc(stadiumId).get()
  if (!stadiumDoc.exists) return null

  const data = stadiumDoc.data() as any
  return {
    id: stadiumDoc.id,
    name: data.name,
    wilayaId: data.wilayaId,
    baladiaId: data.baladiaId,
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() || String(data.createdAt),
    updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || String(data.updatedAt),
  }
}
