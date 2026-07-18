# تدفق تأكيد الحجز - المسار الصحيح

## المشكلة التي تم إصلاحها

كان النظام ينقل الحجز مباشرة إلى حالة `confirmed` بعد الحجز الأولي، بينما يجب أن يكون هناك مرحلة انتظار لقبول المدعو قبل التأكيد النهائي.

---

## التدفق الصحيح الآن

### 1️⃣ **الحجز الأولي** (صاحب الدعوة)
- المستخدم يحجز الملعب والموعد
- **الحالة الجديدة**: `pending_confirmation` (بدلاً من `confirmed`)
- **الإجراء**: إنشاء دعوة مباراة للمدعو
- **الإشعار المرسل**: 
  - **النوع**: `match_invitation`
  - **المحتوى**: "تم إرسال دعوة للعب مباراة"
  - **الأزرار**: ✅ الموافقة | ❌ الرفض | 🏟️ تغيير الملعب | ⏰ تغيير التوقيت

```
POST /api/bookings → status: pending_confirmation
POST /api/match-invitations → create invitation
createNotification(type: 'match_invitation')
```

---

### 2️⃣ **ردّ المدعو** (المدعو)
عند قبول المدعو الدعوة:

#### أ) تأكيد الحجز
- تحديث حالة الحجز من `pending_confirmation` إلى `confirmed`
- **API**: `PUT /api/booking-matches` مع `action: 'confirm'`

#### ب) إرسال إشعارات للطرفين
1. **للمنظّم (صاحب الدعوة)**:
   - **النوع**: `match_confirmed_both`
   - **الرسالة**: "تم قبول الحجز - حمّل معلومات المباراة"
   - **الزر الرئيسي**: 📥 تحميل PDF

2. **للمدعو**:
   - **النوع**: `match_confirmed_both`
   - **الرسالة**: "تم تأكيد المباراة"
   - **الزر الرئيسي**: 📥 تحميل PDF

```
PATCH /api/match-invitations (action: 'accept')
→ PUT /api/booking-matches (action: 'confirm')
→ createNotification(type: 'match_confirmed_both')
→ createNotification(type: 'match_confirmed_both') للطرف الآخر
```

---

### 3️⃣ **تحميل بيانات الحجز** (كلا الطرفين)
- الضغط على زر "تحميل PDF"
- **API**: `GET /api/generate-booking-pdf?...`
- **الملف**: جدول PDF يحتوي على:
  - معلومات الملعب
  - الموعد والتوقيت
  - أسماء الفريقين
  - معلومات الحجز

```
GET /api/generate-booking-pdf
→ HTML/PDF content
→ window.open() in new tab
```

---

### 4️⃣ **السيناريوهات الإضافية**

#### أ) الرفض
```
PATCH /api/match-invitations (action: 'reject')
→ createNotification(type: 'match_invitation_rejected')
→ حجز يبقى في pending_confirmation (يُلغى لاحقاً)
```

#### ب) طلب تغيير الملعب
```
PATCH /api/match-invitations (action: 'change_court')
→ updateInvitation(status: 'court_change_requested')
→ createNotification(type: 'match_invitation_court_change_requested')
→ صاحب الدعوة يضغط "إجراء التغيير"
→ يعود إلى صفحة الحجز لتعديل الحجز
```

#### ج) طلب تغيير التوقيت
```
PATCH /api/match-invitations (action: 'change_time')
→ updateInvitation(status: 'time_change_requested')
→ createNotification(type: 'match_invitation_time_change_requested')
→ صاحب الدعوة يضغط "إجراء التغيير"
→ يعود إلى صفحة الحجز لتعديل الحجز
```

#### د) الإلغاء
```
PATCH /api/match-invitations (action: 'cancel')
→ cancelMatchInvitation(invitationId)
→ createNotification(type: 'match_cancelled_invitation')
→ حجز يُلغى أيضاً (يمكن إضافة update لـ booking status: 'cancelled')
```

---

## حالات قاعدة البيانات

### Bookings Collection
```javascript
{
  id: "booking_123",
  stadiumId: 1,
  stadiumName: "ملعب النجم",
  date: "2025-07-25",
  time: "18:00",
  wilaya: "الجزائر",
  commune: "الحراش",
  status: "pending_confirmation" // ← تم التغيير من "confirmed"
  createdAt: Timestamp,
  confirmedAt: Timestamp, // ← يُملأ عند تأكيد المدعو
}
```

### MatchInvitations Collection
```javascript
{
  id: "invitation_123",
  fromUserId: "user_1",
  toUserId: "user_2",
  status: "pending", // → "accepted" عند القبول
  originalProposedDate: "2025-07-25 18:00",
  originalStadium: "ملعب النجم",
  bookingId: "booking_123",
  createdAt: Timestamp,
  updatedAt: Timestamp,
}
```

### Notifications
```javascript
{
  id: "notif_123",
  userId: "user_2",
  type: "match_invitation",
  title: "تم إرسال دعوة للعب مباراة",
  invitationId: "invitation_123",
  matchDetails: {
    stadium: "ملعب النجم",
    dateTime: "2025-07-25 18:00",
    bookingId: "booking_123",
  },
}
```

---

## الملفات المعدّلة

✅ `/app/api/bookings/route.ts` - تغيير الحالة الأولية إلى `pending_confirmation`
✅ `/app/api/booking-matches/route.ts` - إضافة PUT endpoint للتأكيد + تغيير الحالة الأولية
✅ `/app/api/match-invitations/route.ts` - تحديث الـ accept case لتأكيد الحجز
✅ `/lib/client/api.ts` - إضافة `confirmBooking()` function
✅ `/app/notifications/page.tsx` - إضافة معالج `handleConfirmBooking()`

---

## أمثلة الاستخدام

### إنشاء حجز أولي
```javascript
POST /api/bookings
{
  stadiumId: 1,
  stadiumName: "ملعب النجم",
  date: "2025-07-25",
  time: "18:00",
  wilaya: "الجزائر",
  commune: "الحراش"
}
// Response: status: "pending_confirmation"
```

### قبول الدعوة (من المدعو)
```javascript
PATCH /api/match-invitations
{
  invitationId: "invitation_123",
  action: "accept",
  matchData: { /* match details */ }
}
// يؤدي إلى:
// 1. تحديث حالة الحجز إلى confirmed
// 2. إرسال إشعارات PDF للطرفين
```

### تحميل PDF
```javascript
GET /api/generate-booking-pdf?matchId=...&stadium=...&dateTime=...
// Response: HTML content for PDF
// في المتصفح: window.open(url)
```

---

## ملاحظات مهمة

⚠️ **لا يتم حفظ المباراة في قاعدة البيانات إلا عند قبول المدعو**
⚠️ **الحجز يبقى معلقاً حتى يتم قبول الدعوة أو رفضها**
⚠️ **في حالة الرفض، يجب حذف الحجز أو تحديث حالته إلى cancelled**
⚠️ **جميع الإشعارات ثنائية الاتجاه - تُرسل للطرفين معاً**

