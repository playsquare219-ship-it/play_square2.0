# نظام التحقق من البريد الإلكتروني المحسّن
## (Pending Registrations Pattern)

---

## 📋 ملخص التحسينات

تم تطبيق نمط جديد لنظام التحقق من البريد الإلكتروني يفصل بين مرحلتين:

### المرحلة 1️⃣: التسجيل المعلق (Pending Registration)
- حفظ البيانات **مؤقتاً** في جدول `pending_registrations`
- عدم إنشاء حساب نهائي في جدول `users` بعد

### المرحلة 2️⃣: التفعيل النهائي (Email Verification)
- عند الضغط على رابط التحقق من البريد
- نقل البيانات من `pending_registrations` إلى `users`
- حذف التسجيل المعلق
- إرجاع مستخدم نشط (verified)

---

## 🗄️ هيكل قاعدة البيانات

### Collection: `pending_registrations`
```typescript
interface PendingRegistration {
  id: string // معرّف فريد للتسجيل المعلق
  email: string
  firstName: string
  lastName: string
  password: string // كلمة مرور مشفرة
  provider: "email"
  verificationToken: string // رمز التحقق العشوائي
  verificationTokenExpiry: Timestamp // انتهاء الصلاحية (24 ساعة)
  createdAt: Timestamp // وقت إنشاء التسجيل
  updatedAt: Timestamp
  wilaya?: string // الولاية (اختياري)
  baladia?: string // البلدية (اختياري)
}
```

**مثال:**
```json
{
  "id": "pending_1738456789_abc123",
  "email": "user@example.com",
  "firstName": "أحمد",
  "lastName": "علي",
  "password": "$2a$10$...", // bcrypt hash
  "provider": "email",
  "verificationToken": "a1b2c3d4e5f6...",
  "verificationTokenExpiry": "2026-03-28T12:00:00Z",
  "createdAt": "2026-03-27T12:00:00Z",
  "updatedAt": "2026-03-27T12:00:00Z",
  "wilaya": "الجزائر",
  "baladia": "الجزائر العاصمة"
}
```

### Collection: `users`
```typescript
interface DbUser {
  id: string // معرّف المستخدم النهائي
  email: string
  firstName: string
  lastName: string
  password: string // كلمة مرور مشفرة
  provider: "email" | "google"
  verified: boolean // = true (تم التحقق)
  createdAt: Timestamp // وقت الإنشاء الأصلي
  updatedAt: Timestamp // وقت التحديث (التفعيل)
  wilaya?: string
  baladia?: string
  photoURL?: string // (للمستخدمين من Google فقط)
}
```

**مثال (بعد التحقق):**
```json
{
  "id": "user_1738456800_xyz789",
  "email": "user@example.com",
  "firstName": "أحمد",
  "lastName": "علي",
  "password": "$2a$10$...",
  "provider": "email",
  "verified": true,
  "createdAt": "2026-03-27T12:00:00Z",
  "updatedAt": "2026-03-27T12:01:00Z",
  "wilaya": "الجزائر",
  "baladia": "الجزائر العاصمة"
}
```

---

## 🔄 سير العملية (Workflow)

```
┌─────────────────────────────────────────────────────────────┐
│                    مستخدم جديد                               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │   1. ملء النموذج    │
            │   - البريد الإلكتروني│
            │   - كلمة المرور     │
            │   - البيانات الأخرى  │
            └──────────┬───────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │   2. POST /register  │
            │   - التحقق من البيانات│
            │   - تشفير الكلمة      │
            │   - إنشاء رمز تحقق   │
            └──────────┬───────────┘
                       │
                       ▼
        ┌─────────────────────────────┐
        │   3. حفظ مؤقتاً               │
        │ pending_registrations جدول   │
        │ • بدون verified flag        │
        │ • مع رمز التحقق             │
        └─────────────┬───────────────┘
                      │
                      ▼
        ┌───────────────────────────────┐
        │   4. إرسال بريد تحقق          │
        │   • رابط التحقق مع الرمز     │
        │   • انتظار زوار المتصفح      │
        └───────────────┬───────────────┘
                        │
                        ▼
              ┌─────────────────────┐
              │   المستخدم يفتح     │
              │   البريد والرابط    │
              └──────────┬──────────┘
                         │
                         ▼
        ┌─────────────────────────────────┐
        │   5. GET /verify-email?token= │
        │   • البحث في pending_registrations│
        │   • التحقق من صلاحية الرمز     │
        └─────────────┬───────────────────┘
                      │
                      ▼
        ┌─────────────────────────────────┐
        │   6. نقل البيانات              │
        │   • إنشاء مستخدم جديد في users │
        │   • ضبط verified = true        │
        │   • حذف من pending_registrations│
        └─────────────┬───────────────────┘
                      │
                      ▼
        ┌─────────────────────────────────┐
        │   7. إعادة التوجيه            │
        │   ← /auth/login?verified=true  │
        │   + حفظ JWT في Cookie         │
        └──────────────┬──────────────────┘
                       │
                       ▼
           ┌──────────────────────────┐
           │   ✅ حساب نشط وجاهز      │
           │   يمكن الدخول مباشرة   │
           └──────────────────────────┘
```

---

## 🔧 الدوال الرئيسية

### 1. `createUnverifiedEmailUser()`
**الملف:** `lib/server/db/users.ts`

```typescript
export async function createUnverifiedEmailUser(input: {
  email: string
  firstName: string
  lastName: string
  passwordHash: string // مشفرة مسبقاً
  verificationToken: string // عشوائية
  verificationTokenExpiry: Timestamp // الصلاحية
  wilaya?: string
  baladia?: string
}): Promise<PendingRegistration>
```

**ما تفعله:**
- ✅ تتحقق من عدم وجود مستخدم مع هذا البريد
- ✅ تتحقق من عدم وجود تسجيل معلق موجود
- ✅ تنشئ تسجيل معلق في `pending_registrations`
- ✅ ترجع بيانات التسجيل المعلق

---

### 2. `findPendingRegistrationByEmail()`
**الملف:** `lib/server/db/users.ts`

```typescript
export async function findPendingRegistrationByEmail(
  identifier: string
): Promise<PendingRegistration | null>
```

**ما تفعله:**
- 🔍 تبحث في `pending_registrations` عن بريد معين
- ✅ ترجع التسجيل المعلق أو null

---

### 3. `verifyEmailToken()`
**الملف:** `lib/server/db/users.ts`

```typescript
export async function verifyEmailToken(
  token: string
): Promise<PendingRegistration | null>
```

**ما تفعله:**
- 🔍 تبحث في `pending_registrations` برمز التحقق
- ⏰ تتحقق من عدم انتهاء صلاحية الرمز
- ✅ ترجع التسجيل المعلق أو null

---

### 4. `markEmailAsVerified()`
**الملف:** `lib/server/db/users.ts`

```typescript
export async function markEmailAsVerified(
  pendingRegistrationId: string
): Promise<DbUser | null>
```

**ما تفعله:**
- 📥 تجلب التسجيل المعلق من `pending_registrations`
- ➕ تنشئ مستخدم جديد في `users` مع `verified: true`
- 🗑️ تحذف التسجيل المعلق
- ✅ ترجع المستخدم الجديد

---

## 📊 تدفق البيانات في API Endpoints

### 1. `POST /api/auth/register`
```
المدخلات:
{
  "firstName": "أحمد",
  "lastName": "علي",
  "email": "user@example.com",
  "password": "myPassword123",
  "wilaya": "الجزائر",
  "baladia": "الجزائر العاصمة"
}

↓ العمليات:
1. التحقق من صحة البيانات (Zod)
2. تشفير كلمة المرور (bcrypt)
3. إنشاء رمز تحقق عشوائي
4. حفظ مؤقتاً في pending_registrations
5. إرسال بريد تحقق

المخرجات:
{
  "success": true,
  "data": {
    "message": "تم إرسال بريد تحقق إلى بريدك الإلكتروني..."
  }
}
```

### 2. `GET /api/auth/verify-email?token=...`
```
المدخلات:
- Token query parameter (من رابط البريد)

↓ العمليات:
1. البحث عن التسجيل المعلق برمز التحقق
2. التحقق من صلاحية الرمز
3. نقل البيانات من pending_registrations إلى users
4. حذف التسجيل المعلق من pending_registrations
5. إنشاء JWT Token
6. إعادة توجيه مع مع Cookie

المخرجات:
- Redirect: /auth/login?verified=true
- Cookie: playSquareToken (JWT)
```

---

## 🛡️ الفوائد الأمنية

✅ **منع Spam:** لا توجد حسابات وهمية في جدول المستخدمين  
✅ **تقليل البيانات:** التسجيلات المعلقة تُحذف تلقائياً بعد 24 ساعة  
✅ **تتبع واضح:** يمكن رصد التسجيلات المعلقة والمتخلى عنها  
✅ **عزل البيانات:** بيانات غير المتحققين منفصلة عن المستخدمين النشطين  

---

## 🔧 إدارة البيانات المعلقة

### حذف التسجيلات المنتهية الصلاحية

يمكن إضافة Cloud Function أو Scheduled Task لحذف التسجيلات التي انتهت صلاحيتها:

```typescript
// مثال (يمكن تشغيله يومياً)
export async function cleanupExpiredPendingRegistrations() {
  const now = Timestamp.now()
  const pendingRef = db.collection('pending_registrations')
  
  const expiredDocs = await pendingRef
    .where('verificationTokenExpiry', '<', now)
    .get()
  
  const batch = db.batch()
  expiredDocs.forEach(doc => {
    batch.delete(doc.ref)
  })
  
  await batch.commit()
  console.log(`Deleted ${expiredDocs.size} expired registrations`)
}
```

---

## 🧪 اختبار النظام

### 1. اختبار التسجيل:
```bash
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "firstName": "تجربة",
  "lastName": "المستخدم",
  "email": "test@example.com",
  "password": "Test123456",
  "wilaya": "الجزائر",
  "baladia": "الجزائر العاصمة"
}
```

### 2. مراقبة قاعدة البيانات:
- تحقق من ظهور السجل في `pending_registrations`
- تأكد من وجود رمز التحقق

### 3. اختبار البريد:
- تحقق من استقبال البريد
- انسخ رابط التحقق

### 4. اختبار التحقق:
```
GET http://localhost:3000/api/auth/verify-email?token=<verification_token>
```

### 5. النتيجة النهائية:
- الحساب يجب أن ينتقل من `pending_registrations` إلى `users`
- يجب حذف التسجيل المعلق
- يجب إعادة التوجيه إلى صفحة تسجيل الدخول

---

## 📝 السجلات (Logs)

تم إضافة سجلات تصحيح مفصلة:

```
[Database] Created pending registration: user@example.com
[Register] Verification link: http://localhost:3000/api/auth/verify-email?token=...
[Mailer] Attempting to send verification email to: user@example.com
[Mailer] Verification email sent successfully to: user@example.com
[VerifyEmail] Attempting to verify token
[Database] Valid verification token found for: user@example.com
[Database] User created from pending registration: user@example.com
[Database] Pending registration deleted: user@example.com
[VerifyEmail] User verified successfully: user@example.com
```

---

## ⚠️ معالجة الأخطاء

| الخطأ | السبب | الحل |
|------|------|------|
| `User already exists` | المستخدم موجود بالفعل في `users` | استخدم بريد مختلف أو قم بتسجيل الدخول |
| `Registration already pending` | تسجيل معلق موجود لهذا البريد | أعد محاولة البريد أو انتظر 24 ساعة |
| `Invalid or expired token` | الرمز غير صحيح أو انتهت صلاحيته | اطلب بريد تحقق جديد |
| `Failed sending verification email` | مشكلة في إرسال البريد (Gmail) | تحقق من بيانات اعتماد Gmail في `.env.local` |

---

## 🚀 الخطوات التالية

1. **اختبار كامل:** تأكد من أن النظام يعمل بسلاسة في بيئة التطوير
2. **إضافة صفحة إعادة الإرسال:** اسمح للمستخدمين بإعادة إرسال البريد
3. **تنظيف تلقائي:** قم بإعداد Cloud Function لحذف التسجيلات المنتهية
4. **تحسينات تجربة المستخدم:** أضف صفحة انتظار واضحة بعد التسجيل

---

**تم التحديث:** مارس 27، 2026  
**الإصدار:** 2.0 - نمط Pending Registrations
