"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import type { AppUser } from "@/types"

// نوع بيانات المصادقة
interface AuthContextType {
  user: AppUser | null
  isAuthenticated: boolean
  isLoading: boolean
  refreshSession: () => Promise<void>
  logout: () => Promise<void>
  updateUser: (userData: Partial<AppUser>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// دالة للوصول لبيانات المصادقة
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}

export function AuthProviderClient({
  children,
  initialUser,
}: {
  children: ReactNode
  initialUser?: AppUser | null
}) {
  const [user, setUser] = useState<AppUser | null>(initialUser ?? null)
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(initialUser))
  const [isLoading, setIsLoading] = useState(initialUser ? false : true)

  const refreshSession = async () => {
    try {
      const res = await fetch("/api/auth/session", {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      })

      if (!res.ok) {
        setUser(null)
        setIsAuthenticated(false)
        return
      }

      const data = (await res.json()) as { success: boolean; data?: { user: AppUser | null } }
      const user = data.data?.user ?? null
      setUser(user)
      setIsAuthenticated(Boolean(user))
    } catch {
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Always re-fetch on mount to keep client state consistent with httpOnly cookies.
    void refreshSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const logout = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })
      if (!res.ok) {
        // Even if logout failed, clear client state to avoid stale UI.
        setUser(null)
        setIsAuthenticated(false)
        return
      }
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }

  // دالة تحديث بيانات المستخدم
  const updateUser = (userData: Partial<AppUser>) => {
    if (user) {
      const updatedUser = { ...user, ...userData }
      setUser(updatedUser)
    }
  }

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      refreshSession,
      logout,
      updateUser,
    }),
    [user, isAuthenticated, isLoading],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Backward-compatible export used by `app/layout.tsx` until we switch to a server wrapper.
export function AuthProvider({ children }: { children: ReactNode }) {
  return <AuthProviderClient initialUser={null}>{children}</AuthProviderClient>
}
