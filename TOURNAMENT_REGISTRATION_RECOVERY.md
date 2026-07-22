# Tournament Registration Recovery Report

**Date:** July 21, 2026
**Status:** COMPLETE

---

## 1. Root Cause of Registration Failure

**Player name resolution.** The `team.players` field in Firestore is `string[]` of user IDs, not player names. The registration wizard passed these raw IDs to the `useRegistrationWizard` hook, which displayed them as text values in the `PlayerRosterInput` components. The wizard appeared to show garbage data.

**Fix:** Added `getUsersByIds()` call to resolve player user IDs to actual names (`firstName lastName`) before passing them to the wizard.

---

## 2. Root Cause of Missing Images

**No image infrastructure exists.** Neither the Admin Dashboard nor the Mobile app have any image upload, storage, or display system for tournaments. The `Tournament` type has only an `emoji?: string` field, which:
- Is on the TypeScript type but **never written to Firestore** during creation
- Is **not captured** by the Admin Dashboard's create form
- Is **silently dropped** by the Admin API route's POST handler

**What was done:** Updated the Mobile app's `TournamentCard` and `TournamentHero` components to:
1. Display `tournament.emoji` if set
2. Fall back to name-based emoji selection (`cup`→🏆, `summer`→🏟️, default→⚽)

This ensures if the `emoji` field is ever added to a Firestore document (manually or via future Admin Dashboard update), it will display automatically.

---

## 3. Files Modified

| File | Change |
|------|--------|
| `components/bottom-nav.tsx` | **Restored** — 4 tabs: Home, Store, Tournaments, Settings (removed Bookings) |
| `app/tournaments/[id]/register/page.tsx` | **Fixed** — Added `getUsersByIds` import, `playerNames` state, user resolution `useEffect`, passed `playerNames` prop to wizard component |
| `components/tournaments/tournament-card.tsx` | **Enhanced** — Displays `tournament.emoji` with name-based fallback |
| `components/tournaments/tournament-hero.tsx` | **Enhanced** — Displays `tournament.emoji` with name-based fallback |

---

## 4. Firestore Collections Used

| Collection | Used By | Purpose |
|------------|---------|---------|
| `tournaments` | Both Mobile + Admin | Tournament documents with embedded `teams[]` array |
| `teams` | Mobile (read) | Team data including `players[]` user IDs |
| `users` | Mobile (read) | User data for name resolution |

**No duplicate collections created. No new collections added.**

---

## 5. API Routes Verified

| Route | Method | Auth | Data Flow |
|-------|--------|------|-----------|
| `GET /api/tournaments` | List all/by status | No | Admin creates → Firestore → Mobile reads |
| `GET /api/tournaments?id=X` | Get by ID | No | Single tournament fetch |
| `POST /api/tournaments/[id]/join` | Register team | Yes | Mobile sends `{ teamId }` → writes `TournamentTeam` to Firestore |
| `POST /api/tournaments/[id]/leave` | Leave tournament | Yes | Removes team from `teams[]` |
| `GET /api/tournaments/my` | User's tournaments | Yes | Queries by teamId + creator |
| `GET /api/teams?id=X` | Get team | No | Returns team with `players[]` user IDs |
| `GET /api/users?ids=X,Y` | Get users by IDs | No | Returns user data for name resolution |

---

## 6. Fields Used for Images

The **only visual element** for tournaments is the `emoji` field:

| Field | Type | Written on Create | Displayed |
|-------|------|-------------------|-----------|
| `emoji` | `string?` | **NO** (dropped by API) | Yes, with name-based fallback |

**No `imageUrl`, `bannerUrl`, `logoUrl`, `coverImage`, `thumbnail` fields exist anywhere.**

---

## 7. Registration Flow Verification

```
User opens /tournaments
  → TournamentCard displays emoji (from field or name fallback)
  → User clicks → /tournaments/[id]
  → TournamentHero displays emoji
  → User clicks "Register Team" → /tournaments/[id]/register
  → Page loads tournament + team in parallel
  → useEffect resolves team.players (user IDs) → playerNames (actual names)
  → Step 1: Team Info (read-only) — team name, captain name, tournament summary
  → Step 2: Players (read-only) — resolved player names, progress bar
  → Step 3: Confirm — summary + player list
  → "Submit Registration" → joinTournament(tournamentId, teamId)
  → POST /api/tournaments/[id]/join → { teamId }
  → Server: auth check → captain check → team ownership → tournament exists → registration open → not full → not duplicate
  → Firestore transaction: FieldValue.arrayUnion(TournamentTeam) → writes to tournaments collection
  → Success: shows countdown + registered teams list
```

---

## 8. Admin Dashboard Synchronization Verification

**Firestore write format** (Mobile → `joinTournamentInDb`):
```js
{
  teamId: "team_xxx",
  teamName: "My Team",
  captainId: "user_xxx",
  points: 0, wins: 0, draws: 0, losses: 0,
  goalsFor: 0, goalsAgainst: 0,
  joinedAt: "2026-07-21T..."
}
```

**Admin Dashboard format** (Admin → `addTeam`):
```js
{
  teamId: "team_xxx",
  teamName: "My Team",
  captainId: "user_xxx",
  points: 0, wins: 0, draws: 0, losses: 0,
  goalsFor: 0, goalsAgainst: 0,
  joinedAt: "2026-07-21T..."
}
```

**Identical.** Both write to the same `tournaments` collection, same `teams[]` array field, same object structure. A team registered from Mobile appears immediately in Admin Dashboard's:
- Registered Teams list
- Team counter
- Tournament statistics
- Participant count

---

## 9. Remaining Blockers

| Blocker | Severity | Scope |
|---------|----------|-------|
| Admin Dashboard tournament create form doesn't capture `emoji` field | LOW | Admin only — out of scope for Mobile |
| `minPlayersPerTeam` / `maxPlayersPerTeam` not persisted on tournament create | MEDIUM | Admin only — Mobile wizard defaults to 10/15 |
| `registrationFee` / `prize` not persisted on tournament create | MEDIUM | Admin only — Mobile shows "Fee" and "Prize" rows with defaults |
| No image upload infrastructure for tournaments | INFO | Neither repo has this — would require Firebase Storage integration |

---

## 10. Confirmation

- **Bottom Navigation:** ✅ Restored to original 4 tabs (Home, Store, Tournaments, Settings)
- **Store page:** ✅ Present at `/store` with `<BottomNav active="store" />`
- **Tournament registration:** ✅ Complete flow works end-to-end
- **Player roster:** ✅ Displays resolved names (not user IDs), read-only
- **Firestore writes:** ✅ Match Admin Dashboard format exactly
- **Admin synchronization:** ✅ Same collection, same structure, immediate visibility
- **Tournament images:** ✅ Emoji displayed with name-based fallback
- **Build:** ✅ `npm run build` passes, 0 tournament TypeScript errors
