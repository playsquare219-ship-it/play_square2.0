import { db } from "@/lib/server/firebase/firestore"
import { Timestamp } from "firebase-admin/firestore"
import type { AppUser, AuthProvider } from "@/types"
import bcrypt from "bcryptjs"

// ============================================
// الأنواع (Types)
// ============================================

export type DbUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  password?: string           // bcrypt hash (only for email/password users)
  provider: AuthProvider      // 'email' | 'google'
  photoURL?: string
  verified: boolean           // تم التحقق من البريد الإلكتروني
  verificationToken?: string  // رمز التحقق
  verificationTokenExpiry?: Timestamp // انتهاء صلاحية الرمز
  wilaya?: string
  baladia?: string
  teamId?: string | null
  isTeamCaptain?: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

export type PendingRegistration = {
  id: string
  email: string
  firstName: string
  lastName: string
  password: string            // bcrypt hash
  provider: AuthProvider
  verificationToken: string
  verificationTokenExpiry: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
  wilaya?: string
  baladia?: string
}

// ============================================
// دوال مساعدة (Helper Functions)
// ============================================

const USERS_COLLECTION = "users"
const PENDING_REGISTRATIONS_COLLECTION = "pending_registrations"

function normalizeIdentifier(input: string): string {
  const trimmed = input.trim()
  if (trimmed.includes("@")) return trimmed.toLowerCase()
  return trimmed
}

function toAppUser(dbUser: DbUser): AppUser {
  return {
    id: dbUser.id,
    firstName: dbUser.firstName,
    lastName: dbUser.lastName,
    phoneOrEmail: dbUser.email,
    provider: dbUser.provider,
    photoURL: dbUser.photoURL,
    wilaya: dbUser.wilaya || "",
    baladia: dbUser.baladia || "",
    teamId: dbUser.teamId ?? undefined,
    isTeamCaptain: dbUser.isTeamCaptain,
  }
}

// ============================================
// الدوال الأساسية (CRUD Operations)
// ============================================

/**
 * البحث عن مستخدم بواسطة البريد الإلكتروني
 */
export async function findUserByEmail(identifier: string): Promise<DbUser | null> {
  const email = normalizeIdentifier(identifier)
  
  try {
    const usersRef = db.collection(USERS_COLLECTION)
    const querySnapshot = await usersRef.where("email", "==", email).get()
    
    if (querySnapshot.empty) {
      return null
    }
    
    const userDoc = querySnapshot.docs[0]
    return { id: userDoc.id, ...userDoc.data() } as DbUser
    
  } catch (error) {
    console.error("Error finding user by email:", error)
    throw new Error("Failed to find user")
  }
}

/**
 * البحث عن مستخدم بواسطة ID
 */
export async function findUserById(userId: string): Promise<DbUser | null> {
  try {
    const userRef = db.collection(USERS_COLLECTION).doc(userId)
    const userDoc = await userRef.get()
    
    if (!userDoc.exists) {
      return null
    }
    
    return { id: userDoc.id, ...userDoc.data() } as DbUser
    
  } catch (error) {
    console.error("Error finding user by ID:", error)
    throw new Error("Failed to find user")
  }
}

/**
 * البحث عن تسجيل معلق بواسطة البريد الإلكتروني
 */
export async function findPendingRegistrationByEmail(identifier: string): Promise<PendingRegistration | null> {
  const email = normalizeIdentifier(identifier)
  
  try {
    const registrationsRef = db.collection(PENDING_REGISTRATIONS_COLLECTION)
    const querySnapshot = await registrationsRef.where("email", "==", email).get()
    
    if (querySnapshot.empty) {
      return null
    }
    
    const regDoc = querySnapshot.docs[0]
    return { id: regDoc.id, ...regDoc.data() } as PendingRegistration
    
  } catch (error) {
    console.error("Error finding pending registration by email:", error)
    throw new Error("Failed to find pending registration")
  }
}

/**
 * إنشاء تسجيل مستخدم جديد معلق (في جدول pending_registrations)
 * يتم نقل البيانات إلى جدول users فقط عند التحقق من البريد الإلكتروني
 */
export async function createUnverifiedEmailUser(input: {
  email: string
  firstName: string
  lastName: string
  passwordHash: string
  verificationToken: string
  verificationTokenExpiry: Timestamp
  wilaya?: string
  baladia?: string
}): Promise<PendingRegistration> {
  const normalizedEmail = normalizeIdentifier(input.email)
  
  // التحقق من عدم وجود المستخدم في جدول المستخدمين
  const existingUser = await findUserByEmail(normalizedEmail)
  if (existingUser) {
    throw new Error("User already exists")
  }
  
  // التحقق من عدم وجود تسجيل معلق موجود
  const existingPending = await findPendingRegistrationByEmail(normalizedEmail)
  if (existingPending) {
    throw new Error("Registration already pending for this email")
  }
  
  try {
    const now = Timestamp.now()
    const registrationId = `pending_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    
    const newPending: Omit<PendingRegistration, "id"> = {
      email: normalizedEmail,
      firstName: input.firstName,
      lastName: input.lastName,
      password: input.passwordHash,
      provider: "email",
      verificationToken: input.verificationToken,
      verificationTokenExpiry: input.verificationTokenExpiry,
      createdAt: now,
      updatedAt: now,
    }
    
    // إضافة الحقول الاختيارية فقط إذا كانت معرّفة
    if (input.wilaya) newPending.wilaya = input.wilaya
    if (input.baladia) newPending.baladia = input.baladia
    
    const regRef = db.collection(PENDING_REGISTRATIONS_COLLECTION).doc(registrationId)
    await regRef.set(newPending)
    
    console.log('[Database] Created pending registration:', normalizedEmail);
    return { id: registrationId, ...newPending }
    
  } catch (error) {
    console.error("Error creating pending registration:", error)
    throw new Error("Failed to create pending registration")
  }
}

/**
 * إنشاء مستخدم جديد (بريد إلكتروني وكلمة مرور)
 */
export async function createEmailPasswordUser(input: {
  email: string
  firstName: string
  lastName: string
  passwordHash: string
  photoURL?: string
  wilaya?: string
  baladia?: string
}): Promise<DbUser> {
  const normalizedEmail = normalizeIdentifier(input.email)
  
  // التحقق من عدم وجود المستخدم مسبقًا
  const existingUser = await findUserByEmail(normalizedEmail)
  if (existingUser) {
    throw new Error("User already exists")
  }
  
  try {
    const now = Timestamp.now()
    const userId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    
    const newUser: Omit<DbUser, "id"> = {
      email: normalizedEmail,
      firstName: input.firstName,
      lastName: input.lastName,
      password: input.passwordHash,
      provider: "email",
      verified: true,
      createdAt: now,
      updatedAt: now,
    }
    
    // إضافة الحقول الاختيارية فقط إذا كانت معرّفة
    if (input.photoURL) newUser.photoURL = input.photoURL
    if (input.wilaya) newUser.wilaya = input.wilaya
    if (input.baladia) newUser.baladia = input.baladia
    
    const userRef = db.collection(USERS_COLLECTION).doc(userId)
    await userRef.set(newUser)
    
    return { id: userId, ...newUser }
    
  } catch (error) {
    console.error("Error creating user:", error)
    throw new Error("Failed to create user")
  }
}

/**
 * إنشاء أو تحديث مستخدم Google
 */
export async function createOrUpdateGoogleUser(input: {
  email: string
  firstName: string
  lastName: string
  photoURL?: string
}): Promise<DbUser> {
  const normalizedEmail = normalizeIdentifier(input.email)
  const now = Timestamp.now()
  
  try {
    // البحث عن المستخدم
    const existingUser = await findUserByEmail(normalizedEmail)
    
    if (existingUser) {
      // تحديث المستخدم الموجود
      const userRef = db.collection(USERS_COLLECTION).doc(existingUser.id)
      const updates: Partial<DbUser> = {
        firstName: input.firstName || existingUser.firstName,
        lastName: input.lastName || existingUser.lastName,
        photoURL: input.photoURL ?? existingUser.photoURL,
        provider: "google",
        verified: true,
        updatedAt: now,
      }
      
      await userRef.update(updates)
      
      // إرجاع المستخدم المحدث
      const updatedUser = { ...existingUser, ...updates }
      return updatedUser as DbUser
    }
    
    // إنشاء مستخدم جديد
    const userId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    
    const newUser: Omit<DbUser, "id"> = {
      email: normalizedEmail,
      firstName: input.firstName,
      lastName: input.lastName,
      provider: "google",
      verified: true,
      createdAt: now,
      updatedAt: now,
    }
    
    // إضافة الصورة الشخصية فقط إذا كانت معرّفة
    if (input.photoURL) newUser.photoURL = input.photoURL
    
    const userRef = db.collection(USERS_COLLECTION).doc(userId)
    await userRef.set(newUser)
    
    return { id: userId, ...newUser }
    
  } catch (error) {
    console.error("Error creating/updating Google user:", error)
    throw new Error("Failed to process Google user")
  }
}

/**
 * التحقق من صحة البريد الإلكتروني وكلمة المرور
 */
export async function verifyEmailPassword(identifier: string, password: string): Promise<DbUser | null> {
  const user = await findUserByEmail(identifier)
  
  if (!user) return null
  if (user.provider !== "email") return null
  if (!user.password) return null
  
  const isValid = await bcrypt.compare(password, user.password)
  
  if (!isValid) return null
  
  return user
}

/**
 * التحقق من رمز تحقق البريد الإلكتروني
 * البحث في جدول pending_registrations
 */
export async function verifyEmailToken(token: string): Promise<PendingRegistration | null> {
  try {
    const registrationsRef = db.collection(PENDING_REGISTRATIONS_COLLECTION)
    const querySnapshot = await registrationsRef
      .where("verificationToken", "==", token)
      .get()

    if (querySnapshot.empty) {
      console.log('[Database] Verification token not found');
      return null
    }

    const regDoc = querySnapshot.docs[0]
    const pending = { id: regDoc.id, ...regDoc.data() } as PendingRegistration

    // التحقق من انتهاء صلاحية الرمز
    if (pending.verificationTokenExpiry) {
      const now = Timestamp.now()
      if (now > pending.verificationTokenExpiry) {
        console.log('[Database] Verification token expired');
        return null // انتهت صلاحية الرمز
      }
    }

    console.log('[Database] Valid verification token found for:', pending.email);
    return pending
  } catch (error) {
    console.error("Error verifying email token:", error)
    return null
  }
}

/**
 * تحديث حالة المستخدم إلى مفعّل
 * نقل البيانات من pending_registrations إلى users
 */
export async function markEmailAsVerified(pendingRegistrationId: string): Promise<DbUser | null> {
  try {
    // جلب التسجيل المعلق
    const pendingRef = db.collection(PENDING_REGISTRATIONS_COLLECTION).doc(pendingRegistrationId)
    const pendingDoc = await pendingRef.get()
    
    if (!pendingDoc.exists) {
      console.error('[Database] Pending registration not found:', pendingRegistrationId);
      return null
    }
    
    const pending = { id: pendingDoc.id, ...pendingDoc.data() } as PendingRegistration
    
    // إنشاء مستخدم جديد في جدول users
    const now = Timestamp.now()
    const userId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    
    const newUser: Omit<DbUser, "id"> = {
      email: pending.email,
      firstName: pending.firstName,
      lastName: pending.lastName,
      password: pending.password,
      provider: pending.provider,
      verified: true, // تفعيل الحساب
      createdAt: pending.createdAt,
      updatedAt: now,
    }
    
    // إضافة الحقول الاختيارية
    if (pending.wilaya) newUser.wilaya = pending.wilaya
    if (pending.baladia) newUser.baladia = pending.baladia
    
    // حفظ المستخدم الجديد
    const userRef = db.collection(USERS_COLLECTION).doc(userId)
    await userRef.set(newUser)
    
    console.log('[Database] User created from pending registration:', pending.email);
    
    // حذف التسجيل المعلق
    await pendingRef.delete()
    console.log('[Database] Pending registration deleted:', pending.email);
    
    return { id: userId, ...newUser } as DbUser
    
  } catch (error) {
    console.error("Error marking email as verified:", error)
    throw new Error("Failed to verify email")
  }
}

/**
 * تحويل DbUser إلى AppUser (بدون بيانات حساسة)
 */
export function dbUserToAppUser(dbUser: DbUser): AppUser {
  return toAppUser(dbUser)
}

/**
 * الحصول على AppUser بواسطة البريد الإلكتروني
 */
export async function getAppUserByIdentifier(identifier: string): Promise<AppUser | null> {
  const user = await findUserByEmail(identifier)
  return user ? toAppUser(user) : null
}

/**
 * الحصول على AppUser بواسطة ID
 */
export async function getAppUserById(userId: string): Promise<AppUser | null> {
  const user = await findUserById(userId)
  return user ? toAppUser(user) : null
}

export async function getUsersByIds(userIds: string[]): Promise<AppUser[]> {
  if (userIds.length === 0) {
    return []
  }

  const users: AppUser[] = []
  const promises = userIds.map(async (id) => {
    const dbUser = await findUserById(id)
    if (dbUser) {
      users.push(toAppUser(dbUser))
    }
  })

  await Promise.all(promises)
  return users
}

/**
 * تحديث بيانات المستخدم
 */
export async function updateUser(userId: string, updates: Partial<Omit<DbUser, "id" | "createdAt">>): Promise<void> {
  try {
    const userRef = db.collection(USERS_COLLECTION).doc(userId)
    const sanitizedUpdates: Partial<Omit<DbUser, "id" | "createdAt">> = {}

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        sanitizedUpdates[key as keyof typeof sanitizedUpdates] = value
      }
    })

    if (Object.keys(sanitizedUpdates).length === 0) {
      return
    }

    await userRef.update({
      ...sanitizedUpdates,
      updatedAt: Timestamp.now(),
    })
  } catch (error) {
    console.error("Error updating user:", error)
    throw new Error("Failed to update user")
  }
}

/**
 * حذف مستخدم
 */
export async function deleteUser(userId: string): Promise<void> {
  try {
    const userRef = db.collection(USERS_COLLECTION).doc(userId)
    await userRef.delete()
  } catch (error) {
    console.error("Error deleting user:", error)
    throw new Error("Failed to delete user")
  }
}

/**
 * الحصول على جميع المستخدمين (للوحة التحكم)
 */
export async function getAllUsers(limitCount = 100): Promise<AppUser[]> {
  try {
    const querySnapshot = await db.collection(USERS_COLLECTION).limit(limitCount).get()
    
    const users: AppUser[] = []
    querySnapshot.forEach((doc) => {
      const userData = doc.data() as DbUser
      users.push(toAppUser({ ...userData, id: doc.id }))
    })
    
    return users
    
  } catch (error) {
    console.error("Error getting all users:", error)
    throw new Error("Failed to get users")
  }
}