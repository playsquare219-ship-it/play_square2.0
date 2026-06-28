# Stadium Bookings - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Install Dependencies
```bash
cd /vercel/share/v0-project
npm install
# or
yarn install
```

### Step 2: Verify Environment Variables
Check that your `.env.development.local` contains Firebase credentials:
```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
FIREBASE_PROJECT_ID=...
FIREBASE_SERVICE_ACCOUNT_JSON=...
```

### Step 3: Start Development Server
```bash
npm run dev
```

Server will start at `http://localhost:3000`

### Step 4: Navigate to Bookings
Open browser and go to:
- **Bookings Page**: `http://localhost:3000/bookings`
- **My Bookings**: `http://localhost:3000/my-bookings`
- **Statistics**: `http://localhost:3000/statistics`

## 📱 Using the Bookings System

### Browse Stadiums
1. Go to `/bookings`
2. See list of available stadiums
3. Use search to find by name
4. Click filter icon to filter by wilaya/commune

### Make a Booking
1. Click on any stadium card
2. Select date using calendar picker
3. View available time slots (booked slots are grayed out)
4. Select a time slot
5. Click "Confirm Booking"
6. See confirmation with booking details

### View Your Bookings
1. Go to `/my-bookings`
2. See all your bookings
3. View date, time, location details
4. Quick link to book another stadium

### Check Statistics
1. Go to `/statistics`
2. View total bookings
3. See weekly/monthly breakdown
4. Find your favorite stadiums
5. Get usage tips

## 🔌 API Endpoints

Test the APIs directly:

### Get Booked Slots
```bash
curl "http://localhost:3000/api/bookings?stadiumId=1&date=2026-01-15"
```

### Create Booking
```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "stadiumId": 1,
    "stadiumName": "Test Stadium",
    "date": "2026-01-15",
    "time": "18:00",
    "wilaya": "Algiers",
    "commune": "Hydra"
  }'
```

### Get Wilayas
```bash
curl "http://localhost:3000/api/wilayas"
```

### Get Stadiums
```bash
curl "http://localhost:3000/api/stadiums?wilayaId=16"
```

## 📊 Data Flow

```
User Interface
    ↓ (Click, Filter, Select)
React Components
    ↓ (fetch API)
Next.js API Routes (/api/bookings, /api/stadiums, /api/wilayas)
    ↓ (Firebase Admin SDK)
Firebase Firestore Database
    ↓ (Real-time updates)
React Components Updated
```

## 🎨 UI Components

### Bookings Page
- **Search Bar**: Find stadiums by name
- **Filter Button**: Filter by wilaya/commune
- **Stadium Cards**: Click to book
- **Calendar**: Select booking date
- **Time Grid**: Select time slot
- **Confirmation**: See booking summary

### My Bookings Page
- **Booking Cards**: List of all bookings
- **Booking Details**: Date, time, location
- **Status Badge**: Booking status
- **Book Again**: Quick link to bookings page

### Statistics Page
- **Total Bookings**: Main stat card
- **Weekly/Monthly**: Quick stats grid
- **Favorites**: Most used stadium and wilaya
- **Tips**: Usage recommendations

## 🔐 Firebase Setup

### Collections
- `bookings`: All stadium bookings
- `stadiums`: Stadium information
- `wilayas`: Province data
- `baladias`: Commune data

### Firestore Security Rules (Example)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read on bookings
    match /bookings/{document=**} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.userId;
    }
    
    // Allow read on stadiums, wilayas, baladias
    match /{document=**} {
      allow read: if true;
    }
  }
}
```

## 💡 Tips & Tricks

### Testing Without Data
The app works even without stadiums in Firestore:
1. Wilayas load from hardcoded list
2. Empty stadium list shows "No stadiums found"
3. This is expected - add stadiums via Firebase Console

### Adding Test Data
1. Go to Firebase Console
2. Create `stadiums` collection
3. Add documents with fields: name, wilayaId, baladiaId
4. Refresh bookings page to see them

### Debugging
1. Open browser DevTools (F12)
2. Check Console for errors
3. Check Network tab for API calls
4. Look for [v0] prefixed logs for debugging

### Performance
- Slots are cached per date
- Reloading date fetches fresh data
- Bookings are instant after confirmation
- Statistics update real-time

## ❓ Common Issues

### Stadiums not showing?
**Solution**: Add stadiums to Firebase Firestore `stadiums` collection

### Bookings not saving?
**Solution**: 
- Check Firebase connection
- Verify Firestore write permissions
- Check browser console for errors
- Ensure Firebase credentials are set

### Calendar not working?
**Solution**:
- Clear browser cache
- Refresh page
- Check JavaScript console for errors

### API errors?
**Solution**:
- Check server console logs
- Verify Firebase service account
- Check Firestore database connection
- Ensure API route is accessible

## 📝 Code Structure

```
/app
  /bookings
    page.tsx          # Main bookings interface
  /my-bookings
    page.tsx          # Booking history
  /statistics
    page.tsx          # Analytics dashboard
  /api
    /bookings
      route.ts        # API for bookings
    /wilayas
      route.ts        # API for provinces
    /stadiums
      route.ts        # API for stadiums
```

## 🚢 Deployment

### Vercel Deployment
1. Push to GitHub
2. Connect to Vercel
3. Set environment variables
4. Deploy automatically

### Environment Variables (Production)
```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=play-square-d1e9b
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
FIREBASE_PROJECT_ID=play-square-d1e9b
FIREBASE_SERVICE_ACCOUNT_JSON={...}
```

## 🎯 Next Steps

1. **Add Authentication**: Connect bookings to user accounts
2. **Add Payments**: Integration with payment gateway
3. **Add Notifications**: Email confirmations
4. **Add Cancellation**: Allow users to cancel bookings
5. **Add Reviews**: Stadium ratings and feedback
6. **Add Recurring**: Support for recurring bookings

## 📞 Support

### Debug Information
- Browser: Check Console tab
- Network: Check Network tab for API calls
- Firebase: Check Cloud Firestore console
- Server: Check terminal output

### Useful Commands
```bash
# Check build
npm run build

# Type check
npm run lint

# Start dev server
npm run dev
```

## ✅ Checklist

- [ ] npm dependencies installed
- [ ] Environment variables set
- [ ] Dev server running
- [ ] Bookings page loads
- [ ] Can select stadium
- [ ] Can select date/time
- [ ] Booking saves to Firebase
- [ ] Booking appears in My Bookings
- [ ] Statistics update correctly

---

**Ready to go!** 🎉

Start with the bookings page at `/bookings` and explore the features.

For detailed technical documentation, see `BOOKINGS_SETUP.md` and `INTEGRATION_SUMMARY.md`.
