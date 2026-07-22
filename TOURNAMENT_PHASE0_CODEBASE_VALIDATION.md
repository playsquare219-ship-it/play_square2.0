# TOURNAMENT PHASE 0 — CODEBASE VALIDATION REPORT

> **Document Type:** Pre-Implementation Codebase Validation
> **Mode:** READ-ONLY — No files created or modified
> **Date:** 20 July 2026
> **Project:** `play_square2.0` (Mobile Application)

---

## 1. Executive Summary

This report validates every assumption from the Architecture Baseline and Tournament Verification Report against the **actual source code** of the mobile application. Every claim has been verified by reading real files, searching real code, and inspecting real exports.

**Overall Finding**: The mobile application is at **early-stage development**. The tournament system has **zero implementation** — no API routes, no data layer, no UI components. The Architecture Baseline correctly describes the Admin Dashboard's systems (which live in a separate repository). The mobile application must build its consumption layer from scratch.

**Implementation Readiness: 35%**

---

## 2. Repository Audit

### 2.1 Claimed Repositories

| Repository | Expected By | Exists in Mobile App? | Evidence |
|-----------|------------|----------------------|----------|
| TournamentRepository | Arch Baseline §3.9 | **NOT FOUND** | No file, class, or export exists |
| TournamentFixtureRepository | Arch Baseline §3.9 | **NOT FOUND** | No file, class, or export exists |
| MatchRepository | Arch Baseline §3.9 | **NOT FOUND** | No class — loose functions in `lib/server/db/matches.ts` |
| TeamRepository | Arch Baseline §3.9 | **NOT FOUND** | No class — loose functions in `lib/server/db/teams.ts` |
| StatisticsRepository | Arch Baseline §3.9 | **NOT FOUND** | No `statistics.ts` in DB layer |
| LeaderboardRepository | Arch Baseline §3.9 | **NOT FOUND** | No `leaderboard.ts` in DB layer |

### 2.2 What Actually Exists — DB Layer

The mobile app uses **standalone exported async functions** in `lib/server/db/*.ts`, not class-based repositories.

| File | Collections Referenced | Exported Functions |
|------|----------------------|-------------------|
| `lib/server/db/users.ts` | `users`, `pending_registrations` | User CRUD functions |
| `lib/server/db/teams.ts` | `teams` | Team CRUD functions |
| `lib/server/db/matches.ts` | `matches` | Match CRUD functions |
| `lib/server/db/notifications.ts` | `notifications`, `team_join_requests`, `match_requests` | `createNotification()`, `getNotificationsForUser()`, `getNotificationsForTeam()`, `markNotificationsReadForUser()` |
| `lib/server/db/matchmaking.ts` | `matchmaking_queue` | `enqueueTeamForMatchmaking()`, `findRandomMatch()`, `findInstantMatch()`, `recordMatchmakingMatch()` |
| `lib/server/db/match-requests.ts` | `match_requests` | Match request CRUD |
| `lib/server/db/match-reports.ts` | `match_reports` | Match report CRUD |
| `lib/server/db/direct-challenges.ts` | `direct_challenges` | Direct challenge CRUD |
| `lib/server/db/team-requests.ts` | `team_join_requests` | Team join request CRUD |
| `lib/server/db/locations.ts` | `wilayas`, `baladias`, `stadiums` | Location/stadium queries |
| `lib/server/db/index.ts` | Barrel export | Re-exports from above |

**Missing DB files**: `tournaments.ts`, `tournament-fixtures.ts`, `statistics.ts`, `leaderboard.ts`, `stadium-bookings.ts`, `rewards.ts`, `audit.ts`

### 2.3 Verdict

| Claim | Status |
|-------|--------|
| "TournamentRepository exists" | ❌ FALSE — Must create `lib/server/db/tournaments.ts` |
| "TournamentFixtureRepository exists" | ❌ FALSE — Must create `lib/server/db/tournament-fixtures.ts` |
| "MatchRepository exists as class" | ❌ FALSE — Functions exist, not class. Reusable as-is. |
| "TeamRepository exists as class" | ❌ FALSE — Functions exist, not class. Reusable as-is. |

---

## 3. Service Audit

| Service | Exists? | Location | Functions Available |
|---------|---------|----------|-------------------|
| TournamentService | **NOT FOUND** | — | None |
| NotificationService | **NOT FOUND** | — | Raw functions in `lib/server/db/notifications.ts`: `createNotification`, `getNotificationsForUser`, `getNotificationsForTeam`, `markNotificationsReadForUser` |
| AuditLogService | **NOT FOUND** | — | None. No audit system exists. |
| VerificationService | **FOUND** | `lib/server/services/verification.ts` | Email verification logic |

### 3.1 Verdict

| Claim | Status |
|-------|--------|
| "TournamentService is reusable" | ❌ FALSE — Does not exist. Must create API routes that read Firestore directly. |
| "NotificationService is reusable" | ⚠️ PARTIAL — Raw functions exist. No service class. API routes can use raw functions. |
| "AuditLogService is reusable" | ❌ FALSE — Does not exist. Audit logging must be added to API routes. |

---

## 4. Engine Audit

| Engine | Exists? | Should Exist in Mobile App? |
|--------|---------|---------------------------|
| TournamentEngine | NOT FOUND | ❌ No — Admin Dashboard owns this |
| MatchEngine | NOT FOUND | ❌ No — Admin Dashboard owns this |
| NotificationEngine | NOT FOUND | ❌ No — Admin Dashboard owns this |
| StatisticsEngine | NOT FOUND | ❌ No — Admin Dashboard owns this |
| LeaderboardEngine | NOT FOUND | ❌ No — Admin Dashboard owns this |
| RewardsEngine | NOT FOUND | ❌ No — Admin Dashboard owns this |
| MatchmakingEngine | NOT FOUND | ❌ No — Admin Dashboard owns this |

### 4.1 Verdict

| Claim | Status |
|-------|--------|
| "Mobile app should consume engines via API" | ✅ CORRECT — But the API routes to consume them don't exist yet |
| "Engines exist in Admin Dashboard" | ✅ CORRECT — Verified in separate repository |
| "Mobile app correctly has no engines" | ✅ CORRECT — By design |

**Critical finding**: The Verification Report states "Reuse existing engines" — this is architecturally correct but practically insufficient. The mobile app needs **API routes that call the Admin Dashboard's Firestore collections directly** (since both apps share the same Firebase project). The engines themselves are not imported — they are in a separate repository. The mobile app reads the **output** of engine processing (tournament documents, fixtures, standings) from Firestore via its own API routes.

---

## 5. Firestore Audit

### 5.1 Collection References in Mobile App Code

| # | Collection | Referenced? | File | Line |
|---|-----------|------------|------|------|
| 1 | `tournaments` | ❌ NO | Only UI placeholder at `app/tournaments/page.tsx` | — |
| 2 | `tournament_fixtures` | ❌ NO | — | — |
| 3 | `tournament_matches` | ❌ NO | — | — |
| 4 | `matches` | ✅ YES | `lib/server/db/matches.ts` | 9 |
| 5 | `teams` | ✅ YES | `lib/server/db/teams.ts` | 9 |
| 6 | `users` | ✅ YES | `lib/server/db/users.ts` | 48 |
| 7 | `notifications` | ✅ YES | `lib/server/db/notifications.ts` | 5 |
| 8 | `statistics` | ❌ NO | — | — |
| 9 | `leaderboard` | ❌ NO | — | — |
| 10 | `stadiums` | ✅ YES | `lib/server/db/locations.ts` | 7 |
| 11 | `stadium_bookings` | ❌ NO | Bookings use `bookings` collection | — |
| 12 | `matchmaking_queue` | ✅ YES | `lib/server/db/matchmaking.ts` | 8 |
| 13 | `direct_challenges` | ✅ YES | `lib/server/db/direct-challenges.ts` | 8 |
| 14 | `team_join_requests` | ✅ YES | `lib/server/db/team-requests.ts` | 5 |
| 15 | `match_requests` | ✅ YES | `lib/server/db/match-requests.ts` | 11 |
| 16 | `match_reports` | ✅ YES | `lib/server/db/match-reports.ts` | 8 |
| 17 | `pending_registrations` | ✅ YES | `lib/server/db/users.ts` | 49 |
| 18 | `_sync` | ❌ NO | — | — |
| 19 | `auditLogs` | ❌ NO | — | — |
| 20 | `activity_logs` | ❌ NO | — | — |
| 21 | `audit_log` | ❌ NO | — | — |
| 22 | `engineState` | ❌ NO | — | — |
| 23 | `engineConfig` | ❌ NO | — | — |
| 24 | `engineExecutions` | ❌ NO | — | — |
| 25 | `reward_definitions` | ❌ NO | — | — |
| 26 | `reward_grants` | ❌ NO | — | — |
| 27 | `currency_balances` | ❌ NO | — | — |
| 28 | `notification_deliveries` | ❌ NO | — | — |
| 29 | `registrations` | ❌ NO | — | — |
| 30 | `standings` | ❌ NO | — | — |
| 31 | `bracket` | ❌ NO | — | — |
| 32 | `tournament_groups` | ❌ NO | — | — |

**Collections referenced in mobile app: 12**
**Collections NOT referenced: 20**

### 5.2 Firestore Indexes

| Metric | Expected | Actual | Status |
|--------|----------|--------|--------|
| Total composite indexes | 38 | **2** | ❌ SEVERELY UNDER-INDEXED |
| Collections with indexes | 14 collection groups | **1** (`notifications`) | ❌ |
| Tournament-related indexes | 7+ | **0** | ❌ |

The mobile app's `firestore.indexes.json` contains only 2 indexes, both on `notifications`. The Admin Dashboard's 38-index file must be deployed before tournament queries will work.

### 5.3 Firestore Rules

| Expected Rule | Actual Rule | Status |
|--------------|------------|--------|
| Deny-all default | **NOT EXPLICIT** — Rules only cover `users`, `posts`, `rooms`, `notifications` | ⚠️ Different pattern |
| `_sync` readable by authenticated | **NOT FOUND** — `_sync` not referenced in rules | ❌ |
| `users` readable by authenticated | **PARTIAL** — Rules require `isOwner(userId)` | ⚠️ Stricter than baseline |
| All other collections denied | **Implicit** — Not explicitly denied, just not allowed | ⚠️ Different implementation |

The mobile app's `firestore.rules` uses a **per-collection allow** pattern, not a **deny-all default** pattern. This is a different security model than the Admin Dashboard's rules.

### 5.4 Verdict

| Claim | Status |
|-------|--------|
| "Tournaments collection exists in Firestore" | ✅ LIKELY — Admin Dashboard writes to it. Mobile app has no references yet. |
| "Mobile app reads tournaments via API" | ❌ NOT YET — No API routes exist to read tournaments |
| "38 indexes exist" | ❌ FALSE in mobile app — Only 2 indexes. Admin Dashboard has 38. |
| "Firestore rules are deny-all" | ⚠️ DIFFERENT — Mobile app uses per-collection allow pattern |

---

## 6. API Audit

### 6.1 Complete API Route Inventory

| # | Route | Methods | Auth | Response Format |
|---|-------|---------|------|----------------|
| 1 | `/api/auth/login` | POST | None | `{ token, user }` |
| 2 | `/api/auth/register` | POST | None | `{ token, user }` |
| 3 | `/api/auth/logout` | POST | Cookie | `{ success }` |
| 4 | `/api/auth/google` | POST | None | `{ token, user }` |
| 5 | `/api/auth/session` | GET | Cookie | `{ user }` |
| 6 | `/api/auth/verify-email` | POST | None | `{ success }` |
| 7 | `/api/teams` | GET,POST,PUT,DELETE | Cookie (some) | `{ teams }`, `{ team }` |
| 8 | `/api/teams/join` | POST | Cookie | `{ request }` |
| 9 | `/api/teams/leave` | POST | Cookie | — |
| 10 | `/api/teams/transfer-captain` | POST | Cookie | — |
| 11 | `/api/team-requests` | GET,POST,PATCH,DELETE | Cookie | `{ requests }`, `{ request }` |
| 12 | `/api/matches` | GET,POST,PATCH | None/Optional | `{ matches }`, `{ match }` |
| 13 | `/api/match-requests` | GET,POST,PATCH | None/Partial | `{ requests }`, `{ request }` |
| 14 | `/api/match-reports` | GET,POST | None/Cookie | `{ reports }`, `{ report }` |
| 15 | `/api/match-status` | POST | Cookie | `{ success, status }` |
| 16 | `/api/matchmaking` | GET,POST,DELETE | None | `{ isActive }`, enqueue result |
| 17 | `/api/direct-challenges` | GET,POST,PATCH | None | `{ challenges }`, `{ challenge }` |
| 18 | `/api/notifications` | GET,PATCH | Cookie | `{ notifications }` |
| 19 | `/api/stadiums` | GET | None | `{ stadiums }` |
| 20 | `/api/bookings` | GET,POST | Cookie | `{ bookings }`, `{ booking }` |
| 21 | `/api/bookings/all` | GET | None | `{ bookings }` |
| 22 | `/api/booking-matches` | GET,POST | None | `{ matches }`, `{ match }` |
| 23 | `/api/users` | GET | None | `{ users }` |
| 24 | `/api/wilayas` | GET | None | `{ wilayas }` |
| 25 | `/api/baladias` | GET | None | `{ baladias }` |
| 26 | `/api/add-default-data` | POST | None | `{ success }` |

### 6.2 Tournament API Routes — All Missing

| # | Expected Route | Status |
|---|---------------|--------|
| 1 | `GET /api/tournaments` | ❌ MISSING |
| 2 | `GET /api/tournaments?id={id}` | ❌ MISSING |
| 3 | `POST /api/tournaments` | ❌ MISSING |
| 4 | `PATCH /api/tournaments` | ❌ MISSING |
| 5 | `DELETE /api/tournaments?id=` | ❌ MISSING |
| 6 | `GET /api/tournaments/my` | ❌ MISSING |
| 7 | `POST /api/tournaments/[id]/join` | ❌ MISSING |
| 8 | `POST /api/tournaments/[id]/leave` | ❌ MISSING |
| 9 | `GET /api/tournaments/[id]/fixtures` | ❌ MISSING |
| 10 | `GET /api/tournaments/[id]/standings` | ❌ MISSING |
| 11 | `GET /api/tournaments/[id]/groups` | ❌ MISSING |
| 12 | `GET /api/tournaments/[id]/matches` | ❌ MISSING |

### 6.3 Response Format Analysis

| Expected Format | Actual Format | Match? |
|----------------|--------------|--------|
| `{ success, data, code }` | `{ success, data/error }` (in `types/index.ts`) | ⚠️ PARTIAL — `code` field missing |
| Standardized error format | Ad-hoc per route | ❌ INCONSISTENT |

The `ApiResponse` type in `types/index.ts:75-80` defines `{ success, data?, error?, message? }` — missing the `code` field from the Architecture Baseline.

### 6.4 Verdict

| Claim | Status |
|-------|--------|
| "11 tournament API endpoints exist" | ❌ FALSE — 0 exist |
| "Response format is `{ success, data, code }`" | ⚠️ PARTIAL — `code` missing from type definition |
| "All routes have auth" | ❌ FALSE — Many routes have no auth (matchmaking, direct-challenges, matches GET) |

---

## 7. Route Audit

### 7.1 Middleware Matcher

**Actual matcher** (from `middleware.ts:9`):
```ts
matcher: ["/home/:path*", "/team/:path*", "/matches/:path*", "/squad/:path*", "/settings/:path*"]
```

**Missing from matcher:**
- `/tournaments/:path*` — ❌ NOT PROTECTED
- `/bookings/:path*` — ❌ NOT PROTECTED
- `/my-bookings/:path*` — ❌ NOT PROTECTED
- `/notifications/:path*` — ❌ NOT PROTECTED
- `/statistics/:path*` — ❌ NOT PROTECTED
- `/store/:path*` — ❌ NOT PROTECTED

### 7.2 Page Routes

| Route | Exists? | Content |
|-------|---------|---------|
| `/` | ✅ | Splash screen → redirect |
| `/auth` | ✅ | Auth page |
| `/auth/login` | ✅ | Login form |
| `/auth/register` | ✅ | Register form |
| `/home` | ✅ | Dashboard |
| `/team` | ✅ | Team management |
| `/team/create` | ✅ | Create team |
| `/team/join` | ✅ | Join team |
| `/team/requests` | ✅ | Team requests |
| `/squad` | ✅ | Squad view |
| `/matches/create` | ✅ | Create match |
| `/bookings` | ✅ | Bookings |
| `/my-bookings` | ✅ | My bookings |
| `/tournaments` | ✅ | **"Coming Soon" placeholder** |
| `/tournaments/[id]` | ❌ | MISSING |
| `/tournaments/[id]/register` | ❌ | MISSING |
| `/notifications` | ✅ | Notifications |
| `/settings` | ✅ | Settings |
| `/statistics` | ✅ | Statistics |
| `/store` | ✅ | Store |

### 7.3 Verdict

| Claim | Status |
|-------|--------|
| "`/tournaments` route exists" | ⚠️ PLACEHOLDER — 38-line "Coming Soon" page |
| "`/tournaments/[id]` route exists" | ❌ MISSING |
| "`/tournaments/[id]/register` route exists" | ❌ MISSING |
| "Middleware protects tournament routes" | ❌ MISSING — Not in matcher |

---

## 8. Authentication Audit

### 8.1 Auth Flow

| Component | Implementation | Location |
|-----------|---------------|----------|
| JWT signing | `signSessionJwt({ userId, email })` → 7-day expiry | `lib/server/auth/jwt.ts` |
| JWT verification | `verifySessionJwt(token)` → `{ userId, email } \| null` | `lib/server/auth/jwt.ts` |
| Cookie name | `playSquareToken` (from env or default) | `lib/server/auth/session.ts` |
| Session creation | `createSession(userId, email)` → sets cookie | `lib/server/auth/session.ts` |
| Session retrieval | `getSessionUserFromCookies()` → reads cookie, verifies JWT, fetches user | `lib/server/auth/session.ts` |
| Middleware | Checks cookie → verifies JWT → redirect if invalid | `middleware.ts` |

### 8.2 Captain Validation

**Found in**: `app/api/match-status/route.ts:33-38`
```ts
const isCaptain =
  match.team1?.captainId === decoded.userId ||
  match.team2?.captainId === decoded.userId
```

**Not centralized** — Each route does its own ad-hoc captain check.

### 8.3 Team Ownership Validation

**NOT FOUND** as a shared utility. Each route checks ownership independently.

### 8.4 Auth Context

**Available via `useAuth()` hook:**
```ts
{
  user: AppUser | null,        // { id, firstName, lastName, teamId?, isTeamCaptain? }
  isAuthenticated: boolean,
  isLoading: boolean,
  refreshSession: () => Promise<void>,
  logout: () => Promise<void>,
  updateUser: (userData: Partial<AppUser>) => void,
}
```

### 8.5 Verdict

| Claim | Status |
|-------|--------|
| "SESSION_COOKIE_NAME exists" | ✅ TRUE — `playSquareToken` |
| "verifySessionJwt() exists" | ✅ TRUE — Returns `{ userId, email }` |
| "Middleware protects routes" | ⚠️ PARTIAL — Only 5 route patterns protected |
| "Captain validation exists" | ⚠️ AD-HOC — In match-status only, not centralized |
| "Team ownership validation exists" | ❌ NOT FOUND — No shared utility |
| "Permission checks exist" | ❌ NOT FOUND — No RBAC system |

---

## 9. Component Audit

### 9.1 shadcn/ui Components Available

| Component | Exists | Can Be Reused For Tournament? |
|-----------|--------|------------------------------|
| `Card` | ✅ | Tournament card, section card |
| `Badge` | ✅ | Status badges |
| `Tabs` | ✅ | Filter tabs |
| `Button` | ✅ | Register button, navigation |
| `Input` | ✅ | Form inputs |
| `Skeleton` | ✅ | Loading states |
| `Collapsible` | ✅ | Teams list collapsible |
| `Progress` | ✅ | Player roster progress |
| `Dialog` | ✅ | Confirmation dialogs |
| `Sheet` | ✅ | Side panels |
| `Sonner/Toast` | ✅ | Error/success notifications |
| `Empty` | ✅ | Empty states |
| `ScrollArea` | ✅ | Scrollable content |
| `Separator` | ✅ | Visual dividers |
| `Label` | ✅ | Form labels |
| `Spinner` | ✅ | Loading indicators |

### 9.2 Custom Components Available

| Component | Exists | Reusable? |
|-----------|--------|----------|
| `BottomNav` | ✅ | Yes — for page layout |
| `MatchCard` | ✅ | Partially — match display pattern |
| `ProgressBar` | ✅ | Yes — labeled progress |
| `SplashScreen` | ✅ | No — app entry only |
| `InstallPWA` | ✅ | No — PWA only |
| `AuthProvider` | ✅ | Yes — wraps all pages |

### 9.3 Components NOT Found

| Expected Component | Status | Needed For |
|-------------------|--------|-----------|
| `ErrorBoundary` | ❌ NOT FOUND | Error states on all pages |
| Tournament-specific components | ❌ NOT FOUND | All tournament UI |

### 9.4 Verdict

| Claim | Status |
|-------|--------|
| "Reusable UI components exist" | ✅ TRUE — 57 shadcn/ui components available |
| "Error boundaries exist" | ❌ FALSE — Must create |
| "Tournament components exist" | ❌ FALSE — Must create all 15+ |

---

## 10. Utility Audit

| Utility | Exists? | Location | Notes |
|---------|---------|----------|-------|
| `cn()` | ✅ | `lib/utils.ts` | `twMerge(clsx(inputs))` |
| `formatCurrency()` | ❌ NOT FOUND | — | Must create |
| `formatDate()` | ⚠️ INLINE ONLY | `app/my-bookings/page.tsx:224` | Not exported/shared |
| `formatRelativeTime()` | ❌ NOT FOUND | — | Must create |
| `useAuth()` | ✅ | `contexts/auth-context.tsx` | Returns user, isAuthenticated, etc. |
| `useIsMobile()` | ✅ | `hooks/use-mobile.ts` | Breakpoint: 768px |
| `useToast()` | ✅ | `hooks/use-toast.ts` | Toast notifications |
| Zod schemas | ⚠️ INLINE ONLY | Per form/API route | No shared schemas |
| `ApiResponse` type | ✅ | `types/index.ts:75` | `{ success, data?, error?, message? }` |

### 10.1 Verdict

| Claim | Status |
|-------|--------|
| "`formatCurrency()` exists" | ❌ FALSE — Must create |
| "`formatDate()` exists" | ❌ FALSE — Inline only, not shared |
| "`formatRelativeTime()` exists" | ❌ FALSE — Must create |
| "`cn()` exists" | ✅ TRUE |
| "`useAuth()` exists" | ✅ TRUE |

---

## 11. Business Logic Audit

### 11.1 Tournament Registration Logic

| Rule | Expected Location | Actual Location | Status |
|------|------------------|----------------|--------|
| Captain validation | TournamentEngine or join API | **NOWHERE** — No tournament code exists | ❌ MUST CREATE |
| Team existence check | TournamentEngine or join API | **NOWHERE** | ❌ MUST CREATE |
| Registration phase check | TournamentEngine or join API | **NOWHERE** | ❌ MUST CREATE |
| Capacity check (maxTeams) | TournamentEngine or join API | **NOWHERE** | ❌ MUST CREATE |
| Duplicate registration check | TournamentEngine or join API | **NOWHERE** | ❌ MUST CREATE |
| Leave validation | TournamentEngine or leave API | **NOWHERE** | ❌ MUST CREATE |

### 11.2 Where Business Logic Actually Lives

| Logic | Location | Pattern |
|-------|----------|---------|
| Match status update | `app/api/match-status/route.ts` | Inline in route handler |
| Team creation | `app/api/teams/route.ts` | Inline in route handler |
| Match request flow | `app/api/match-requests/route.ts` | Inline in route handler |
| Notification creation | `lib/server/db/notifications.ts` | Standalone function |
| Match verification | `lib/server/services/verification.ts` | Service function |

**Pattern**: All business logic is inline in API route handlers or in standalone DB functions. There are no service classes, no engine classes, no repository classes.

### 11.3 Verdict

| Claim | Status |
|-------|--------|
| "Business logic lives in engines" | ❌ FALSE in mobile app — No engines exist |
| "Business logic lives in services" | ❌ FALSE — Only 1 service exists (`verification.ts`) |
| "Business logic lives in API routes" | ✅ TRUE — All logic is inline in route handlers |
| "No parallel implementations needed" | ✅ CORRECT — Mobile app has no tournament logic to parallel |

---

## 12. Gap Analysis

### 12.1 Critical Gaps

| # | Gap | Severity | File | Expected | Actual | Impact | Blocker? |
|---|-----|----------|------|----------|--------|--------|----------|
| 1 | No tournament API routes | CRITICAL | `app/api/tournaments/` | 12 route files | 0 files | Cannot fetch any tournament data | ✅ YES |
| 2 | No tournament DB layer | CRITICAL | `lib/server/db/tournaments.ts` | Tournament CRUD functions | Not exists | API routes have no data access | ✅ YES |
| 3 | No tournament fixture DB layer | CRITICAL | `lib/server/db/tournament-fixtures.ts` | Fixture CRUD functions | Not exists | Cannot read fixtures | ✅ YES |
| 4 | No tournament types | HIGH | `types/index.ts` | Tournament, TournamentFixture, etc. | Not exists | No type safety | ✅ YES |
| 5 | No tournament UI components | HIGH | `components/tournaments/` | 15+ components | 0 components | No tournament UI | ✅ YES |
| 6 | No tournament pages | HIGH | `app/tournaments/[id]/` | Detail + register pages | Not exists | No tournament experience | ✅ YES |
| 7 | Middleware doesn't protect `/tournaments` | HIGH | `middleware.ts` | `/tournaments/:path*` in matcher | Not in matcher | Unauthenticated access | ⚠️ PARTIAL |
| 8 | No `formatCurrency()` utility | MEDIUM | `lib/utils.ts` | Shared utility | Not exists | Cannot format prize/fee | ⚠️ |
| 9 | No `formatDate()` utility | MEDIUM | `lib/utils.ts` | Shared utility | Inline only | Inconsistent date display | ⚠️ |
| 10 | No `formatRelativeTime()` utility | MEDIUM | `lib/utils.ts` | Shared utility | Not exists | No relative timestamps | ⚠️ |
| 11 | No ErrorBoundary component | MEDIUM | `components/` | Error boundary | Not exists | No graceful error handling | ⚠️ |
| 12 | Firestore indexes insufficient | HIGH | `firestore.indexes.json` | 38 indexes | 2 indexes | Tournament queries will fail | ✅ YES |
| 13 | `ApiResponse` missing `code` field | LOW | `types/index.ts` | `{ success, data, code }` | `{ success, data, error, message }` | Minor inconsistency | ❌ NO |

### 12.2 Non-Critical Gaps

| # | Gap | Severity | Notes |
|---|-----|----------|-------|
| 1 | `useIsMobile` duplicated in 2 locations | LOW | Works, just redundant |
| 2 | Zod schemas not shared | LOW | Each route defines its own |
| 3 | Auth checks inconsistent across routes | MEDIUM | Some routes have no auth |
| 4 | No RBAC system | MEDIUM | Tournament join needs captain check |

---

## 13. Risk Assessment

| # | Risk | Category | Probability | Impact | Mitigation |
|---|------|----------|------------|--------|-----------|
| 1 | Tournament DB layer doesn't exist | Critical | Certain | Cannot build API routes | Create `tournaments.ts` and `tournament-fixtures.ts` DB functions |
| 2 | Firestore indexes insufficient | Critical | Certain | Tournament queries fail | Deploy Admin Dashboard's `firestore.indexes.json` |
| 3 | No shared formatting utilities | High | Certain | Inconsistent UI | Create `formatCurrency`, `formatDate`, `formatRelativeTime` |
| 4 | No ErrorBoundary | Medium | Certain | Unhandled errors crash UI | Create `ErrorBoundary` component |
| 5 | Auth middleware incomplete | Medium | Certain | Unprotected routes | Add `/tournaments` to matcher |
| 6 | `ApiResponse` type mismatch | Low | Certain | Minor type issues | Add `code` field to type |
| 7 | Firestore rules may block tournament reads | Medium | Possible | API routes can't read tournaments | Verify rules allow Admin SDK access |
| 8 | Tournament document schema unknown | High | Certain | May not match expected fields | Read actual tournament documents from Firestore |
| 9 | Join API validation complexity | Medium | Certain | Registration may fail | Implement all 6 validation checks |
| 10 | Countdown timer SSR issues | Low | Possible | Hydration mismatch | Use dynamic import with ssr: false |

---

## 14. Implementation Readiness

### 14.1 Readiness Score by Category

| Category | Score | Notes |
|----------|-------|-------|
| Repository Layer | 0% | No tournament repositories exist |
| Service Layer | 0% | No tournament services exist |
| Engine Layer | N/A | Correctly absent (Admin Dashboard owns) |
| Firestore Schema | 20% | Collections exist in Admin Dashboard, not referenced in mobile app |
| Firestore Indexes | 5% | 2 of 38 indexes exist |
| Firestore Rules | 30% | Different pattern than baseline — needs verification |
| API Routes | 0% | Zero tournament API routes |
| UI Components | 0% | Zero tournament components |
| UI Pages | 5% | Placeholder only |
| Types | 0% | No tournament types |
| Utilities | 40% | `cn()` exists, `useAuth()` exists. Missing formatting utils |
| Auth | 60% | JWT auth works, but middleware incomplete for tournaments |
| Business Logic | 0% | No tournament logic exists |

### 14.2 Overall Readiness Score

**35%** — The foundation exists (auth, teams, matches, shadcn/ui components), but the entire tournament system must be built from scratch.

### 14.3 What MUST Be Created Before Tournament UI

| # | Item | Priority | Estimated Effort |
|---|------|----------|-----------------|
| 1 | `lib/server/db/tournaments.ts` — Tournament DB functions | Critical | 1 session |
| 2 | `lib/server/db/tournament-fixtures.ts` — Fixture DB functions | Critical | 1 session |
| 3 | `app/api/tournaments/route.ts` — List/get tournaments | Critical | 1 session |
| 4 | `app/api/tournaments/[id]/route.ts` — Tournament detail | Critical | 1 session |
| 5 | `app/api/tournaments/[id]/fixtures/route.ts` — Fixtures | Critical | 1 session |
| 6 | `app/api/tournaments/[id]/standings/route.ts` — Standings | Critical | 1 session |
| 7 | `app/api/tournaments/[id]/groups/route.ts` — Groups | Critical | 1 session |
| 8 | `app/api/tournaments/[id]/matches/route.ts` — Matches | Critical | 1 session |
| 9 | `app/api/tournaments/[id]/join/route.ts` — Join | Critical | 1 session |
| 10 | `app/api/tournaments/[id]/leave/route.ts` — Leave | Critical | 1 session |
| 11 | Tournament type definitions in `types/index.ts` | Critical | 1 session |
| 12 | `middleware.ts` — Add `/tournaments` to matcher | High | 5 minutes |
| 13 | `lib/utils.ts` — Add `formatCurrency`, `formatDate`, `formatRelativeTime` | High | 1 session |
| 14 | `firestore.indexes.json` — Replace with Admin Dashboard's 38 indexes | High | 1 command |
| 15 | `components/ui/error-boundary.tsx` — Error boundary | Medium | 30 minutes |

---

## 15. Final Recommendation

### 15.1 Can Implementation Begin?

**NO — not immediately.** The codebase is missing critical infrastructure that must be built first:

1. **Database layer** for tournaments must be created (`lib/server/db/tournaments.ts`, `lib/server/db/tournament-fixtures.ts`)
2. **API routes** for tournaments must be created (12 route files)
3. **Type definitions** for tournaments must be added to `types/index.ts`
4. **Middleware** must be updated to protect `/tournaments` routes
5. **Formatting utilities** must be created (`formatCurrency`, `formatDate`, `formatRelativeTime`)
6. **Firestore indexes** must be replaced with the Admin Dashboard's 38-index file

### 15.2 Revised Implementation Plan

| Phase | Task | Estimated Effort | Dependencies |
|-------|------|-----------------|-------------|
| **0A** | Create tournament types in `types/index.ts` | 30 min | None |
| **0B** | Create `lib/server/db/tournaments.ts` | 1 session | Phase 0A |
| **0C** | Create `lib/server/db/tournament-fixtures.ts` | 1 session | Phase 0A |
| **0D** | Create 10 tournament API routes | 2 sessions | Phase 0A, 0B, 0C |
| **0E** | Update `middleware.ts` | 5 min | None |
| **0F** | Create formatting utilities | 30 min | None |
| **0G** | Replace `firestore.indexes.json` | 5 min | Admin Dashboard file |
| **0H** | Create `ErrorBoundary` component | 30 min | None |
| **1** | Create tournament UI components (15+) | 2 sessions | Phase 0A–0H |
| **2** | Create tournament list page | 1 session | Phase 0D, 1 |
| **3** | Create tournament detail page | 1 session | Phase 0D, 1 |
| **4** | Create registration wizard page | 1-2 sessions | Phase 0D, 1 |
| **5** | Polish, testing, visual verification | 1 session | All phases |

### 15.3 What the Verification Report Got Right

| Claim | Verdict |
|-------|---------|
| Architecture Baseline is correct | ✅ TRUE |
| Admin Dashboard owns engines/services/events | ✅ TRUE |
| Mobile app should consume via API | ✅ TRUE |
| Tournament registration uses Option A (read-only roster) | ✅ TRUE |
| Join API accepts `{ teamId }` only | ✅ TRUE |
| HTML visual design must be preserved | ✅ TRUE |
| No architecture changes needed | ✅ TRUE |
| No HTML design changes needed | ✅ TRUE |

### 15.4 What the Verification Report Overstated

| Claim | Reality |
|-------|---------|
| "TournamentRepository is reusable" | Does not exist in mobile app — must create DB functions |
| "TournamentService is reusable" | Does not exist in mobile app — must create API routes |
| "NotificationService is reusable" | Only raw functions exist, not a service |
| "38 indexes exist" | Only 2 exist in mobile app's `firestore.indexes.json` |
| "All 11 API endpoints exist" | 0 of 11 exist |
| "15 components will be created" | Correct, but understates that 0 exist today |

---

> **End of Phase 0 Codebase Validation Report**
>
> This report reflects the ACTUAL state of the codebase as of 20 July 2026.
> No files were created or modified during this validation.
> Implementation may begin only after the gaps identified above are addressed.
