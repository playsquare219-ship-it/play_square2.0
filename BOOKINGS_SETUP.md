# Stadium Bookings System - Firebase Integration

## 📋 Overview

This document describes the new stadium bookings system integrated with Firebase Firestore.

## 🆕 New Pages Added

### 1. **Bookings Page** (`/bookings`)
- Browse and search stadiums across Algerian wilayas (provinces)
- Filter by wilaya and commune
- View real-time availability of stadium time slots
- Book a stadium for a specific date and time
- All data is saved to Firebase Firestore

**Features:**
- Real-time slot availability checking
- Search and filter stadiums
- Date picker with past date blocking
- 15 time slots per day (08:00 - 22:00)
- Booking confirmation with details

### 2. **My Bookings Page** (`/my-bookings`)
- View all your past and current bookings
- Display booking details (stadium, date, time, location)
- Track booking history
- Quick link to book another stadium

### 3. **Statistics Page** (`/statistics`)
- View booking statistics and trends
- Track total bookings, weekly/monthly breakdowns
- Identify favorite stadiums and wilayas
- Display upcoming bookings count
- Tips for better booking experience

## 🔌 Firebase Collections

### `bookings` Collection
Stores all stadium bookings with the following structure:
```
{
  stadiumId: number,
  stadiumName: string,
  date: string (YYYY-MM-DD),
  time: string (HH:00),
  wilaya: string,
  commune: string,
  createdAt: Timestamp,
  status: "confirmed" | "cancelled" | "completed"
}
```

### `stadiums` Collection (Existing)
Contains stadium information:
```
{
  name: string,
  wilayaId: string,
  baladiaId: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## 🔌 API Routes

### GET `/api/bookings`
Fetch booked time slots for a specific stadium on a specific date.

**Query Parameters:**
- `stadiumId`: Stadium ID
- `date`: Date in YYYY-MM-DD format

**Response:**
```json
{
  "bookedSlots": ["08:00", "09:00", "14:00"]
}
```

### POST `/api/bookings`
Create a new booking.

**Request Body:**
```json
{
  "stadiumId": 1,
  "stadiumName": "Stadium Name",
  "date": "2026-01-15",
  "time": "18:00",
  "wilaya": "Algiers",
  "commune": "Hydra"
}
```

**Response:**
```json
{
  "id": "booking_doc_id",
  "stadiumId": 1,
  "stadiumName": "Stadium Name",
  "date": "2026-01-15",
  "time": "18:00",
  "wilaya": "Algiers",
  "commune": "Hydra",
  "createdAt": "2026-01-10T10:30:00Z",
  "status": "confirmed"
}
```

### GET `/api/wilayas`
Fetch all Algerian wilayas with their communes.

**Response:**
```json
{
  "wilayas": [
    {
      "id": 16,
      "name": "Algiers",
      "communes": ["Hydra", "Bab Ezzouar", ...]
    },
    ...
  ]
}
```

### GET `/api/stadiums`
Fetch stadiums with optional filtering.

**Query Parameters:**
- `wilayaId`: Filter by wilaya
- `baladiaId`: Filter by baladia/commune

**Response:**
```json
{
  "stadiums": [
    {
      "id": "stadium_id",
      "name": "Stadium Name",
      "wilayaId": "wilaya_id",
      "baladiaId": "baladia_id"
    }
  ]
}
```

## 🛠️ Environment Variables Required

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

FIREBASE_PROJECT_ID=...
FIREBASE_SERVICE_ACCOUNT_JSON=...
```

## 📱 Navigation

The new Bookings page is accessible from the bottom navigation bar:
- **Icon:** Calendar icon
- **Label:** "Bookings"
- **Route:** `/bookings`

Users can also access:
- My Bookings: `/my-bookings`
- Statistics: `/statistics`

## 🔄 Data Flow

```
User Interface (React Components)
    ↓
API Routes (/api/bookings, /api/stadiums, /api/wilayas)
    ↓
Firebase Firestore Database
    ↓
Real-time Updates
```

## 📊 Features

### Search & Filter
- Search stadiums by name
- Filter by wilaya (province)
- Filter by commune
- Real-time result updates

### Booking Management
- Date picker with validation (no past dates)
- 15 available time slots (08:00-22:00)
- Real-time availability checking
- Duplicate booking prevention
- Booking confirmation with summary

### Statistics
- Total bookings counter
- Weekly and monthly statistics
- Favorite stadium tracking
- Most used wilaya tracking
- Upcoming bookings forecast

## 🚀 Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

2. **Set Environment Variables**
   Add Firebase credentials to your `.env.local` file

3. **Initialize Firebase**
   Firebase is already configured in the project

4. **Run Development Server**
   ```bash
   npm run dev
   ```

5. **Access the Bookings Page**
   Navigate to `http://localhost:3000/bookings`

## 🐛 Troubleshooting

### Bookings not loading
- Check Firebase connection
- Verify Firestore security rules
- Check browser console for errors

### Stadiums not appearing
- Ensure stadiums collection is populated in Firestore
- Check wilaya/baladia filtering parameters
- Verify API route is working (check `/api/stadiums`)

### Bookings not saving
- Check Firebase authentication
- Verify Firestore write permissions
- Ensure required fields are provided

## 📝 Future Enhancements

- User authentication for personal booking history
- Payment integration
- Booking notifications
- Stadium ratings and reviews
- Group bookings
- Recurring bookings
- Real-time availability WebSocket updates
- Email confirmation for bookings

## 🔐 Security Considerations

- All Firebase Firestore rules should restrict write access to authenticated users
- API routes validate input parameters
- Duplicate booking prevention at database level
- Consider implementing rate limiting for booking creation
- Sanitize user inputs before database operations

## 📞 Support

For issues or questions, check:
1. Firebase Firestore console for data
2. Browser console for client-side errors
3. Server logs for API route errors
4. Network tab in browser DevTools for API calls
