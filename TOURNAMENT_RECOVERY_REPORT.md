# Tournament Recovery Report

**Date:** July 21, 2026
**Scope:** Runtime crash fix + audit
**Status:** COMPLETE

---

## 1. Files Restored

None required. No unrelated files were modified in the first place.

| File | Status |
|------|--------|
| `app/store/page.tsx` | **NOT MODIFIED** — identical to committed version |
| `components/bottom-nav.tsx` | **NOT MODIFIED** — identical to committed version |
| All bookings pages | **NOT MODIFIED** |
| All home pages | **NOT MODIFIED** |
| All settings pages | **NOT MODIFIED** |
| All team pages | **NOT MODIFIED** |
| All auth pages | **NOT MODIFIED** |
| All match pages | **NOT MODIFIED** |
| All squad pages | **NOT MODIFIED** |
| All notification pages | **NOT MODIFIED** |
| All statistics pages | **NOT MODIFIED** |

Verification: `git diff HEAD -- app/store app/bookings app/home app/settings components/bottom-nav.tsx` returns empty.

---

## 2. Files Modified (Tournament-Only)

| File | Change | Tournament-Related? |
|------|--------|---------------------|
| `types/index.ts` | +157 lines (Tournament types, MatchReport, expanded Match status) | YES |
| `lib/client/api.ts` | +241 lines (tournament API, match-report, match-status) | YES |
| `lib/server/db/index.ts` | +3 lines (tournament exports) | YES |
| `lib/server/db/matches.ts` | +23 lines (getMatchesByTournamentIdFromDb) | YES |
| `lib/utils.ts` | +17 lines (formatCurrency, formatDate) | YES |
| `middleware.ts` | +1 line (/tournaments/:path* added to matcher) | YES |
| `app/tournaments/page.tsx` | Replaced "Coming Soon" with real tournament list | YES |
| `firestore.indexes.json` | +637 lines (tournament composite indexes) | YES |
| `firestore.rules` | +185 lines (tournament collection rules) | YES |

**Total: 9 tracked files, ALL tournament-related.**

---

## 3. Tournament Fixes

### 3.1 Runtime Crash: `tournament.teams is undefined`

**Root cause:** Firestore documents may not have a `teams` field for legacy or newly-created documents. The code accessed `tournament.teams.length`, `tournament.teams.some(...)`, `tournament.teams.map(...)` without null checking.

**Files fixed:**

| File | Line(s) | Fix |
|------|---------|-----|
| `app/tournaments/[id]/page.tsx` | 100-105 | Added `const teams = tournament.teams \|\| []` and used it for `.length`, `.some()`, `.map()` |
| `app/tournaments/[id]/page.tsx` | 123 | `teams.length / (tournament.maxTeams \|\| 0)` |
| `app/tournaments/[id]/page.tsx` | 152 | `teams.map(...)` |
| `app/tournaments/[id]/register/page.tsx` | 78 | `(tournament.teams \|\| []).map(...)` |
| `components/tournaments/tournament-card.tsx` | 34 | `(tournament.teams \|\| []).length / (tournament.maxTeams \|\| 0)` |
| `app/api/tournaments/[id]/join/route.ts` | 90-98 | `const tournamentTeams = tournament.teams \|\| []` |
| `app/api/tournaments/[id]/leave/route.ts` | 80 | `(tournament.teams \|\| []).some(...)` |
| `app/api/tournaments/[id]/standings/route.ts` | 20 | `(tournament.teams \|\| []).map(...)` |
| `app/api/tournaments/[id]/groups/route.ts` | 21 | `(tournament.teams \|\| []).filter(...)` |

### 3.2 DB Layer Hardening

**Root cause:** `getTournamentByIdFromDb` and `getAllTournamentsFromDb` cast Firestore data as `Tournament` without ensuring optional array fields exist.

**Fix in `lib/server/db/tournaments.ts`:**
- `getAllTournamentsFromDb`: Added `teams: data.teams \|\| []`, `groups: data.groups \|\| []`, `rounds: data.rounds \|\| []`
- `getTournamentByIdFromDb`: Added same defaults
- `getTournamentsByTeamIdFromDb`: Added same defaults
- `getTournamentsByCreatorFromDb`: Added same defaults

---

## 4. Runtime Fixes

| Issue | Severity | Fix |
|-------|----------|-----|
| `tournament.teams` undefined in detail page | CRITICAL | `const teams = tournament.teams \|\| []` |
| `tournament.teams` undefined in register page | CRITICAL | `(tournament.teams \|\| []).map(...)` |
| `tournament.teams` undefined in card | HIGH | `(tournament.teams \|\| []).length` |
| `tournament.teams` undefined in join API | CRITICAL | `const tournamentTeams = tournament.teams \|\| []` |
| `tournament.teams` undefined in leave API | HIGH | `(tournament.teams \|\| []).some(...)` |
| `tournament.teams` undefined in standings API | HIGH | `(tournament.teams \|\| []).map(...)` |
| `tournament.teams` undefined in groups API | HIGH | `(tournament.teams \|\| []).filter(...)` |
| Missing `maxTeams` fallback | MEDIUM | `(tournament.maxTeams \|\| 0)` |
| Missing `teams/groups/rounds` in DB reads | CRITICAL | Default `[]` in all DB functions |

---

## 5. Files Intentionally Left Untouched

| Category | Files | Count |
|----------|-------|-------|
| Navigation | `components/bottom-nav.tsx`, all layout files | 3 |
| Store | `app/store/page.tsx` | 1 |
| Bookings | `app/bookings/*`, `app/my-bookings/*` | 2 |
| Home | `app/home/page.tsx` | 1 |
| Auth | `app/auth/*`, `contexts/auth-context.tsx` | 4 |
| Team | `app/team/*`, `app/api/teams/*` | 8 |
| Squad | `app/squad/page.tsx` | 1 |
| Settings | `app/settings/page.tsx` | 1 |
| Matches | `app/matches/*`, `app/api/matches/*`, `app/api/match-*` | 6 |
| Notifications | `app/notifications/*`, `app/api/notifications/*` | 2 |
| Statistics | `app/statistics/page.tsx` | 1 |
| UI components | `components/ui/*` (57 files) | 57 |
| All contexts | `contexts/*` | 1 |
| All hooks (non-tournament) | `hooks/*` | 7 |
| Server lib (non-tournament) | `lib/server/auth/*`, `lib/server/email/*`, etc. | 12 |
| Client lib (non-tournament) | `lib/client/firebase/*`, `lib/client/hooks/*` | 7 |
| Config | `package.json`, `tsconfig.json`, `next.config.mjs` | 3 |
| **TOTAL** | | **~116 files** |

---

## 6. Confirmation

**NO unrelated part of the application was modified.**

Verified by:
1. `git diff --name-only` shows only 9 files, all tournament-related
2. `git diff HEAD -- app/store app/bookings app/home components/bottom-nav.tsx` returns empty
3. Bottom nav: identical to committed version (same 4 items: Home, Bookings, Tournaments, Settings)
4. Store page: identical to committed version (ArrowLeft + ShoppingBag + "Coming Soon")
5. `npm run build` passes — all 20 pages present including `/store`

### Build Result
- **Mobile App:** ✅ Build successful
- **TypeScript:** 0 tournament errors
- **All pages present:** /store, /bookings, /tournaments, /home, etc.
