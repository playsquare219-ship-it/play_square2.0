# PlaySquare Architecture Baseline

> **Document Type:** Engineering Reference — Permanent Architecture Baseline
> **Scope:** Entire PlaySquare Ecosystem (Mobile Application + Admin Dashboard)
> **Status:** Authoritative — All future implementations must conform to this document
> **Date:** 20 July 2026

---

## Section 1: System Architecture Baseline

### 1.1 Overall Architecture

PlaySquare is a two-application platform built on a single Firebase project (`play-square-d1e9b`). The two applications are:

1. **Admin Dashboard** (`play_square 3.1-main`, v3.1) — The authoritative management system. Owns all business logic, data mutation, event processing, engine execution, and administrative operations.

2. **Mobile Application** (`play_square2.0`, v2.0) — The player-facing consumer application. Provides user registration, team management, match participation, tournament browsing, stadium discovery, notifications, and profile management.

Both applications share the same Firebase project, same Firestore database, same Firebase Auth tenant, same Firebase Storage bucket, and same service account. They are **not** independent systems — they are two frontends for one backend.

### 1.2 System Boundaries

```
┌─────────────────────────────────────────────────────────────────┐
│                    Firebase Project: play-square-d1e9b           │
│                                                                 │
│  ┌─────────────────┐    ┌──────────────────┐                   │
│  │   Firestore      │    │   Firebase Auth   │                   │
│  │   (Database)     │    │   (Identity)      │                   │
│  └────────┬────────┘    └────────┬─────────┘                   │
│           │                      │                              │
│  ┌────────┴──────────────────────┴─────────┐                   │
│  │         Admin SDK (Server-Side)          │                   │
│  │    Service Account: Firebase Auth Admin   │                   │
│  │                    + Cloud Datastore User │                   │
│  └────────┬──────────────────┬─────────────┘                   │
│           │                  │                                  │
│  ┌────────┴────────┐  ┌─────┴──────────────┐                   │
│  │  Admin Dashboard │  │  Mobile Application │                   │
│  │  (Next.js 16)   │  │  (Next.js)          │                   │
│  │  Port: 3000     │  │  Port: 3000         │                   │
│  └─────────────────┘  └────────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
```

**The Admin Dashboard is the authority.** The Mobile Application is a consumer. This is not a peer-to-peer architecture. It is an authority-consumer architecture.

### 1.3 Communication Model

| Channel | Direction | Mechanism | Purpose |
|---------|-----------|-----------|---------|
| Admin → Firestore | Write | Admin SDK (server-side) | All data mutations, event emissions, engine writes |
| Mobile → API Routes | Request/Response | HTTP REST (Next.js API routes) | All data reads and writes |
| API Routes → Firestore | Read/Write | Admin SDK (server-side) | Data access behind API routes |
| Admin → EventBus | Publish | In-memory event bus | 135 event types dispatched to handlers |
| EventBus → Handlers | Consume | In-memory subscriptions | Audit, Notification, Analytics, Realtime Sync handlers |
| Admin → `_sync` collection | Write | Admin SDK via realtime dispatcher | Signal bus for client-side polling |
| Mobile → `_sync` collection | Read | Client SDK (authenticated read allowed by rules) | Polling for data freshness |
| Mobile → `users` collection | Read | Client SDK (authenticated read allowed by rules) | Profile display |
| Mobile → All other collections | **BLOCKED** | Firestore rules deny all client reads | Must go through API routes |

### 1.4 Source of Truth

| Domain | Source of Truth | Location |
|--------|----------------|----------|
| User accounts | Firestore `users` collection | Single collection, shared |
| Teams | Firestore `teams` collection | Admin dashboard writes, mobile reads via API |
| Matches | Firestore `matches` collection | Admin dashboard writes (via engines), mobile reads via API |
| Tournaments | Firestore `tournaments` + `tournament_fixtures` collections | Admin dashboard writes (via engine), mobile reads via API |
| Stadiums | Firestore `stadiums` collection | Admin dashboard writes, mobile reads via API |
| Notifications | Firestore `notifications` collection | Admin dashboard writes (via notification service), mobile reads via API |
| Bookings | Firestore `stadium_bookings` collection | Admin dashboard writes, mobile reads via API |
| Statistics | Firestore `statistics` collection | Admin dashboard writes (via engines), mobile reads via API |
| Leaderboard | Firestore `leaderboard` collection | Admin dashboard writes (via engine), mobile reads via API |
| Rewards | Firestore `reward_definitions`, `reward_grants`, `currency_balances` | Admin dashboard writes (via engine), mobile reads via API |
| References (Wilayas, Baladias) | Firestore `references` collection | Admin dashboard writes, mobile reads via API |
| Audit logs | Firestore `auditLogs`, `activity_logs`, `audit_log` | Admin dashboard writes, mobile writes via API |

### 1.5 Data Ownership

| Collection | Owner | Mobile Access |
|------------|-------|---------------|
| `users` | Admin Dashboard | Client SDK read (authenticated) |
| `_sync` | Admin Dashboard | Client SDK read (authenticated) |
| `teams` | Admin Dashboard | API route read only |
| `matches` | Admin Dashboard | API route read only |
| `tournaments` | Admin Dashboard | API route read only |
| `tournament_fixtures` | Admin Dashboard | API route read only |
| `tournament_matches` | Admin Dashboard | API route read only |
| `bracket` | Admin Dashboard | API route read only |
| `standings` | Admin Dashboard | API route read only |
| `registrations` | Admin Dashboard | API route read only |
| `tournament_groups` | Admin Dashboard | API route read only |
| `stadiums` | Admin Dashboard | API route read only |
| `stadium_bookings` | Admin Dashboard | API route read only |
| `notifications` | Admin Dashboard | API route read only |
| `notification_deliveries` | Admin Dashboard | API route read only |
| `statistics` | Admin Dashboard | API route read only |
| `leaderboard` | Admin Dashboard | API route read only |
| `reward_definitions` | Admin Dashboard | API route read only |
| `reward_grants` | Admin Dashboard | API route read only |
| `currency_balances` | Admin Dashboard | API route read only |
| `reward_audit_log` | Admin Dashboard | API route read only |
| `references` | Admin Dashboard | API route read only |
| `matchmaking_queue` | Admin Dashboard | API route read only |
| `direct_challenges` | Admin Dashboard | API route read only |
| `team_join_requests` | Admin Dashboard | API route read only |
| `pending_registrations` | Admin Dashboard | API route read only |
| `auditLogs` | Admin Dashboard | API route read + write |
| `activity_logs` | Admin Dashboard | API route read + write |
| `audit_log` | Admin Dashboard | API route read only |
| `engineState` | Admin Dashboard | No mobile access |
| `engineConfig` | Admin Dashboard | No mobile access |
| `engineExecutions` | Admin Dashboard | No mobile access |
| `engineHealthHistory` | Admin Dashboard | No mobile access |
| `roleSyncLog` | Admin Dashboard | No mobile access |
| `event_analytics` | Admin Dashboard | No mobile access |
| `fcm_pending` | Admin Dashboard | No mobile access |
| `email_pending` | Admin Dashboard | No mobile access |
| `scheduled_notifications` | Admin Dashboard | No mobile access |
| `dead_letters` | Admin Dashboard | No mobile access |
| `notification_preferences` | Admin Dashboard | API route read + write |
| `notification_templates` | Admin Dashboard | No mobile access |

### 1.6 Firestore Ownership

The Admin Dashboard owns the complete Firestore schema:

- **33+ top-level collections** defined in `collection-paths.ts`
- **9 tournament subcollections**: `tournament_matches`, `bracket`, `standings`, `registrations`, `tournament_groups`, `tournament_fixtures`, `tournament_chats`, `tournament_stats`, `tournament_schedules`
- **38 composite indexes** defined in `firestore.indexes.json`
- **Security rules**: Deny-all default with two read-only exceptions (`_sync`, `users`)

The Mobile Application's `firestore.indexes.json` contains only 1 index (notifications). This file must be replaced with the Admin Dashboard's complete 38-index file before deployment.

### 1.7 API Ownership

| System | API Routes | Endpoints | Purpose |
|--------|-----------|-----------|---------|
| Admin Dashboard | 88 route files under `app/api/` | 120+ endpoints | Full CRUD, engine management, analytics, system admin, tournament management (30+ sub-endpoints) |
| Mobile Application | 26 route files under `app/api/` | ~50 endpoints | Player-facing operations: auth, teams, matches, tournaments (read), stadiums, notifications, profile, bookings, statistics, store |

The Admin Dashboard's API is the complete API. The Mobile Application's API is a subset that exposes only player-facing operations.

### 1.8 Event Ownership

- **135 unique event types** (32 core + 103 extended) owned by the Admin Dashboard
- **In-memory EventBus** with priority-based handler execution
- **4 handlers**: AuditEventHandler (-100), NotificationEventHandler (-50), AnalyticsEventHandler (-200), Realtime Sync Dispatcher
- **Event flow**: Admin Dashboard API routes and engines emit events → EventBus dispatches → handlers process → Firestore writes

The Mobile Application does not emit events. It consumes notifications created by the event handlers.

### 1.9 Notification Ownership

- **NotificationEngine** and **NotificationService** owned by the Admin Dashboard
- **9 categories**: match, tournament, team, leaderboard, rating, system, achievement, stadium, recommendation
- **4 priorities**: low, normal, high, urgent
- **5 statuses**: pending, sent, delivered, read, failed
- **45 event-to-notification rules** in NotificationEventHandler
- **8 tournament-specific templates**: tournament_invite, tournament_started, tournament_ended, tournament_match_ready, tournament_fixture_generated, tournament_walkover, tournament_starts_tomorrow, tournament_starts_today
- **Delivery channels**: in_app (Firestore `notifications`), push (FCM via `fcm_pending`), email (via `email_pending`)

The Mobile Application reads notifications via API routes and displays them in the UI.

### 1.10 Authentication Ownership

| System | Mechanism | Cookie/Token | Expiry | Verification |
|--------|-----------|-------------|--------|-------------|
| Admin Dashboard | Firebase session cookies | `__session` (httpOnly, secure, sameSite=lax) | 14 days | `adminAuth.verifySessionCookie(cookie, true)` with `checkRevoked=true` |
| Mobile Application | JWT httpOnly cookies | `playSquareToken` (httpOnly, secure, sameSite=lax) | Configurable | JWT verification with secret key |

Both systems share the same Firebase Auth tenant and the same `users` Firestore collection. They use different session mechanisms but the same identity provider.

### 1.11 Authorization Ownership

- **Admin Dashboard**: 10-role RBAC hierarchy (numeric levels 10-110), enforced server-side via `requireAdmin()` and `requireExactRoles()`, with coarse JWT-claim-based middleware check
- **Mobile Application**: No RBAC system implemented. Currently only checks if user is authenticated.

The Admin Dashboard defines the authoritative role hierarchy. The Mobile Application must implement a compatible subset for player-facing operations.

### 1.12 Deployment Model

| Aspect | Admin Dashboard | Mobile Application |
|--------|----------------|-------------------|
| Framework | Next.js 16.2.9 | Next.js (version to be confirmed) |
| Hosting | Vercel (or compatible) | Vercel (or compatible) |
| Runtime | Node.js >= 18.18.0 | Node.js >= 18.18.0 |
| Build | `npm run build` (Turbopack for dev) | `npm run build` |
| Firebase deploy | `firebase deploy --only firestore:rules,indexes` | Must NOT deploy independently — rules/indexes shared |
| Environment | 12 variables (6 client, 4 server, 2 standard) | Same 12 variables |
| Docker | Not configured | Not configured |

**Critical deployment rule**: Both applications share the same `firestore.rules` and `firestore.indexes.json`. Only ONE system should deploy these files. The Admin Dashboard is the authority for Firebase configuration deployment.

---

## Section 2: Responsibility Matrix

### A. Admin Dashboard Responsibilities

| Responsibility | Details |
|---------------|---------|
| All Firestore writes | Every collection except `users` (client read) and `_sync` (client read) |
| All business logic | Engines, services, validation, state machines |
| Tournament lifecycle management | Draft → Registration → Closed → Draw → In Progress → Finished → Archived |
| Match lifecycle management | Created → Scheduled → Live → Completed/Cancelled/Disputed |
| Engine execution | 8 engines: Tournament, Standings, Matchmaking, Rating, Leaderboard, Rewards, Notifications, Statistics |
| Event emission | 135 event types via in-memory EventBus |
| Notification creation and delivery | In-app, push (FCM), email |
| Audit logging | Three audit systems: `auditLogs`, `activity_logs`, `audit_log` |
| RBAC enforcement | 10-role hierarchy with server-side verification |
| Firebase Auth management | User creation, session cookies, role assignment, custom claims |
| Firebase Storage management | File uploads, storage rules |
| Firestore schema management | All 33+ collections, 38 composite indexes, security rules |
| Admin UI | Complete admin dashboard with 12 nav groups, 50+ pages |
| Realtime sync | `_sync` collection writes via polling-based realtime dispatcher |
| Analytics and reporting | Executive dashboard, match operations, geo statistics, ultimate analytics |
| System administration | Feature flags, scheduled jobs, maintenance mode, rate limits, API metrics |
| Engine monitoring | Engine state, config, executions, health history, failures |
| Payment processing | Payment records, revenue tracking, financial summaries |
| Stadium management | CRUD, availability, booking configuration, slot generation |
| Team verification | Approval workflow for team registrations |
| Reference data management | Wilayas, baladias, positions, municipalities |

### B. Mobile Application Responsibilities

| Responsibility | Details |
|---------------|---------|
| Player authentication | Login, registration, password reset, session management |
| Player profile management | View/edit profile, photo upload (via API) |
| Team creation and management | Create team, invite players, manage roster |
| Team join requests | Send/accept/reject join requests |
| Match participation | Accept/decline match invites, submit results, report disputes |
| Tournament browsing | List tournaments, view details, view fixtures, view standings |
| Tournament registration | Join/leave tournaments (via API) |
| Stadium discovery | Browse stadiums, view availability, view details |
| Booking management | Create/view/cancel bookings |
| Notification display | Read notifications, mark as read, unread count |
| Statistics viewing | View personal and team statistics |
| Leaderboard viewing | View global and category leaderboards |
| Store browsing | Browse rewards, redeem items |
| Match history | View past matches, results, statistics |
| Direct challenges | Create/accept/decline direct challenges |
| Matchmaking queue | Join/leave matchmaking queue |
| Client-side routing | Page navigation, URL management |
| Client-side state management | UI state, form state, local cache |
| Responsive design | Mobile-first UI adapted for various screen sizes |
| Offline handling | Graceful degradation when network is unavailable |
| Error handling | User-friendly error display, retry logic |
| Security headers | Middleware-enforced headers on all responses |
| Rate limiting | In-memory rate limiting on API routes |
| Structured error responses | `{ success, data/error, code }` format from all API routes |

### C. Shared Infrastructure

| Resource | Shared By | Ownership |
|----------|----------|-----------|
| Firebase Project (`play-square-d1e9b`) | Both | Firebase Console |
| Firestore Database | Both | Admin Dashboard deploys rules/indexes |
| Firebase Auth Tenant | Both | Admin Dashboard manages users |
| Firebase Storage Bucket | Both | Admin Dashboard manages rules |
| Service Account | Both | Same `FIREBASE_SERVICE_ACCOUNT_BASE64` |
| `users` collection | Both (read), Admin (write) | Admin Dashboard |
| `_sync` collection | Both (read), Admin (write) | Admin Dashboard |
| `firestore.rules` | Both | Admin Dashboard deploys |
| `firestore.indexes.json` | Both | Admin Dashboard deploys (38 indexes) |
| Environment variables | Both | Same 12 variables |
| EventBus | Admin emits, Mobile consumes via notifications | Admin Dashboard |
| Notification system | Admin creates, Mobile displays | Admin Dashboard |
| Audit system | Both write via API routes | Admin Dashboard |

---

## Section 3: Tournament Domain

### 3.1 Lifecycle

The tournament lifecycle is a state machine managed by the Admin Dashboard:

```
draft
  ↓ (publish)
registration_open
  ↓ (close_registration)
registration_closed
  ↓ (start or draw)
schedule_generated / groups_created
  ↓
draw_pending
  ↓ (draw completed)
in_progress
  ↓ (pause)
paused → in_progress
  ↓ (finish)
finished
  ↓ (archive)
archived

Cancel available from: draft, registration_open, registration_closed, draw_pending, in_progress, paused
```

### 3.2 Entities

| Entity | Collection | Fields | Purpose |
|--------|-----------|--------|---------|
| Tournament | `tournaments` | id, name, description, type, status, maxTeams, teams[], rounds[], groups[], startDate, endDate, registrationFee, prize, minPlayersPerTeam, maxPlayersPerTeam, emoji, createdByUserId, phaseConfig, venueConfig, scheduleConfig, rules, createdAt, updatedAt | Core tournament document |
| TournamentTeam | Embedded in `tournaments.teams[]` | teamId, teamName, captainId, points, wins, draws, losses, goalsFor, goalsAgainst, joinedAt | Registered team with stats |
| TournamentFixture | `tournament_fixtures` | id, tournamentId, round, roundName, matchIndex, team1Id, team2Id, matchId, status, winnerId, score1, score2, createdAt, updatedAt | Bracket/fixture slot |
| TournamentRound | Embedded in `tournaments.rounds[]` | roundName, matches[], startDate, endDate | Round grouping |
| TournamentGroup | Embedded in `tournaments.groups[]` | id, name, teamIds[], fixtureIds[] | Group stage grouping |
| TournamentMatch | `tournament_matches` | Regular match fields + tournamentId, round, groupName | Match belonging to tournament |
| TournamentRegistration | `registrations` | status, registeredAt, team info | Registration record |
| TournamentStanding | `standings` | groupId, teamId, points, goalDifference | Group standings |
| TournamentBracket | `bracket` | round, position | Bracket structure |
| TournamentGroup | `tournament_groups` | order | Group ordering |

### 3.3 Workflow

1. **Creation**: Captain creates tournament (name, type, maxTeams, startDate required). Status: `draft` or `registration_open`.
2. **Registration**: Teams join via `POST /api/tournaments/[id]/join`. Captain must have a team. Tournament must be in registration phase. Not full. Not duplicate.
3. **Registration Close**: Admin closes registration. Status: `registration_closed`.
4. **Fixture Generation**: Admin triggers draw. TournamentEngine generates fixtures based on format (knockout/league/group+knockout). Creates Match documents for each fixture.
5. **Tournament Start**: Status: `in_progress`. Matches become available for play.
6. **Match Play**: Regular match lifecycle applies. On completion, `MatchCompleted` event fires.
7. **Bracket Advancement**: TournamentEngine picks up `MatchCompleted` event, updates fixture, advances winner to next round.
8. **Group Stage Transition**: For `group_and_knockout`, when all group fixtures complete, engine seeds knockout bracket from group standings.
9. **Finalization**: When all fixtures complete, engine determines winner, sets status to `completed`.
10. **Archival**: Admin archives finished tournament.

### 3.4 Registration

- **Who**: Team captains only (must have `isTeamCaptain: true` and a valid `teamId`)
- **Validation**: Tournament exists, status is `registration`, not full (`teams.length < maxTeams`), team not already registered
- **Storage**: `FieldValue.arrayUnion()` appends `TournamentTeam` to `tournaments.teams[]`
- **Event**: `TournamentJoined` published → NotificationEngine sends `tournament_invite` notification
- **Leaving**: `FieldValue.arrayRemove()` during registration phase only

### 3.5 Fixtures

Three formats supported:

**Knockout**: Pads teams to next power of 2. Creates bye fixtures for excess slots. Empty placeholder rounds created. Winners advance via bracket propagation.

**League (Round-Robin)**: Every pair plays once. Total fixtures = n(n-1)/2. Standings computed from results.

**Group + Knockout**: Teams distributed across groups (configurable count). Round-robin within each group. Top N teams per group advance to knockout bracket (rounds numbered 100+).

### 3.6 Standings

Computed on-the-fly from `tournaments.teams[]` stats:

- **Primary sort**: Points (win=3, draw=1, loss=0)
- **Tiebreaker 1**: Goal Difference (goalsFor - goalsAgainst)
- **Tiebreaker 2**: Goals For
- **Tiebreaker 3**: Head-to-head (for league format)

No separate standings collection in mobile app's current schema. Standings are computed from the embedded teams array.

### 3.7 Brackets

- Stored in `tournament_fixtures` collection
- Each fixture has `round` and `matchIndex` fields
- Advancement: `pairIndex = floor(matchIndex / 2)` determines target fixture
- Winner placed in `team1` slot if `matchIndex` is even, `team2` slot if odd
- When both slots filled → Match document created → fixture status set to `scheduled`

### 3.8 Notifications

8 tournament-specific notification templates:

| Template | Trigger | Priority | Destination |
|----------|---------|----------|-------------|
| `tournament_invite` | Team joins tournament | normal | — |
| `tournament_started` | Fixtures generated | urgent | tournament_bracket |
| `tournament_ended` | Tournament finalized | normal | tournament_details |
| `tournament_match_ready` | Match scheduled | normal | tournament_match |
| `tournament_fixture_generated` | Fixtures created | normal | tournament_bracket |
| `tournament_walkover` | Walkover processed | normal | tournament_bracket |
| `tournament_starts_tomorrow` | Scheduled reminder | high | tournament_details |
| `tournament_starts_today` | Scheduled reminder | urgent | tournament_details |

### 3.9 Engines

The **TournamentEngine** (948 lines) is the core engine. It:

- Subscribes to `MatchCompleted` events
- Generates fixtures for all three formats
- Processes bracket advancement
- Handles byes and walkovers
- Seeds knockout from group standings
- Auto-schedules matches
- Computes standings with tiebreakers
- Finalizes tournaments
- Publishes lifecycle events

Dependencies injected: `TournamentRepository`, `TournamentFixtureRepository`, `TeamRepository`, `StatisticsRepository`, `LeaderboardRepository`, `MatchRepository`, `EventBus`, `Logger`.

### 3.10 Event Flow

```
Admin Action (e.g., "Start Tournament")
  → TournamentEngine.generateFixtures()
    → Creates fixtures in Firestore
    → Creates Match documents
    → Publishes TournamentStarted event
      → NotificationEventHandler → Creates notifications
      → AuditEventHandler → Writes audit log
      → AnalyticsEventHandler → Writes analytics
      → Realtime Sync Dispatcher → Updates _sync collection
```

```
Match Completion (regular match)
  → MatchCompleted event published
    → TournamentEngine.handleMatchCompleted()
      → Updates fixture scores
      → Advances winner to next round
      → Publishes TournamentMatchResultProcessed event
      → Checks tournament completion
        → If all fixtures done → finalizeTournament() → TournamentCompleted event
        → If group stage done → seedKnockoutFromGroups() → continues
```

### 3.11 Database Relationships

```
tournaments (document)
  ├── teams[] (embedded array of TournamentTeam)
  ├── rounds[] (embedded array of TournamentRound)
  └── groups[] (embedded array of TournamentGroup)

tournament_fixtures (collection)
  ├── tournamentId → tournaments.id
  └── matchId → matches.id

tournament_matches (collection)
  ├── tournamentId → tournaments.id
  └── Regular match fields

matches (collection)
  ├── tournamentId → tournaments.id (when tournament match)
  └── tournamentRound → round identifier

standings (collection)
  ├── groupId → tournament group
  └── teamId → teams.id

bracket (collection)
  └── round, position → tournament bracket structure

registrations (collection)
  └── tournamentId, teamId, status

tournament_groups (collection)
  └── order → group ordering within tournament
```

### 3.12 APIs

**Public/User-Facing Tournament APIs (Mobile App)**:

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/tournaments` | No | List all, filter by `?id=` or `?status=` |
| POST | `/api/tournaments` | Captain | Create tournament |
| PATCH | `/api/tournaments` | Creator | Update tournament |
| DELETE | `/api/tournaments?id=` | Creator | Delete tournament + cascade fixtures |
| GET | `/api/tournaments/my` | Yes | My tournaments |
| POST | `/api/tournaments/[id]/join` | Captain | Join tournament |
| POST | `/api/tournaments/[id]/leave` | Captain | Leave tournament |
| GET | `/api/tournaments/[id]/fixtures` | No | Get fixtures |
| GET | `/api/tournaments/[id]/groups` | No | Get groups with standings |
| GET | `/api/tournaments/[id]/matches` | No | Get tournament matches |
| GET | `/api/tournaments/[id]/standings` | No | Get standings |

**Admin Tournament APIs (Admin Dashboard)**:

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/admin/tournaments/[id]/start` | Creator | Initialize engine, generate fixtures |
| POST | `/api/admin/tournaments/[id]/draw` | Creator | Execute draw |
| POST | `/api/admin/tournaments/[id]/cancel` | Creator | Cancel tournament |
| POST | `/api/admin/tournaments/[id]/walkover` | Creator | Process walkover |
| POST | `/api/admin/tournaments/[id]/schedule` | Creator | Auto-schedule matches |
| GET | `/api/admin/tournaments/[id]/fixtures` | Creator | Get fixtures (admin variant) |
| POST | `/api/admin/tournaments/[id]/publish` | Admin | Lifecycle state transitions |
| GET | `/api/admin/tournaments/[id]/stats` | Admin | Tournament statistics |
| GET | `/api/admin/tournaments/[id]/teams` | Admin | Registered teams |
| GET | `/api/admin/tournaments/[id]/matches` | Admin | Tournament matches |
| GET | `/api/admin/tournaments/[id]/groups` | Admin | Groups |
| GET | `/api/admin/tournaments/[id]/standings` | Admin | Standings |
| GET | `/api/admin/tournaments/[id]/bracket` | Admin | Bracket |
| GET | `/api/admin/tournaments/[id]/schedule` | Admin | Schedule |
| GET | `/api/admin/tournaments/[id]/registrations` | Admin | Registrations |
| GET | `/api/admin/tournaments/[id]/payments` | Admin | Payments |
| GET | `/api/admin/tournaments/[id]/reports` | Admin | Reports |
| GET | `/api/admin/tournaments/[id]/announcements` | Admin | Announcements |
| GET | `/api/admin/tournaments/[id]/media` | Admin | Media |
| GET | `/api/admin/tournaments/[id]/activity` | Admin | Activity log |
| GET | `/api/admin/tournaments/[id]/referees` | Admin | Referees |
| GET | `/api/admin/tournaments/[id]/awards` | Admin | Awards |
| PUT | `/api/admin/tournaments/[id]/settings` | Admin | Update settings |

### 3.13 Mobile Application Consumption

The Mobile Application consumes the Tournament system as follows:

1. **Browse tournaments**: `GET /api/tournaments` — list all public tournaments
2. **View tournament details**: `GET /api/tournaments?id={id}` — full tournament with teams, status, config
3. **View fixtures**: `GET /api/tournaments/[id]/fixtures` — bracket/fixture tree
4. **View standings**: `GET /api/tournaments/[id]/standings` — computed standings
5. **View groups**: `GET /api/tournaments/[id]/groups` — group stage with inline standings
6. **View matches**: `GET /api/tournaments/[id]/matches` — all tournament matches
7. **Join tournament**: `POST /api/tournaments/[id]/join` — captain registers team
8. **Leave tournament**: `POST /api/tournaments/[id]/leave` — captain withdraws team
9. **My tournaments**: `GET /api/tournaments/my` — tournaments user is involved in
10. **Notifications**: Read tournament notifications from `notifications` collection via API

The Mobile Application does NOT:
- Create tournaments (admin/organizer function)
- Generate draws/fixtures (admin function)
- Start/pause/finish/archive tournaments (admin function)
- Process walkovers (admin function)
- Auto-schedule matches (admin function)
- Access tournament engine directly
- Access tournament statistics sub-endpoints

---

## Section 4: Platform Module Map

### 4.1 Tournament Module

| Aspect | Detail |
|--------|--------|
| Owner | Admin Dashboard |
| Mobile Access | Read-only (browse, view details, join/leave) |
| Shared Resources | `tournaments`, `tournament_fixtures`, `matches`, `users`, `teams` collections |
| Dependencies | TournamentEngine, MatchEngine, NotificationEngine, RatingEngine, LeaderboardEngine |
| Communication | Mobile reads via API routes. Admin manages via API routes + engine. |

### 4.2 Matches Module

| Aspect | Detail |
|--------|--------|
| Owner | Admin Dashboard |
| Mobile Access | Read + limited write (accept/decline invites, submit results, report disputes) |
| Shared Resources | `matches`, `match_requests`, `matchmaking_queue`, `direct_challenges` collections |
| Dependencies | MatchEngine, RatingEngine, StatisticsEngine, NotificationEngine |
| Communication | Mobile reads via API. Mobile can create match requests and submit results via API. |

### 4.3 Teams Module

| Aspect | Detail |
|--------|--------|
| Owner | Admin Dashboard |
| Mobile Access | Full CRUD (create, read, update, manage roster) |
| Shared Resources | `teams`, `users`, `team_join_requests` collections |
| Dependencies | Team verification engine, NotificationEngine |
| Communication | Mobile creates/manages teams via API. Admin verifies/approves teams. |

### 4.4 Stadiums Module

| Aspect | Detail |
|--------|--------|
| Owner | Admin Dashboard |
| Mobile Access | Read-only (browse, view details, view availability) |
| Shared Resources | `stadiums`, `stadium_bookings` collections |
| Dependencies | Booking system, NotificationEngine |
| Communication | Mobile reads via API. Bookings created via API. |

### 4.5 Bookings Module

| Aspect | Detail |
|--------|--------|
| Owner | Admin Dashboard |
| Mobile Access | Read + create (book stadiums, view bookings, cancel) |
| Shared Resources | `stadium_bookings`, `stadiums`, `users` collections |
| Dependencies | Stadium management, NotificationEngine |
| Communication | Mobile creates bookings via API. Admin manages availability. |

### 4.6 Notifications Module

| Aspect | Detail |
|--------|--------|
| Owner | Admin Dashboard |
| Mobile Access | Read + mark as read |
| Shared Resources | `notifications`, `notification_deliveries`, `_sync` collections |
| Dependencies | NotificationEngine, EventBus (45 event-to-notification rules) |
| Communication | Admin creates via engine. Mobile reads via API. Mobile marks read via API. |

### 4.7 Statistics Module

| Aspect | Detail |
|--------|--------|
| Owner | Admin Dashboard |
| Mobile Access | Read-only (view personal/team statistics) |
| Shared Resources | `statistics` collection |
| Dependencies | StatisticsEngine, RatingEngine |
| Communication | Admin computes via engine. Mobile reads via API. |

### 4.8 Profile Module

| Aspect | Detail |
|--------|--------|
| Owner | Shared (Admin writes, Mobile reads + limited updates) |
| Mobile Access | Read + limited update (name, phone, photo) |
| Shared Resources | `users` collection |
| Dependencies | Firebase Auth |
| Communication | Mobile reads `users/{uid}` directly (allowed by Firestore rules). Updates via API route. |

### 4.9 Leaderboard Module

| Aspect | Detail |
|--------|--------|
| Owner | Admin Dashboard |
| Mobile Access | Read-only (view rankings) |
| Shared Resources | `leaderboard` collection |
| Dependencies | LeaderboardEngine, RatingEngine |
| Communication | Admin computes via engine. Mobile reads via API. |

### 4.10 Rewards Module

| Aspect | Detail |
|--------|--------|
| Owner | Admin Dashboard |
| Mobile Access | Read-only (view rewards, achievements, currency balance) |
| Shared Resources | `reward_definitions`, `reward_grants`, `currency_balances` collections |
| Dependencies | RewardsEngine, EventBus |
| Communication | Admin manages definitions and grants. Mobile reads via API. |

### 4.11 Settings Module

| Aspect | Detail |
|--------|--------|
| Owner | Admin Dashboard |
| Mobile Access | Read-only (notification preferences) |
| Shared Resources | `notification_preferences` collection |
| Dependencies | None |
| Communication | Mobile reads/writes preferences via API. |

### 4.12 Authentication Module

| Aspect | Detail |
|--------|--------|
| Owner | Shared (Firebase Auth is shared, session mechanisms differ) |
| Mobile Access | Full (login, register, logout, session management) |
| Shared Resources | Firebase Auth tenant, `users` collection |
| Dependencies | Firebase Auth Admin SDK |
| Communication | Mobile manages sessions via its own API routes. Admin manages users via its own API routes. Both write to same `users` collection. |

---

## Section 5: Integration Rules

### 5.1 Business Logic Rules

| Rule | Rationale |
|------|-----------|
| **Never duplicate business logic.** If logic exists in the Admin Dashboard's engines or services, the Mobile Application must call it via API routes, not reimplement it. | Single source of truth. Duplication leads to inconsistency. |
| **Never bypass API routes.** All Firestore reads and writes from the Mobile Application must go through Next.js API routes using the Admin SDK. | Firestore rules deny all client writes. Client reads are blocked on all collections except `users` and `_sync`. |
| **Never read restricted Firestore collections directly.** Collections other than `users` and `_sync` are blocked by Firestore rules for client-side access. | Security model depends on server-side access control. |
| **Never write to Firestore from client code.** All writes must use the Admin SDK on the server side. | Firestore rules deny all client writes. This is a hard security constraint. |

### 5.2 Engine and Service Rules

| Rule | Rationale |
|------|-----------|
| **Reuse existing engines.** The TournamentEngine, MatchEngine, RatingEngine, LeaderboardEngine, StatisticsEngine, RewardsEngine, NotificationEngine, and MatchmakingEngine are the authoritative implementations. | Engines contain complex business logic, event handling, and cross-cutting concerns. |
| **Reuse existing services.** NotificationService, AuditLogService, TournamentService, MatchService, TeamService, StadiumService are the authoritative implementations. | Services encapsulate data access patterns and validation logic. |
| **Never create parallel service implementations.** If a service exists in the Admin Dashboard, the Mobile Application must call it via API, not create its own. | Prevents divergence and data inconsistency. |

### 5.3 Event and Notification Rules

| Rule | Rationale |
|------|-----------|
| **Reuse existing events.** The 135 event types defined in the Admin Dashboard are the authoritative event catalog. | Events drive notifications, audit logging, analytics, and sync. |
| **Reuse existing notification flows.** The 45 event-to-notification rules in NotificationEventHandler define how events become notifications. | Consistent notification behavior across the platform. |
| **Reuse existing notification templates.** The 8 tournament templates and all other templates are the authoritative notification content. | Consistent messaging and branding. |
| **Never create duplicate notification channels.** The Mobile Application displays notifications; it does not create them. | Notification creation is an Admin Dashboard responsibility. |

### 5.4 Database Rules

| Rule | Rationale |
|------|-----------|
| **Reuse existing database structures.** All 33+ collections and their schemas are authoritative. | Prevents schema fragmentation. |
| **Never create new top-level collections without Admin Dashboard coordination.** New collections require Firestore rules, indexes, and security review. | Shared Firestore instance requires coordinated schema management. |
| **Never modify Firestore rules independently.** Rules are deployed from the Admin Dashboard's `firestore.rules` file. | Rules are shared infrastructure. |
| **Never deploy Firestore indexes independently.** Indexes are deployed from the Admin Dashboard's `firestore.indexes.json` file. | 38 indexes are shared infrastructure. The Mobile Application's 1-index file must not be deployed. |

### 5.5 Architecture Consistency Rules

| Rule | Rationale |
|------|-----------|
| **Follow the authority-consumer model.** The Admin Dashboard is the authority. The Mobile Application is a consumer. | This is the fundamental architecture. |
| **Maintain consistent API response format.** All API routes must return `{ success, data/error, code }` format. | Consistent client-side error handling. |
| **Maintain consistent date handling.** All dates stored as ISO strings. Displayed via standardized formatters. | Cross-system date consistency. |
| **Maintain consistent currency handling.** Displayed via standardized `formatCurrency()`. | Cross-system financial consistency. |
| **Follow the existing RBAC hierarchy.** The 10-role system (10-110) is authoritative. The Mobile Application must implement a compatible subset. | Consistent authorization across systems. |
| **Follow the existing security header pattern.** `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-XSS-Protection: 1; mode=block`. | Consistent security posture. |
| **Follow the existing rate limiting pattern.** In-memory, per `ip:path`, STANDARD=60/min, STRICT=10/min, RELAXED=200/min. | Consistent abuse prevention. |

### 5.6 Deployment Rules

| Rule | Rationale |
|------|-----------|
| **Single deployment authority for Firebase configuration.** Only the Admin Dashboard deploys `firestore.rules` and `firestore.indexes.json`. | Prevents conflicting rule/index deployments. |
| **Shared environment variables.** Both applications use the same 12 environment variables. | Same Firebase project, same configuration. |
| **No `DEV_BYPASS_AUTH` in production.** The `isDevBypassEnabled()` function requires both `NODE_ENV=development` AND `DEV_BYPASS_AUTH=true`. | Security constraint. |
| **Session cookie flags must match.** `httpOnly: true`, `secure: true` (production), `sameSite: 'lax'`, 14-day expiry. | Security consistency. |

---

## Section 6: Architecture Constraints

### 6.1 Security Constraints

| Constraint | Violation Consequence |
|-----------|----------------------|
| All Firestore writes must use Admin SDK server-side | Client writes are denied by Firestore rules |
| All Firestore reads (except `users` and `_sync`) must use API routes | Client reads are denied by Firestore rules |
| `FIREBASE_SERVICE_ACCOUNT_BASE64` must never be exposed to client | Full service account with private key compromise |
| `DEV_BYPASS_AUTH` must be `false`/unset in production | Authentication bypass vulnerability |
| `NODE_ENV` must be `production` in production | Error stack traces exposed, secure cookie flags disabled |
| Session cookies must be httpOnly, secure, sameSite=lax | Session hijacking vulnerability |
| All API routes must verify session cookies server-side | Unauthorized access to protected resources |
| Role hierarchy must be enforced server-side | Privilege escalation vulnerability |
| No debug endpoints in production | Information disclosure vulnerability |
| Security headers must be set on all responses | XSS, clickjacking, MIME sniffing vulnerabilities |
| Rate limiting must be enabled on all API routes | Denial of service vulnerability |
| No stack traces in production error responses | Information disclosure vulnerability |

### 6.2 Firestore Constraints

| Constraint | Detail |
|-----------|--------|
| Deny-all default | All collections blocked by default. Only `_sync` and `users` have read exceptions. |
| 38 composite indexes | Must be maintained. Mobile app's 1-index file is insufficient. |
| Single Firebase project | Both apps share `play-square-d1e9b`. Schema changes affect both. |
| No client-side writes | Hard rule enforced by Firestore security rules. |
| Shared `users` collection | Both apps read. Only Admin writes. |
| Shared `_sync` collection | Admin writes. Both apps read. |

### 6.3 Authentication Constraints

| Constraint | Detail |
|-----------|--------|
| Firebase Auth tenant shared | Both apps use same identity provider |
| Two session mechanisms | Admin: `__session` (Firebase session cookie). Mobile: `playSquareToken` (JWT). |
| 14-day session expiry | Both systems should align session lifetimes |
| `checkRevoked=true` | Admin SDK verifies token revocation on every request |
| Custom claims | Admin Dashboard sets role claims on Firebase Auth tokens |

### 6.4 Production Constraints

| Constraint | Detail |
|-----------|--------|
| Node.js >= 18.18.0 | Required by Next.js 16.2.9 |
| No Docker configuration | Neither app has Docker support |
| Vercel deployment | Both apps deployed to Vercel (or compatible host) |
| In-memory rate limiting | Lost on cold starts. Acceptable for serverless. |
| Firebase Storage rules missing | Must be configured via Firebase Console or new `storage.rules` file |

### 6.5 Performance Constraints

| Constraint | Detail |
|-----------|--------|
| 38 composite indexes required | Queries will fail or perform poorly without proper indexes |
| No N+1 query patterns | Server components must use `Promise.all()` for parallel queries |
| Polling-based sync | 5-second interval via `/api/sync`. Not real-time. |
| Collection read limit 500 | `/api/sync/collection` caps at 500 documents |
| MAX_PATHS = 10 | Batch sync requests limited to 10 paths |
| Tournament `findByTeamId` loads all tournaments | Performance issue in admin dashboard. Mobile app should implement index-based query. |

### 6.6 Scalability Constraints

| Constraint | Detail |
|-----------|--------|
| In-memory EventBus | Single-instance only. No cross-instance event propagation. |
| In-memory rate limiting | No shared state across instances |
| Firestore document size limit | Embedded arrays (teams[], rounds[], groups[]) must stay under 1MB |
| Tournament team limit | Max 2-64 teams per tournament (enforced at creation) |
| Firestore read/write costs | Every API call generates Firestore operations. Must optimize queries. |

### 6.7 Maintainability Constraints

| Constraint | Detail |
|-----------|--------|
| TypeScript strict mode | Both apps use `strict: true` |
| Shared type definitions | Types must be consistent across systems |
| Shared API response format | `{ success, data/error, code }` |
| Shared error handling patterns | `AuthorizationError`, `BusinessError`, generic errors |
| Shared date/currency formatting | ISO strings, `formatCurrency()` |

### 6.8 Data Consistency Constraints

| Constraint | Detail |
|-----------|--------|
| Single source of truth per domain | No duplicate authoritative data stores |
| Atomic operations | `FieldValue.arrayUnion()` / `arrayRemove()` for embedded array mutations |
| Batch writes | Firestore batch for multi-document mutations (fixture generation) |
| Event-driven consistency | Match completion → event → tournament update → notification |
| No eventual consistency assumptions | All reads are from the same Firestore instance |

---

## Section 7: Development Roadmap

### Phase 1: Foundation and Authentication

**Why first**: Authentication is the prerequisite for all other features. Without a working auth system, no protected route can function. The mobile app already has a partial auth system that needs to be aligned with the Admin Dashboard's auth model.

**Scope**:
- Verify and align mobile app auth system with Admin Dashboard's auth model
- Implement structured API response format (`{ success, data/error, code }`)
- Implement security headers in middleware
- Implement rate limiting on API routes
- Protect all currently unprotected routes (`/tournaments`, `/bookings`, `/my-bookings`, `/notifications`, `/statistics`, `/store`)
- Implement session cookie alignment (flags, expiry)
- Implement basic RBAC for player-facing operations

**Dependencies**: None
**Risk**: Low — existing auth system is partially functional

### Phase 2: Tournament UI Integration

**Why second**: The Tournament system is the most complex domain. It touches teams, matches, notifications, standings, brackets, and statistics. Building it first establishes patterns for all other module integrations. The HTML design is expected next, making this the natural implementation target.

**Scope**:
- Tournament list page (browse all public tournaments)
- Tournament detail page (overview, status, teams, config)
- Tournament fixtures page (bracket view, round-robin view)
- Tournament standings page (computed standings with tiebreakers)
- Tournament groups page (group stage with inline standings)
- Tournament matches page (all tournament matches with status)
- Join/leave tournament functionality
- My tournaments page (tournaments user is involved in)
- Tournament notifications integration
- Tournament-related API routes (read-only + join/leave)

**Dependencies**: Phase 1 (authentication)
**Risk**: Medium — complex UI, three tournament formats, bracket visualization

### Phase 3: Match Module

**Why third**: Matches are the core gameplay loop. After tournaments (which contain matches), the standalone match system is the next most-used feature. It connects to teams, statistics, ratings, and notifications.

**Scope**:
- Match list page (upcoming, live, completed, cancelled)
- Match detail page (score, teams, events, statistics)
- Match request creation (challenge another team)
- Match invite accept/decline
- Match result submission
- Match dispute reporting
- Match history page
- Direct challenge system
- Matchmaking queue integration
- Match-related API routes

**Dependencies**: Phase 1 (authentication)
**Risk**: Medium — complex match lifecycle, real-time considerations

### Phase 4: Teams Module

**Why fourth**: Teams are a prerequisite for tournament registration and match participation. After tournaments and matches are functional, the team management experience needs to be complete.

**Scope**:
- Team creation page
- Team detail page (roster, statistics, match history)
- Team edit page
- Team join request system (send/accept/reject)
- Captain transfer
- Team verification status display
- Team-related API routes

**Dependencies**: Phase 1 (authentication)
**Risk**: Low — CRUD operations, existing DB modules

### Phase 5: Stadiums and Bookings

**Why fifth**: Stadiums are a supporting module. They are required for match scheduling and booking but are not core gameplay. After the core modules (tournaments, matches, teams) are functional, stadiums add the physical venue layer.

**Scope**:
- Stadium list page (browse by wilaya, baladia, sport)
- Stadium detail page (amenities, availability, pricing)
- Stadium booking creation
- Booking list page (my bookings)
- Booking detail/cancel
- Stadium search and filtering
- Stadium-related API routes

**Dependencies**: Phase 1 (authentication), reference data (wilayas, baladias)
**Risk**: Low — read-heavy, existing DB modules

### Phase 6: Notifications

**Why sixth**: Notifications are a cross-cutting concern that touches all modules. By Phase 6, all modules that generate notifications (tournaments, matches, teams, bookings) are functional. The notification display system can now be fully integrated.

**Scope**:
- Notification list page (categorized, filtered)
- Notification detail/read
- Mark as read / mark all as read
- Unread count badge
- Notification preferences page
- Real-time notification polling (via `_sync` collection)
- Notification-related API routes

**Dependencies**: All previous phases (notifications are generated by all modules)
**Risk**: Low — display-only, existing notification infrastructure

### Phase 7: Statistics and Leaderboard

**Why seventh**: Statistics and leaderboards are read-heavy modules that aggregate data from matches and tournaments. After all data-generating modules are functional, statistics become meaningful.

**Scope**:
- Statistics overview page (personal stats, team stats)
- Statistics detail pages (match history, performance charts)
- Leaderboard page (global, category, wilaya-based)
- Rating display
- Statistics-related API routes

**Dependencies**: Phases 2, 3, 4 (tournaments, matches, teams generate statistics data)
**Risk**: Low — read-only, data already computed by engines

### Phase 8: Profile and Settings

**Why eighth**: Profile and settings are personal modules that don't depend on other modules. They can be implemented at any point but are lower priority than gameplay features.

**Scope**:
- Profile page (view/edit personal information)
- Profile photo upload
- Team membership display
- Notification preferences
- Account settings
- Profile-related API routes

**Dependencies**: Phase 1 (authentication)
**Risk**: Low — simple CRUD, direct `users` collection read

### Phase 9: Rewards and Store

**Why ninth**: Rewards and store are gamification features that depend on all other modules generating activity. They are the least critical for core functionality.

**Scope**:
- Store page (browse rewards, achievements)
- Reward details
- Currency balance display
- Redemption flow
- Reward history
- Reward-related API routes

**Dependencies**: All previous phases (rewards are earned through gameplay)
**Risk**: Low — read-heavy, existing reward infrastructure

### Phase 10: Remaining Modules

**Why last**: Direct challenges, matchmaking queue, and other niche features are lower priority and can be implemented as needed.

**Scope**:
- Direct challenge system refinement
- Matchmaking queue refinement
- Search functionality
- Deep linking
- PWA features
- Offline support
- Performance optimization

**Dependencies**: All previous phases
**Risk**: Low — incremental improvements

---

## Section 8: Implementation Readiness

### 8.1 Already Available

| Component | Location | Status |
|-----------|----------|--------|
| Complete Admin Dashboard | `play_square 3.1-main` | Fully functional |
| 8 production engines | `engines/` | Implemented |
| 135 event types | `lib/server/event-bus/` | Defined |
| 4 event handlers | `handlers/` | Implemented |
| 38 Firestore indexes | `firestore.indexes.json` | Defined |
| Firestore security rules | `firestore.rules` | Defined (deny-all default) |
| Tournament engine (948 lines) | `lib/engines/tournament/` | Implemented |
| Notification service | `lib/server/services/notification-service.ts` | Implemented |
| Audit logging (3 systems) | Multiple locations | Implemented |
| RBAC system (10 roles) | `lib/server/auth/authorization.ts` | Implemented |
| API route factory | `lib/server/api-route-handler.ts` | Implemented |
| 120+ admin API endpoints | `app/api/admin/` | Implemented |
| 11 user-facing tournament APIs | `app/api/tournaments/` | Implemented |
| Complete type system | `types/index.ts` | Defined |
| 27+ Firestore collections | `collection-paths.ts` | Defined |
| 8 notification templates (tournament) | `template-service.ts` | Defined |
| Match verification engine | Mobile app `lib/server/services/verification.ts` | Implemented |
| 13 mobile DB modules | Mobile app `lib/server/db/` | Implemented |
| 26 mobile API routes | Mobile app `app/api/` | Implemented |
| 11 mobile pages | Mobile app `app/` | Implemented |
| Auth system (partial) | Mobile app | Partially implemented |

### 8.2 Missing

| Component | Owner | Impact |
|-----------|-------|--------|
| Firestore Storage rules | Shared | Image uploads (profile photos, team logos, match photos) cannot work via client SDK |
| Mobile app middleware route protection | Mobile | `/tournaments`, `/bookings`, `/my-bookings`, `/notifications`, `/statistics`, `/store` unprotected |
| Mobile app RBAC | Mobile | No role-based access control for player-facing operations |
| Mobile app rate limiting | Mobile | No rate limiting on API routes |
| Mobile app security headers | Mobile | No `X-Frame-Options`, `X-Content-Type-Options`, etc. |
| Mobile app structured error responses | Mobile | API routes don't follow `{ success, data/error, code }` format consistently |
| Mobile app Firestore indexes | Mobile | Only 1 index (notifications). Needs 38 indexes from Admin Dashboard |
| Mobile app tournament pages | Mobile | Only "Coming Soon" placeholder |
| Mobile app tournament API routes | Mobile | No tournament-specific API routes beyond basic listing |
| Mobile app notification display | Mobile | No notification list/detail page |
| Mobile app statistics pages | Mobile | Placeholder or missing |
| Mobile app leaderboard pages | Mobile | Placeholder or missing |
| Mobile app rewards/store pages | Mobile | Placeholder or missing |
| Mobile app booking pages | Mobile | Placeholder or missing |

### 8.3 Needs Clarification

| Item | Question | Impact |
|------|----------|--------|
| Mobile app Next.js version | What version is the mobile app running? Must be >= 18.18.0 Node.js compatible | Build compatibility |
| Mobile app dependency versions | Are `firebase`, `firebase-admin`, `react`, `next` versions aligned with Admin Dashboard? | Shared Firebase project compatibility |
| HTML Tournament design | The user will provide HTML design for tournament UI integration | Phase 2 implementation scope |
| Mobile app deployment target | Vercel, self-hosted, or other? | Deployment configuration |
| Mobile app PWA requirements | Is PWA a requirement? Service worker? Offline support? | Architecture decisions |
| Mobile app deep linking | Are there specific deep link requirements? | Routing architecture |
| Mobile app analytics | Should mobile app emit analytics events? | EventBus integration |
| Tournament creation permissions | Should mobile app captains be able to create tournaments, or only admins? | API authorization |

### 8.4 Potential Risks

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Firestore index mismatch | High | Deploy Admin Dashboard's 38-index file. Never deploy Mobile app's 1-index file. |
| Auth session divergence | Medium | Align session cookie flags, expiry, and verification patterns |
| Event system single-instance | Medium | In-memory EventBus only works on single instance. Acceptable for current scale. |
| Tournament engine complexity | Medium | 948 lines of complex bracket logic. Thorough testing required before mobile integration. |
| `findByTeamId` performance | Low | Admin Dashboard loads all tournaments then filters in-memory. Mobile app should implement index-based query. |
| Firebase Storage rules missing | Medium | Must be created before any file upload feature works |
| In-memory rate limiting | Low | Lost on cold starts. Acceptable for Vercel serverless. |
| Session cookie 14-day expiry | Low | May be too long or too short. Consider configurable expiry. |

### 8.5 Future Improvements

| Improvement | Priority | Dependencies |
|------------|----------|-------------|
| Redis-backed rate limiting | Low | Multi-instance deployment |
| Real-time notifications (WebSocket/Firestore listeners) | Low | Current polling is adequate |
| Docker configuration | Low | Self-hosted deployment |
| Tournament chat system | Low | Not implemented in Admin Dashboard |
| Tournament prize system | Low | Not implemented in Admin Dashboard |
| Tournament schedule system (automated) | Medium | `autoSchedule()` exists but needs cron trigger |
| Mobile app analytics event emission | Medium | EventBus integration |
| Mobile app offline support | Low | PWA requirements |
| `FIREBASE_SERVICE_ACCOUNT_PATH` for containerized deployment | Low | Docker support |

---

## Section 9: Classification

### A. Already Implemented in Admin Dashboard

| Item | Location |
|------|----------|
| TournamentEngine (948 lines) | `engines/tournament/` |
| MatchEngine | `engines/match/` |
| RatingEngine | `engines/rating/` |
| LeaderboardEngine | `engines/leaderboard/` |
| StatisticsEngine | `engines/statistics/` |
| RewardsEngine | `engines/rewards/` |
| NotificationEngine + NotificationService | `engines/notification/`, `services/notification-service.ts` |
| MatchmakingEngine | `engines/matchmaking/` |
| EventBus (135 event types) | `lib/server/event-bus/` |
| 4 event handlers | `handlers/` |
| 8 tournament notification templates | `template-service.ts` |
| 10-role RBAC hierarchy | `lib/server/auth/authorization.ts` |
| API route factory with auth, rate limiting, audit | `lib/server/api-route-handler.ts` |
| 120+ admin API endpoints | `app/api/admin/` |
| 11 user-facing tournament APIs | `app/api/tournaments/` |
| 38 Firestore composite indexes | `firestore.indexes.json` |
| Firestore security rules (deny-all default) | `firestore.rules` |
| 33+ Firestore collection definitions | `collection-paths.ts` |
| Complete type system | `types/index.ts` |
| Audit logging (3 systems) | Multiple locations |
| Realtime sync dispatcher | `realtime-dispatcher.ts` |
| Sync registry (17 rule sets) | `sync-registry.ts` |
| Executive dashboard analytics | `analytics/executive-dashboard/` |
| Match operations analytics | `matches/operations/` |
| Geo statistics | `geo-statistics/` |
| System administration (feature flags, scheduled jobs, maintenance) | `system/` |
| Engine monitoring (state, config, executions, health) | `engines/` |
| Stadium management with booking configuration | `stadiums/` |
| Team verification workflow | `teams/verification/` |
| Payment tracking | `payments/` |
| Report generation | `reports/` |
| Firebase Auth session management | `auth/login/`, `auth/register/` |
| Environment variable configuration | `.env.local` |

### B. Required for Mobile Application

| Item | Phase |
|------|-------|
| Middleware route protection for all authenticated routes | Phase 1 |
| Structured API response format | Phase 1 |
| Security headers in middleware | Phase 1 |
| Rate limiting on API routes | Phase 1 |
| Basic RBAC for player-facing operations | Phase 1 |
| Session cookie alignment | Phase 1 |
| Tournament list page | Phase 2 |
| Tournament detail page | Phase 2 |
| Tournament fixtures page | Phase 2 |
| Tournament standings page | Phase 2 |
| Tournament groups page | Phase 2 |
| Tournament matches page | Phase 2 |
| Join/leave tournament functionality | Phase 2 |
| My tournaments page | Phase 2 |
| Tournament API routes | Phase 2 |
| Match list page | Phase 3 |
| Match detail page | Phase 3 |
| Match request/invite system | Phase 3 |
| Match result submission | Phase 3 |
| Match dispute reporting | Phase 3 |
| Match history page | Phase 3 |
| Direct challenge system | Phase 3 |
| Matchmaking queue integration | Phase 3 |
| Team creation page | Phase 4 |
| Team detail page | Phase 4 |
| Team edit page | Phase 4 |
| Team join request system | Phase 4 |
| Stadium list page | Phase 5 |
| Stadium detail page | Phase 5 |
| Booking creation page | Phase 5 |
| Booking list page | Phase 5 |
| Notification list page | Phase 6 |
| Notification preferences page | Phase 6 |
| Unread count badge | Phase 6 |
| Statistics overview page | Phase 7 |
| Leaderboard page | Phase 7 |
| Profile page | Phase 8 |
| Profile photo upload | Phase 8 |
| Store page | Phase 9 |
| Reward details page | Phase 9 |

### C. Shared Infrastructure

| Item | Managed By |
|------|-----------|
| Firebase Project (`play-square-d1e9b`) | Firebase Console |
| Firestore Database | Admin Dashboard deploys rules/indexes |
| Firebase Auth Tenant | Admin Dashboard manages users |
| Firebase Storage Bucket | Admin Dashboard manages rules |
| Service Account (`FIREBASE_SERVICE_ACCOUNT_BASE64`) | Both applications |
| `firestore.rules` | Admin Dashboard deploys |
| `firestore.indexes.json` (38 indexes) | Admin Dashboard deploys |
| `users` collection | Admin writes, Mobile reads |
| `_sync` collection | Admin writes, Mobile reads |
| Environment variables (12) | Both applications |
| EventBus | Admin emits, Mobile consumes via notifications |
| Notification system | Admin creates, Mobile displays |
| Audit system | Both write via API routes |

### D. Future Enhancement

| Item | Priority | Dependencies |
|------|----------|-------------|
| Firebase Storage rules file | Medium | Required for file uploads |
| Redis-backed rate limiting | Low | Multi-instance deployment |
| Tournament chat system | Low | Not in Admin Dashboard |
| Tournament prize system | Low | Not in Admin Dashboard |
| Tournament schedule automation (cron) | Medium | `autoSchedule()` exists |
| Mobile app PWA features | Low | Service worker, offline support |
| Mobile app deep linking | Low | Routing architecture |
| Mobile app analytics emission | Medium | EventBus integration |
| Real-time notifications (WebSocket) | Low | Current polling adequate |
| Docker configuration | Low | Self-hosted deployment |
| `findByTeamId` index optimization | Low | Performance improvement |
| Configurable session expiry | Low | Security flexibility |
| Mobile app offline support | Low | PWA requirements |

---

> **End of Architecture Baseline Document**
>
> This document is the permanent engineering reference for the PlaySquare platform.
> All future implementations must conform to this document.
> This document should be updated only when architectural decisions change.
