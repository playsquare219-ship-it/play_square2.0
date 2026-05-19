# خطوات التطبيق والاختبار السريع

## ✅ التغييرات المنفذة

### 1️⃣ ملفات قاعدة البيانات

#### `lib/server/db/users.ts`
- ✅ إضافة نوع `PendingRegistration` الجديد
- ✅ إضافة collection `PENDING_REGISTRATIONS_COLLECTION`
- ✅ تعديل `createUnverifiedEmailUser()` - يحفظ في `pending_registrations`
- ✅ إضافة `findPendingRegistrationByEmail()` - بحث في pending
- ✅ تعديل `verifyEmailToken()` - يبحث في `pending_registrations`
- ✅ تعديل `markEmailAsVerified()` - ينقل من pending إلى users

### 2️⃣ ملفات API

#### `app/api/auth/register/route.ts`
- ✅ تحديث الاستيراد (حذف `dbUserToAppUser`)
- ✅ إضافة سجلات تصحيح مفصلة

#### `app/api/auth/verify-email/route.ts`
- ✅ تصحيح الاستيراد: `generateToken` من `lib/server/auth/jwt`
- ✅ تحديث الكود للعمل مع `PendingRegistration`
- ✅ إضافة سجلات تصحيح مفصلة

---

## 🧪 اختبار النظام

### المتطلبات الأساسية:
```bash
# تأكد من أن المشروع قيد التشغيل
npm run dev

# البريد الإلكتروني مكون بشكل صحيح في .env.local
EMAIL_USER=playsquare219@gmail.com
EMAIL_PASSWORD=fkvc wiwd zuum ffax
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### خطوات الاختبار:

#### 1️⃣ **اختبر التسجيل:**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "تجربة",
    "lastName": "المستخدم",
    "email": "test@example.com",
    "password": "Test123456",
    "wilaya": "الجزائر",
    "baladia": "الجزائر العاصمة"
  }'
```

**النتائج المتوقعة:**
```json
{
  "success": true,
  "data": {
    "message": "تم إرسال بريد تحقق إلى بريدك الإلكتروني..."
  }
}
```

#### 2️⃣ **تحقق من قاعدة البيانات:**

**في Firebase Console:**
- اذهب إلى `firestore` → `pending_registrations`
- يجب أن ترى سجل جديد بـ:
  - email: `test@example.com`
  - verificationToken: `abc123...`
  - verified: ❌ غير موجود (غير مفعل تلقائياً)
- يجب **ألا** ترى السجل في `users` بعد

#### 3️⃣ **تحقق من البريد الإلكتروني:**

- اذهب إلى البريد الإلكتروني (`test@example.com`)
- ابحث عن بريد من `playsquare219@gmail.com`
- انسخ رابط التحقق:
```
http://localhost:3000/api/auth/verify-email?token=abc123...
```

#### 4️⃣ **اختبر رابط التحقق:**

```bash
# في المتصفح أو curl:
curl http://localhost:3000/api/auth/verify-email?token=abc123...
```

**النتائج المتوقعة:**
- Redirect إلى `/auth/login?verified=true`
- إضافة Cookie: `playSquareToken`

#### 5️⃣ **تحقق من قاعدة البيانات النهائية:**

**في Firebase Console:**
- المجموعة `pending_registrations`:
  - يجب أن **تكون فارغة** (تم حذف السجل)
  
- المجموعة `users`:
  - يجب أن ترى سجل جديد بـ:
    - email: `test@example.com`
    - verified: ✅ `true`
    - createdAt: (وقت التسجيل الأصلي)
    - updatedAt: (وقت التحقق)

#### 6️⃣ **اختبر تسجيل الدخول:**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456"
  }'
```

**النتائج المتوقعة:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_...",
      "email": "test@example.com",
      "firstName": "تجربة",
      "verified": true
    }
  }
}
```

---

## 🐛 استكشاف الأخطاء

### المشكلة: البريد لم يصل

**الحل:**
1. تحقق من السجلات في Terminal:
```
[Register] Verification link: http://localhost:3000/api/auth/verify-email?token=...
[Register] Email user configured: true
[Mailer] Attempting to send verification email to: test@example.com
[Mailer] Error sending verification email: ...
```

2. تحقق من بيانات Gmail:
   - استخدم **App Password** وليس كلمة المرور العادية
   - انتقل إلى: https://myaccount.google.com/apppasswords
   - اختر: Mail + Windows Computer
   - انسخ الكلمة وزيّن البيانات

### المشكلة: رمز التحقق غير صحيح

**الحل:**
```
[VerifyEmail] Invalid or expired token
```
- تأكد من نسخ الرابط بالكامل من البريد
- انتظر أقل من 24 ساعة

### المشكلة: لا يوجد بريد للمستخدم

**الحل:**
1. تحقق من سجلات التسجيل:
```
[Database] Created pending registration: test@example.com
```

2. تحقق من قاعدة البيانات:
   - اذهب إلى `pending_registrations`
   - ابحث عن البريد

---

## 📊 ملخص الحالات

| الحالة | pending_registrations | users | الإجراء |
|--------|------|-------|---------|
| بعد التسجيل | ✅ السجل موجود | ❌ فارغ | انتظر البريد |
| بعد التحقق الناجح | ❌ محذوف | ✅ السجل موجود | سجل الدخول |
| بريد منتهي | ✅ محذوف تلقائياً | ❌ فارغ | سجل من جديد |

---

## 🎯 النتيجة النهائية

عند اكتمال الاختبار:
- ✅ لا يوجد حسابات وهمية في `users`
- ✅ التسجيلات المعلقة منفصلة عن الحسابات النشطة
- ✅ يمكن حذف التسجيلات المعلقة بأمان
- ✅ بيانات نظيفة وموثوقة

---

## 📚 ملفات التوثيق الإضافية

- `PENDING_REGISTRATIONS_PATTERN.md` - شرح شامل للنمط الجديد
- `PATTERN_COMPARISON.md` - مقارنة بين النظام القديم والجديد
- `EMAIL_VERIFICATION_FIX.md` - الإصلاحات السابقة (البريد والتحويل)

---

**آخر تحديث:** مارس 27، 2026
