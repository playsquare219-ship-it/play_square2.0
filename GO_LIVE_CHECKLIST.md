# GO-LIVE CHECKLIST

**Date:** 2026-07-20
**Module:** Tournament Module
**Target:** Production Deployment

---

## Pre-Deployment

### Firebase Console

- [ ] Open Firebase Console → Project `play-square-d1e9b`
- [ ] Verify Firestore database exists and is in `nam5` (US) region
- [ ] Verify Authentication is enabled (Google provider at minimum)
- [ ] Navigate to Service Accounts tab
- [ ] Click "Generate new private key"
- [ ] Download the JSON file
- [ ] Store securely (never commit to git)

### Vercel Dashboard

- [ ] Open Vercel Dashboard → Project settings
- [ ] Navigate to Environment Variables

#### Required Environment Variables

| Variable | Where to Find | Status |
|----------|--------------|--------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Console → Project Settings → General → Web API Key | [ ] Set |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Console → Project Settings → General → Auth domain | [ ] Set |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `play-square-d1e9b` | [ ] Set |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Console → Project Settings → General → Storage bucket | [ ] Set |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Console → Project Settings → General → Messaging sender ID | [ ] Set |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase Console → Project Settings → General → App ID | [ ] Set |
| `FIREBASE_PROJECT_ID` | `play-square-d1e9b` | [ ] Set |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Paste entire service account JSON | [ ] Set |
| `JWT_SECRET` | Generate a strong random string (32+ chars) | [ ] Set |

---

## Deployment

### Step 1: Deploy Firestore Resources

```bash
firebase deploy --only firestore:rules
```

- [ ] Rules deployed successfully
- [ ] Verify in Firebase Console → Firestore → Rules tab

```bash
firebase deploy --only firestore:indexes
```

- [ ] Indexes deployment initiated
- [ ] Wait for all indexes to show "Enabled" in Firebase Console
- [ ] Verify 76 indexes total

### Step 2: Deploy Application

Option A (automatic): Push to `main` branch → Vercel auto-deploys
Option B (manual):
```bash
vercel --prod
```

- [ ] Deployment initiated
- [ ] Wait for build to complete
- [ ] No deployment errors in Vercel build log

---

## Post-Deployment Verification

### Authentication

- [ ] Open deployed URL
- [ ] Click "Sign in with Google"
- [ ] Complete Google OAuth flow
- [ ] Redirected to home page
- [ ] User avatar/name visible in header

### Tournament List (`/tournaments`)

- [ ] Page loads without errors
- [ ] Filter tabs visible (All, Upcoming, Live, Completed)
- [ ] Tournament cards display correctly
- [ ] Empty state shows if no tournaments
- [ ] Loading skeleton appears during load
- [ ] Back button in top bar works (44px touch target)
- [ ] Tap a tournament card → navigates to detail page

### Tournament Detail (`/tournaments/[id]`)

- [ ] Page loads with tournament info
- [ ] Hero section shows tournament name, type, status
- [ ] Info section shows start date, teams count, max teams
- [ ] Countdown timer works for upcoming tournaments
- [ ] Fixtures tab shows matches (if tournament started)
- [ ] Standings tab shows rankings (if tournament started)
- [ ] Groups tab shows group breakdown (if applicable)
- [ ] Register button shows correct state:
  - "Register" if not registered and registration open
  - "Registered ✓" if team is registered
  - Hidden if registration closed or tournament full

### Registration (`/tournaments/[id]/register`)

- [ ] Page loads for authenticated users
- [ ] 3-step wizard displays:
  1. Team Info (auto-filled from user's team)
  2. Player Roster (read-only, pre-populated)
  3. Confirm & Submit
- [ ] Submit sends POST to `/api/tournaments/[id]/join`
- [ ] Success redirects to tournament detail page
- [ ] Error state displays correctly
- [ ] Back button works at each step

### Leave Tournament

- [ ] Registered team sees "Leave" option
- [ ] POST to `/api/tournaments/[id]/leave` succeeds
- [ ] Tournament detail refreshes showing team is no longer registered
- [ ] Register button reappears

### API Response Verification

- [ ] `GET /api/tournaments` → `{ success: true, tournaments: [...] }`
- [ ] `GET /api/tournaments?id=xxx` → `{ success: true, tournament: {...} }`
- [ ] `GET /api/tournaments/my` → `{ success: true, tournaments: [...] }`
- [ ] `GET /api/tournaments/[id]/fixtures` → `{ success: true, fixtures: [...] }`
- [ ] `GET /api/tournaments/[id]/standings` → `{ success: true, standings: [...] }`
- [ ] `GET /api/tournaments/[id]/groups` → `{ success: true, groups: [...] }`
- [ ] `GET /api/tournaments/[id]/matches` → `{ success: true, matches: [...] }`
- [ ] `POST /api/tournaments/[id]/join` → `{ success: true }` or `{ success: false, error: "..." }`
- [ ] `POST /api/tournaments/[id]/leave` → `{ success: true }` or `{ success: false, error: "..." }`

### Cross-App Sync (Admin ↔ Mobile)

- [ ] Create tournament in Admin Dashboard → appears in Mobile list
- [ ] Register team in Mobile → team appears in Admin
- [ ] Generate fixtures in Admin → visible in Mobile fixtures tab
- [ ] Complete match in Admin → standings update in Mobile

### Error Handling

- [ ] 404 page shows for non-existent tournament
- [ ] Loading states show skeleton/spinner
- [ ] Error states show retry button
- [ ] Empty states show descriptive message
- [ ] Network errors handled gracefully

---

## Rollback Plan

If critical issues found post-deployment:

1. **Vercel:** Dashboard → Deployments → find previous working deployment → "Promote to Production"
2. **Firestore Rules:** `firebase deploy --only firestore:rules` (after reverting firestore.rules)
3. **Firestore Indexes:** Cannot rollback (only add/remove). If issue, remove offending index from JSON and redeploy.

---

## Sign-Off

| Item | Verified By | Date |
|------|------------|------|
| Firebase configuration | _____ | _____ |
| Environment variables set | _____ | _____ |
| Firestore rules deployed | _____ | _____ |
| Firestore indexes deployed | _____ | _____ |
| Application deployed | _____ | _____ |
| Authentication working | _____ | _____ |
| Tournament list working | _____ | _____ |
| Tournament detail working | _____ | _____ |
| Registration working | _____ | _____ |
| Cross-app sync verified | _____ | _____ |
| Error handling verified | _____ | _____ |
| **GO-LIVE APPROVED** | _____ | _____ |

---

*Checklist ready. Complete all items before approving go-live.*
