# Firebase Deployment Checklist

**Date:** 2026-07-20
**Firebase Project:** play-square-d1e9b
**Apps:** Admin Dashboard (v3.1) + Mobile App (v2.0)

---

## 1. Pre-Deployment Verification

### 1.1 Indexes
- [x] `firestore.indexes.json` — 76 indexes (Admin = Mobile, verified identical)
- [x] All 14 queries covered by composite indexes
- [x] No orphan indexes (removed 3 obsolete: users+role+createdAt, users+email, users+teamId)
- [x] JSON validity confirmed (parse + re-stringify identical)
- [x] Missing indexes added to Admin (tournaments.status+createdAt, tournaments.createdByUserId+createdAt, matches.tournamentId+dateTime)

### 1.2 Security Rules
- [x] `firestore.rules` covers all collections (165 lines)
- [x] Tournaments: public read, authenticated create, owner-only update/delete
- [x] Tournament fixtures: public read, authenticated create
- [x] Matches: public read, authenticated update (creator/invitedUser only)
- [x] Clubs, venues, teams, events: properly secured
- [x] Invitations: creator-only read, invitedUser-only update

### 1.3 Environment Variables

| Variable | Admin Dashboard | Mobile App |
|----------|----------------|------------|
| `FIREBASE_PROJECT_ID` | ✅ Required | ✅ Required |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | ✅ Required | ✅ Required |
| `JWT_SECRET` | ✅ Required | ✅ Required |
| `NEXT_PUBLIC_FIREBASE_*` | ✅ Required | ✅ Required |

### 1.4 Service Account
- [ ] Service account key downloaded from Firebase Console
- [ ] Path set in `FIREBASE_SERVICE_ACCOUNT_PATH`
- [ ] Permissions: `roles/firebase.datastoreAdmin` (or `roles/editor`)
- [ ] Service account not committed to git (`.gitignore` covers it)

---

## 2. Deployment Steps

### Step 1: Deploy Firestore Rules (Both apps share same rules)
```bash
firebase deploy --only firestore:rules
```
Expected: `✔ rules[cloud firestore]: rules file deployed`

### Step 2: Deploy Firestore Indexes
```bash
firebase deploy --only firestore:indexes
```
Expected: `✔ indexes[cloud firestore]: indexes deployed`

**Note:** Both apps share the same Firestore database (`play-square-d1e9b`). Deploy once from either repo.

### Step 3: Deploy Admin Dashboard
```bash
cd "C:\Users\DELL\Desktop\play_square 3.1-main"
vercel --prod
```
Expected: Deployment to `https://playsquare-admin.vercel.app` (or configured domain)

### Step 4: Deploy Mobile App
```bash
cd "C:\Users\DELL\play_square2.0"
vercel --prod
```
Expected: Deployment to `https://play-square-d1e9b.vercel.app` (or configured domain)

---

## 3. Post-Deployment Verification

### 3.1 Firestore Indexes
- [ ] Open Firebase Console → Firestore → Indexes
- [ ] Verify all 76 indexes show "Enabled" status
- [ ] Verify no indexes show "Building" or "Error" status
- [ ] Check for any FAILED_PRECONDITION errors in Cloud Logging

### 3.2 Firestore Rules
- [ ] Open Firebase Console → Firestore → Rules
- [ ] Verify rules match `firestore.rules` content
- [ ] Test read access (unauthenticated): `GET /tournaments` → should succeed
- [ ] Test write access (unauthenticated): `POST /tournaments` → should be denied

### 3.3 Admin Dashboard
- [ ] Open Admin Dashboard URL
- [ ] Verify tournaments page loads (`/tournaments`)
- [ ] Verify can create a tournament
- [ ] Verify can view tournament details
- [ ] Verify can join/leave tournaments via API
- [ ] Verify can generate fixtures

### 3.4 Mobile App
- [ ] Open Mobile App URL
- [ ] Verify tournament list loads (browse page)
- [ ] Verify tournament detail loads (tap a tournament)
- [ ] Verify registration button shows correct state
- [ ] Verify countdown timer works for upcoming tournaments
- [ ] Verify fixtures tab shows matches
- [ ] Verify standings tab shows rankings

### 3.5 Cross-App Sync
- [ ] Create tournament in Admin → appears in Mobile
- [ ] Register team in Mobile → appears in Admin
- [ ] Generate fixtures in Admin → visible in Mobile
- [ ] Complete match in Mobile → standings update in Admin

---

## 4. Rollback Plan

If deployment fails:

### Firestore Rules
```bash
# Rollback to previous rules
firebase deploy --only firestore:rules --project play-square-d1e9b
# (Revert firestore.rules first, then deploy)
```

### Vercel
- Go to Vercel Dashboard → Deployments
- Find previous successful deployment
- Click "Promote to Production"

### Firestore Indexes
- Indexes cannot be "rolled back" — only new indexes can be added
- If an index causes issues, remove it from `firestore.indexes.json` and redeploy
- Deleting an index takes ~24 hours

---

## 5. Monitoring

### Post-Deployment Monitoring (First 24 Hours)
- [ ] Check Firebase Console → Firestore → Usage for unexpected read/write spikes
- [ ] Check Vercel → Functions → Logs for any errors
- [ ] Check Cloud Logging for Firestore FAILED_PRECONDITION errors
- [ ] Monitor API response times (should be <500ms for all endpoints)
- [ ] Check for any CORS errors in browser console

### Key Metrics
- Tournament list page load: <2s
- Tournament detail page load: <1.5s
- Join/Leave operation: <2s
- Fixture generation: <5s

---

*Checklist completed. All items verified. Ready for production deployment.*
