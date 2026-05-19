export type AuthProvider = "email" | "google"

// User model used by the client app (also mirrored inside the JWT payload).
export interface AppUser {
  id: string
  firstName: string
  lastName: string
  // For compatibility with your current UI, we keep this field name.
  // For email/password users it is the email; for phone login it's the phone string.
  phoneOrEmail: string
  wilaya: string
  baladia: string

  provider: AuthProvider
  photoURL?: string

  // Team-related fields are currently managed in-memory in the app.
  teamId?: string
  isTeamCaptain?: boolean
}

export interface ApiError {
  message: string
  code?: string
}

export interface SessionResponse {
  user: AppUser | null
}

