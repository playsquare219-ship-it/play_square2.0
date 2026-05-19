"use server"

import type { Team, Match, MatchRequest, DirectChallenge } from "@/types"
import {
  getAllTeamsFromDb,
  getTeamByIdFromDb,
  updateTeam,
  getAllMatchesFromDb,
  createMatch,
  getOutgoingRequestsForTeamAsync,
  getPendingRequestsForTeamAsync,
  createMatchRequestAsync,
  respondToMatchRequestAsync,
  createDirectChallenge,
  getAllDirectChallenges,
  updateDirectChallengeStatus,
} from "@/lib/server/db"

// ============================================
// 🎯 Firebase-Backed Server Functions
// These are server-side only and safe to use in Server Components or API routes
// ============================================

/**
 * الحصول على جميع الفريقات (من Firebase) - SERVER ONLY
 */
export async function getAllTeams(): Promise<Team[]> {
  return await getAllTeamsFromDb()
}

/**
 * الحصول على فريق بواسطة ID (من Firebase) - SERVER ONLY
 */
export async function getTeamById(teamId: string): Promise<Team | null> {
  return await getTeamByIdFromDb(teamId)
}

/**
 * حفظ فريق (إلى Firebase) - SERVER ONLY
 */
export async function saveTeam(team: Team): Promise<void> {
  if (team.id) {
    await updateTeam(team.id, {
      name: team.name,
      captainId: team.captainId,
      players: team.players,
      photoURL: team.photoURL,
      wilaya: team.wilaya,
      baladia: team.baladia,
    })
  }
}

/**
 * الحصول على جميع المباريات (من Firebase) - SERVER ONLY
 */
export async function getAllMatches(): Promise<Match[]> {
  return await getAllMatchesFromDb()
}

/**
 * حفظ مبارة (إلى Firebase) - SERVER ONLY
 */
export async function saveMatch(match: Omit<Match, "id">): Promise<Match> {
  return await createMatch(match as any)
}

/**
 * الحصول على جميع طلبات المقابلة (من Firebase) - SERVER ONLY
 */
export async function getMatchRequests(): Promise<MatchRequest[]> {
  return []
}

/**
 * حفظ طلب مقابلة (إلى Firebase) - SERVER ONLY
 */
export async function saveMatchRequest(
  request: Omit<MatchRequest, "id" | "createdAt" | "updatedAt">
): Promise<MatchRequest> {
  return await createMatchRequestAsync({
    fromTeam: request.fromTeam,
    toTeam: request.toTeam,
    kind: request.kind,
    stadium: request.stadium,
    wilaya: request.wilaya,
    baladia: request.baladia,
    proposedDate: request.proposedDate || "",
    createdByUserId: request.createdByUserId,
  })
}

/**
 * الحصول على جميع التحديات المباشرة (من Firebase) - SERVER ONLY
 */
export async function getDirectChallenges(): Promise<DirectChallenge[]> {
  return await getAllDirectChallenges()
}

/**
 * حفظ تحدي مباشر (إلى Firebase) - SERVER ONLY
 */
export async function saveDirectChallenge(
  challenge: Omit<DirectChallenge, "id">
): Promise<DirectChallenge> {
  return await createDirectChallenge(challenge)
}

// ============================================
// Mock Data (for seeding/demo)
// ============================================

/**
 * Mock teams from Algerian neighborhoods
 * Used for testing and initial data seeding
 */
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

// Mock matches
export const MOCK_MATCHES: Match[] = [
  {
    id: "match_1",
    team1Id: "team_1",
    team2Id: "team_2",
    team1: MOCK_TEAMS[0],
    team2: MOCK_TEAMS[1],
    stadium: "5 Juillet",
    wilaya: "Alger",
    dateTime: "2025-12-18T15:00:00Z",
    status: "completed",
    createdByUserId: "captain_1",
    result: {
      team1Score: 3,
      team2Score: 2,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "match_2",
    team1Id: "team_3",
    team2Id: "team_4",
    team1: MOCK_TEAMS[2],
    team2: MOCK_TEAMS[3],
    stadium: "Omar Hamadi",
    wilaya: "Alger",
    dateTime: "2025-12-17T15:00:00Z",
    status: "completed",
    createdByUserId: "captain_3",
    result: {
      team1Score: 1,
      team2Score: 1,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

/**
 * ⚠️ تحذير: يجب استخدام هذه الوحدة على الخادم فقط (Server Components)
 * للمكونات العميلة (Client Components)، استخدم lib/client/api.ts بدلاً من ذلك
 */
export const WARNING = {
  message: "This module is server-only. Use lib/client/api.ts in Client Components.",
} as const


