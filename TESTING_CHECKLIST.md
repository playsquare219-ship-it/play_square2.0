# قائمة اختبار نظام تأكيد الحجز

## الاختبار اليدوي

### 1. اختبار الحجز الأولي ✅
```
[ ] افتح /bookings
[ ] اختر ملعب وموعد وتوقيت
[ ] اضغط "تأكيد الحجز"
[ ] تحقق من الاستجابة: status = "pending_confirmation"
[ ] لا يجب أن يظهر الحجز كمؤكد بعد
```

### 2. اختبار تلقي الدعوة ✅
```
[ ] افتح حساب مستخدم ثاني (المدعو)
[ ] تحقق من /notifications
[ ] يجب أن ترى إشعار "match_invitation"
[ ] الإشعار يحتوي على:
    - اسم الملعب
    - الموعد والتوقيت
    - أزرار: الموافقة | تغيير الملعب | تغيير التوقيت | الرفض
```

### 3. اختبار قبول الدعوة ✅
```
[ ] المدعو يضغط "الموافقة"
[ ] انتظر التحديث
[ ] يجب أن يختفي إشعار match_invitation
[ ] يجب أن يظهر إشعار جديد: match_confirmed_both
[ ] الحجز الآن يجب أن يكون status = "confirmed"
```

### 4. اختبار تحميل PDF ✅
```
[ ] المنظّم يرى إشعار match_confirmed_both مع زر "تحميل PDF"
[ ] المدعو يرى نفس الإشعار مع نفس الزر
[ ] كلاهما يضغط على الزر
[ ] يفتح نافذة جديدة مع جدول PDF
[ ] PDF يحتوي على:
    - معلومات الملعب
    - الموعد والتوقيت
    - أسماء الفريقين (إن وجدت)
```

### 5. اختبار طلب تغيير الملعب ✅
```
[ ] ابدأ من جديد بحجز جديد
[ ] المدعو يضغط "تغيير الملعب"
[ ] يُطلب منه إدخال اسم ملعب جديد
[ ] يضغط OK
[ ] المنظّم يرى إشعار: "طلب تغيير الملعب"
[ ] يوجد زر "إجراء التغيير"
[ ] يعود إلى صفحة الحجز لتعديل الملعب
```

### 6. اختبار طلب تغيير التوقيت ✅
```
[ ] ابدأ من جديد بحجز جديد
[ ] المدعو يضغط "تغيير التوقيت"
[ ] يُطلب منه إدخال توقيت جديد (مثال: 18:00)
[ ] يضغط OK
[ ] المنظّم يرى إشعار: "طلب تغيير التوقيت"
[ ] يوجد زر "إجراء التغيير"
[ ] يعود إلى صفحة الحجز لتعديل الموعد
```

### 7. اختبار الرفض ✅
```
[ ] ابدأ من جديد بحجز جديد
[ ] المدعو يضغط "الرفض"
[ ] الإشعار يختفي
[ ] المنظّم يرى إشعار: "تم رفض دعوة المباراة"
[ ] الحجز يبقى معلقاً (pending_confirmation)
```

### 8. اختبار الإلغاء بعد التأكيد ✅
```
[ ] قبول دعوة بنجاح (status = confirmed)
[ ] يظهر إشعار match_confirmed_both
[ ] اضغط على زر "إلغاء المباراة"
[ ] الإشعار يتحدث
[ ] الحجز يصبح status = "cancelled"
[ ] المدعو يرى إشعار: "تم إلغاء المباراة"
```

---

## اختبار API المباشر (cURL/Postman)

### 1. إنشاء حجز أولي
```bash
POST /api/bookings
Content-Type: application/json

{
  "stadiumId": 1,
  "stadiumName": "ملعب النجم",
  "date": "2025-07-25",
  "time": "18:00",
  "wilaya": "الجزائر",
  "commune": "الحراش"
}

Expected Response:
{
  "id": "booking_123",
  "status": "pending_confirmation",  ✅
  "createdAt": "2025-07-18T..."
}
```

### 2. إنشاء دعوة مباراة
```bash
POST /api/match-invitations
Content-Type: application/json
Cookie: playSquareToken=...

{
  "toUserId": "user_2",
  "bookingId": "booking_123",
  "originalStadium": "ملعب النجم",
  "originalProposedDate": "2025-07-25 18:00"
}

Expected Response:
{
  "invitation": {
    "id": "invitation_123",
    "status": "pending",  ✅
    "bookingId": "booking_123"
  }
}
```

### 3. قبول الدعوة (من المدعو)
```bash
PATCH /api/match-invitations
Content-Type: application/json
Cookie: playSquareToken=... (user_2)

{
  "invitationId": "invitation_123",
  "action": "accept",
  "matchData": {
    "team1Id": "team_1",
    "team2Id": "team_2",
    "stadium": "ملعب النجم",
    "wilaya": "الجزائر",
    "dateTime": "2025-07-25 18:00"
  }
}

Expected Response:
{
  "success": true,
  "result": {
    "matchId": "match_123"
  }
}

Side Effects:
✅ booking_matches.status → "confirmed"
✅ Notifications sent to both users
✅ Match saved to DB
```

### 4. تحديث الحجز (يجب أن يكون confirmed الآن)
```bash
GET /api/booking-matches?bookingId=booking_123

Expected Response:
{
  "bookings": [{
    "id": "booking_123",
    "status": "confirmed",  ✅
    "confirmedAt": "2025-07-18T..."
  }]
}
```

### 5. تحميل PDF
```bash
GET /api/generate-booking-pdf?matchId=match_123&stadium=ملعب%20النجم&dateTime=2025-07-25%2018:00

Expected Response:
HTML content with PDF styling
```

---

## اختبار قاعدة البيانات

### 1. التحقق من حالات الحجز
```javascript
// في Firestore console
db.collection('booking_matches')
  .where('status', '==', 'pending_confirmation')
  .get()

// يجب أن تكون هناك حجوزات معلقة بعد الحجز الأولي
```

### 2. التحقق من الدعوات
```javascript
db.collection('match_invitations')
  .where('toUserId', '==', 'user_2')
  .get()

// يجب أن تكون هناك دعوات بحالة 'pending'
// وتحتوي على bookingId
```

### 3. التحقق من المباريات
```javascript
db.collection('matches')
  .orderBy('createdAt', 'desc')
  .limit(1)
  .get()

// يجب أن تظهر المباراة فقط بعد قبول المدعو
// NOT بعد الحجز الأولي!
```

### 4. التحقق من الإشعارات
```javascript
db.collection('notifications')
  .where('userId', '==', 'user_1')
  .orderBy('createdAt', 'desc')
  .get()

// يجب أن تكون هناك إشعارات:
// 1. match_invitation → للمدعو
// 2. match_confirmed_both → بعد القبول
```

---

## اختبار الحالات الحدية

### الحالة 1: تغيير ثم إلغاء
```
[ ] حجز جديد
[ ] المدعو يطلب تغيير الملعب
[ ] المنظّم يضغط "إجراء التغيير"
[ ] بدلاً من التعديل، يضغط "الرجوع"
[ ] الحالة: ماذا يحدث؟ (يجب أن تبقى pending)
```

### الحالة 2: دعوات متعددة
```
[ ] المنظّم يحجز ملعب
[ ] يُرسل دعوات لـ 3 أشخاص
[ ] شخص واحد يقبل → booking: confirmed
[ ] الآخران يرفضان → يجب أن يظهروا في الإشعارات
```

### الحالة 3: تغيير الملعب متعدد
```
[ ] تغيير الملعب من A إلى B
[ ] تغيير الملعب من B إلى C
[ ] يجب أن يتم حفظ التغيير الأخير فقط
```

---

## اختبار الأداء

### سرعة الاستجابة
```
[ ] POST /api/bookings: < 500ms
[ ] PATCH /api/match-invitations (accept): < 1000ms
[ ] GET /api/generate-booking-pdf: < 2000ms
```

### استهلاك قاعدة البيانات
```
[ ] عدم إنشاء مستندات مكررة
[ ] حذف الحجوزات المرفوضة (أو تحديثها)
[ ] عدم فقدان البيانات
```

---

## قائمة التحقق النهائية

- [ ] جميع الحجوزات الجديدة تبدأ بـ `pending_confirmation`
- [ ] الإشعارات توصل للمدعو فقط في البداية
- [ ] قبول الدعوة يؤكد الحجز تلقائياً
- [ ] PDF متاح فقط بعد التأكيد النهائي
- [ ] المباراة تُحفظ فقط عند قبول المدعو
- [ ] جميع الإشعارات عربي صحيح (RTL)
- [ ] الأزرار تعمل بشكل صحيح
- [ ] لا توجد أخطاء في console
- [ ] الاتصالات الآمنة (HTTPS/cookies)

---

## ملاحظات الاختبار

🔍 **تتبع الأشياء**:
- استخدم `console.log()` لمتابعة التدفق
- فعّل DevTools Network tab لرؤية الطلبات
- تحقق من Firestore console للبيانات المباشرة

⚠️ **الأشياء الشائعة**:
- تأكد من تسجيل الدخول (cookie موجود)
- استخدم حسابات اختبار مختلفة للمنظّم والمدعو
- امسح الذاكرة المؤقتة إذا لم تظهر التحديثات

✨ **نصائح**:
- اختبر على أجهزة مختلفة (موبايل/سطح المكتب)
- اختبر الاتصالات البطيئة
- اختبر مع عدة حجوزات معاً

