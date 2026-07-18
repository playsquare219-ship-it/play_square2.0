# 📋 دليل نظام تأكيد الحجز الكامل

## 🎯 نظرة عامة

تم إصلاح نظام الحجز ليتبع التدفق الصحيح:
1. **الحجز الأولي** → معلق (pending_confirmation)
2. **إرسال دعوة** للمدعو
3. **قبول المدعو** ← تأكيد الحجز
4. **تحميل PDF** للطرفين

---

## 📁 الملفات المُعدّلة

### 1. `/app/api/bookings/route.ts` - الحجز الأولي
**التغيير**: تغيير حالة الحجز الافتراضية
```javascript
// السطر 70
status: 'pending_confirmation' // بدلاً من 'confirmed'
```

**المفهوم**: 
- الحجز يُنشأ في حالة معلقة
- ينتظر قبول المدعو قبل التأكيد النهائي
- هذا يجعل الحجز أكثر مرونة للتعديلات

---

### 2. `/app/api/booking-matches/route.ts` - إدارة الحجوزات المتقدمة
**التغييرات**:

#### أ. تغيير الحالة الأولية (السطر 29)
```javascript
status: 'pending_confirmation' // من 'confirmed'
```

#### ب. إضافة PUT endpoint (السطور 97-156)
```javascript
export async function PUT(request: NextRequest) {
  // تحديث حالة الحجز من pending_confirmation إلى confirmed
  if (action === 'confirm') {
    await docRef.update({
      status: 'confirmed',
      confirmedAt: Timestamp.now()
    })
  }
}
```

**الاستخدام**:
```bash
PUT /api/booking-matches
{
  bookingId: "booking_123",
  action: "confirm" // أو "cancel"
}
```

---

### 3. `/app/api/match-invitations/route.ts` - معالجة الدعوات
**التغييرات**: تحديث case 'accept' (السطور 174-225)

#### قبل:
```javascript
case 'accept': {
  // فقط ينشئ match notification
  // لا يحدّث الحجز
}
```

#### بعد:
```javascript
case 'accept': {
  // 1. تأكيد المبارة
  const result = await confirmMatchInvitation(invitationId, matchData)
  
  // 2. تأكيد الحجز
  if (invitation.bookingId) {
    await db.collection('booking_matches')
      .doc(invitation.bookingId)
      .update({
        status: 'confirmed',
        confirmedAt: Timestamp.now()
      })
  }
  
  // 3. إرسال إشعارات
  createNotification(userId: fromUserId, ...) // للمنظّم
  createNotification(userId: toUserId, ...)   // للمدعو
}
```

**المفهوم**: عند قبول الدعوة:
1. تُنشأ المباراة في قاعدة البيانات
2. يُأكّد الحجز تلقائياً
3. يُرسل إشعاران (واحد لكل طرف)

---

### 4. `/lib/client/api.ts` - دوال العميل
**الإضافة**: دالة جديدة (السطور 588-598)

```javascript
export async function confirmBooking(
  bookingId: string, 
  action: 'confirm' | 'cancel'
): Promise<void> {
  const res = await fetch('/api/booking-matches', {
    method: 'PUT',
    body: JSON.stringify({ bookingId, action })
  })
  // ...
}
```

**الاستخدام**: من أي مكون في الواجهة الأمامية:
```javascript
await confirmBooking('booking_123', 'confirm')
```

---

### 5. `/app/notifications/page.tsx` - الواجهة الأمامية
**التغييرات**:

#### أ. إضافة import (السطر 9)
```javascript
import { ..., confirmBooking } from '@/lib/client/api'
```

#### ب. إضافة معالج (السطور 236-257)
```javascript
const handleConfirmBooking = async (notification: Notification) => {
  await confirmBooking(notification.matchDetails.bookingId, 'confirm')
  // تحديث الواجهة
  loadNotifications(0)
}
```

#### ج. تحديث عرض الإشعارات (السطور 415-439)
```javascript
{notification.type === 'match_confirmed_both' && (
  <Button onClick={() => handleDownloadPDF(notification)}>
    📥 تحميل معلومات الحجز PDF
  </Button>
)}
```

---

## 🔄 التدفق الكامل خطوة بخطوة

### المرحلة 1️⃣: الحجز الأولي

```
User A (المنظّم) في صفحة الحجز
  ↓
يختار: الملعب، التاريخ، الوقت
  ↓
يضغط "تأكيد الحجز"
  ↓
POST /api/bookings
  ↓
✅ Booking created with status: "pending_confirmation"
✅ Invitation created with status: "pending"
✅ Notification sent to User B (match_invitation)
```

**البيانات المحفوظة**:
```javascript
// bookings collection
{
  id: "booking_123",
  stadiumName: "ملعب النجم",
  date: "2025-07-25",
  time: "18:00",
  status: "pending_confirmation", // ← معلق
  createdAt: "2025-07-18T10:00:00Z"
}

// match_invitations collection
{
  id: "invitation_123",
  fromUserId: "user_a",
  toUserId: "user_b",
  status: "pending",
  bookingId: "booking_123",
  originalStadium: "ملعب النجم",
  originalProposedDate: "2025-07-25 18:00"
}

// notifications collection
{
  userId: "user_b",
  type: "match_invitation",
  title: "تم إرسال دعوة للعب مباراة",
  invitationId: "invitation_123"
}
```

---

### المرحلة 2️⃣: ردّ المدعو

```
User B (المدعو) يفتح الإشعارات
  ↓
يرى "تم إرسال دعوة للعب مباراة"
  ↓
الخيارات:
  ✅ الموافقة (accept)
  ❌ الرفض (reject)
  🏟️ تغيير الملعب
  ⏰ تغيير التوقيت
  ↓
يختار "الموافقة"
  ↓
PATCH /api/match-invitations
  (action: 'accept')
  ↓
⚙️ Backend:
  1. Confirm invitation: status = "accepted"
  2. Create match: "match_123"
  3. Confirm booking: status = "confirmed"
  4. Send notifications
  ↓
✅ Invitation: status = "accepted", matchId = "match_123"
✅ Booking: status = "confirmed", confirmedAt = now
✅ Match: created and saved
✅ Notifications: match_confirmed_both (for both)
```

**البيانات المُحدّثة**:
```javascript
// booking_matches collection
{
  id: "booking_123",
  status: "confirmed", // ← تم التأكيد!
  confirmedAt: "2025-07-18T10:05:00Z"
}

// match_invitations collection
{
  id: "invitation_123",
  status: "accepted", // ← مقبول
  matchId: "match_123"
}

// matches collection (جديد!)
{
  id: "match_123",
  team1Id: "team_a",
  team2Id: "team_b",
  stadium: "ملعب النجم",
  dateTime: "2025-07-25 18:00",
  status: "scheduled",
  invitationId: "invitation_123",
  confirmationStatus: "confirmed"
}

// notifications collection (جديد!)
{
  userId: "user_a", // للمنظّم
  type: "match_confirmed_both",
  title: "تم قبول الحجز - حمّل معلومات المباراة",
  matchDetails: { ... },
  actionType: "approve"
}

{
  userId: "user_b", // للمدعو
  type: "match_confirmed_both",
  title: "تم تأكيد المباراة",
  matchDetails: { ... }
}
```

---

### المرحلة 3️⃣: تحميل PDF

```
كلا المستخدمين يريان:
  "تم قبول الحجز - حمّل معلومات المباراة" ✉️
  
يضغطان على "تحميل PDF"
  ↓
GET /api/generate-booking-pdf?params
  ↓
✅ HTML PDF generated
  ↓
window.open(url)
  ↓
PDF opens in new tab 📄
```

**محتوى PDF**:
```
═════════════════════════════════════
        معلومات حجز المباراة
═════════════════════════════════════

📅 الموعد: 25 يوليو 2025
⏰ التوقيت: 18:00
🏟️ الملعب: ملعب النجم
📍 الولاية: الجزائر
🏘️ البلدية: الحراش

👥 الفريق الأول: فريق A
👥 الفريق الثاني: فريق B

📋 معرف الحجز: booking_123
🎫 معرف المباراة: match_123

═════════════════════════════════════
       تم تأكيد المباراة
═════════════════════════════════════
```

---

## 📊 مقارنة قبل وبعد

| المرحلة | قبل الإصلاح ❌ | بعد الإصلاح ✅ |
|--------|--------------|------------|
| الحجز الأولي | status: confirmed | status: pending_confirmation |
| الدعوة | لا توجد | ترسل للمدعو |
| ردّ المدعو | لا شيء | تأكيد الحجز |
| حفظ المباراة | مباشرة | عند قبول المدعو |
| تحميل PDF | غير متاح | متاح بعد التأكيد |
| الإشعارات | دعوة فقط | دعوة + تأكيد |

---

## 🔗 العلاقات بين الكائنات

```
Booking (pending_confirmation)
  ├─ bookingId: "booking_123"
  ├─ status: "pending_confirmation"
  └─ [تأكيد بعد قبول المدعو]
      └─ status: "confirmed"

MatchInvitation (pending)
  ├─ invitationId: "invitation_123"
  ├─ bookingId: "booking_123"
  ├─ status: "pending"
  └─ [قبول يؤدي إلى]:
      └─ status: "accepted"
      └─ matchId: "match_123"
      └─ booking.status: "confirmed"

Match (created on accept)
  ├─ matchId: "match_123"
  ├─ invitationId: "invitation_123"
  └─ status: "scheduled"

Notifications
  ├─ match_invitation (قبل قبول)
  └─ match_confirmed_both (بعد قبول)
```

---

## 🛠️ الأدوات والتقنيات المستخدمة

- **Firebase/Firestore**: قاعدة البيانات
- **Next.js API Routes**: الخادم
- **TypeScript**: أمان النوع
- **Client-side API functions**: اتصال الواجهة

---

## ⚙️ متغيرات البيئة المطلوبة

```env
FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...
```

---

## 📝 ملفات التوثيق الإضافية

- **FIX_SUMMARY.md** - ملخص التصحيحات
- **BOOKING_CONFIRMATION_FLOW.md** - تدفق التأكيد بالتفصيل
- **TESTING_CHECKLIST.md** - قائمة اختبار شاملة

---

## 🚀 الخطوات التالية

1. ✅ تشغيل الاختبارات اليدوية من TESTING_CHECKLIST.md
2. ✅ التحقق من النسجلات (logs) في console
3. ✅ اختبار على أجهزة مختلفة
4. ✅ نشر التغييرات إلى الإنتاج

---

## 💡 نصائح للصيانة المستقبلية

- **حذف الحجوزات المرفوضة**: أضف task مجدول للتنظيف
- **إرسال تذكيرات**: قبل موعد المباراة بساعة
- **تتبع الإحصائيات**: عدد المقبولة/المرفوضة/المعلقة
- **معالجة الحالات النادرة**: مثل حذف المستخدم وسط دعوة

---

**النسخة**: 1.0
**آخر تحديث**: 2025-07-18
**الحالة**: ✅ جاهز للاختبار

