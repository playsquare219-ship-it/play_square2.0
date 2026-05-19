import { initializeApp, getApps, cert, App } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"
import { readFileSync } from "fs"
import path from "path"

let adminApp: App | undefined

function getServiceAccount() {
  // ✅ الخيار 1: استخدام مسار ملف JSON (موصى به)
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  
  if (serviceAccountPath) {
    try {
      const absolutePath = path.resolve(process.cwd(), serviceAccountPath)
      const serviceAccount = JSON.parse(readFileSync(absolutePath, 'utf8'))
      return serviceAccount
    } catch (error) {
      console.error("Error reading service account file:", error)
    }
  }
  
  // ✅ الخيار 2: استخدام المتغير البيئي (كحل احتياطي)
  // قراءة المفتاح من `FIREBASE_SERVICE_ACCOUNT_KEY` أو `FIREBASE_SERVICE_ACCOUNT_JSON`
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (raw) {
    try {
      // Trim surrounding whitespace only. We will normalize the private_key after parsing.
      const cleaned = raw.trim()
      const parsed = JSON.parse(cleaned)

      // If the private_key contains escaped newlines ("\\n"), convert them to real newlines.
      if (parsed && typeof parsed.private_key === 'string') {
        parsed.private_key = parsed.private_key.replace(/\\n/g, '\n')
        // Ensure there are no stray carriage returns
        parsed.private_key = parsed.private_key.replace(/\r/g, '')
      }

      return parsed
    } catch (error) {
      console.error("Error parsing FIREBASE_SERVICE_ACCOUNT_JSON:", error)
      throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT_JSON: must be valid JSON")
    }
  }
  
  throw new Error("Missing Firebase service account credentials")
}

export function getFirebaseAdminApp(): App {
  if (adminApp && getApps().length > 0) {
    return adminApp
  }

  const projectId = process.env.FIREBASE_PROJECT_ID
  if (!projectId) throw new Error("Missing FIREBASE_PROJECT_ID env var")

  const serviceAccount = getServiceAccount()

  if (getApps().length === 0) {
    adminApp = initializeApp({
      credential: cert(serviceAccount),
      projectId,
    })
  } else {
    adminApp = getApps()[0]
  }

  return adminApp
}

export const adminAuth = getAuth(getFirebaseAdminApp())

export async function verifyGoogleIdToken(idToken: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    return decodedToken
  } catch (error) {
    throw new Error("Invalid Google ID token")
  }
}