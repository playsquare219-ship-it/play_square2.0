// ============================================
// أنواع المستخدم (User Types)
// ============================================

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  photoURL?: string;
  provider: 'email' | 'google';
  wilaya?: string;
  baladia?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppUser {
  id: string;
  firstName: string;
  lastName: string;
  phoneOrEmail: string;
  provider: 'email' | 'google';
  photoURL?: string;
  wilaya?: string;
  baladia?: string;
  teamId?: string;
  isTeamCaptain?: boolean;
}

export interface UserCreateInput {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  phone?: string;
  wilaya?: string;
  baladia?: string;
  provider: 'email' | 'google';
}

// ============================================
// أنواع المصادقة (Auth Types)
// ============================================

export type AuthProvider = 'email' | 'google';

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  wilaya?: string;
  baladia?: string;
}

export interface GoogleAuthInput {
  idToken: string;
  userData: {
    uid: string;
    email: string;
    displayName: string | null;
    photoURL: string | null;
  };
}

// ✅ إضافة ApiResponse
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ============================================
// أنواع الجلسة (Session Types)
// ============================================

export interface SessionData {
  userId: string;
  email: string;
  expiresAt: number;
}

// ============================================
// أنواع الفريق (Team Types)
// ============================================

export interface Team {
  id: string;
  name: string;
  captainId: string;
  players: string[]; // Array of user IDs
  photoURL?: string;
  wilaya?: string;
  baladia?: string;
  division?: string; // e.g., "Premier", "Division 1"
  rating?: number; // Team rating/elo
  wins?: number; // Number of wins
  draws?: number; // Number of draws
  losses?: number; // Number of losses
  createdAt: string;
  updatedAt: string;
}

export interface Wilaya {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Baladia {
  id: string;
  name: string;
  wilayaId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Stadium {
  id: string;
  name: string;
  wilayaId: string;
  baladiaId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamCreateInput {
  name: string;
  captainId: string;
  wilaya?: string;
  baladia?: string;
}

export interface TeamJoinRequest {
  id: string;
  teamId: string;
  requesterId: string;
  requesterName?: string;
  requesterEmail?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  teamId?: string;
  requestId?: string;
  matchId?: string;
  title: string;
  message: string;
  type:
    | 'team_request'
    | 'team_request_response'
    | 'team_captain_transfer'
    | 'match_invite'
    | 'match_invite_accepted'
    | 'match_invite_rejected'
    | 'match_confirmed'
    | 'match_cancelled'
    | 'match_report_request'
    | 'match_result_verified'
    | 'match_result_disputed'
    | 'tournament_invite'
    | 'tournament_started'
    | 'tournament_ended'
    | 'tournament_match_ready'
    | 'tournament_fixture_generated'
    | 'tournament_registration_closed'
    | 'tournament_finalists_decided'
    | 'tournament_walkover'
    | 'recommendation_tournament'
    | string;
  read: boolean;
  createdAt: string;
  requestStatus?: 'pending' | 'accepted' | 'rejected' | 'cancelled';
}

// ============================================
// أنواع المباراة (Match Types)
// ============================================

export interface Match {
  id: string;
  team1Id: string;
  team2Id: string;
  team1: Team;
  team2: Team;
  stadium?: string;
  wilaya?: string;
  baladia?: string;
  dateTime: string;
  endTime?: string;
  durationMinutes?: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'live' | 'reporting' | 'verifying' | 'verified' | 'disputed';
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  tournamentId?: string;
  tournamentRound?: string;
  result?: {
    team1Score: number;
    team2Score: number;
    winnerId?: string;
  };
  verifiedAt?: string;
}

// ============================================
// أنواع تقرير المباراة (Match Report Types)
// ============================================

export interface MatchReport {
  id: string;
  matchId: string;
  userId: string;
  teamId: string;
  team1Score: number;
  team2Score: number;
  createdAt: string;
}

// ============================================
// أنواع طلب المقابلة (Match Request Types)
// ============================================

export interface MatchRequest {
  id: string;
  kind: 'random' | 'direct' | 'instant';
  fromTeamId: string;
  toTeamId: string;
  fromTeam: Team;
  toTeam: Team;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  stadium?: string;
  wilaya?: string;
  baladia?: string;
  proposedDate?: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// أنواع البطولة (Tournament Types)
// ============================================

export type TournamentStatus = 'registration' | 'ongoing' | 'completed' | 'cancelled'

export type TournamentType = 'knockout' | 'league' | 'group_and_knockout'

export interface Tournament {
  id: string
  name: string
  description?: string
  type: TournamentType
  status: TournamentStatus
  maxTeams: number
  teams: TournamentTeam[]
  rounds?: TournamentRound[]
  groups?: TournamentGroup[]
  startDate: string
  endDate?: string
  registrationFee?: number
  prize?: number
  minPlayersPerTeam?: number
  maxPlayersPerTeam?: number
  emoji?: string
  createdByUserId: string
  createdAt: string
  updatedAt: string
  phaseConfig?: TournamentPhaseConfig
  venueConfig?: TournamentVenueConfig
  scheduleConfig?: TournamentScheduleConfig
  rules?: TournamentRules
}

export interface TournamentTeam {
  teamId: string
  teamName: string
  captainId: string
  points: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  joinedAt: string
}

export interface TournamentRound {
  roundName: string
  matches: string[]
  startDate?: string
  endDate?: string
}

export interface TournamentGroup {
  id: string
  name: string
  teamIds: string[]
  fixtureIds: string[]
}

export type TournamentFixtureStatus = 'pending' | 'scheduled' | 'completed' | 'bye' | 'walkover'

export interface TournamentFixture {
  id: string
  tournamentId: string
  round: number
  roundName: string
  matchIndex: number
  team1Id: string | null
  team2Id: string | null
  matchId: string | null
  status: TournamentFixtureStatus
  winnerId: string | null
  score1: number | null
  score2: number | null
  createdAt: string
  updatedAt: string
}

export type SeedingMethod = 'rating' | 'leaderboard' | 'random' | 'manual'

export interface TournamentPhaseConfig {
  groupCount?: number
  advancePerGroup?: number
  thirdPlaceMatch?: boolean
  seedingMethod: SeedingMethod
  allowByes?: boolean
}

export interface TournamentVenueConfig {
  wilayaId?: string
  baladiaId?: string
  stadiumId?: string
  autoAssign?: boolean
}

export interface TournamentScheduleConfig {
  matchIntervalMinutes?: number
  matchStartDate?: string
  matchEndDate?: string
  blackoutDates?: string[]
}

export interface TournamentRules {
  extraTime?: boolean
  penalties?: boolean
  drawInKnockout?: 'extra_time' | 'penalties' | 'coin_toss'
  substitutionLimit?: number
}

export interface TournamentStanding {
  teamId: string
  teamName: string
  played: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
}

// ============================================
// أنواع المطابقة (Matchmaking Types)
// ============================================

export interface MatchmakingQueue {
  id: string;
  teamId: string;
  team: Team;
  mode: 'instant' | 'random';
  createdAt: string;
  priority: number;
}

// ============================================
// أنواع التحدي المباشر (Direct Challenge Types)
// ============================================

export interface DirectChallenge {
  id: string;
  fromTeamId: string;
  toTeamId: string;
  fromTeam: Team;
  toTeam: Team;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  stadium?: string;
  wilaya?: string;
  baladia?: string;
  proposedDate?: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}