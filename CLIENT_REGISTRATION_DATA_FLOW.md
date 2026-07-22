# CLIENT_REGISTRATION_DATA_FLOW.md

## Forensic Audit: Tournament Registration Flow

**Date:** 2026-07-22
**Scope:** Client application tournament registration execution chain
**Constraint:** No modifications made. Facts only.

---

## 1. COMPLETE EXECUTION CHAIN

### Step 1: User Clicks "Register Team" on Tournament Detail Page

| Field | Value |
|-------|-------|
| **File** | `app/tournaments/[id]/page.tsx` |
| **Function** | `TournamentDetailPage` (inline onClick) |
| **Lines** | 187-191 |
| **Caller** | User click on `<Button>` |
| **Callee** | `router.push(\`/tournaments/${tournamentId}/register\`)` |

```tsx
// app/tournaments/[id]/page.tsx:187-191
<Button
  onClick={() => router.push(`/tournaments/${tournamentId}/register`)}
  ...
>
  Register Team
</Button>
```

---

### Step 2: Registration Wizard Page Loads

| Field | Value |
|-------|-------|
| **File** | `app/tournaments/[id]/register/page.tsx` |
| **Function** | `RegistrationWizardPage` |
| **Lines** | 244-363 |
| **Caller** | Next.js router navigation |
| **Callee** | Multiple useEffect hooks |

#### Step 2a: Load Tournament + Team Data (line 267-269)

```tsx
// app/tournaments/[id]/register/page.tsx:267-269
const [t, tm] = await Promise.all([
  getTournamentById(tournamentId),   // → fetch("/api/tournaments?id=...")
  getTeamById(user.teamId!),          // → fetch("/api/teams?id=...")
])
```

| Call | Client API Function | File:Lines | HTTP Request |
|------|---------------------|------------|-------------|
| `getTournamentById(tournamentId)` | `lib/client/api.ts:628-648` | fetch(`/api/tournaments?id=${tournamentId}`) |
| `getTeamById(user.teamId!)` | `lib/client/api.ts:27-37` | fetch(`/api/teams?id=${teamId}`) |

#### Step 2b: Resolve Player Names (line 299)

```tsx
// app/tournaments/[id]/register/page.tsx:299
const users = await getUsersByIds(team.players)
```

| Call | Client API Function | File:Lines | HTTP Request |
|------|---------------------|------------|-------------|
| `getUsersByIds(team.players)` | `lib/client/api.ts:271-285` | fetch(`/api/users?ids=${userIds.join(',')}`) |

---

### Step 3: Wizard Hook Initializes

| Field | Value |
|-------|-------|
| **File** | `lib/client/hooks/use-registration-wizard.ts` |
| **Function** | `useRegistrationWizard` |
| **Lines** | 14-84 |
| **Caller** | `RegistrationWizardContent` (line 42-47) |
| **Callee** | useState, useEffect (React hooks only) |

```tsx
// app/tournaments/[id]/register/page.tsx:42-47
const wizard = useRegistrationWizard(
  tournament,
  team.name,
  userName,
  playerNames
)
```

Wizard manages local React state only. No Firestore calls.

---

### Step 4: User Navigates Wizard Steps

| Step | Lines | Action |
|------|-------|--------|
| Step 1 (Team Info) | 103-147 | Displays team name, captain name, tournament summary |
| Step 2 (Players) | 149-201 | Player roster input with min/max validation |
| Step 3 (Confirm) | 203-239 | Shows registration summary, "Submit Registration" button |

All step transitions are local React state changes via `wizard.nextStep()` / `wizard.prevStep()`.

---

### Step 5: User Clicks "Submit Registration" (THE CRITICAL BUTTON)

| Field | Value |
|-------|-------|
| **File** | `app/tournaments/[id]/register/page.tsx` |
| **Function** | `handleJoin` |
| **Lines** | 49-59 |
| **Caller** | `<DualButtonRow onPrimary={handleJoin}>` (line 234) |
| **Callee** | `joinTournament(tournament.id, team.id)` (client API) |

```tsx
// app/tournaments/[id]/register/page.tsx:49-59
const handleJoin = async () => {
  wizard.setSubmitting(true)
  try {
    await joinTournament(tournament.id, team.id)   // ← LINE 52
    setSuccess(true)
  } catch (err: any) {
    toast.error(err.message || "Failed to join tournament")
  } finally {
    wizard.setSubmitting(false)
  }
}
```

---

### Step 6: Client API Function

| Field | Value |
|-------|-------|
| **File** | `lib/client/api.ts` |
| **Function** | `joinTournament` |
| **Lines** | 706-722 |
| **Caller** | `handleJoin` (register page line 52) |
| **Callee** | `fetch("/api/tournaments/${tournamentId}/join", ...)` |

```typescript
// lib/client/api.ts:706-722
export async function joinTournament(tournamentId: string, teamId: string): Promise<void> {
  const res = await fetch(`/api/tournaments/${encodeURIComponent(tournamentId)}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ teamId }),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || "Failed to join tournament")
  }
}
```

---

### Step 7: Server API Route Receives Request

| Field | Value |
|-------|-------|
| **File** | `app/api/tournaments/[id]/join/route.ts` |
| **Function** | `POST` |
| **Lines** | 12-131 |
| **Caller** | Next.js HTTP request from `lib/client/api.ts:joinTournament` |
| **Callee** | Multiple DB functions (see below) |

#### Validation Chain (Server-Side):

| # | Check | Line | DB Read | Collection | Document/Query |
|---|-------|------|---------|------------|----------------|
| 1 | JWT token exists | 20 | None | None | Cookie read only |
| 2 | JWT token valid | 28 | `verifySessionJwt(token)` | None | In-memory JWT verify |
| 3 | Body has teamId | 37 | None | None | Request body check |
| 4 | User exists | 44 | `findUserById(decoded.userId)` | `users` | Document `{userId}` |
| 5 | User is team captain | 52 | None | None | `user.isTeamCaptain` check |
| 6 | User owns team | 59 | None | None | `user.teamId === body.teamId` check |
| 7 | Team exists | 66 | `getTeamByIdFromDb(body.teamId)` | `teams` | Document `{teamId}` |
| 8 | Tournament exists | 74 | `getTournamentByIdFromDb(tournamentId)` | `tournaments` | Document `{tournamentId}` |
| 9 | Tournament not closed | 82-88 | None | None | `tournament.status` check |
| 10 | Tournament not full | 92-97 | None | None | `teams.length >= maxTeams` check |
| 11 | Team not already registered | 99-107 | None | None | `teams.some(t => t.teamId === body.teamId)` |

#### Build TournamentTeam Object (lines 109-120):

```typescript
// app/api/tournaments/[id]/join/route.ts:109-120
const tournamentTeam: TournamentTeam = {
  teamId: team.id,
  teamName: team.name,
  captainId: team.captainId,
  points: 0,
  wins: 0,
  draws: 0,
  losses: 0,
  goalsFor: 0,
  goalsAgainst: 0,
  joinedAt: new Date().toISOString(),
}
```

#### Call DB Function (line 122):

```typescript
await joinTournamentInDb(tournamentId, tournamentTeam)
```

---

### Step 8: Firestore Transaction (THE ONLY WRITE)

| Field | Value |
|-------|-------|
| **File** | `lib/server/db/tournaments.ts` |
| **Function** | `joinTournamentInDb` |
| **Lines** | 143-178 |
| **Caller** | API route `POST /api/tournaments/[id]/join` (line 122) |
| **Callee** | Firestore Admin SDK transaction |

```typescript
// lib/server/db/tournaments.ts:143-178
export async function joinTournamentInDb(
  tournamentId: string,
  team: TournamentTeam
): Promise<void> {
  const docRef = db.collection(TOURNAMENTS_COLLECTION).doc(tournamentId)

  await db.runTransaction(async (transaction) => {
    const doc = await transaction.get(docRef)              // READ inside transaction
    if (!doc.exists) throw new Error("Tournament not found")

    const data = doc.data() as any
    const teams = data.teams || []

    if (teams.some((t: any) => t.teamId === team.teamId))  // DUPLICATE CHECK inside transaction
      throw new Error("Team is already registered")

    if (teams.length >= (data.maxTeams || 0))              // CAPACITY CHECK inside transaction
      throw new Error("Tournament is full")

    transaction.update(docRef, {                           // ← THE ONLY FIRESTORE WRITE
      teams: FieldValue.arrayUnion(team),
      updatedAt: new Date().toISOString(),
    })
  })
}
```

---

### Step 9: Response Returns to Client

| Field | Value |
|-------|-------|
| **File** | `app/api/tournaments/[id]/join/route.ts` |
| **Line** | 124 |
| **Response** | `NextResponse.json({ success: true })` |

### Step 10: Success UI

| Field | Value |
|-------|-------|
| **File** | `app/tournaments/[id]/register/page.tsx` |
| **Function** | `RegistrationWizardContent` (success branch) |
| **Lines** | 53 (setSuccess(true)), 61-96 (success UI) |
| **Caller** | `handleJoin` resolves without error |

```tsx
// app/tournaments/[id]/register/page.tsx:53
setSuccess(true)

// Renders:
// - SuccessConfirmation component (line 64-67)
// - CountdownTimer (line 69-76)
// - PlayerRosterSection showing registered teams (line 78-85)
// - "Back to Leagues" button (line 87-94)
```

---

## 2. EVERY FIRESTORE OPERATION

### FIRESTORE WRITES (Complete List)

There is exactly **ONE** Firestore write in the entire registration flow:

| # | Operation Type | Collection | Document Path | Method | Merge? | Fields Written |
|---|---------------|------------|---------------|--------|--------|----------------|
| 1 | **transaction.update()** | `tournaments` | `tournaments/{tournamentId}` | `transaction.update()` | N/A (update) | `teams` (FieldValue.arrayUnion), `updatedAt` (ISO string) |

**Detailed field analysis:**

| Field | Write Method | Value |
|-------|-------------|-------|
| `teams` | `FieldValue.arrayUnion(team)` | Adds a single `TournamentTeam` object to the existing array |
| `updatedAt` | Direct assignment | `new Date().toISOString()` |

**Fields written inside the `team` object embedded in `teams[]`:**

```typescript
{
  teamId: string,      // team.id
  teamName: string,    // team.name
  captainId: string,   // team.captainId
  points: 0,           // hardcoded zero
  wins: 0,             // hardcoded zero
  draws: 0,            // hardcoded zero
  losses: 0,           // hardcoded zero
  goalsFor: 0,         // hardcoded zero
  goalsAgainst: 0,     // hardcoded zero
  joinedAt: string     // new Date().toISOString()
}
```

**Fields removed:** None
**Fields incremented:** None

### FIRESTORE READS (Complete List)

| # | Operation | Collection | Document/Query | Trigger |
|---|-----------|------------|----------------|---------|
| 1 | `findUserById(userId)` | `users` | `users/{userId}` document get | API route validation (line 44) |
| 2 | `getTeamByIdFromDb(teamId)` | `teams` | `teams/{teamId}` document get | API route validation (line 66) |
| 3 | `getTournamentByIdFromDb(tournamentId)` | `tournaments` | `tournaments/{tournamentId}` document get | API route validation (line 74) |
| 4 | `transaction.get(docRef)` | `tournaments` | `tournaments/{tournamentId}` document get | Inside Firestore transaction (line 151) |

**Read details:**

| # | Function | Collection | Type | where() | orderBy() | limit() |
|---|----------|------------|------|---------|-----------|---------|
| 1 | `findUserById` | `users` | doc.get | N/A | N/A | N/A |
| 2 | `getTeamByIdFromDb` | `teams` | doc.get | N/A | N/A | N/A |
| 3 | `getTournamentByIdFromDb` | `tournaments` | doc.get | N/A | N/A | N/A |
| 4 | `transaction.get` | `tournaments` | doc.get (transaction) | N/A | N/A | N/A |

**Note:** Read #4 is a duplicate of Read #3 within the transaction (to guarantee atomicity). Read #3 fetches the tournament for pre-validation (lines 82-107 in the API route). Read #4 fetches it again inside the transaction to prevent TOCTOU race conditions.

---

## 3. ANSWERS TO SPECIFIC QUESTIONS

### Q1: Exactly where is the registration stored?

The registration is stored as an **embedded element inside the tournament document**.

**Collection:** `tournaments`
**Document:** `tournaments/{tournamentId}`
**Field:** `teams` (array)
**Mechanism:** `FieldValue.arrayUnion(teamObject)` appends one entry

There is no separate registration document. The "registration" IS the presence of the team's `TournamentTeam` object inside the `teams[]` array of the tournament document.

---

### Q2: Is a registration document created?

**NO.**

No standalone registration document is created anywhere in the Client application. There is no `registrations` collection. There is no `tournamentRegistrations` collection. The only Firestore write is a `transaction.update()` on the existing `tournaments/{tournamentId}` document.

---

### Q3: Does the Client update the tournament document?

**YES.**

**Exact code (lib/server/db/tournaments.ts:167-170):**

```typescript
transaction.update(docRef, {
  teams: FieldValue.arrayUnion(team),
  updatedAt: new Date().toISOString(),
})
```

**Exact fields updated:**

| Field | Method | Value |
|-------|--------|-------|
| `teams` | `FieldValue.arrayUnion(team)` | Appends a `TournamentTeam` object |
| `updatedAt` | Direct assignment | `new Date().toISOString()` |

No other fields of the tournament document are modified. The `maxTeams`, `status`, `name`, `startDate`, `createdByUserId`, `type`, `groups`, `rounds`, `phaseConfig`, `venueConfig`, `scheduleConfig`, `rules`, `description`, `registrationFee`, `prize`, `minPlayersPerTeam`, `maxPlayersPerTeam`, `emoji`, and `createdAt` fields are all untouched.

---

### Q4: Does the Client update tournaments.teams, participants, registeredTeamIds, or another field?

**The Client updates `tournaments.teams`.**

**Exact code (lib/server/db/tournaments.ts:167-169):**

```typescript
transaction.update(docRef, {
  teams: FieldValue.arrayUnion(team),
  updatedAt: new Date().toISOString(),
})
```

There is **no** `participants` field anywhere in the codebase.
There is **no** `registeredTeamIds` field anywhere in the codebase.
There is **no** other field for tracking registrations.

The `Tournament` type definition (types/index.ts:263-287) confirms the field is called `teams`:

```typescript
export interface Tournament {
  // ...other fields...
  teams: TournamentTeam[]    // ← THIS is the registration storage
  // ...
}
```

---

### Q5: Does the Client update the Team document?

**NO.**

The `teams` collection (the Team document) is **read** during validation (`getTeamByIdFromDb`) but is **never written to** during registration. The Team document's `wins`, `draws`, `losses`, `rating`, and other fields remain unchanged.

The only write is to the `tournaments` collection.

---

### Q6: Is there any Event Bus involved?

**NO.**

There is no Event Bus implementation in the Client application codebase. Searches for event-bus patterns, EventEmitter usage, pub/sub mechanisms, or any event dispatching during the registration flow returned zero results.

The architecture documentation references an EventBus for an admin dashboard (a separate system), but it does not exist in this client codebase.

---

### Q7: Is there any Cloud Function expected to continue the process?

**NO.**

There are zero Cloud Functions in this project. No `functions/` directory. No `onCreate`/`onWrite`/`onUpdate` triggers. No Firebase Functions deployment configuration. The `firebase.json` file only configures hosting and Firestore rules, not functions.

The registration flow is entirely self-contained within the Client + API route layer.

---

### Q8: Does the Client stop after creating a Registration document?

**The Client does not create a Registration document at all (see Q2).**

After the single `transaction.update()` to the tournament document, the API route returns `{ success: true }`, and the Client:
1. Sets `setSuccess(true)` (line 53)
2. Renders the `SuccessConfirmation` component
3. Shows a `CountdownTimer` to tournament start
4. Shows the updated `PlayerRosterSection` with all registered teams
5. Displays a "Back to Leagues" button

There is no further Firestore write. No background job. No webhook. No notification creation. No event emission. **The flow ends here.**

---

### Q9: What is considered by the Client to mean "Already Registered"?

"Already Registered" is determined by **two independent checks** at different layers:

#### Check A: UI Layer (Tournament Detail Page)

**File:** `app/tournaments/[id]/page.tsx:104`

```tsx
const isAlreadyRegistered = teams.some((t) => t.captainId === user?.id)
```

**Logic:** Iterates over the tournament's `teams[]` array. If ANY team has a `captainId` matching the current user's `id`, the user is considered "Already Registered".

**UI result (line 193-196):**

```tsx
) : isAlreadyRegistered ? (
  <div className="... text-[#2ecc71] ...">
    Already Registered
  </div>
)}
```

This hides the "Register Team" button and shows a green "Already Registered" label.

#### Check B: API Route Validation Layer

**File:** `app/api/tournaments/[id]/join/route.ts:99-107`

```typescript
const alreadyRegistered = tournamentTeams.some(
  (t) => t.teamId === body.teamId
)
if (alreadyRegistered) {
  return NextResponse.json(
    { success: false, error: "Team is already registered" },
    { status: 400 }
  )
}
```

**Logic:** Checks if any team in the tournament's `teams[]` array has a `teamId` matching the requesting team's ID.

#### Check C: Transaction-Level Guard (Atomic)

**File:** `lib/server/db/tournaments.ts:159-161`

```typescript
if (teams.some((t: any) => t.teamId === team.teamId)) {
  throw new Error("Team is already registered")
}
```

**Logic:** Same check as B, but inside the Firestore transaction to prevent race conditions.

**Key difference:**
- UI check (A): matches on `captainId === user.id` (user-level)
- API checks (B, C): match on `teamId === body.teamId` (team-level)

**There is no dedicated query to check "already registered".** All three checks are performed by reading the full tournament document and filtering the `teams[]` array in memory.

---

### Q10: Every place inside the Client that reads tournament registrations

| # | File | Function | Line(s) | How Registrations Are Read |
|---|------|----------|---------|---------------------------|
| 1 | `app/tournaments/[id]/page.tsx` | `TournamentDetailPage` | 100, 104 | `tournament.teams` - reads the full `teams[]` array to determine `isAlreadyRegistered`, `isFull`, and display the roster |
| 2 | `app/tournaments/[id]/register/page.tsx` | `RegistrationWizardPage` | 267-269 | `getTournamentById(tournamentId)` - fetches full tournament including `teams[]` |
| 3 | `app/tournaments/[id]/register/page.tsx` | `RegistrationWizardContent` | 80-83 | `tournament.teams.map(t => ({ teamId, teamName }))` - maps registered teams for `PlayerRosterSection` display |
| 4 | `app/tournaments/page.tsx` | `TournamentsPage` | 34 | `getTournaments()` - fetches all tournaments (each includes `teams[]`) |
| 5 | `app/api/tournaments/my/route.ts` | `GET` | 37-39 | `getTournamentsByTeamIdFromDb(user.teamId)` - finds tournaments where team is in `teams[]` array |
| 6 | `app/api/tournaments/my/route.ts` | `GET` | 41 | `getTournamentsByCreatorFromDb(user.id)` - finds tournaments created by user |
| 7 | `lib/server/db/tournaments.ts` | `getTournamentsByTeamIdFromDb` | 77-103 | Fetches ALL tournaments, filters in-memory where `data.teams.some(t => t.teamId === teamId)` |
| 8 | `lib/server/db/tournaments.ts` | `getTournamentsByCreatorFromDb` | 108-133 | Query with `.where("createdByUserId", "==", userId)` - includes `teams[]` in returned data |
| 9 | `lib/server/db/tournaments.ts` | `getAllTournamentsFromDb` | 18-45 | Query with optional `.where("status", "==", status)` + `.orderBy("createdAt", "desc")` - includes `teams[]` |
| 10 | `lib/server/db/tournaments.ts` | `getTournamentByIdFromDb` | 50-70 | Document get for `tournaments/{id}` - includes `teams[]` |
| 11 | `lib/server/db/tournaments.ts` | `joinTournamentInDb` | 143-178 | `transaction.get(docRef)` - reads `teams[]` inside transaction for validation |
| 12 | `lib/server/db/tournaments.ts` | `leaveTournamentInDb` | 184-215 | `transaction.get(docRef)` - reads `teams[]` inside transaction for team lookup |
| 13 | `app/api/tournaments/[id]/join/route.ts` | `POST` | 74, 90 | `getTournamentByIdFromDb(tournamentId)` - reads `teams[]` for pre-validation |
| 14 | `app/api/tournaments/[id]/leave/route.ts` | `POST` | (parallel to join) | `getTournamentByIdFromDb(tournamentId)` - reads `teams[]` for validation |

---

## 4. COMPLETE SEQUENCE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         REGISTRATION FLOW                                   │
│                    Button Click → Firestore Write                            │
└─────────────────────────────────────────────────────────────────────────────┘

User                    Client (Browser)              Next.js API Route         Firestore Admin SDK
 │                           │                              │                         │
 │  Click "Register Team"    │                              │                         │
 ├──────────────────────────>│                              │                         │
 │                           │                              │                         │
 │            ┌──────────────┤ router.push(/tournaments/    │                         │
 │            │              │  [id]/register)              │                         │
 │            ▼              │                              │                         │
 │                           │                              │                         │
 │  ┌──────────────────────┐ │  useEffect:                  │                         │
 │  │ RegistrationWizard   │ │  ┌─────────────────────────┐ │                         │
 │  │ Page Loads           │ │  │ Parallel API calls:     │ │                         │
 │  │                      │ │  │ 1. getTournamentById()  │─┼─── GET ───────────────>│
 │  │                      │ │  │ 2. getTeamById()        │─┼─── GET ───────────────>│
 │  └──────────────────────┘ │  │                          │ │                         │
 │                           │  │ Server reads:            │ │  GET tournaments/{id}   │
 │                           │  │ - tournaments/{id}       │ │<────────────────────────│
 │                           │  │ - teams/{teamId}         │ │  GET teams/{teamId}     │
 │                           │  │ - users/{userId}         │ │<────────────────────────│
 │                           │  │  (via /api/teams?id=)    │ │  GET users/{userId}     │
 │                           │  │                          │ │<────────────────────────│
 │                           │  │ 3. getUsersByIds() ──────┼─── GET /api/users?ids=...│
 │                           │  │    (resolve player names)│ │  GET users/{id} × N     │
 │                           │  └─────────────────────────┘ │<────────────────────────│
 │                           │                              │                         │
 │  ┌──────────────────────┐ │  useRegistrationWizard()     │                         │
 │  │ Step 1: Team Info    │ │  (local React state only)   │                         │
 │  │ - Team Name          │ │                              │                         │
 │  │ - Captain Name       │ │                              │                         │
 │  │ - Tournament Summary │ │                              │                         │
 │  │ [Next] button ───────│>│  wizard.nextStep()           │                         │
 │  └──────────────────────┘ │                              │                         │
 │                           │                              │                         │
 │  ┌──────────────────────┐ │                              │                         │
 │  │ Step 2: Players      │ │                              │                         │
 │  │ - Player roster      │ │                              │                         │
 │  │ - Min/max validation │ │                              │                         │
 │  │ [Confirm] button ────│>│  wizard.nextStep()           │                         │
 │  └──────────────────────┘ │                              │                         │
 │                           │                              │                         │
 │  ┌──────────────────────┐ │                              │                         │
 │  │ Step 3: Confirm      │ │                              │                         │
 │  │ - Summary            │ │                              │                         │
 │  │ - Player list        │ │                              │                         │
 │  │ [Submit] button ─────│>│  handleJoin()                │                         │
 │  └──────────────────────┘ │                              │                         │
 │                           │                              │                         │
 │                           │  joinTournament(id, teamId)  │                         │
 │                           │  ┌─────────────────────────┐ │                         │
 │                           │  │ POST /api/tournaments/   │ │                         │
 │                           │  │   [id]/join              │─┼─── HTTP POST ─────────>│
 │                           │  │ Body: { teamId }         │ │                         │
 │                           │  └─────────────────────────┘ │                         │
 │                           │                              │                         │
 │                           │                              │  ┌─────────────────────┐│
 │                           │                              │  │ 1. verifySessionJwt  ││
 │                           │                              │  │    (cookie read)     ││
 │                           │                              │  └─────────────────────┘│
 │                           │                              │                         │
 │                           │                              │  ┌─────────────────────┐│
 │                           │                              │  │ 2. findUserById()   ││
 │                           │                              │  │ → READ users/{id}   │─┼──> GET users/{userId}
 │                           │                              │  └─────────────────────┘│
 │                           │                              │                         │
 │                           │                              │  ┌─────────────────────┐│
 │                           │                              │  │ 3. Check:           ││
 │                           │                              │  │ user.isTeamCaptain   ││
 │                           │                              │  │ user.teamId === id   ││
 │                           │                              │  └─────────────────────┘│
 │                           │                              │                         │
 │                           │                              │  ┌─────────────────────┐│
 │                           │                              │  │ 4. getTeamByIdFromDb ││
 │                           │                              │  │ → READ teams/{id}   │─┼──> GET teams/{teamId}
 │                           │                              │  └─────────────────────┘│
 │                           │                              │                         │
 │                           │                              │  ┌─────────────────────┐│
 │                           │                              │  │ 5. getTournamentById ││
 │                           │                              │  │ → READ tournaments/  │─┼──> GET tournaments/{id}
 │                           │                              │  │    {id}              ││
 │                           │                              │  └─────────────────────┘│
 │                           │                              │                         │
 │                           │                              │  ┌─────────────────────┐│
 │                           │                              │  │ 6. Pre-validation:   ││
 │                           │                              │  │ - status check       ││
 │                           │                              │  │ - capacity check     ││
 │                           │                              │  │ - duplicate check    ││
 │                           │                              │  └─────────────────────┘│
 │                           │                              │                         │
 │                           │                              │  ┌─────────────────────┐│
 │                           │                              │  │ 7. Build TournamentTeam│
 │                           │                              │  │    object            ││
 │                           │                              │  └─────────────────────┘│
 │                           │                              │                         │
 │                           │                              │  ┌─────────────────────┐│
 │                           │                              │  │ 8. joinTournamentInDb││
 │                           │                              │  │                      ││
 │                           │                              │  │ ┌──────────────────┐ ││
 │                           │                              │  │ │ transaction.get()│ ││
 │                           │                              │  │ │ → READ           │─┼──> GET tournaments/{id}
 │                           │                              │  │ │   tournaments/{id}││
 │                           │                              │  │ └──────────────────┘ ││
 │                           │                              │  │                      ││
 │                           │                              │  │ ┌──────────────────┐ ││
 │                           │                              │  │ │ Duplicate check  │ ││
 │                           │                              │  │ │ Capacity check   │ ││
 │                           │                              │  │ └──────────────────┘ ││
 │                           │                              │  │                      ││
 │                           │                              │  │ ┌──────────────────┐ ││
 │                           │                              │  │ │ transaction.     │ ││
 │                           │                              │  │ │   update(docRef, │ ││
 │                           │                              │  │ │ {                │ ││
 │                           │                              │  │ │  teams: FieldVal.│─┼──> ★ WRITE tournaments/{id}
 │                           │                              │  │ │   arrayUnion(team)│  │    (teams[], updatedAt)
 │                           │                              │  │ │  updatedAt: ...  │ ││
 │                           │                              │  │ │ })               │ ││
 │                           │                              │  │ └──────────────────┘ ││
 │                           │                              │  └─────────────────────┘│
 │                           │                              │                         │
 │                           │  ← 200 { success: true }    │  ← COMMIT               │
 │                           │                              │                         │
 │                           │  setSuccess(true)            │                         │
 │                           │                              │                         │
 │  ┌──────────────────────┐ │                              │                         │
 │  │ SuccessConfirmation  │ │                              │                         │
 │  │ - CountdownTimer     │ │                              │                         │
 │  │ - PlayerRosterSection│ │                              │                         │
 │  │ - "Back to Leagues"  │ │                              │                         │
 │  └──────────────────────┘ │                              │                         │
 │                           │                              │                         │

★ = THE ONLY FIRESTORE WRITE IN THE ENTIRE FLOW
```

---

## 5. SUMMARY OF FIRESTORE OPERATIONS

### During Registration (button click to completion):

| Type | Collection | Document | Operation | Count |
|------|------------|----------|-----------|-------|
| READ | `users` | `users/{userId}` | `doc.get()` | 1 |
| READ | `teams` | `teams/{teamId}` | `doc.get()` | 1 |
| READ | `tournaments` | `tournaments/{tournamentId}` | `doc.get()` | 2 (once pre-validation, once inside transaction) |
| WRITE | `tournaments` | `tournaments/{tournamentId}` | `transaction.update()` | 1 |
| **TOTAL READS** | | | | **4** |
| **TOTAL WRITES** | | | | **1** |

### What IS Written:

```
Collection: tournaments
Document:   tournaments/{tournamentId}
Operation:  transaction.update()
Fields:
  - teams:        FieldValue.arrayUnion(TournamentTeam{...})
  - updatedAt:    ISO date string
```

### What is NOT Written:

| Item | Status |
|------|--------|
| Separate registration document | **NOT CREATED** |
| `participants` field | **DOES NOT EXIST** |
| `registeredTeamIds` field | **DOES NOT EXIST** |
| Team document (`teams/{id}`) | **NOT UPDATED** |
| User document (`users/{id}`) | **NOT UPDATED** |
| Notifications collection | **NOT WRITTEN** |
| Any counter/increment | **NOT PERFORMED** |
| Any event emission | **NONE** |
| Any cloud function trigger | **NONE** |
