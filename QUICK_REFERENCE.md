# Dual Booking System - Quick Reference

## What Changed?

### Before
- Match creation saved directly to database
- No easy way to book stadium solo
- All bookings mixed together

### After
- Solo bookings redirect to unified `/bookings` page
- Team bookings can be confirmed from notifications
- Separate collections for organization
- Better user experience with auto-redirect

---

## Two Booking Flows

### Flow 1: Solo Stadium Booking
```
1. Go to /matches/create
2. Select stadium + date + time (NO team)
3. Click "Book Now"
4. Redirected to /bookings (auto-populated)
5. Confirm booking
6. ✅ Saved to Firebase + localStorage
7. Auto-redirect to /my-bookings
```

### Flow 2: Team Match Booking
```
1. Check notifications
2. Find "match_invite_accepted"
3. Click "تأكيد الحجز" (Confirm Booking)
4. Redirected to /bookings (auto-populated)
5. Confirm booking
6. ✅ Saved to Firebase (booking_matches) + localStorage
7. Auto-redirect to /my-bookings
```

---

## Files Changed

| File | What | Impact |
|------|------|--------|
| matches/create/page.tsx | Removed old flow, added redirect | Solo bookings now go to /bookings |
| notifications/page.tsx | Added "تأكيد الحجز" button | Team bookings can confirm from here |
| bookings/page.tsx | Dual flow support | Handles both solo and team bookings |
| my-bookings/page.tsx | Fetch both collections | Shows all bookings in one place |
| app/api/booking-matches/route.ts | NEW API endpoint | Manages team bookings in Firebase |

---

## Firebase Collections

### bookings (Solo Bookings)
```json
{
  "stadiumId": 123,
  "stadiumName": "Stadium A",
  "date": "2024-06-29",
  "time": "18:00",
  "wilaya": "Algiers",
  "commune": "Algiers",
  "createdAt": "2024-06-29T10:00:00Z",
  "status": "confirmed"
}
```

### booking_matches (Team Bookings)
```json
{
  "requestId": "req_123",
  "matchRequestId": "match_456",
  "teamId": "team_789",
  "stadiumName": "Stadium B",
  "date": "2024-06-29",
  "time": "19:00",
  "wilaya": "Algiers",
  "commune": "Algiers",
  "createdAt": "2024-06-29T11:00:00Z",
  "status": "confirmed",
  "isTeamBooking": true
}
```

---

## localStorage Keys

| Key | Purpose | Content |
|-----|---------|---------|
| ps_bookings | Backup solo bookings | Array of solo bookings |
| ps_team_bookings | Backup team bookings | Array of team bookings |

---

## URL Parameters

When redirecting to /bookings, these parameters can be passed:

### Solo Booking
```
/bookings?stadium=Stadium+A&wilaya=Algiers&commune=Algiers&date=2024-06-29&time=18:00
```

### Team Booking
```
/bookings?requestId=req_123&isTeamBooking=true
```

---

## API Endpoints

### Solo Bookings
```
POST /api/bookings - Create booking
GET /api/bookings/all - Fetch all bookings
GET /api/bookings?stadiumId=X&date=Y - Check availability
```

### Team Bookings
```
POST /api/booking-matches - Create team booking
GET /api/booking-matches?requestId=X - Fetch by request ID
GET /api/booking-matches?teamId=X - Fetch by team ID
```

---

## Testing

### Test Solo Booking
1. Go to /matches/create
2. Fill stadium, date, time (no team)
3. Click "Book Now"
4. Verify redirect to /bookings
5. Verify form auto-populated
6. Confirm booking
7. Verify success message
8. Check /my-bookings for new booking

### Test Team Booking
1. Go to /notifications
2. Find match_invite_accepted
3. Click "تأكيد الحجز"
4. Verify redirect to /bookings with requestId
5. Verify form auto-populated
6. Confirm booking
7. Verify success message
8. Check /my-bookings for new booking

### Verify My-Bookings
1. Go to /my-bookings
2. Verify both solo and team bookings shown
3. Verify sorted by date (newest first)
4. Verify correct booking count

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Booking not saved | Check Firebase console, verify network |
| Redirect not working | Check browser console for errors |
| Form not auto-populated | Check URL parameters are correct |
| Offline bookings not showing | Check localStorage ps_bookings key |
| Both collections showing duplicates | Deduplication may need refresh |

---

## Key Features

✅ Unified booking page for both flows
✅ Auto form population from URL
✅ 2-second redirect after confirmation
✅ Firebase + localStorage backup
✅ Smart deduplication
✅ Sorted by date (newest first)
✅ Error handling on all levels
✅ Works offline (with localStorage)

---

## Status

All features implemented and tested.
Ready for production deployment.

---

**Version**: 2.0.0
**Last Updated**: June 29, 2024
