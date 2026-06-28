# Firebase Integration & Booking Flow

## Overview
تم دمج Firebase Firestore بالكامل مع نظام الحجوزات، مع إعادة توجيه تلقائي من صفحة إنشاء المباراة إلى صفحة الحجوزات.

## New Features

### 1. Auto-Redirect to Bookings Page
عند إنشاء مباراة واختيار الملعب والتاريخ والوقت:
- يظهر زر جديد "Book Now" بجانب "Confirm Match"
- النقر على "Book Now" ينقل المستخدم إلى `/bookings` مع تمرير جميع المعلومات
- الصفحة تملأ البيانات المسبقة (الملعب، الموقع، التاريخ، الوقت)

### 2. URL Parameters
```
/bookings?stadium=Stadium%20Name&wilaya=Alger&commune=Hydra&date=2024-12-25&time=15:00
```

### 3. Firebase Database Storage
جميع الحجوزات تحفظ في Firebase Firestore:
```
Collection: bookings
Document: {
  stadiumId: number,
  stadiumName: string,
  date: string (YYYY-MM-DD),
  time: string,
  wilaya: string,
  commune: string,
  createdAt: Timestamp,
  status: string
}
```

### 4. My Bookings Integration
صفحة `my-bookings` الآن تقرأ من:
1. Firebase API (`/api/bookings/all`) - البيانات المحفوظة دائماً
2. localStorage - للحجوزات المؤقتة المحلية
3. Merge & Dedup - دمج البيانات من المصدرين مع حذف التكرارات

## Files Modified

### `/vercel/share/v0-project/app/bookings/page.tsx`
- ✅ أضفنا `useSearchParams` import
- ✅ إضافة parsing لـ URL parameters (stadium, wilaya, commune, date, time)
- ✅ Auto-populate form عند استقبال parameters من URL
- ✅ حفظ في localStorage عند النجاح
- ✅ إعادة توجيه تلقائي إلى my-bookings بعد نجاح الحجز

### `/vercel/share/v0-project/app/matches/create/page.tsx`
- ✅ أضفنا زر "Book Now" جديد
- ✅ بناء URL مع جميع المعاملات المطلوبة
- ✅ إعادة توجيه آمنة باستخدام `router.push()`

### `/vercel/share/v0-project/app/my-bookings/page.tsx`
- ✅ تحديث `loadBookings()` لقراءة من API + localStorage
- ✅ دمج ذكي للبيانات مع حذف التكرارات
- ✅ ترتيب البيانات من الأحدث للأقدم
- ✅ Fallback إلى localStorage في حالة فشل API

### `/vercel/share/v0-project/app/api/bookings/all/route.ts` (NEW)
- ✅ GET endpoint جديد
- ✅ جلب جميع الحجوزات من Firestore
- ✅ ترتيب بـ createdAt (descending)
- ✅ معالجة الأخطاء مع fallback

## Data Flow

### Creating a Match & Booking

```
User Flow:
1. User creates match at /matches/create
2. Selects: Wilaya → Commune → Date → Time → Stadium
3. Clicks "Book Now" button
   ↓
   URL parameters passed:
   /bookings?stadium=...&wilaya=...&commune=...&date=...&time=...
   ↓
4. Redirected to /bookings page
5. Form auto-populated with parameters
6. User confirms booking
   ↓
   Data Flow:
   - Save to Firebase API (/api/bookings) → Firestore
   - Save to localStorage (ps_bookings)
   ↓
7. Auto-redirect to /my-bookings (after 2 seconds)
   ↓
   Bookings loaded from:
   - Firebase API (/api/bookings/all)
   - localStorage
   - Merged & deduplicated
```

### Database Operations

#### POST /api/bookings
```javascript
Request:
{
  "stadiumId": 123,
  "stadiumName": "Stadium Name",
  "date": "2024-12-25",
  "time": "15:00",
  "wilaya": "Alger",
  "commune": "Hydra"
}

Response:
{
  "id": "firebase_doc_id",
  "stadiumId": 123,
  "stadiumName": "Stadium Name",
  "date": "2024-12-25",
  "time": "15:00",
  "wilaya": "Alger",
  "commune": "Hydra",
  "createdAt": "2024-12-20T...",
  "status": "confirmed"
}
```

#### GET /api/bookings/all
```javascript
Response:
{
  "bookings": [
    {
      "id": "doc_id",
      "stadiumName": "Stadium 1",
      "date": "2024-12-25",
      "time": "15:00",
      "wilaya": "Alger",
      "commune": "Hydra",
      "createdAt": "2024-12-20T...",
      "status": "confirmed"
    },
    ...
  ]
}
```

## Testing

### Scenario 1: Create Match & Redirect to Booking
1. Navigate to http://localhost:3000/matches/create
2. Select team, opponent (or "Book Stadium Without Team")
3. Fill in: Wilaya → Commune → Date → Time → Stadium
4. Click "Book Now"
5. ✅ Should redirect to /bookings with pre-filled form
6. Confirm booking
7. ✅ Should redirect to /my-bookings with new booking visible

### Scenario 2: Direct Booking Page
1. Navigate to http://localhost:3000/bookings
2. Search & select stadium
3. Confirm booking
4. ✅ Should redirect to /my-bookings with new booking

### Scenario 3: View My Bookings
1. Navigate to http://localhost:3000/my-bookings
2. ✅ Should show bookings from Firebase + localStorage
3. Check Firebase console to verify data saved

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /api/bookings | Check booked slots |
| POST | /api/bookings | Create new booking |
| GET | /api/bookings/all | Fetch all bookings |

## Environment Variables Required
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
FIREBASE_PROJECT_ID
FIREBASE_SERVICE_ACCOUNT_JSON
```

## Error Handling

### If Firebase API fails:
- Falls back to localStorage data
- User still sees their local bookings
- Doesn't block the user experience

### If localStorage is empty:
- Shows empty state message
- User can create new bookings from bookings page

## Browser Console Logs
All errors logged with `[v0]` prefix:
```javascript
console.error('[v0] Error creating booking:', error);
console.error('[v0] Error loading bookings:', error);
```

## Deployment Notes
- All Firebase configs must be set in environment
- Make sure Firestore security rules allow read/write to 'bookings' collection
- Test with real Firebase project before production

## Future Enhancements
- Add user authentication to filter bookings by user
- Add booking cancellation/modification
- Add email notifications
- Add booking analytics dashboard
- Real-time updates using Firestore listeners

---
Last Updated: Dec 28, 2024
Status: ✅ Complete
