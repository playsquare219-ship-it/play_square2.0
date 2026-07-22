# TOURNAMENT ARCHITECTURE RECOVERY PLAN

**Date:** 2026-07-22
**Scope:** Canonical architecture for the entire tournament registration system
**Constraint:** Design only. No code changes.

---

## EXECUTIVE SUMMARY

The Client (`play_square2.0`) and Admin Dashboard (`play_square 3.1-main`) share the same Firestore database but use incompatible registration models. The Client writes/reads `tournament.teams[]` (embedded array). The Admin writes/reads a `registrations` top-level collection. These two models are never synchronized, creating a data integrity gap where each system sees a different truth.

This plan defines a single canonical source of truth, maps every affected consumer, and orders all changes by dependency.

---

## 1. CANONICAL SOURCE OF TRUTH

### Decision: `registrations` Top-Level Collection

**Collection:** `registrations`
**Document ID:** Auto-generated (e.g., `reg_{tournamentId}_{teamId}`)
**Index Fields:** `tournamentId` + `teamId` (unique compound)

### Why `registrations` Wins Over `tournament.teams[]`

| Criterion | `tournament.teams[]` | `registrations` Collection | Winner |
|-----------|----------------------|---------------------------|--------|
| Status tracking | None (team is either present or absent) | `pending`, `approved`, `rejected`, `cancelled` | `registrations` |
| Approval workflow | Impossible (instant join only) | Native support | `registrations` |
| Payment status | Not tracked | `paymentStatus`, `paymentId`, `paidAt` | `registrations` |
| Independent queries | Cannot query "all registrations for team X across tournaments" without full scan | Direct `where("teamId", "==", x)` query | `registrations` |
| Scale | 1MB document limit; array grows with each team | Unlimited documents | `registrations` |
| Admin audit trail | None | Each registration is a first-class document with timestamps | `registrations` |
| Cross-system consistency | Client-only; Admin cannot read | Both systems can read/write | `registrations` |
| Match resolution updates | Requires updating embedded object inside array (fragile) | Direct document update | `registrations` |

### Why `tournament.teams[]` Is NOT Deleted

`tournament.teams[]` is retained as a **materialized view** — a read-optimized denormalization that:

1. Enables single-document reads for tournament detail pages
2. Enables `FieldValue.arrayUnion`/`arrayRemove` for atomic appends/removes
3. Powers the standings computation (reads `points`, `wins`, `draws`, etc.)
4. Powers the group standings computation
5. Enables the "My Tournaments" query via the existing `getTournamentsByTeamIdFromDb` function

Both `registrations` and `tournament.teams[]` are updated in the **same Firestore transaction**, guaranteeing atomicity.

---

## 2. COMPLETE CONSUMER INVENTORY

### 2A. Pages (Client)

| # | File | Route | Reads | Writes |
|---|------|-------|-------|--------|
| 1 | `app/tournaments/page.tsx` | `/tournaments` | `tournament.teams` (count) | None |
| 2 | `app/tournaments/[id]/page.tsx` | `/tournaments/[id]` | `tournament.teams` (registration check, count, roster) | None |
| 3 | `app/tournaments/[id]/register/page.tsx` | `/tournaments/[id]/register` | `tournament.teams` (registered list, success display) | `joinTournament()` |

### 2B. Components (Client)

| # | File | Reads |
|---|------|-------|
| 4 | `components/tournaments/tournament-card.tsx` | `tournament.teams` (count for badge) |
| 5 | `components/tournaments/player-roster-section.tsx` | `teamNames` derived from `tournament.teams` |
| 6 | `components/tournaments/tournament-hero.tsx` | Tournament metadata only (no teams) |
| 7 | `components/tournaments/status-badge.tsx` | `tournament.status` only |
| 8-17 | Remaining 10 components | Generic presentational (no tournament data) |

### 2C. Hooks (Client)

| # | File | Reads |
|---|------|-------|
| 18 | `lib/client/hooks/use-registration-wizard.ts` | `tournament.minPlayersPerTeam`, `tournament.maxPlayersPerTeam` |
| 19 | `lib/client/hooks/use-countdown.ts` | None (timer only) |

### 2D. Client API Layer

| # | File | Function | Reads | Writes |
|---|------|----------|-------|--------|
| 20 | `lib/client/api.ts:613` | `getTournaments()` | None (fetch wrapper) | None |
| 21 | `lib/client/api.ts:628` | `getTournamentById()` | None (fetch wrapper) | None |
| 22 | `lib/client/api.ts:650` | `getTournamentFixtures()` | None (fetch wrapper) | None |
| 23 | `lib/client/api.ts:664` | `getTournamentStandings()` | None (fetch wrapper) | None |
| 24 | `lib/client/api.ts:678` | `getTournamentGroups()` | None (fetch wrapper) | None |
| 25 | `lib/client/api.ts:692` | `getTournamentMatches()` | None (fetch wrapper) | None |
| 26 | `lib/client/api.ts:706` | `joinTournament()` | None (fetch wrapper) | POST to API |
| 27 | `lib/client/api.ts:724` | `leaveTournament()` | None (fetch wrapper) | POST to API |
| 28 | `lib/client/api.ts:742` | `getMyTournaments()` | None (fetch wrapper) | None |

### 2E. Server DB Layer

| # | File | Function | Collection | Reads | Writes |
|---|------|----------|------------|-------|--------|
| 29 | `lib/server/db/tournaments.ts:18` | `getAllTournamentsFromDb()` | `tournaments` | `.get()` | None |
| 30 | `lib/server/db/tournaments.ts:50` | `getTournamentByIdFromDb()` | `tournaments` | `.doc().get()` | None |
| 31 | `lib/server/db/tournaments.ts:77` | `getTournamentsByTeamIdFromDb()` | `tournaments` | `.get()` + JS filter | None |
| 32 | `lib/server/db/tournaments.ts:108` | `getTournamentsByCreatorFromDb()` | `tournaments` | `.where().get()` | None |
| 33 | `lib/server/db/tournaments.ts:143` | `joinTournamentInDb()` | `tournaments` | `transaction.get()` | `transaction.update()` — `teams[]` |
| 34 | `lib/server/db/tournaments.ts:184` | `leaveTournamentInDb()` | `tournaments` | `transaction.get()` | `transaction.update()` — `teams[]` |
| 35 | `lib/server/db/tournament-fixtures.ts:14` | `getFixturesByTournamentIdFromDb()` | `tournament_fixtures` | `.where().get()` | None |
| 36 | `lib/server/db/matches.ts:40` | `getMatchesByTournamentIdFromDb()` | `matches` | `.where().get()` | None |

### 2F. API Routes

| # | File | Method | Auth | Reads | Writes |
|---|------|--------|------|-------|--------|
| 37 | `app/api/tournaments/route.ts` | GET | No | `getAllTournamentsFromDb()` | None |
| 38 | `app/api/tournaments/[id]/route.ts` | GET | No | `getTournamentByIdFromDb()` | None |
| 39 | `app/api/tournaments/[id]/join/route.ts` | POST | Yes | `findUserById()`, `getTeamByIdFromDb()`, `getTournamentByIdFromDb()` | `joinTournamentInDb()` |
| 40 | `app/api/tournaments/[id]/leave/route.ts` | POST | Yes | `findUserById()`, `getTeamByIdFromDb()`, `getTournamentByIdFromDb()` | `leaveTournamentInDb()` |
| 41 | `app/api/tournaments/[id]/fixtures/route.ts` | GET | No | `getTournamentByIdFromDb()`, `getFixturesByTournamentIdFromDb()` | None |
| 42 | `app/api/tournaments/[id]/standings/route.ts` | GET | No | `getTournamentByIdFromDb()` | None |
| 43 | `app/api/tournaments/[id]/groups/route.ts` | GET | No | `getTournamentByIdFromDb()` | None |
| 44 | `app/api/tournaments/[id]/matches/route.ts` | GET | No | `getTournamentByIdFromDb()`, `getMatchesByTournamentIdFromDb()` | None |
| 45 | `app/api/tournaments/my/route.ts` | GET | Yes | `findUserById()`, `getTournamentsByTeamIdFromDb()`, `getTournamentsByCreatorFromDb()` | None |

### 2G. Types

| # | File | Type | Impact |
|---|------|------|--------|
| 46 | `types/index.ts:263` | `Tournament` | Add `registrationCount?: number` field |
| 47 | `types/index.ts:289` | `TournamentTeam` | No change (retained for materialized view) |
| 48 | `types/index.ts` | NEW: `TournamentRegistration` | New type definition |

### 2H. Firestore Configuration

| # | File | Section | Impact |
|---|------|---------|--------|
| 49 | `firestore.rules` | `registrations` | Add rules for read/write |
| 50 | `firestore.indexes.json` | `registrations` | Add composite indexes |

### 2I. Notification Types (Defined but not created by Client)

| # | Type | Consumer |
|---|------|----------|
| 51 | `tournament_invite` | Admin Dashboard |
| 52 | `tournament_started` | Admin Dashboard |
| 53 | `tournament_ended` | Admin Dashboard |
| 54 | `tournament_match_ready` | Admin Dashboard |
| 55 | `tournament_fixture_generated` | Admin Dashboard |
| 56 | `tournament_registration_closed` | Admin Dashboard |
| 57 | `tournament_finalists_decided` | Admin Dashboard |
| 58 | `tournament_walkover` | Admin Dashboard |

### 2J. Admin Dashboard (Separate Repository — Not Modified Here)

| # | Consumer | Reads | Writes |
|---|----------|-------|--------|
| 59 | TournamentEngine (948 lines) | `tournaments`, `registrations` | `tournaments`, `registrations`, `tournament_fixtures`, `matches` |
| 60 | RegistrationEngine | `registrations` | `registrations` |
| 61 | NotificationEngine | `registrations` | `notifications` |
| 62 | StatisticsEngine | `registrations`, `tournament_fixtures` | `team_stats`, `leaderboard_positions` |
| 63 | ScheduleEngine | `tournaments`, `tournament_fixtures` | `tournament_fixtures` |
| 64 | ReportEngine | `registrations`, `matches` | `reports` (future) |
| 65 | PaymentEngine | `registrations` | `registrations` (payment fields) |
| 66 | DrawEngine | `registrations` | `tournament_fixtures`, `tournaments.groups` |

---

## 3. READ PATHS THAT MUST CHANGE

### 3A. Client-Side Read Changes (Minimal)

| # | Current Read | Change Required | Reason |
|---|-------------|----------------|--------|
| 1 | `tournament.teams` for count | **No change** | Materialized view retained |
| 2 | `tournament.teams` for registration check | **No change** | Materialized view retained |
| 3 | `tournament.teams` for registered teams display | **No change** | Materialized view retained |
| 4 | `tournament.teams` for standings | **No change** | Stats remain on materialized view |
| 5 | `tournament.teams` for group standings | **No change** | Stats remain on materialized view |
| 6 | `getTournamentsByTeamIdFromDb()` — full scan + JS filter | **CHANGE**: Query `registrations` where `teamId == x` | Eliminate O(N) full scan |

### 3B. Server-Side Read Changes

| # | Current Read | Change Required | Reason |
|---|-------------|----------------|--------|
| 7 | `getTournamentsByTeamIdFromDb()` | **CHANGE**: Query `registrations` collection | Replace full-tournament scan with indexed query |
| 8 | `joinTournamentInDb()` — `transaction.get()` | **No change** | Transaction needs current teams[] for validation |
| 9 | `leaveTournamentInDb()` — `transaction.get()` | **No change** | Transaction needs current teams[] for team lookup |
| 10 | Standings computation from `teams[]` | **No change** | Stats remain on materialized view |

### 3C. Admin Dashboard Read Changes (External)

| # | Current Read | Change Required |
|---|-------------|----------------|
| 11 | Admin reads `registrations` collection | **No change** (already canonical) |
| 12 | Admin reads `tournament.teams[]` | **CHANGE**: Read from `registrations` for registration status |
| 13 | Admin TournamentEngine | **CHANGE**: Use `registrations` for team list, `teams[]` for stats |

---

## 4. WRITE PATHS THAT MUST CHANGE

### 4A. Client Write Changes

| # | Current Write | Change Required | New Write |
|---|--------------|----------------|-----------|
| 1 | `joinTournamentInDb()` — `arrayUnion(team)` into `teams[]` | **CHANGE**: Write to BOTH `registrations` AND `teams[]` | `transaction.set()` on `registrations` + `transaction.update()` on `teams[]` |
| 2 | `leaveTournamentInDb()` — `arrayRemove(team)` from `teams[]` | **CHANGE**: Delete from `registrations` AND remove from `teams[]` | `transaction.delete()` on `registrations` + `transaction.update()` on `teams[]` |

### 4B. Admin Dashboard Write Changes (External)

| # | Current Write | Change Required |
|---|--------------|----------------|
| 3 | Admin writes to `registrations` | **No change** (already canonical) |
| 4 | Admin updates `tournament.teams[]` for stats | **CHANGE**: Also write updated stats to `teams[]` materialized view |

### 4C. Combined Write Flow (After Migration)

```
User clicks "Submit Registration"
  │
  ├── transaction.set("registrations/{regId}", {
  │     tournamentId,
  │     teamId,
  │     teamName,
  │     captainId,
  │     status: "approved",           // Client = instant approval
  │     registeredAt: Timestamp,
  │     paymentStatus: "pending",     // or "paid" if fee == 0
  │     createdAt: Timestamp,
  │     updatedAt: Timestamp
  │   })
  │
  ├── transaction.update("tournaments/{id}", {
  │     teams: FieldValue.arrayUnion({ ...TournamentTeam }),
  │     registrationCount: FieldValue.increment(1),
  │     updatedAt: ISO string
  │   })
  │
  └── (same Firestore transaction — atomic)
```

---

## 5. EVERY MIGRATION REQUIRED

### 5A. Schema Migrations

| # | Migration | Type | Reversible? |
|---|-----------|------|-------------|
| M1 | Add `TournamentRegistration` type to `types/index.ts` | Type addition | Yes (delete type) |
| M2 | Add `registrationCount` field to `Tournament` type | Type addition | Yes (delete field) |
| M3 | Create Firestore indexes for `registrations` collection | Index creation | Yes (delete indexes) |
| M4 | Add Firestore security rules for `registrations` | Rules update | Yes (revert rules) |
| M5 | Create `registrations` collection documents from existing `tournament.teams[]` | Data migration | Yes (delete documents) |
| M6 | Add `registrationCount` to all existing tournament documents | Data migration | Yes (remove field) |

### 5B. Code Migrations

| # | Migration | File | Type |
|---|-----------|------|------|
| C1 | Add `createRegistration()`, `deleteRegistration()`, `getRegistrationByTeamAndTournament()`, `getRegistrationsByTeamId()` to DB layer | `lib/server/db/registrations.ts` (NEW) | New module |
| C2 | Update `joinTournamentInDb()` to write both collections in transaction | `lib/server/db/tournaments.ts` | Modify |
| C3 | Update `leaveTournamentInDb()` to delete from `registrations` and remove from `teams[]` in transaction | `lib/server/db/tournaments.ts` | Modify |
| C4 | Replace `getTournamentsByTeamIdFromDb()` to query `registrations` collection | `lib/server/db/tournaments.ts` | Modify |
| C5 | Update barrel export to include new `registrations.ts` | `lib/server/db/index.ts` | Modify |
| C6 | Add `tournamentId` index to `registrations` for "my tournaments" query | `firestore.indexes.json` | Modify |
| C7 | Add `teamId` index to `registrations` for "team's registrations" query | `firestore.indexes.json` | Modify |
| C8 | Add `tournamentId + teamId` unique compound index | `firestore.indexes.json` | Modify |
| C9 | Add security rules for `registrations` collection | `firestore.rules` | Modify |
| C10 | Update `ARCHITECTURE_BASELINE.md` to reflect canonical model | Documentation | Modify |
| C11 | Update Admin Dashboard TournamentEngine to read `teams[]` for stats | Admin repo | External |
| C12 | Update Admin Dashboard RegistrationEngine to also update `teams[]` | Admin repo | External |

---

## 6. MIGRATION STRATEGY FOR EXISTING TOURNAMENTS

### Phase 0: Pre-Migration (No Downtime)

1. Deploy new `TournamentRegistration` type
2. Deploy new Firestore indexes for `registrations`
3. Deploy new Firestore security rules for `registrations`
4. Deploy new `lib/server/db/registrations.ts` module
5. **No existing code changes yet** — new code is additive only

### Phase 1: Dual-Write Activation (Zero Downtime)

1. Update `joinTournamentInDb()` to write to BOTH `registrations` AND `teams[]`
2. Update `leaveTournamentInDb()` to delete from BOTH `registrations` AND remove from `teams[]`
3. Deploy to production
4. **All new registrations now write to both models**
5. **All existing code continues reading from `teams[]`** — no read changes yet

### Phase 2: Backfill Existing Data (Zero Downtime)

1. Run a one-time migration script that:
   - Reads every tournament document
   - For each team in `tournament.teams[]`, creates a corresponding `registrations` document
   - Sets `status: "approved"` (since all existing teams were already accepted)
   - Sets `registeredAt` to the team's `joinedAt` timestamp
   - Sets `paymentStatus: "unknown"` (historical data)
2. Script runs as a Cloud Function or admin script with retry logic
3. **No read changes yet** — all consumers still read `teams[]`

### Phase 3: Read Migration (Zero Downtime)

1. Update `getTournamentsByTeamIdFromDb()` to query `registrations` instead of full-tournament scan
2. Update any Admin Dashboard queries that read `tournament.teams[]` for registration status
3. **Both models now have identical data** — reads can switch incrementally

### Phase 4: Validation Period (1-2 Weeks)

1. Monitor both models for consistency
2. Run daily reconciliation check: count of `registrations` where `tournamentId == X` should equal `tournament.teams.length`
3. **No further changes during validation**

### Phase 5: Cleanup (After Validation Passes)

1. Remove any duplicate read paths
2. Update documentation
3. Mark `getTournamentsByTeamIdFromDb()` as deprecated if fully replaced

---

## 7. ROLLBACK STRATEGY

### Rollback Trigger Conditions

| Condition | Action |
|-----------|--------|
| `registrations` writes fail but `teams[]` writes succeed | Revert to single-write mode (Phase 0) |
| `registrations` reads return wrong data | Revert `getTournamentsByTeamIdFromDb()` to full-scan |
| Firestore transaction timeout rate exceeds 1% | Add retry logic; if persists, revert to Phase 0 |
| Backfill script fails midway | Script is idempotent — re-run from last checkpoint |
| Admin Dashboard reports inconsistency | Pause Phase 3; fix Admin alignment first |

### Rollback Procedure

| Phase | Rollback Action | Risk |
|-------|----------------|------|
| Phase 1 (Dual-Write) | Remove `registrations` writes from `joinTournamentInDb()` and `leaveTournamentInDb()` | Zero data loss — `teams[]` still correct |
| Phase 2 (Backfill) | Delete all documents in `registrations` collection | Zero data loss — `teams[]` still correct |
| Phase 3 (Read Migration) | Revert `getTournamentsByTeamIdFromDb()` to original full-scan | Zero data loss — `teams[]` still correct |
| Phase 4 (Validation) | Revert to Phase 3 state | Zero data loss |
| Phase 5 (Cleanup) | Revert any documentation changes | Zero data loss |

**Key principle:** `tournament.teams[]` is NEVER deleted during any phase. It remains the safety net throughout.

---

## 8. DATA INTEGRACY GUARANTEES

### 8A. Atomicity

Both `registrations` and `tournament.teams[]` are updated in the **same Firestore transaction**. Either both succeed or both fail. No partial writes possible.

```
Transaction {
  1. Read tournament document (for validation)
  2. Write registrations document
  3. Update tournament.teams[]
  4. Update tournament.registrationCount
}
// All-or-nothing
```

### 8B. Consistency

| Check | Enforcement |
|-------|-------------|
| Duplicate registration | `transaction.get()` reads current state; `teams.some(t => t.teamId === id)` check inside transaction |
| Capacity limit | `teams.length >= maxTeams` check inside transaction |
| Team existence | `getTeamByIdFromDb()` called before transaction |
| Tournament existence | `transaction.get()` verifies document exists |
| Registration uniqueness | `registrations/{tournamentId}_{teamId}` document ID prevents duplicates at Firestore level |

### 8C. Isolation

Firestore transactions provide snapshot isolation. Two concurrent join attempts for the same team will be serialized — one succeeds, the other retries and sees the updated state.

### 8D. Durability

Firestore guarantees durability. Both writes are persisted to disk before the transaction commits.

### 8E. Reconciliation

A daily reconciliation script (Phase 4) verifies:

```
For each tournament:
  count(registrations where tournamentId == id AND status == "approved")
  == tournament.teams.length
```

If mismatch detected, alert and log which model has the discrepancy.

---

## 9. DEPENDENCY GRAPH

```
                    ┌─────────────────────┐
                    │   types/index.ts    │
                    │  (TournamentRegistration)
                    │  (Tournament update)
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
    ┌─────────────────┐ ┌──────────────┐ ┌──────────────────┐
    │ firestore.rules │ │ firestore.   │ │ lib/server/db/   │
    │ (registrations) │ │ indexes.json │ │ registrations.ts │
    │                 │ │ (registrations)│ │ (NEW MODULE)     │
    └────────┬────────┘ └──────┬───────┘ └────────┬─────────┘
             │                 │                   │
             │                 │           ┌───────┴────────┐
             │                 │           │                │
             │                 │           ▼                ▼
             │                 │  ┌──────────────┐  ┌──────────────┐
             │                 │  │ tournaments  │  │ tournaments  │
             │                 │  │ .ts (join)   │  │ .ts (leave)  │
             │                 │  └──────┬───────┘  └──────┬───────┘
             │                 │         │                  │
             │                 │         ▼                  ▼
             │                 │  ┌──────────────────────────────┐
             │                 │  │   lib/server/db/index.ts     │
             │                 │  │   (barrel re-export)         │
             │                 │  └──────────────┬───────────────┘
             │                 │                 │
             │                 │    ┌────────────┼────────────┐
             │                 │    │            │            │
             │                 │    ▼            ▼            ▼
             │                 │ ┌────────┐ ┌────────┐ ┌────────────┐
             │                 │ │join/   │ │leave/  │ │my/         │
             │                 │ │route.ts│ │route.ts│ │route.ts    │
             │                 │ └───┬────┘ └───┬────┘ └─────┬──────┘
             │                 │     │          │            │
             │                 │     ▼          ▼            ▼
             │                 │ ┌──────────────────────────────────┐
             │                 │ │    lib/client/api.ts             │
             │                 │ │    (joinTournament, leave, my)   │
             │                 │ └───────────────┬──────────────────┘
             │                 │                 │
             │                 │    ┌────────────┼────────────┐
             │                 │    │            │            │
             │                 │    ▼            ▼            ▼
             │                 │ ┌────────┐ ┌────────┐ ┌────────────┐
             │                 │ │register│ │[id]/   │ │tournaments/│
             │                 │ │/page   │ │page    │ │page        │
             │                 │ └───┬────┘ └───┬────┘ └─────┬──────┘
             │                 │     │          │            │
             │                 │     ▼          ▼            ▼
             │                 │ ┌──────────────────────────────────┐
             │                 │ │  components/tournaments/*        │
             │                 │ │  (tournament-card, roster, etc.) │
             │                 │ └──────────────────────────────────┘
             │                 │
             │                 │
             ▼                 ▼
    ┌────────────────────────────────────┐
    │         FIRESTORE DATABASE         │
    │                                    │
    │  tournaments/{id}                  │
    │    ├── teams[] (materialized view) │
    │    ├── registrationCount           │
    │    ├── groups[]                    │
    │    ├── rounds[]                    │
    │    └── ...other fields             │
    │                                    │
    │  registrations/{regId}             │
    │    ├── tournamentId                │
    │    ├── teamId                      │
    │    ├── teamName                    │
    │    ├── captainId                   │
    │    ├── status                      │
    │    ├── registeredAt                │
    │    ├── paymentStatus               │
    │    ├── paymentId                   │
    │    ├── paidAt                      │
    │    ├── createdAt                   │
    │    └── updatedAt                   │
    │                                    │
    │  tournament_fixtures/{fixtureId}   │
    │  matches/{matchId}                 │
    │  notifications/{notifId}           │
    │  teams/{teamId}                    │
    │  users/{userId}                    │
    └────────────────────────────────────┘
```

---

## 10. EVERY FILE REQUIRING MODIFICATION

### Client Repository (`play_square2.0`)

| # | File | Change Type | Description |
|---|------|-------------|-------------|
| 1 | `types/index.ts` | MODIFY | Add `TournamentRegistration` type; add `registrationCount?: number` to `Tournament` |
| 2 | `lib/server/db/registrations.ts` | **CREATE** | New module: `createRegistration()`, `deleteRegistration()`, `getRegistrationByTeamAndTournament()`, `getRegistrationsByTeamId()`, `getRegistrationCountByTournament()` |
| 3 | `lib/server/db/tournaments.ts` | MODIFY | Update `joinTournamentInDb()` to write both `registrations` and `teams[]` in transaction; update `leaveTournamentInDb()` to delete from both; update `getTournamentsByTeamIdFromDb()` to query `registrations` |
| 4 | `lib/server/db/index.ts` | MODIFY | Add `export * from "@/lib/server/db/registrations"` |
| 5 | `app/api/tournaments/[id]/join/route.ts` | MODIFY | Update `TournamentTeam` construction to match materialized view format |
| 6 | `firestore.rules` | MODIFY | Add `match /registrations/{regId}` rules block |
| 7 | `firestore.indexes.json` | MODIFY | Add 3 composite indexes for `registrations` collection |
| 8 | `ARCHITECTURE_BASELINE.md` | MODIFY | Update data model section to reflect canonical `registrations` collection |
| 9 | `CLIENT_REGISTRATION_DATA_FLOW.md` | MODIFY | Update to reflect dual-write architecture |
| 10 | `TOURNAMENT_FINAL_VERIFICATION.md` | MODIFY | Update verification to include `registrations` collection |

### Admin Dashboard Repository (`play_square 3.1-main`) — External

| # | File | Change Type | Description |
|---|------|-------------|-------------|
| 11 | `TournamentEngine` | MODIFY | Read `teams[]` for stats, write stats to `teams[]` after match resolution |
| 12 | `RegistrationEngine` | MODIFY | Ensure writes to `registrations` also update `teams[]` materialized view |
| 13 | `TournamentRepository` | MODIFY | Align query patterns with canonical model |

---

## 11. MODIFICATION ORDER BY DEPENDENCY

| Order | Step | Files | Dependencies |
|-------|------|-------|-------------|
| **1** | Type definitions | `types/index.ts` | None |
| **2** | Firestore infrastructure | `firestore.rules`, `firestore.indexes.json` | Step 1 (type must exist before rules reference it) |
| **3** | New DB module | `lib/server/db/registrations.ts` (CREATE) | Step 1 (uses `TournamentRegistration` type) |
| **4** | Barrel export | `lib/server/db/index.ts` | Step 3 (re-exports new module) |
| **5** | Join write path | `lib/server/db/tournaments.ts` (joinTournamentInDb) | Steps 3 + 4 (calls new registration functions) |
| **6** | Leave write path | `lib/server/db/tournaments.ts` (leaveTournamentInDb) | Steps 3 + 4 (calls new registration functions) |
| **7** | My tournaments read path | `lib/server/db/tournaments.ts` (getTournamentsByTeamIdFromDb) | Step 3 (queries registrations collection) |
| **8** | API route alignment | `app/api/tournaments/[id]/join/route.ts` | Step 5 (uses updated joinTournamentInDb) |
| **9** | Documentation update | `ARCHITECTURE_BASELINE.md`, `CLIENT_REGISTRATION_DATA_FLOW.md`, `TOURNAMENT_FINAL_VERIFICATION.md` | Steps 1-8 (documents final state) |
| **10** | Admin Dashboard alignment | External repository | Steps 1-9 (depends on Client being deployed first) |

---

## 12. ELIMINATING DUPLICATE MODELS

### Before (Current State)

```
Client writes:  tournament.teams[]        ← READS from this
Admin writes:   registrations collection  ← READS from this
Synchronization: NONE
```

### After (Target State)

```
Both write:     registrations collection  (canonical source of truth)
Both write:     tournament.teams[]        (materialized view for reads)
Synchronization: SAME Firestore transaction (atomic)
```

### Elimination Steps

1. **Phase 1:** Client gains write access to `registrations` (additive — no elimination yet)
2. **Phase 2:** Backfill ensures `registrations` has all historical data
3. **Phase 3:** Client reads switch to `registrations` for queries, `teams[]` for display
4. **Phase 4:** Validation confirms both models are in sync
5. **Phase 5:** Any redundant read paths are removed

**What is NOT eliminated:**
- `tournament.teams[]` is NEVER eliminated — it becomes the materialized view
- The embedded stats (`points`, `wins`, `draws`, etc.) remain on `teams[]`

**What IS eliminated:**
- The Admin's independent `registrations` writes that skip `teams[]`
- The Client's independent `teams[]` writes that skip `registrations`
- Any future possibility of the two systems diverging

---

## 13. GUARANTEE: EVERY CONSUMER READS THE SAME SOURCE

| Consumer | Primary Read | Secondary Read | Consistency |
|----------|-------------|----------------|-------------|
| **Client: Tournament List** | `tournament.teams[]` (count) | None | ✅ Materialized view |
| **Client: Tournament Detail** | `tournament.teams[]` (registration check) | None | ✅ Materialized view |
| **Client: Registration Wizard** | `tournament.teams[]` (registered list) | None | ✅ Materialized view |
| **Client: My Tournaments** | `registrations` (query by teamId) | `tournaments` (query by creator) | ✅ Canonical + materialized |
| **Client: Standings** | `tournament.teams[]` (stats) | None | ✅ Materialized view |
| **Client: Groups** | `tournament.teams[]` (stats + groups) | None | ✅ Materialized view |
| **Admin: Tournament Management** | `tournaments` | `registrations` | ✅ Canonical + materialized |
| **Admin: Registration Approval** | `registrations` (canonical) | None | ✅ Canonical |
| **Admin: Schedule Management** | `tournament_fixtures` | `tournaments` | ✅ Derived from canonical |
| **Admin: Draw Generation** | `registrations` (approved teams) | `tournament_fixtures` | ✅ Canonical |
| **Admin: Group Assignment** | `registrations` (approved teams) | `tournaments.groups[]` | ✅ Canonical + materialized |
| **Admin: Statistics** | `registrations` + `matches` | `tournament.teams[]` (stats) | ✅ Canonical + materialized |
| **Admin: Notifications** | `registrations` (status changes) | `tournaments` | ✅ Canonical |
| **Admin: Payments** | `registrations` (paymentStatus) | None | ✅ Canonical |
| **Admin: Reports** | `registrations` + `matches` + `tournament_fixtures` | None | ✅ Canonical |
| **Notifications Engine** | `registrations` (status events) | `tournaments` | ✅ Canonical |
| **Statistics Engine** | `registrations` + `matches` | `tournament.teams[]` | ✅ Canonical + materialized |

**Every consumer ultimately traces back to the same `registrations` collection as the canonical source, with `tournament.teams[]` as the read-optimized materialized view.**

---

## 14. REGISTRATION DOCUMENT SCHEMA

```typescript
interface TournamentRegistration {
  // Identity
  id: string                    // Auto-generated: "reg_{tournamentId}_{teamId}"
  tournamentId: string          // FK → tournaments/{id}
  teamId: string                // FK → teams/{id}

  // Team snapshot (denormalized for queries)
  teamName: string
  captainId: string

  // Status
  status: "pending" | "approved" | "rejected" | "cancelled"

  // Payment
  paymentStatus: "pending" | "paid" | "refunded" | "waived" | "unknown"
  paymentId?: string
  paidAt?: Timestamp

  // Timestamps
  registeredAt: Timestamp       // When the team submitted registration
  reviewedAt?: Timestamp        // When admin approved/rejected (null for instant approval)
  createdAt: Timestamp
  updatedAt: Timestamp

  // Metadata
  notes?: string                // Admin notes (rejection reason, etc.)
}
```

---

## 15. FIRESTORE INDEXES FOR `registrations`

```json
{
  "collectionGroup": "registrations",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "tournamentId", "order": "ASCENDING" },
    { "fieldPath": "registeredAt", "order": "DESCENDING" }
  ]
}
```

```json
{
  "collectionGroup": "registrations",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "teamId", "order": "ASCENDING" },
    { "fieldPath": "registeredAt", "order": "DESCENDING" }
  ]
}
```

```json
{
  "collectionGroup": "registrations",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "tournamentId", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" }
  ]
}
```

```json
{
  "collectionGroup": "registrations",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "tournamentId", "order": "ASCENDING" },
    { "fieldPath": "teamId", "order": "ASCENDING" }
  ]
}
```

---

## 16. FIRESTORE RULES FOR `registrations`

```
match /registrations/{regId} {
  allow read: if isAuthenticated();
  allow create: if isAuthenticated();
  allow update: if isAuthenticated();
  allow delete: if false;
}
```

---

## 17. SUMMARY OF KEY DECISIONS

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Canonical source | `registrations` collection | Supports status tracking, approval workflow, payments, independent queries |
| Materialized view | `tournament.teams[]` | Retained for single-document reads, atomic appends, stats computation |
| Write pattern | Dual-write in same transaction | Guarantees atomicity; no partial state possible |
| Client read change | Minimal (1 function changes) | `getTournamentsByTeamIdFromDb()` switches to `registrations` query |
| Admin read change | Minimal (reads `registrations` already) | Admin already uses canonical model |
| Backfill strategy | Idempotent script, checkpoint-based | Safe to re-run; no data loss on failure |
| Rollback strategy | Phased revert, `teams[]` never deleted | Each phase independently reversible |
| Validation | Daily reconciliation check | Automated consistency monitoring |
