import { getFirestore, type Firestore } from "firebase-admin/firestore"
import { getFirebaseAdminApp } from "./admin"

let firestoreDb: Firestore

export function getFirestoreDb() {
  if (!firestoreDb) {
    const app = getFirebaseAdminApp()
    firestoreDb = getFirestore(app)
  }
  return firestoreDb
}

export const db = getFirestoreDb()