import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifySessionJwt } from "@/lib/server/auth/jwt"
import { SESSION_COOKIE_NAME } from "@/lib/server/auth/session"

export const runtime = "nodejs"

export const config = {
  matcher: ["/home/:path*", "/team/:path*", "/matches/:path*", "/squad/:path*", "/settings/:path*"],
}

export function middleware(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value

  // No token -> redirect to login.
  if (!token) {
    return NextResponse.redirect(new URL("/auth/login", req.url))
  }

  try {
    verifySessionJwt(token)
    return NextResponse.next()
  } catch {
    const res = NextResponse.redirect(new URL("/auth/login", req.url))
    return res
  }
}

