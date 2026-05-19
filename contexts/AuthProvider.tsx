import type { ReactNode } from "react"
import { getSessionUserFromCookies } from "@/lib/server/auth/session"
import { AuthProviderClient } from "@/contexts/auth-context"

export default async function AuthProvider({ children }: { children: ReactNode }) {
  const initialUser = await getSessionUserFromCookies()
  return <AuthProviderClient initialUser={initialUser}>{children}</AuthProviderClient>
}

