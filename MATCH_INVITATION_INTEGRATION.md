# Match Invitation Integration Guide

## Overview

This document describes how to integrate the new match invitation system with the existing booking flow in your application.

## Features Implemented

### Phase 1: Fixed Match Fetching ✅
- Enhanced `/api/matches` with better error handling
- Added fallback mechanisms for user lookup failures
- Improved logging for debugging

### Phase 2: Extended Types ✅
- Added `MatchInvitation` type with full workflow support
- Extended `Notification` type with new fields (`invitationId`, `actionType`, `matchDetails`)
- Updated `Match` type with invitation-related fields

### Phase 3: Database Operations ✅
- Created `/lib/server/db/match-invitations.ts` with CRUD operations
- Functions:
  - `createMatchInvitation()` - Create invitation after booking
  - `getMatchInvitationById()` - Retrieve invitation details
  - `getPendingInvitationsForUser()` - Get pending invitations
  - `getSentInvitationsForUser()` - Get sent invitations
  - `updateMatchInvitationStatus()` - Update invitation status
  - `updateInvitationWithChanges()` - Handle court/time change requests
  - `confirmMatchInvitation()` - Confirm and save match to database
  - `acceptChangeRequest()` - Accept proposed changes
  - `rejectChangeRequest()` - Reject proposed changes
  - `cancelMatchInvitation()` - Cancel invitation

### Phase 4: API Routes ✅
- Created `/app/api/match-invitations/route.ts` with full REST endpoints
- **POST** - Create new match invitation after booking
- **GET** - Fetch pending or sent invitations (with `?type=pending|sent` parameter)
- **PATCH** - Respond to invitations with actions:
  - `accept` - Accept invitation and confirm match
  - `reject` - Reject invitation
  - `change_court` - Request court change
  - `change_time` - Request time change
  - `cancel` - Cancel match
  - `accept_change` - Accept change request
  - `reject_change` - Reject change request

### Phase 5: Notification System ✅
- Enhanced `/lib/server/db/notifications.ts` to support new fields
- Added support for new notification types:
  - `match_invitation` - Initial invitation
  - `match_invitation_accepted` - Invitation accepted
  - `match_invitation_rejected` - Invitation rejected
  - `match_invitation_court_change_requested` - Court change requested
  - `match_invitation_time_change_requested` - Time change requested
  - `match_change_request_accepted` - Change accepted by organizer
  - `match_change_request_rejected` - Change rejected by organizer
  - `match_confirmed_both` - Match confirmed (sent to both parties)
  - `match_cancelled_invitation` - Match cancelled

### Phase 6: PDF Generation ✅
- Created `/app/api/generate-booking-pdf/route.ts`
- Generates HTML PDFs with match details
- Supports GET and POST methods
- Returns formatted document with Arabic text support

### Phase 7: Notifications UI ✅
- Updated `/app/notifications/page.tsx` with:
  - New handler: `handleMatchInvitationResponse()` for invitation actions
  - New handler: `handleDownloadPDF()` for PDF downloads
  - UI components for all new notification types
  - Support for action buttons (approve, reject, change court, change time, cancel)
  - PDF download button for confirmed matches

### Phase 8: Bookings Integration (Needs Implementation)

## Phase 8 Implementation Steps

To complete the integration, you need to add the match invitation creation flow to the bookings page:

### Step 1: Update Bookings Page

After successful booking confirmation (around line 412-437 in `/app/bookings/page.tsx`), add:

```typescript
if (res.ok) {
  setStatus("success");
  setTick((n) => n + 1);
  
  // Create match invitation if this is a team booking
  if (stadium.invitedUserId) {
    try {
      await createMatchInvitation({
        toUserId: stadium.invitedUserId,
        fromTeamId: stadium.teamId,
        toTeamId: stadium.opponentTeamId,
        originalProposedDate: `${date}T${time}:00`,
        originalStadium: stadium.name,
        bookingId: requestId,
      });
      
      toast({ 
        title: 'تم إرسال الدعوة', 
        description: 'تم إرسال دعوة المباراة بنجاح' 
      });
    } catch (error) {
      console.error('Failed to create match invitation:', error);
      // Don't fail the booking if invitation creation fails
    }
  }
  
  // Save to localStorage as backup
  // ... rest of the code
}
```

### Step 2: Add Invitation Context to Stadium Selection

Modify the stadium selection to capture the invited user:

```typescript
const selectedStadium = {
  ...stadium,
  invitedUserId: searchParams.get('invitedUserId'),
  opponentTeamId: searchParams.get('opponentTeamId'),
};
```

### Step 3: Update Booking Query Parameters

When navigating to bookings page, include invitation parameters:

```typescript
const bookingParams = new URLSearchParams({
  requestId: matchId,
  isTeamBooking: 'true',
  invitedUserId: inviteeUserId,
  opponentTeamId: opponentTeamId,
});
router.push(`/bookings?${bookingParams.toString()}`);
```

## Notification Flow

### Full Workflow: Accept Invitation

1. **Organizer** confirms booking on `/app/bookings/page.tsx`
2. System creates `MatchInvitation` with status "pending"
3. **Invitee** receives `match_invitation` notification
4. Invitee clicks "الموافقة" (Approve)
5. `/api/match-invitations` PATCH endpoint with `action: 'accept'`
6. System confirms invitation and saves match to database
7. Both parties receive `match_confirmed_both` notification
8. Notifications include PDF download button with match details

### Workflow: Change Court

1. Invitee receives `match_invitation` notification
2. Invitee clicks "تغيير الملعب" (Change Court)
3. Prompted to enter new court name
4. System updates invitation with status "court_change_requested"
5. Organizer receives `match_invitation_court_change_requested` notification
6. Organizer can navigate to bookings to accept/reject change
7. Invitee receives `match_change_request_accepted` or `match_change_request_rejected`

### Workflow: Cancel Match

1. Either party can cancel from `match_confirmed_both` notification
2. System updates invitation to "cancelled"
3. Other party receives `match_cancelled_invitation` notification
4. Match remains in database but marked as cancelled

## New Client API Functions

Added to `/lib/client/api.ts`:

```typescript
// Create match invitation
createMatchInvitation(input: {
  toUserId: string
  fromTeamId?: string
  toTeamId?: string
  originalProposedDate: string
  originalStadium?: string
  bookingId?: string
}): Promise<any>

// Get pending invitations for current user
getPendingMatchInvitations(): Promise<any[]>

// Respond to invitation
respondToMatchInvitation(
  invitationId: string,
  action: 'accept' | 'reject' | 'change_court' | 'change_time' | 'cancel',
  extraData?: any
): Promise<void>

// Generate booking PDF
generateBookingPDF(input: {
  matchId: string
  stadium: string
  dateTime: string
  team1Name?: string
  team2Name?: string
  wilaya?: string
  commune?: string
  bookingReference?: string
  organizer?: string
  invitee?: string
}): Promise<string>
```

## Database Collections

### match_invitations
```json
{
  "id": "invitation_xxx",
  "fromUserId": "user_1",
  "toUserId": "user_2",
  "fromTeamId": "team_1",
  "toTeamId": "team_2",
  "status": "pending|accepted|rejected|court_change_requested|time_change_requested|cancelled",
  "originalProposedDate": "2024-12-20T18:00:00Z",
  "originalStadium": "Stadium Name",
  "suggestedDate": "2024-12-20T19:00:00Z",
  "suggestedStadium": "New Stadium",
  "suggestedTime": "19:00",
  "bookingId": "booking_xxx",
  "matchId": "match_xxx",
  "createdAt": Timestamp,
  "updatedAt": Timestamp
}
```

## Testing the System

### Test Scenario 1: Accept Invitation
1. Login as User A
2. Create match booking for a stadium with User B invited
3. Login as User B
4. Navigate to notifications
5. Should see "match_invitation" notification
6. Click "الموافقة"
7. Match saved to database, both receive "match_confirmed_both"
8. Click "تحميل PDF" to download

### Test Scenario 2: Change Court
1. Follow steps 1-5 from Scenario 1
2. Click "تغيير الملعب"
3. Enter new court name (e.g., "ملعب آخر")
4. Switch to User A
5. User A should see "match_invitation_court_change_requested"
6. User A can navigate to bookings to change and confirm
7. User B receives "match_change_request_accepted"

### Test Scenario 3: Cancel Match
1. Follow accept workflow to get "match_confirmed_both"
2. Click "إلغاء المباراة"
3. Other party receives "match_cancelled_invitation"
4. Match status updated to cancelled in database

## Error Handling

The system includes comprehensive error handling:
- Missing authentication returns 401
- Invalid invitations return 404
- Missing required fields return 400
- Unauthorized actions return 403
- Server errors return 500 with fallback to all matches

## Next Steps

1. **Complete Phase 8** - Integrate invitation creation with bookings flow
2. **Add real-time updates** - Use WebSockets or polling for live notifications
3. **Mobile optimization** - Ensure responsive design for mobile
4. **Testing** - Write unit tests for all API endpoints and DB operations
5. **Performance** - Add indexing to Firestore for faster queries
6. **Analytics** - Track invitation acceptance rates and match confirmations

## Support

For issues or questions, refer to:
- API Route: `/app/api/match-invitations/route.ts`
- Database: `/lib/server/db/match-invitations.ts`
- UI Components: `/app/notifications/page.tsx`
- Types: `/types/index.ts`
