import { cookies } from "next/headers"
import type { NextResponse } from "next/server"
import type { AppUser } from "@/types"
import { generateToken, verifyToken } from "@/lib/server/auth/jwt"

export const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "playSquareToken"

/**
 * إنشاء جلسة للمستخدم وحفظها في Cookie
 */
export async function createSession(user: AppUser): Promise<string> {
  const token = generateToken(user.id, user.phoneOrEmail)
  
  // ✅ إضافة await
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  })
  
  return token
}

/**
 * الحصول على المستخدم من الجلسة الحالية
 */
export async function getSessionUserFromCookies(): Promise<AppUser | null> {
  // ✅ إضافة await
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  
  if (!token) return null
  
  try {
    const decoded = verifyToken(token)
    if (!decoded) return null
    
    // هنا يمكنك جلب المستخدم من قاعدة البيانات باستخدام decoded.userId
    // return await getUserById(decoded.userId);
    
    // مؤقتاً نعيد بيانات بسيطة
    return {
      id: decoded.userId,
      firstName: "",
      lastName: "",
      phoneOrEmail: decoded.email,
      provider: "email",
    } as AppUser
    
  } catch (error) {
    console.error("Error verifying session:", error)
    return null
  }
}

/**
 * الحصول على الجلسة الحالية من Cookie (للاستخدام العام)
 */
export async function getSession(): Promise<{ userId: string; email: string } | null> {
  // ✅ إضافة await
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  
  if (!token) return null
  
  const decoded = verifyToken(token)
  if (!decoded) return null
  
  return {
    userId: decoded.userId,
    email: decoded.email,
  }
}

/**
 * حذف الجلسة (تسجيل الخروج)
 */
export async function destroySession(response?: NextResponse): Promise<void> {
  // ✅ إضافة await
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
  
  if (response) {
    response.cookies.delete(SESSION_COOKIE_NAME)
  }
}

/**
 * حذف جلسة من Response (alias for destroySession)
 */
export function clearSessionCookie(response: NextResponse): void {
  response.cookies.delete(SESSION_COOKIE_NAME)
}

/**
 * إضافة الجلسة إلى Response (للاستخدام في API Routes)
 */
export function addSessionToResponse(response: NextResponse, user: AppUser): NextResponse {
  const token = generateToken(user.id, user.phoneOrEmail)
  
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  })
  
  return response
}