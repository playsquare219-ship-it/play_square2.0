/**
 * Client-side API functions
 * These are safe to use in browser components
 * All actual database operations are handled server-side through API routes
 */

import type { Team, Match, MatchRequest, DirectChallenge, TeamCreateInput } from "@/types"

// ============================================
// Teams API
// ============================================

export async function getAllTeams(): Promise<Team[]> {
  try {
    const res = await fetch("/api/teams", { cache: "no-store" })
    if (!res.ok) return []
    const data = await res.json()
    const teams = data.teams || []
    // Filter out any undefined or invalid values
    return teams.filter((team: any) => team && team.id && team.name)
  } catch (error) {
    console.error("Error fetching teams:", error)
    return []
  }
}

export async function getTeamById(teamId: string): Promise<Team | null> {
  try {
    const res = await fetch(`/api/teams?id=${teamId}`, { cache: "no-store" })
    if (!res.ok) return null
    const data = await res.json()
    return data.team || null
  } catch (error) {
    console.error("Error fetching team:", error)
    return null
  }
}

export async function createTeam(team: TeamCreateInput): Promise<Team> {
  try {
    const res = await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team }),
    })
    if (!res.ok) throw new Error("Failed to create team")
    const data = await res.json()
    if (!data.team) throw new Error("No team returned from API")
    return data.team
  } catch (error) {
    console.error("Error creating team:", error)
    throw error
  }
}

export async function getMyTeams(): Promise<Team[]> {
  try {
    const res = await fetch("/api/teams?mine=true", { cache: "no-store", credentials: "include" })
    if (!res.ok) return []
    const data = await res.json()
    return data.teams || []
  } catch (error) {
    console.error("Error fetching my teams:", error)
    return []
  }
}

export async function joinTeam(teamId: string): Promise<any> {
  try {
    const res = await fetch("/api/team-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ teamId }),
    })
    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Failed to join team: ${errorText}`)
    }
    const data = await res.json()
    if (!data.request) throw new Error("No join request returned from API")
    return data.request
  } catch (error) {
    console.error("Error joining team:", error)
    throw error
  }
}

export async function leaveTeam(teamId: string): Promise<void> {
  try {
    const res = await fetch('/api/teams/leave', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ teamId }),
    })
    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Failed to leave team: ${errorText}`)
    }
  } catch (error) {
    console.error('Error leaving team:', error)
    throw error
  }
}

export async function getTeamRequests(teamId: string): Promise<any[]> {
  try {
    const res = await fetch(`/api/team-requests?teamId=${encodeURIComponent(teamId)}`, {
      cache: "no-store",
      credentials: "include",
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.requests || []
  } catch (error) {
    console.error("Error fetching team requests:", error)
    return []
  }
}

export async function getWilayas(): Promise<any[]> {
  try {
    const res = await fetch('/api/wilayas', { cache: 'no-store' })
    if (!res.ok) return []
    const data = await res.json()
    return data.wilayas || []
  } catch (error) {
    console.error('Error fetching wilayas:', error)
    return []
  }
}

export async function getBaladias(wilayaId?: string): Promise<any[]> {
  try {
    const res = await fetch(`/api/baladias${wilayaId ? `?wilayaId=${encodeURIComponent(wilayaId)}` : ''}`, {
      cache: 'no-store',
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.baladias || []
  } catch (error) {
    console.error('Error fetching baladias:', error)
    return []
  }
}

export const fetchBaladias = getBaladias

export async function getStadiums(wilayaId?: string, baladiaId?: string, date?: string, time?: string): Promise<any[]> {
  try {
    const url = new URL('/api/stadiums', window.location.origin)
    if (wilayaId) url.searchParams.set('wilayaId', wilayaId)
    if (baladiaId) url.searchParams.set('baladiaId', baladiaId)
    if (date && time) {
      url.searchParams.set('dateTime', `${date} ${time}`)
    }
    const res = await fetch(url.toString(), { cache: 'no-store' })
    if (!res.ok) return []
    const data = await res.json()
    return data.stadiums || []
  } catch (error) {
    console.error('Error fetching stadiums:', error)
    return []
  }
}

export async function respondToTeamJoinRequest(requestId: string, status: 'accepted' | 'rejected'): Promise<void> {
  try {
    const res = await fetch('/api/team-requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ requestId, status }),
    })
    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Failed to update request: ${errorText}`)
    }
  } catch (error) {
    console.error('Error updating team request:', error)
    throw error
  }
}

export async function deleteTeamJoinRequest(requestId: string): Promise<void> {
  try {
    const res = await fetch('/api/team-requests', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ requestId }),
    })
    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Failed to delete request: ${errorText}`)
    }
  } catch (error) {
    console.error('Error deleting team request:', error)
    throw error
  }
}

export async function deleteTeam(teamId: string): Promise<void> {
  try {
    const res = await fetch(`/api/teams?id=${encodeURIComponent(teamId)}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Failed to delete team: ${errorText}`)
    }
  } catch (error) {
    console.error('Error deleting team:', error)
    throw error
  }
}

export async function transferTeamCaptain(teamId: string, newCaptainId: string): Promise<void> {
  try {
    const res = await fetch('/api/teams/transfer-captain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ teamId, newCaptainId }),
    })
    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Failed to transfer captain: ${errorText}`)
    }
  } catch (error) {
    console.error('Error transferring captain:', error)
    throw error
  }
}

export async function getNotifications(limit = 5, offset = 0): Promise<{ notifications: any[]; hasMore: boolean }> {
  try {
    const res = await fetch(`/api/notifications?limit=${limit}&offset=${offset}`, {
      cache: 'no-store',
      credentials: 'include',
    })
    if (!res.ok) return { notifications: [], hasMore: false }
    const data = await res.json()
    return {
      notifications: data.notifications || [],
      hasMore: data.hasMore === true,
    }
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return { notifications: [], hasMore: false }
  }
}

export async function markNotificationsRead(): Promise<void> {
  try {
    const res = await fetch('/api/notifications', {
      method: 'PATCH',
      credentials: 'include',
    })
    if (!res.ok) {
      throw new Error('Failed to mark notifications as read')
    }
  } catch (error) {
    console.error('Error marking notifications read:', error)
    throw error
  }
}

export async function getUsersByIds(userIds: string[]): Promise<any[]> {
  try {
    if (userIds.length === 0) return []
    const query = userIds.map(encodeURIComponent).join(',')
    const res = await fetch(`/api/users?ids=${query}`, {
      cache: 'no-store',
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.users || []
  } catch (error) {
    console.error('Error fetching users by ids:', error)
    return []
  }
}

export async function updateTeam(team: Team): Promise<void> {
  try {
    const res = await fetch("/api/teams", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(team),
    })
    if (!res.ok) throw new Error("Failed to update team")
  } catch (error) {
    console.error("Error updating team:", error)
    throw error
  }
}

// ============================================
// Matches API
// ============================================

export async function getAllMatches(): Promise<Match[]> {
  try {
    const res = await fetch("/api/matches", { cache: "no-store" })
    if (!res.ok) return []
    const data = await res.json()
    const matches = data.matches || []
    // Filter out any invalid values
    return matches.filter((match: any) => match && match.id)
  } catch (error) {
    console.error("Error fetching matches:", error)
    return []
  }
}

export async function saveMatch(match: Omit<Match, "id">): Promise<Match> {
  try {
    const res = await fetch("/api/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(match),
    })
    if (!res.ok) throw new Error("Failed to save match")
    const data = await res.json()
    if (!data.match) throw new Error("No match returned from API")
    return data.match
  } catch (error) {
    console.error("Error saving match:", error)
    throw error
  }
}

export async function cancelMatch(matchId: string): Promise<void> {
  try {
    const res = await fetch("/api/matches", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId, action: "cancel" }),
    })
    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Failed to cancel match: ${errorText}`)
    }
  } catch (error) {
    console.error("Error cancelling match:", error)
    throw error
  }
}

// ============================================
// Match Requests API
// ============================================

export async function getMatchRequests(): Promise<MatchRequest[]> {
  try {
    const res = await fetch("/api/match-requests", { cache: "no-store" })
    if (!res.ok) return []
    const data = await res.json()
    const requests = data.requests || []
    return requests.filter((req: any) => req && req.id)
  } catch (error) {
    console.error("Error fetching match requests:", error)
    return []
  }
}

export async function saveMatchRequest(
  request: Omit<MatchRequest, "id" | "createdAt" | "updatedAt" | "status" | "toTeam"> & { toTeamId: string }
): Promise<MatchRequest> {
  try {
    const res = await fetch("/api/match-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(request),
    })
    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Failed to save match request: ${errorText}`)
    }
    const data = await res.json()
    if (!data.request) throw new Error("No request returned from API")
    return data.request
  } catch (error) {
    console.error("Error saving match request:", error)
    throw error
  }
}

export async function getMatchRequestById(requestId: string): Promise<MatchRequest | null> {
  try {
    const res = await fetch(`/api/match-requests?requestId=${encodeURIComponent(requestId)}`, {
      cache: "no-store",
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.request || null
  } catch (error) {
    console.error("Error fetching match request:", error)
    return null
  }
}

export async function respondToMatchRequest(requestId: string, action: 'accepted' | 'rejected' | 'cancelled'): Promise<void> {
  try {
    const res = await fetch('/api/match-requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, action }),
    })
    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Failed to respond to match request: ${errorText}`)
    }
  } catch (error) {
    console.error('Error responding to match request:', error)
    throw error
  }
}

export async function confirmMatchBooking(requestId: string, bookingDetails?: {
  stadium?: string
  wilaya?: string
  baladia?: string
  date?: string
  time?: string
}): Promise<void> {
  try {
    const payload: any = { requestId, confirmBooking: true }
    if (bookingDetails?.stadium) payload.stadium = bookingDetails.stadium
    if (bookingDetails?.wilaya) payload.wilaya = bookingDetails.wilaya
    if (bookingDetails?.baladia) payload.baladia = bookingDetails.baladia
    if (bookingDetails?.date && bookingDetails?.time) {
      payload.proposedDate = `${bookingDetails.date} ${bookingDetails.time}`
    } else if (bookingDetails?.date?.includes('T')) {
      payload.proposedDate = bookingDetails.date
    }

    const res = await fetch('/api/match-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Failed to confirm booking: ${errorText}`)
    }
  } catch (error) {
    console.error('Error confirming booking:', error)
    throw error
  }
}

export async function cancelMatchRequest(requestId: string): Promise<void> {
  try {
    const res = await fetch('/api/match-requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, action: 'cancelled' }),
    })
    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Failed to cancel match request: ${errorText}`)
    }
  } catch (error) {
    console.error('Error cancelling match request:', error)
    throw error
  }
}

// ============================================
// Direct Challenges API
// ============================================

export async function getDirectChallenges(): Promise<DirectChallenge[]> {
  try {
    const res = await fetch("/api/direct-challenges", { cache: "no-store" })
    if (!res.ok) return []
    const data = await res.json()
    const challenges = data.challenges || []
    return challenges.filter((ch: any) => ch && ch.id)
  } catch (error) {
    console.error("Error fetching direct challenges:", error)
    return []
  }
}

export async function saveDirectChallenge(
  challenge: Omit<DirectChallenge, "id">
): Promise<DirectChallenge> {
  try {
    const res = await fetch("/api/direct-challenges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(challenge),
    })
    if (!res.ok) throw new Error("Failed to save direct challenge")
    const data = await res.json()
    if (!data.challenge) throw new Error("No challenge returned from API")
    return data.challenge
  } catch (error) {
    console.error("Error saving direct challenge:", error)
    throw error
  }
}

// ============================================
// Mock Data (for seeding/demo)
// ============================================

export const MOCK_TEAMS: Team[] = [
  {
    id: "team_1",
    name: "Hydra FC",
    captainId: "captain_1",
    players: ["captain_1"],
    wilaya: "Alger",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "team_2",
    name: "Kouba United",
    captainId: "captain_2",
    players: ["captain_2"],
    wilaya: "Alger",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "team_3",
    name: "Bab Ezzouar Lions",
    captainId: "captain_3",
    players: ["captain_3"],
    wilaya: "Alger",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "team_4",
    name: "El Harrach Stars",
    captainId: "captain_4",
    players: ["captain_4"],
    wilaya: "Alger",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "team_5",
    name: "El Madania Tigers",
    captainId: "captain_5",
    players: ["captain_5"],
    wilaya: "Alger",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]
