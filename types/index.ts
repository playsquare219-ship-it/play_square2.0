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
  invitationId?: string;
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
    | 'match_invitation'
    | 'match_invitation_accepted'
    | 'match_invitation_rejected'
    | 'match_invitation_court_change_requested'
    | 'match_invitation_time_change_requested'
    | 'match_change_request_accepted'
    | 'match_change_request_rejected'
    | 'match_confirmed_both'
    | 'match_cancelled_invitation'
    | string;
  read: boolean;
  createdAt: string;
  requestStatus?: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  actionType?: 'approve' | 'reject' | 'change_court' | 'change_time' | 'cancel';
  matchDetails?: any;
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
  status: 'scheduled' | 'completed' | 'cancelled';
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  result?: {
    team1Score: number;
    team2Score: number;
    winnerId?: string;
  };
  invitationId?: string;
  invitedUserId?: string;
  confirmationStatus?: 'pending_confirmation' | 'confirmed' | 'cancelled';
}

export interface MatchInvitation {
  id: string;
  matchId?: string;
  fromUserId: string;
  toUserId: string;
  fromTeamId?: string;
  toTeamId?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'court_change_requested' | 'time_change_requested' | 'cancelled';
  originalProposedDate: string;
  originalStadium?: string;
  suggestedDate?: string;
  suggestedStadium?: string;
  suggestedTime?: string;
  bookingId?: string;
  createdAt: string;
  updatedAt: string;
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
