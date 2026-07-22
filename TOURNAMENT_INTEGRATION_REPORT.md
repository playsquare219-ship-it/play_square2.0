# Tournament HTML → Architecture Integration Report

> **Document Type:** Engineering Integration Analysis
> **Input:** Tournament HTML design (5 screens)
> **Reference:** ARCHITECTURE_BASELINE.md (locked)
> **Status:** Pre-implementation analysis — no code written

---

## 1. HTML Design Analysis

### 1.1 Screens Inventory

The HTML defines **5 screens** (numbered s1, s2, s4, s5, s7). Screens s3 and s6 are absent from the design.

| Screen | ID | Purpose | Complexity |
|--------|-----|---------|-----------|
| Tournament List | s1 | Browse all tournaments with status filters | Medium |
| Tournament Detail | s2 | View tournament info, countdown, registered teams | High |
| Registration Step 1 | s4 | Enter team name and captain name | Low |
| Registration Step 2 | s5 | Enter player roster (15 slots, min 10) | Medium |
| Registration Success | s7 | Confirmation with countdown to tournament start | Low |

**Missing screens** (not in HTML, will need engineering decisions):
- Screen s3: Not defined. Gap between Tournament Detail (s2) and Registration Step 1 (s4).
- Screen s6: Not defined. Gap between Registration Step 2 (s5) and Success (s7). Likely the "Confirm" step (step 3 of the registration wizard).

### 1.2 Complete Element Inventory

#### Screen 1 — Tournament List (`s1`)

| Element | HTML Structure | Visual Behavior |
|---------|---------------|-----------------|
| Top Bar | `.topbar` > `h2` "Football Leagues" | Sticky header, centered title, no back button |
| Hero Title | `.hero-title` | Large bold text "Football Leagues", padding 22px top |
| Filter Tabs | `.filter-tabs` > 4x `.tab` | Horizontal scrollable row: All (active/red), Upcoming, Ongoing, Past |
| Tournament Card | `.tournament-card` | Full-width card with image, badges, title, metadata |
| Card Image | `.card-image` > `.img-placeholder` | 190px height, gradient placeholder with emoji |
| Card Badges | `.card-badges` > 2x `.badge` | Overlaid on image top-left: type badge + status badge |
| Card Title | `.card-title` | Tournament name, 18px bold |
| Card Metadata | `.card-meta` > 3x `.meta-item` | Date icon, team count icon, prize amount (red) |

**Card states identified:**
- Status badge colors: green (Upcoming), red-b (Past), blue (Ongoing)
- Prize always displayed in red
- Cards have `:active` scale transform (0.98)

#### Screen 2 — Tournament Detail (`s2`)

| Element | HTML Structure | Visual Behavior |
|---------|---------------|-----------------|
| Top Bar | `.topbar` > `.back` button + `h2` | Sticky, centered title, left back arrow |
| Detail Hero | `.detail-hero` | 210px height image with gradient overlay |
| Hero Badges | `.badges` > 2x `.badge` | Overlaid on image top-left |
| Hero Title | `.title-over` | Bottom-positioned, 24px bold, over gradient |
| Description | `.desc-text` | Muted text, 14px, 1.65 line-height |
| Tournament Info Card | `.section-card` > `.section-header` + 6x `.info-row` | Card with header (icon + title), label-value rows |
| Info Rows | `.info-row` | Teams (8 of 12), Players per team (10–15), Fee (red), Prize (red), Start date, End date |
| Countdown Card | `.countdown-card` | "Time left to register" label, 4-box grid |
| Countdown Boxes | `.cd-box` > `.cd-num` + `.cd-unit` | Days/Hours/Mins/Secs, red numbers, surface2 background |
| Collapsible Teams | `.collapsible` | "Registered Teams (8)" with chevron, toggles team list |
| Team List | `#teams-list` | Hidden by default, shows team names in info-row format |
| Register Button | `.register-btn` | Full-width red button with glow shadow |

#### Screen 4 — Registration Step 1 (`s4`)

| Element | HTML Structure | Visual Behavior |
|---------|---------------|-----------------|
| Steps Bar | `.steps-bar` > 3x `.step-item` | Step indicators: 1 (active/red), 2, 3 (inactive) |
| Step Circle | `.step-circle` | 38px circle, active state: red background |
| Step Label | `.step-label` | 11px text, active: red + bold |
| Team Name Input | `.form-group` > `.form-input` | Right-aligned text, 14px padding, surface background |
| Captain Name Input | `.form-group` > `.form-input` | Same style as team name |
| Registration Info Box | `.reg-info-box` > 4x `.info-row` | Tournament name, Min/Max players, Fee (red) |
| Button Row | `.dual-btn-row` | Two buttons: Next (filled, conditional enabled) + Cancel (outline) |

#### Screen 5 — Registration Step 2 (`s5`)

| Element | HTML Structure | Visual Behavior |
|---------|---------------|-----------------|
| Steps Bar | Same as s4 | Step 1 shows checkmark (completed), Step 2 active |
| Players Header | `.players-header` | "Team Players" title + "0 of 15 — Minimum 10" subtitle |
| Progress Bar | `.progress-bar` > `.progress-fill` | 4px height, red fill, percentage-based width |
| Player Rows | `.player-row` > `.player-num` + `.player-input` | 15 rows: numbered red circle + text input |
| Warning Bar | `.warning-bar` | Amber warning when < 10 players filled |
| Button Row | `.dual-btn-row` | Confirm Registration (conditional enabled) + Back |

#### Screen 7 — Success (`s7`)

| Element | HTML Structure | Visual Behavior |
|---------|---------------|-----------------|
| Success Icon | `.success-icon` | 72px green circle with checkmark |
| Success Title | `.success-title` | "Registered Successfully!", 26px bold |
| Success Subtitle | `.success-sub` | Tournament name, muted text |
| Countdown Card | Same as s2 | "Countdown to Tournament Start" |
| Teams Collapsible | `.collapsible` | "Participating Teams (8)" |
| Back Button | `.register-btn` | "Back to Leagues" |

### 1.3 Interaction Inventory

| Interaction | Trigger | Behavior | Screens |
|-------------|---------|----------|---------|
| Screen navigation | `showScreen(id)` | Hides all screens, shows target, scrolls to top | All |
| Tab filtering | `filterCards(status, el)` | Filters cards by `data-status` attribute, updates active tab | s1 |
| Teams collapsible | `toggleTeams()` | Toggles `#teams-list` display, swaps chevron | s2, s7 |
| Step 1 validation | `oninput` on team/captain inputs | Enables/disables Next button | s4 |
| Player progress | `oninput` on player inputs | Updates count, progress bar, warning, enables Confirm | s5 |
| Countdown timer | `setInterval(tick, 1000)` | Updates Days/Hours/Mins/Secs every second | s2, s7 |

### 1.4 State Inventory

| State | Type | Scope | Screens |
|-------|------|-------|---------|
| Active screen | string | Global | All |
| Active filter tab | string | Local | s1 |
| Team name | string | Local | s4 |
| Captain name | string | Local | s4 |
| Player roster | string[15] | Local | s5 |
| Filled player count | computed | Local | s5 |
| Teams list expanded | boolean | Local | s2, s7 |
| Countdown values | computed | Local | s2, s7 |

---

## 2. Reusable UI Components

### 2.1 Components Extractable from HTML

| Component | HTML Source | shadcn/ui Base | Reuse Count |
|-----------|------------|----------------|-------------|
| `TournamentTopBar` | `.topbar` | Custom (no shadcn equivalent) | 5 screens |
| `TournamentHeroSection` | `.detail-hero` | Custom | 2 screens (s2, s7 implicit) |
| `TournamentCard` | `.tournament-card` | `Card` | List, potentially grid |
| `StatusBadge` | `.badge` | `Badge` | All tournament displays |
| `InfoRow` | `.info-row` | Custom (label + value) | 10+ usages |
| `SectionCard` | `.section-card` | `Card` with header | Tournament info, teams, etc. |
| `CountdownTimer` | `.countdown-card` + `.cd-box` | Custom | 2 screens (s2, s7) |
| `CollapsibleSection` | `.collapsible` | `Collapsible` | Teams list, potentially more |
| `FilterTabs` | `.filter-tabs` | `Tabs` or custom | Tournament list |
| `StepsIndicator` | `.steps-bar` | Custom | Registration wizard |
| `FormInput` | `.form-input` | `Input` | Registration forms |
| `PlayerRosterInput` | `.player-row` | Custom (numbered input) | Step 2 |
| `ProgressBar` | `.progress-bar` | `Progress` | Step 2, potentially others |
| `WarningBanner` | `.warning-bar` | `Alert` variant | Validation warnings |
| `DualButtonRow` | `.dual-btn-row` | Custom (2x `Button`) | Form navigation |
| `SuccessConfirmation` | `.success-screen` | Custom | Registration success |
| `HeroTitle` | `.hero-title` | Custom | List page |

### 2.2 Components NOT in HTML (Engineering Additions Required)

| Component | Reason | Priority |
|-----------|--------|----------|
| `TournamentLoadingSkeleton` | No loading states in HTML | Required |
| `TournamentEmptyState` | No empty state in HTML | Required |
| `TournamentErrorState` | No error state in HTML | Required |
| `BottomNav` | Not in HTML but exists in mobile app | Required (existing) |
| `TournamentDetailSkeleton` | Loading state for detail page | Required |
| `RegistrationStep3Confirm` | Screen s6 missing from HTML | Required (gap fill) |

---

## 3. Complete Component Hierarchy

```
app/tournaments/
├── page.tsx                          ← Tournament List (s1)
│   ├── TournamentTopBar
│   ├── HeroTitle
│   ├── FilterTabs
│   └── TournamentCard[]
│       ├── CardImage (with placeholder)
│       ├── StatusBadge[] (type + status)
│       ├── CardTitle
│       └── CardMeta (date, teams, prize)
│
├── [id]/
│   ├── page.tsx                      ← Tournament Detail (s2)
│   │   ├── TournamentTopBar (with back)
│   │   ├── TournamentHeroSection
│   │   │   ├── HeroImage (with gradient overlay)
│   │   │   ├── StatusBadge[]
│   │   │   └── HeroTitle (positioned over image)
│   │   ├── DescriptionText
│   │   ├── SectionCard (Tournament Info)
│   │   │   ├── SectionHeader (icon + title)
│   │   │   └── InfoRow[] (teams, players, fee, prize, dates)
│   │   ├── CountdownTimer (registration countdown)
│   │   ├── CollapsibleSection (Registered Teams)
│   │   │   └── InfoRow[] (team names)
│   │   └── RegisterButton
│   │
│   └── register/
│       └── page.tsx                  ← Registration Wizard (s4, s5, s7)
│           ├── StepsIndicator (3 steps)
│           ├── [Step 1: Team Info]
│           │   ├── FormInput (team name)
│           │   ├── FormInput (captain name)
│           │   ├── SectionCard (tournament summary)
│           │   │   └── InfoRow[] (tournament, min/max, fee)
│           │   └── DualButtonRow (Next + Cancel)
│           ├── [Step 2: Players]
│           │   ├── PlayersHeader (title + count)
│           │   ├── ProgressBar
│           │   ├── PlayerRosterInput[] (15 rows)
│           │   ├── WarningBanner
│           │   └── DualButtonRow (Confirm + Back)
│           ├── [Step 3: Confirm] (gap fill)
│           │   └── ConfirmationSummary
│           └── [Success]
│               ├── SuccessConfirmation
│               ├── CountdownTimer (tournament countdown)
│               ├── CollapsibleSection (teams)
│               └── BackToLeaguesButton
│
components/tournaments/
├── tournament-top-bar.tsx
├── tournament-hero.tsx
├── tournament-card.tsx
├── status-badge.tsx
├── info-row.tsx
├── section-card.tsx
├── countdown-timer.tsx
├── collapsible-section.tsx
├── filter-tabs.tsx
├── steps-indicator.tsx
├── player-roster-input.tsx
├── warning-banner.tsx
├── dual-button-row.tsx
├── success-confirmation.tsx
└── hero-title.tsx
```

---

## 4. HTML → React + TypeScript + Tailwind + shadcn/ui Mapping

### 4.1 CSS Variables → Tailwind Theme Tokens

| HTML CSS Variable | Current Value | Tailwind Token Mapping | Notes |
|-------------------|---------------|----------------------|-------|
| `--bg: #0a0a0a` | Background | `bg-[#0a0a0a]` | **Conflict**: Mobile app uses `--background: #121212` |
| `--surface: #1a1a1a` | Card surface | `bg-[#1a1a1a]` | Close to mobile `--card: #1E1E1E` |
| `--surface2: #222222` | Secondary surface | `bg-[#222222]` | Between mobile `--card` and `--border` |
| `--border: #2e2e2e` | Borders | `border-[#2e2e2e]` | Close to mobile `--border: #2C2C2C` |
| `--red: #e8352a` | Primary accent | `text-[#e8352a]` | **Conflict**: Mobile uses `--primary: #FF3B3F` |
| `--red-glow: rgba(232,53,42,0.25)` | Button shadow | `shadow-[0_4px_20px_rgba(232,53,42,0.25)]` | Custom shadow |
| `--text: #ffffff` | Primary text | `text-white` | Matches mobile |
| `--text-muted: #888888` | Secondary text | `text-[#888888]` | Close to mobile `--muted-foreground: #A0A0A0` |
| `--text-dim: #555555` | Placeholder text | `text-[#555555]` | No direct mobile equivalent |
| `--green: #2ecc71` | Success | `text-[#2ecc71]` | No mobile equivalent (success not themed) |
| `--amber: #f0a500` | Warning | `text-[#f0a500]` | No mobile equivalent |

### 4.2 Component Mapping Details

**`.topbar` → `TournamentTopBar`**
- Sticky positioning: `sticky top-0 z-10`
- Border bottom: `border-b border-[#2e2e2e]`
- Back button: `absolute left-4` with `←` character → Replace with `lucide-react` `ArrowLeft` icon
- Title: `text-base font-semibold`

**`.tournament-card` → `TournamentCard`**
- Border radius: `rounded-2xl` (16px)
- Background: `bg-[#1a1a1a]`
- Active state: `active:scale-[0.98]` transition
- Image height: `h-[190px]`
- Uses existing `Badge` component with custom variants

**`.badge` → `StatusBadge`**
- Base: `rounded-full px-2.5 py-1 text-[11px] font-semibold`
- Variants: default (glass), green (success), red-b (destructive), blue (info)
- Glass effect: `bg-black/65 backdrop-blur-sm border border-white/15`

**`.countdown-card` → `CountdownTimer`**
- Accepts `targetDate: Date` prop
- Uses `useEffect` with `setInterval(1000)` for live countdown
- Boxes: `bg-[#222222] rounded-[10px]` with `text-[#e8352a]` numbers
- Client component only (no SSR for countdown)

**`.collapsible` → `CollapsibleSection`**
- Uses existing `Collapsible` from shadcn/ui
- Chevron: `lucide-react` `ChevronDown` / `ChevronUp`
- Toggle state managed via `useState`

**`.steps-bar` → `StepsIndicator`**
- Accepts `currentStep: number` and `steps: string[]` props
- Step circle: `w-[38px] h-[38px] rounded-full`
- Active: `bg-[#e8352a] border-[#e8352a] text-white`
- Completed: `border-[#e8352a] text-[#e8352a]` with checkmark
- Inactive: `bg-[#222222] border-[#2e2e2e] text-[#888888]`

**`.player-row` → `PlayerRosterInput`**
- Accepts `index: number`, `value: string`, `onChange` props
- Number circle: `w-8 h-8 rounded-full bg-[#e8352a]` with white number
- Input: same as `FormInput` with `.filled` class toggle

**`.form-input` → Integration with existing `Input`**
- Right-aligned: `text-right` (RTL form layout)
- Focus ring: `focus:border-[#e8352a]`
- Background: `bg-[#1a1a1a]`
- Border: `border-[1.5px] border-[#2e2e2e]`

---

## 5. Folder Structure

### 5.1 New Files to Create

```
app/tournaments/
├── page.tsx                              ← Tournament List page
├── [id]/
│   ├── page.tsx                          ← Tournament Detail page
│   └── register/
│       └── page.tsx                      ← Registration Wizard page

components/tournaments/
├── tournament-top-bar.tsx                ← Sticky top bar with back button
├── tournament-hero.tsx                   ← Hero image section with overlay
├── tournament-card.tsx                   ← Card for tournament list
├── status-badge.tsx                      ← Status/type badge component
├── info-row.tsx                          ← Label-value row component
├── section-card.tsx                      ← Card with header section
├── countdown-timer.tsx                   ← Live countdown component
├── collapsible-section.tsx               ← Expandable section
├── filter-tabs.tsx                       ← Horizontal filter tab bar
├── steps-indicator.tsx                   ← Registration step progress
├── player-roster-input.tsx               ← Numbered player input row
├── warning-banner.tsx                    ← Amber warning bar
├── dual-button-row.tsx                   ← Two-button navigation row
├── success-confirmation.tsx              ← Success state display
└── hero-title.tsx                        ← Large hero title text

lib/client/hooks/
├── use-tournament.ts                     ← Tournament data fetching hook
├── use-tournament-list.ts                ← Tournament list with filters
├── use-countdown.ts                      ← Countdown timer logic
└── use-registration-wizard.ts            ← Multi-step form state

lib/client/
└── api.ts                                ← ADD tournament API functions

types/
└── index.ts                              ← ADD tournament types

app/api/tournaments/
├── route.ts                              ← GET /api/tournaments (list)
├── [id]/
│   ├── route.ts                          ← GET /api/tournaments/[id] (detail)
│   ├── fixtures/route.ts                 ← GET fixtures
│   ├── standings/route.ts                ← GET standings
│   ├── groups/route.ts                   ← GET groups
│   ├── matches/route.ts                  ← GET matches
│   ├── join/route.ts                     ← POST join
│   └── leave/route.ts                    ← POST leave
```

### 5.2 Existing Files to Modify

| File | Modification | Reason |
|------|-------------|--------|
| `app/tournaments/page.tsx` | Replace placeholder with Tournament List | Current: "Coming Soon" |
| `middleware.ts` | Add `/tournaments` to protected routes | Currently unprotected |
| `lib/client/api.ts` | Add tournament API functions | No tournament functions exist |
| `types/index.ts` | Add tournament type definitions | No tournament types exist |
| `components/bottom-nav.tsx` | Verify Tournaments tab links correctly | May need route update |

---

## 6. Routing Strategy

### 6.1 Route Definitions

| Route | Screen | Component | Auth | Layout |
|-------|--------|-----------|------|--------|
| `/tournaments` | s1 | `TournamentListPage` | Yes | Default (BottomNav) |
| `/tournaments/[id]` | s2 | `TournamentDetailPage` | Yes | Default (BottomNav) |
| `/tournaments/[id]/register` | s4→s5→s7 | `RegistrationWizardPage` | Yes | Default (BottomNav) |

### 6.2 Route Parameters

| Route | Param | Type | Source |
|-------|-------|------|--------|
| `/tournaments/[id]` | `id` | `string` | Tournament document ID |
| `/tournaments/[id]/register` | `id` | `string` | Tournament document ID |

### 6.3 Navigation Flow

```
/tournaments (list)
  → click card → /tournaments/[id] (detail)
    → click "Register Team" → /tournaments/[id]/register (wizard)
      → Step 1: Team Info → Step 2: Players → Step 3: Confirm → Success
        → "Back to Leagues" → /tournaments (list)
    → click back → /tournaments (list)
```

### 6.4 URL Strategy

- Tournament list: `/tournaments` (no query params for filters — filters are client-side)
- Tournament detail: `/tournaments/{tournamentId}` (direct linkable)
- Registration: `/tournaments/{tournamentId}/register` (direct linkable, but auth-gated)

---

## 7. API Mapping

### 7.1 Screen → API Endpoint Mapping

| Screen | Data Required | API Endpoint | Method | Auth |
|--------|--------------|-------------|--------|------|
| s1: Tournament List | All public tournaments | `GET /api/tournaments` | GET | No |
| s1: Filter (Upcoming) | Tournaments by status | `GET /api/tournaments?status=registration` | GET | No |
| s1: Filter (Ongoing) | Tournaments by status | `GET /api/tournaments?status=ongoing` | GET | No |
| s1: Filter (Past) | Tournaments by status | `GET /api/tournaments?status=completed` | GET | No |
| s2: Tournament Detail | Single tournament | `GET /api/tournaments?id={id}` | GET | No |
| s2: Registered Teams | Embedded in tournament | Same as above (teams[] array) | — | — |
| s2: Countdown | Derived from `startDate` | Client-side computation | — | — |
| s4/s5: Registration | Tournament config | Same as detail | — | — |
| s7: Success | Post-join confirmation | Response from join API | — | — |

### 7.2 User Action → API Endpoint Mapping

| User Action | API Endpoint | Method | Request Body | Response |
|-------------|-------------|--------|-------------|----------|
| Browse tournaments | `GET /api/tournaments` | GET | — | `Tournament[]` |
| Filter by status | `GET /api/tournaments?status=X` | GET | — | `Tournament[]` |
| View tournament detail | `GET /api/tournaments?id={id}` | GET | — | `Tournament` |
| View fixtures | `GET /api/tournaments/[id]/fixtures` | GET | — | `TournamentFixture[]` |
| View standings | `GET /api/tournaments/[id]/standings` | GET | — | `TournamentStanding[]` |
| View groups | `GET /api/tournaments/[id]/groups` | GET | — | `TournamentGroup[]` |
| View matches | `GET /api/tournaments/[id]/matches` | GET | — | `Match[]` |
| Join tournament | `POST /api/tournaments/[id]/join` | POST | `{ teamId }` | `{ success, tournament }` |
| Leave tournament | `POST /api/tournaments/[id]/leave` | POST | `{ teamId }` | `{ success }` |
| My tournaments | `GET /api/tournaments/my` | GET | — | `Tournament[]` |

### 7.3 Registration Flow → Backend Service Mapping

| Step | Frontend Action | Backend Service | Event Emitted |
|------|----------------|----------------|---------------|
| Step 1: Enter team info | Form state (local) | None (client-side only) | — |
| Step 2: Enter players | Form state (local) | None (client-side only) | — |
| Step 3: Confirm | Submit to API | `POST /api/tournaments/[id]/join` | `TournamentJoined` |
| Success | Display confirmation | NotificationEngine processes event | Notification created |

**Critical architectural insight**: The HTML's registration wizard collects team name, captain name, and 15 player names. However, the existing backend API (`POST /api/tournaments/[id]/join`) only accepts `{ teamId }`. The player roster data must be handled by one of two approaches:

1. **Architecture-aligned approach**: The registration wizard is UI-only. The user's team is already created with a roster via the Teams module. The "Register Team" button sends `{ teamId }` to the existing join API. The player roster display in the wizard is read-only (showing existing team members), not editable.

2. **HTML-faithful approach**: The registration wizard allows editing the roster. This data is sent as part of the join request. This requires extending the API endpoint.

**Recommendation**: Approach 1 is architecture-aligned. The HTML's player input fields represent the team roster that already exists. The wizard displays (not edits) the team's players. The "Confirm Registration" button sends `{ teamId }` to the existing API.

---

## 8. Backend Service Reuse

### 8.1 Engines Consumed

| Engine | How Consumed | Mobile App Role |
|--------|-------------|-----------------|
| **TournamentEngine** | Indirectly via API routes | Consumer — reads engine output (fixtures, standings, brackets) |
| **NotificationEngine** | Indirectly via notifications API | Consumer — displays notifications created by engine |
| **StatisticsEngine** | Indirectly via statistics API | Consumer — displays stats computed by engine |
| **LeaderboardEngine** | Indirectly via leaderboard API | Consumer — displays rankings computed by engine |
| **MatchEngine** | Indirectly via matches API | Consumer — displays matches created/managed by engine |
| **RatingEngine** | Indirectly via statistics API | Consumer — displays ratings computed by engine |
| **RewardsEngine** | Indirectly via rewards API | Consumer — displays rewards granted by engine |
| **MatchmakingEngine** | Indirectly via matchmaking API | Consumer — joins/leaves queue managed by engine |

### 8.2 Services Reused

| Service | Location | Mobile App Consumption |
|---------|----------|----------------------|
| TournamentService | Admin Dashboard | Via `GET /api/tournaments` and sub-endpoints |
| NotificationService | Admin Dashboard | Via `GET /api/notifications` and `PATCH mark-read` |
| AuditLogService | Admin Dashboard | Via API routes (mobile writes trigger audit) |
| MatchService | Admin Dashboard | Via `GET /api/matches` endpoints |
| TeamService | Admin Dashboard | Via `GET /api/teams` endpoints |

### 8.3 Event Flow (Mobile App as Consumer)

```
Admin Dashboard creates/updates tournament
  → TournamentEngine processes
    → EventBus emits TournamentStarted / TournamentCompleted / etc.
      → NotificationEventHandler creates notifications
        → Mobile App reads notifications via API
          → Displays in notification list

User joins tournament (via mobile app)
  → Mobile API route calls join endpoint
    → TournamentEngine.addTeam()
      → EventBus emits TournamentJoined
        → NotificationEventHandler creates tournament_invite notification
          → Other team members see notification
```

---

## 9. UI State Management

### 9.1 State Architecture

| State Type | Management | Location |
|------------|-----------|----------|
| **Server data** (tournaments, fixtures, standings) | Server Components + fetch | `page.tsx` (server) |
| **URL state** (current tournament ID, filters) | Next.js router | URL params + query |
| **UI state** (active tab, expanded sections, step) | `useState` | Component level |
| **Form state** (team name, captain, players) | `useState` or `react-hook-form` | Wizard component |
| **Auth state** (current user, team) | `AuthContext` | Global context |
| **Loading state** (pending requests) | `useState` + `useTransition` | Component level |
| **Countdown state** (timer values) | `useState` + `useEffect` | Countdown component |

### 9.2 State Flow

```
Server Component (page.tsx)
  → Fetches tournament data via API
    → Passes data as props to Client Components
      → Client Components manage local UI state
        → User interactions trigger API calls
          → Revalidation via revalidatePath/revalidateTag
```

### 9.3 Form State (Registration Wizard)

The registration wizard is a multi-step form with local state:

```
Step 1 (Team Info):
  - teamName: string (from existing team, read-only)
  - captainName: string (from auth context, read-only)
  → Validation: both fields non-empty

Step 2 (Players):
  - players: string[] (15 slots, from existing team roster, read-only)
  - filledCount: computed (count of non-empty slots)
  → Validation: filledCount >= minPlayersPerTeam

Step 3 (Confirm):
  - summary: computed from Step 1 + Step 2
  → Action: POST /api/tournaments/[id]/join with { teamId }

Success:
  - Displays confirmation
  - Shows countdown to tournament start
  - Shows participating teams
```

---

## 10. Loading, Empty, Success, Error States

### 10.1 States Not in HTML (Engineering Additions)

| Screen | Loading | Empty | Error |
|--------|---------|-------|-------|
| Tournament List (s1) | Skeleton cards (3x) | "No tournaments found" with icon | "Failed to load tournaments" with retry |
| Tournament Detail (s2) | Skeleton detail hero + info rows | "Tournament not found" | "Failed to load tournament" with retry |
| Registration (s4/s5) | Button spinner on submit | N/A (pre-populated from team) | "Registration failed" with retry |
| Success (s7) | N/A | N/A | N/A |

### 10.2 Loading State Implementation

- **Tournament List**: 3 skeleton cards matching `.tournament-card` dimensions (190px image + title + meta)
- **Tournament Detail**: Skeleton hero (210px) + skeleton info rows (6x) + skeleton countdown
- **Registration Submit**: `Spinner` component (existing) inside button, button disabled during submission

### 10.3 Empty State Implementation

- **No tournaments**: `Empty` component (existing at `components/ui/empty.tsx`) with trophy icon, "No tournaments available", description text
- **No registered teams**: Empty state inside collapsible section

### 10.4 Error State Implementation

- **Fetch error**: Error message with `Retry` button that triggers re-fetch
- **Registration error**: Toast notification (existing `Sonner`) with error message and retry option
- **Network error**: Offline indicator (if applicable)

---

## 11. Responsive Behavior

### 11.1 HTML Responsive Design

The HTML uses a `max-width: 430px` phone container. This is a mobile-first design.

| Breakpoint | Behavior |
|-----------|----------|
| < 430px | Full width, standard mobile layout |
| 430px+ | Centered phone container (HTML only — React should be full-width) |
| Tablet/Desktop | Not designed — mobile-only application |

### 11.2 Mobile App Alignment

The existing mobile app uses:
- `useMobile()` hook (from `components/ui/use-mobile.tsx`) for responsive detection
- `BottomNav` component for navigation
- Mobile-first Tailwind utilities

The tournament pages should follow the same pattern:
- Full-width mobile layout (no max-width constraint)
- `BottomNav` integration
- Touch-friendly tap targets (minimum 44px)
- Safe area insets for notched devices

### 11.3 Specific Responsive Considerations

| Element | Mobile Behavior | Notes |
|---------|----------------|-------|
| Filter tabs | Horizontal scroll, hidden scrollbar | `overflow-x-auto scrollbar-hide` |
| Countdown boxes | Flex with `max-width: 72px` each | Scales down on small screens |
| Player roster (15 rows) | Scrollable list | May need virtualization on very small screens |
| Tournament cards | Full width with margin | Standard mobile card layout |
| Dual button row | Side by side, equal width | Stacks on very narrow screens? HTML doesn't show this |

---

## 12. Accessibility Considerations

### 12.1 Current HTML Accessibility Gaps

| Issue | Location | Impact |
|-------|----------|--------|
| No `aria-label` on buttons | `.back`, `.register-btn`, `.tab` | Screen readers cannot identify button purpose |
| No `role` on filter tabs | `.tab` | Tabs not recognized as tablist/tab |
| No `aria-expanded` on collapsible | `.collapsible` | Screen readers don't know expansion state |
| No `aria-live` on countdown | `.countdown-card` | Countdown changes not announced |
| No form labels associated with inputs | `.form-label` + `.form-input` | Inputs not labeled for screen readers |
| No `aria-current` on active tab | `.tab.active` | Active tab not identified |
| No keyboard navigation for cards | `.tournament-card onclick` | Cards not focusable/activatable via keyboard |
| Emoji used as icons | Card images, badges | Not accessible to screen readers |
| Color-only status indicators | Badge colors | Color-blind users cannot distinguish statuses |

### 12.2 Accessibility Fixes for React Implementation

| Fix | Implementation |
|-----|---------------|
| Button labels | `aria-label="Go back"`, `aria-label="Register team"` |
| Tab semantics | `role="tablist"`, `role="tab"`, `aria-selected` |
| Collapsible | `aria-expanded`, `aria-controls` |
| Countdown | `aria-live="polite"` on countdown container |
| Form labels | `<label htmlFor="teamName">` linked to input `id` |
| Card interaction | `role="button"`, `tabIndex={0}`, `onKeyDown` handler |
| Status badges | Include text alongside color: `aria-label="Status: Upcoming"` |
| Icon alternatives | Replace emoji with `lucide-react` icons with `aria-hidden` |

---

## 13. Performance Optimizations

### 13.1 Data Fetching Performance

| Optimization | Implementation |
|-------------|---------------|
| Server Components | Tournament list and detail pages render on server, reducing client JS |
| Parallel fetching | Tournament detail + fixtures + standings fetched in `Promise.all` |
| Streaming | Use `loading.tsx` for instant navigation feedback |
| ISR/Revalidation | `revalidateTag('tournaments')` after mutations |
| Pagination | Tournament list supports `?limit=` and `?offset=` (API exists) |

### 13.2 Client-Side Performance

| Optimization | Implementation |
|-------------|---------------|
| Countdown `useEffect` cleanup | `clearInterval` on unmount to prevent memory leaks |
| Filter tabs `useMemo` | Filtered tournament list memoized to prevent re-render on unrelated state changes |
| Player roster `useCallback` | Input change handlers memoized |
| Image lazy loading | `loading="lazy"` on tournament card images |
| Skeleton loading | Instant skeleton display while data loads |
| Debounced search | If search is added, debounce input |

### 13.3 Bundle Performance

| Optimization | Implementation |
|-------------|---------------|
| Dynamic imports | `CountdownTimer` dynamically imported (client-only) |
| Code splitting | Each tournament page is a separate chunk |
| Tree shaking | Only import used `lucide-react` icons |
| CSS extraction | Tailwind purges unused classes |

---

## 14. Caching Strategy

### 14.1 Data Caching

| Data | Cache Duration | Invalidation |
|------|---------------|-------------|
| Tournament list | 30 seconds (SWR) | On mutation (join/leave) |
| Tournament detail | 30 seconds (SWR) | On mutation |
| Fixtures | 60 seconds (longer, less volatile) | On tournament state change |
| Standings | 30 seconds (computed on-the-fly) | On match completion |
| User's team | 60 seconds (rarely changes) | On team update |
| Notifications | 15 seconds (real-time sensitive) | On mark-read |

### 14.2 Client-Side Caching

| Cache | Mechanism | Duration |
|-------|-----------|----------|
| Tournament list | React state + SWR | Session |
| Form state (wizard) | `useState` (lost on navigation) | Per session |
| Auth token | httpOnly cookie | 14 days |
| Filter preference | `localStorage` (optional) | Persistent |

### 14.3 Cache Invalidation Flow

```
User joins tournament
  → POST /api/tournaments/[id]/join
    → API route calls join endpoint
      → Success response
        → Client calls revalidateTag('tournaments')
          → Next.js revalidates cached tournament data
            → UI reflects updated team count
```

---

## 15. Data Fetching Strategy

### 15.1 Server vs Client Fetching

| Page | Strategy | Reason |
|------|----------|--------|
| Tournament List | Server Component fetch | SEO, fast initial render, no auth needed for public list |
| Tournament Detail | Server Component fetch + Client hydration | SEO for detail, client needed for countdown + collapsible |
| Registration Wizard | Client-side only | Auth required, multi-step form, interactive |

### 15.2 Fetching Patterns

**Tournament List (Server Component)**:
```
Server: fetch tournaments from API
  → Render tournament cards
    → Client: hydration enables filter tabs, card clicks
```

**Tournament Detail (Hybrid)**:
```
Server: fetch tournament + fixtures + standings
  → Render hero, info, countdown
    → Client: hydration enables countdown timer, collapsible, register button
```

**Registration Wizard (Client Component)**:
```
Client: fetch tournament config (for min/max players, fee)
  → Client: fetch user's team (for team name, captain, roster)
    → Client: multi-step form with local state
      → Client: POST join on confirmation
```

---

## 16. Authentication and Authorization Integration

### 16.1 Auth Flow per Screen

| Screen | Auth Required | Auth Check Location | User Role |
|--------|--------------|-------------------:|-----------|
| Tournament List | Optional (for join) | Server Component | Any authenticated user |
| Tournament Detail | Optional (for register) | Server Component | Any authenticated user |
| Registration Wizard | Required | Middleware + API route | Captain with team |
| Success | Required | Already authenticated | Captain |

### 16.2 Authorization Rules

| Action | Authorization | Enforcement |
|--------|--------------|-------------|
| View tournament list | Any visitor | No auth required |
| View tournament detail | Any visitor | No auth required |
| Click "Register Team" | Must be authenticated | Redirect to login if not |
| Submit registration | Must be captain with team | API route verifies `isTeamCaptain` and `teamId` |
| Leave tournament | Must be captain of registered team | API route verifies ownership |

### 16.3 Middleware Updates Required

Current middleware protects: `/home`, `/team`, `/matches`, `/squad`, `/settings`

Required addition:
- `/tournaments` — Protect tournament routes (list can be public, but register must be auth-gated)
- `/tournaments/[id]` — Detail can be public, but register button requires auth
- `/tournaments/[id]/register` — Must be auth-protected

**Middleware modification**: Add `/tournaments` to the protected routes list. The list and detail pages can optionally check auth client-side to show/hide the register button.

---

## 17. HTML → Production-Quality Conversion

### 17.1 Conversion Principles

| HTML Pattern | React Conversion | Maintain Visual Fidelity |
|-------------|-----------------|------------------------|
| `<div class="phone">` | Remove — mobile app is full-width | N/A (container is HTML-only) |
| `onclick="showScreen('s2')"` | `<Link href={`/tournaments/${id}`}>` | Navigation via Next.js router |
| `onclick="filterCards('all',this)"` | `useState` + filtered list rendering | Same visual behavior |
| `onclick="toggleTeams()"` | `Collapsible` component with state | Same expand/collapse |
| `<input oninput="checkStep1()">` | Controlled input with `useState` | Same validation behavior |
| `setInterval(tick, 1000)` | `useEffect` with `setInterval` + cleanup | Same countdown behavior |
| Hardcoded CSS variables | Tailwind utility classes | Same colors, spacing, typography |
| Emoji placeholders | `lucide-react` icons or `next/image` | Better accessibility, same visual weight |
| Static HTML content | Dynamic data from API | Same layout, real data |

### 17.2 Visual Fidelity Preservation

Every visual detail from the HTML must be preserved:

| Detail | Value | Tailwind Class |
|--------|-------|---------------|
| Card border radius | 16px | `rounded-2xl` |
| Card image height | 190px | `h-[190px]` |
| Badge border radius | 50px | `rounded-full` |
| Badge padding | 4px 10px | `px-2.5 py-1` |
| Info row padding | 12px 16px | `px-4 py-3` |
| Countdown box border radius | 10px | `rounded-[10px]` |
| Countdown number font size | 24px | `text-2xl` |
| Register button border radius | 14px | `rounded-[14px]` |
| Register button shadow | `0 4px 20px rgba(232,53,42,0.25)` | `shadow-[0_4px_20px_rgba(232,53,42,0.25)]` |
| Form input border radius | 12px | `rounded-xl` |
| Player number circle | 32px | `w-8 h-8` |
| Progress bar height | 4px | `h-1` |
| Step circle | 38px | `w-[38px] h-[38px]` |

### 17.3 Color Mapping (HTML → Mobile App Theme)

| HTML Color | Used For | Mobile App Mapping |
|-----------|----------|-------------------|
| `#0a0a0a` (bg) | Page background | Use `--background: #121212` OR override with `bg-[#0a0a0a]` |
| `#1a1a1a` (surface) | Card background | Use `--card: #1E1E1E` OR override with `bg-[#1a1a1a]` |
| `#222222` (surface2) | Secondary surfaces | Use `bg-[#222222]` |
| `#2e2e2e` (border) | Borders | Use `--border: #2C2C2C` OR override with `border-[#2e2e2e]` |
| `#e8352a` (red) | Primary accent | Use `--primary: #FF3B3F` OR override with `bg-[#e8352a]` |
| `#888888` (text-muted) | Secondary text | Use `--muted-foreground: #A0A0A0` OR override |
| `#555555` (text-dim) | Placeholder text | Use `text-[#555555]` |
| `#2ecc71` (green) | Success badges | Use `text-emerald-500` or `text-[#2ecc71]` |
| `#f0a500` (amber) | Warning | Use `text-amber-500` or `text-[#f0a500]` |

**Decision required**: The HTML uses slightly different colors than the mobile app's existing theme. Two approaches:

1. **Override approach**: Use exact HTML colors via arbitrary Tailwind values (`bg-[#0a0a0a]`). Preserves HTML fidelity exactly.
2. **Theme-aligned approach**: Map HTML colors to nearest mobile app theme tokens. Maintains cross-module consistency.

**Recommendation**: Use the override approach for tournament pages to preserve 100% visual fidelity with the HTML design. The mobile app's theme can be updated globally later if needed.

---

## 18. Architecture Conflict Analysis

### 18.1 Conflicts Identified

| # | Conflict | Severity | Resolution |
|---|---------|----------|-----------|
| 1 | HTML background `#0a0a0a` differs from mobile app `#121212` | Low | Use HTML color via arbitrary Tailwind value. No architecture change. |
| 2 | HTML red `#e8352a` differs from mobile app `#FF3B3F` | Low | Use HTML color via arbitrary Tailwind value. No architecture change. |
| 3 | HTML surface `#1a1a1a` differs from mobile app `#1E1E1E` | Low | Use HTML color via arbitrary Tailwind value. No architecture change. |
| 4 | HTML registration wizard collects player roster, but API only accepts `{ teamId }` | High | See Resolution 4 below. |
| 5 | HTML shows editable team name/captain in registration, but these exist on the team | Medium | See Resolution 5 below. |
| 6 | HTML has no bottom navigation bar | Low | Add existing `BottomNav` component. HTML is visual reference only. |
| 7 | HTML has no loading/empty/error states | Medium | Add engineering states not in HTML. HTML is visual reference only. |
| 8 | HTML uses emoji as icons | Low | Replace with `lucide-react` icons. HTML is visual reference only. |
| 9 | HTML has screens s3 and s6 missing | Medium | Fill gaps with engineering decisions. HTML is visual reference only. |
| 10 | HTML filter tabs use client-side filtering, but API supports `?status=` | Low | Use API filtering for initial load, client-side for tab switching. |

### 18.2 Resolution Details

**Resolution 4 (Registration Data Model)**:
The HTML's Step 2 (player roster) suggests an editable form for 15 players. However:
- The Architecture Baseline states: "Team creation and management — Create team, invite players, manage roster" is a Mobile Application responsibility
- Teams already have a roster in the `teams` collection
- The existing join API accepts `{ teamId }` only

**Solution**: The registration wizard displays the existing team roster (read-only). The player inputs show pre-populated names from the user's team. The "Confirm Registration" button sends `{ teamId }` to the existing API. The HTML's editable player fields become read-only displays of existing team members.

**Resolution 5 (Team Name/Captain)**:
Similarly, team name and captain name are properties of the existing team. The wizard displays them (read-only) as confirmation, not as editable fields.

**Resolution 6 (Bottom Navigation)**:
The HTML is a standalone visual reference. The mobile app wraps all pages with `BottomNav`. This is an engineering addition, not an architecture change.

**Resolution 7 (Missing States)**:
The HTML shows only the happy path. Loading, empty, and error states are engineering requirements not present in the visual reference. These are added without changing the architecture or visual design.

---

## 19. Implementation Roadmap

### Phase 1: Foundation (Files + Types + API Layer)

**Objective**: Create the file structure, type definitions, and API functions that all subsequent phases depend on.

**Duration estimate**: 1 session

**Tasks**:
1. Create tournament type definitions in `types/index.ts`
2. Create tournament API functions in `lib/client/api.ts`
3. Create API routes: `app/api/tournaments/route.ts`, `app/api/tournaments/[id]/route.ts`
4. Create sub-resource API routes: fixtures, standings, groups, matches
5. Create join/leave API routes
6. Update `middleware.ts` to protect `/tournaments` routes
7. Create `components/tournaments/` directory structure

**Files created**: ~12 new files
**Files modified**: 3 (`types/index.ts`, `lib/client/api.ts`, `middleware.ts`)

### Phase 2: Core UI Components

**Objective**: Build all reusable tournament UI components from the HTML design.

**Duration estimate**: 1-2 sessions

**Tasks**:
1. `TournamentTopBar` — sticky header with back button
2. `TournamentCard` — card with image, badges, title, meta
3. `StatusBadge` — type and status badges
4. `InfoRow` — label-value row
5. `SectionCard` — card with header
6. `CountdownTimer` — live countdown
7. `CollapsibleSection` — expandable section
8. `FilterTabs` — horizontal filter tabs
9. `HeroTitle` — large hero text
10. `TournamentHeroSection` — hero image with overlay

**Files created**: ~10 component files

### Phase 3: Tournament List Page

**Objective**: Implement Screen s1 — the tournament list with filtering.

**Duration estimate**: 1 session

**Tasks**:
1. Create `app/tournaments/page.tsx` (Server Component)
2. Fetch tournaments from API
3. Render tournament cards with real data
4. Integrate `FilterTabs` with client-side filtering
5. Add loading skeleton
6. Add empty state
7. Add error boundary
8. Integrate `BottomNav`
9. Handle card click → navigation to detail

**Files created**: 1 page file, 1 loading file

### Phase 4: Tournament Detail Page

**Objective**: Implement Screen s2 — the tournament detail with info, countdown, teams, and register button.

**Duration estimate**: 1 session

**Tasks**:
1. Create `app/tournaments/[id]/page.tsx` (Server Component)
2. Fetch tournament + fixtures + standings
3. Render hero section with image and badges
4. Render tournament info card
5. Render countdown timer (client-side)
6. Render collapsible registered teams
7. Render register button (conditional on auth + team)
8. Add loading skeleton
9. Add error/empty states
10. Handle register button → navigation to wizard

**Files created**: 1 page file, 1 loading file

### Phase 5: Registration Wizard

**Objective**: Implement Screens s4, s5, s7 — the multi-step registration flow.

**Duration estimate**: 1-2 sessions

**Tasks**:
1. Create `app/tournaments/[id]/register/page.tsx` (Client Component)
2. Create `StepsIndicator` component
3. Implement Step 1: Team Info (read-only display)
4. Implement Step 2: Player Roster (read-only display)
5. Implement Step 3: Confirmation summary
6. Implement Success screen
7. Create `useRegistrationWizard` hook for step management
8. Integrate join API call on confirmation
9. Handle success → navigation back to list
10. Handle errors → toast notification + retry

**Files created**: 1 page file, 1 hook file, ~3 component files

### Phase 6: Polish and Integration

**Objective**: Final integration, edge cases, and cross-cutting concerns.

**Duration estimate**: 1 session

**Tasks**:
1. Verify all routes work with middleware protection
2. Test registration flow end-to-end
3. Verify countdown accuracy
4. Test filter tab behavior
5. Verify responsive behavior on various screen sizes
6. Add accessibility attributes (aria-labels, roles, etc.)
7. Performance audit (no unnecessary re-renders)
8. Verify auth flow (unauthenticated → login → redirect back)
9. Test edge cases (tournament full, registration closed, already registered)
10. Final visual comparison with HTML

---

## 20. New Files Summary

| File Path | Type | Phase |
|-----------|------|-------|
| `app/tournaments/page.tsx` | Page | 3 |
| `app/tournaments/loading.tsx` | Loading | 3 |
| `app/tournaments/[id]/page.tsx` | Page | 4 |
| `app/tournaments/[id]/loading.tsx` | Loading | 4 |
| `app/tournaments/[id]/register/page.tsx` | Page | 5 |
| `components/tournaments/tournament-top-bar.tsx` | Component | 2 |
| `components/tournaments/tournament-hero.tsx` | Component | 2 |
| `components/tournaments/tournament-card.tsx` | Component | 2 |
| `components/tournaments/status-badge.tsx` | Component | 2 |
| `components/tournaments/info-row.tsx` | Component | 2 |
| `components/tournaments/section-card.tsx` | Component | 2 |
| `components/tournaments/countdown-timer.tsx` | Component | 2 |
| `components/tournaments/collapsible-section.tsx` | Component | 2 |
| `components/tournaments/filter-tabs.tsx` | Component | 2 |
| `components/tournaments/steps-indicator.tsx` | Component | 5 |
| `components/tournaments/player-roster-input.tsx` | Component | 5 |
| `components/tournaments/warning-banner.tsx` | Component | 5 |
| `components/tournaments/dual-button-row.tsx` | Component | 5 |
| `components/tournaments/success-confirmation.tsx` | Component | 5 |
| `components/tournaments/hero-title.tsx` | Component | 2 |
| `lib/client/hooks/use-countdown.ts` | Hook | 2 |
| `lib/client/hooks/use-registration-wizard.ts` | Hook | 5 |
| `lib/client/hooks/use-tournament.ts` | Hook | 3 |
| `lib/client/hooks/use-tournament-list.ts` | Hook | 3 |
| `app/api/tournaments/route.ts` | API Route | 1 |
| `app/api/tournaments/[id]/route.ts` | API Route | 1 |
| `app/api/tournaments/[id]/fixtures/route.ts` | API Route | 1 |
| `app/api/tournaments/[id]/standings/route.ts` | API Route | 1 |
| `app/api/tournaments/[id]/groups/route.ts` | API Route | 1 |
| `app/api/tournaments/[id]/matches/route.ts` | API Route | 1 |
| `app/api/tournaments/[id]/join/route.ts` | API Route | 1 |
| `app/api/tournaments/[id]/leave/route.ts` | API Route | 1 |

**Total new files**: ~32

---

## 21. Existing Files Summary

| File Path | Modification | Phase |
|-----------|-------------|-------|
| `app/tournaments/page.tsx` | Replace "Coming Soon" placeholder | 3 |
| `middleware.ts` | Add `/tournaments` to protected routes | 1 |
| `lib/client/api.ts` | Add tournament API functions (~8 functions) | 1 |
| `types/index.ts` | Add tournament type definitions (~10 types) | 1 |
| `components/bottom-nav.tsx` | Verify Tournaments tab route | 3 |

**Total modified files**: 5

---

## 22. Module Dependencies

```
Tournament Module
  ├── depends on → Auth Module (for user identity, team membership)
  ├── depends on → Teams Module (for team data, roster)
  ├── depends on → Matches Module (for tournament matches)
  ├── depends on → Notifications Module (for tournament notifications)
  ├── provides to → Statistics Module (tournament stats data)
  ├── provides to → Leaderboard Module (tournament rankings)
  └── provides to → Rewards Module (tournament achievements)
```

**Implementation order dependency**: Tournament module requires Auth (Phase 1 of roadmap) and Teams (already exists) to be functional. Tournament module should be implemented AFTER Auth and Teams are verified working.

---

## 23. Risk Assessment

| # | Risk | Probability | Impact | Mitigation |
|---|------|------------|--------|-----------|
| 1 | API endpoints don't return data in expected format | Medium | High | Verify API responses match type definitions before UI implementation |
| 2 | Tournament data model mismatch (teams[] embedded vs separate collection) | Low | High | Architecture Baseline defines the model; follow it exactly |
| 3 | Registration flow complexity (3-step wizard) | Medium | Medium | Break into phases; test each step independently |
| 4 | Countdown timer SSR issues | Low | Low | Use `dynamic` import with `ssr: false` for countdown component |
| 5 | Filter tab performance with many tournaments | Low | Low | Client-side filtering is fast; pagination exists in API |
| 6 | Auth redirect loop on registration page | Low | Medium | Test auth flow thoroughly; ensure redirect preserves return URL |
| 7 | Color theme conflict between HTML and mobile app | Low | Low | Use arbitrary Tailwind values for exact HTML colors |
| 8 | Missing screens s3 and s6 | Medium | Low | Engineering gap-fill; not blocking |
| 9 | Player roster display vs edit confusion | Medium | Medium | Clarify with user: read-only (architecture-aligned) vs editable (requires API extension) |
| 10 | Mobile app `firebase-admin` version mismatch with Admin Dashboard | Low | High | Verify version compatibility before deployment |

---

## 24. Critical Clarification Required

Before implementation begins, the following question must be answered:

**Registration Wizard Player Roster: Edit or Display?**

The HTML shows 15 editable input fields for player names in Step 2. However:

- **Option A (Architecture-Aligned)**: The player inputs display the existing team roster (read-only). The user's team was already created via the Teams module. The registration wizard confirms the team and roster before joining. The API call is `{ teamId }`.

- **Option B (HTML-Faithful)**: The player inputs are editable. The user can modify the roster during registration. This requires extending the join API to accept player data and creating/updating team members. This introduces new business logic not in the Admin Dashboard.

**Option A is recommended** because it aligns with the Architecture Baseline and reuses existing team management. Option B would require new API endpoints, new Firestore operations, and potentially new engines — violating the "never duplicate business logic" rule.

---

> **End of Tournament HTML → Architecture Integration Report**
>
> This document is the pre-implementation engineering reference.
> No code has been written. No architecture has been changed.
> The HTML has been fully analyzed and mapped to the existing system.
