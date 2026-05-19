# المقارنة بين النظام القديم والنظام الجديد

## 🔴 المشكلة في النظام القديم

### ❌ الهيكل القديم:
```
التسجيل → حفظ مباشرة في جدول users (بدون verified)
         ↓
         إرسال بريد تحقق
         ↓
         عند الضغط على الرابط:
         تحديث verified = true

مشاكل:
❌ إذا لم يتحقق المستخدم، يبقى الحساب في جدول users
❌ يؤدي إلى تضخيم البيانات بحسابات وهمية
❌ صعوبة تنظيف التسجيلات المتخلى عنها
❌ الإحصائيات غير دقيقة (المستخدمين الحقيقين مقابل غير المفعلين)
```

### مثال على المشكلة:

```firestore
// جدول users الواحد
users/
├── user_1 { email: "verified@example.com", verified: true }
├── user_2 { email: "unverified@example.com", verified: false }  ← مشكلة!
├── user_3 { email: "spam@example.com", verified: false }        ← مشكلة!
└── user_4 { email: "abandoned@example.com", verified: false }   ← مشكلة!
```

---

## ✅ الحل: نمط Pending Registrations

### ✅ النظام الجديد:
```
التسجيل → حفظ مؤقتاً في جدول pending_registrations فقط
         ↓
         إرسال بريد تحقق
         ↓
         عند الضغط على الرابط:
         نقل البيانات من pending_registrations إلى users
         حذف من pending_registrations

مزايا:
✅ جدول users يحتوي فقط على حسابات مفعلة
✅ إمكانية تنظيف سهلة للتسجيلات المعلقة
✅ بيانات نظيفة وموثوقة
✅ فصل واضح بين مراحل دورة الحياة
```

### مثال على الحل:

```firestore
// جدول users - فقط الحسابات النشطة
users/
├── user_1 { email: "verified1@example.com", verified: true }
├── user_2 { email: "verified2@example.com", verified: true }
└── user_3 { email: "verified3@example.com", verified: true }

// جدول pending_registrations - التسجيلات المعلقة فقط
pending_registrations/
├── pending_1 { email: "waiting1@example.com", verificationToken: "..." }
├── pending_2 { email: "waiting2@example.com", verificationToken: "..." }
└── pending_3 { email: "abandoned@example.com", verificationToken: "..." }
```

---

## 📊 جدول المقارنة التفصيلي

| الجانب | النظام القديم | النظام الجديد |
|--------|-------|--------|
| **مكان حفظ البيانات** | جدول users مباشرة (verified=false) | جدول pending_registrations مؤقتاً |
| **عدد الجداول** | 1 (users فقط) | 2 (users + pending_registrations) |
| **بيانات جدول users** | مخلوطة (مفعلة + غير مفعلة) | نظيفة (مفعلة فقط) |
| **الحسابات الوهمية** | موجودة في جدول users | معزولة في جدول منفصل |
| **تنظيف التسجيلات** | صعب (حذف من users) | سهل (حذف من pending_registrations) |
| **الإحصائيات** | غير دقيقة | دقيقة جداً |
| **سرعة الاستعلام** | قد تكون بطيئة (تصفية verified=true) | سريعة جداً |
| **الأمان** | معرض للهجمات (spam users) | محمي بشكل أفضل |

---

## 🔄 الفروقات في التدفق

### الدوال المتغيرة:

#### 1. `createUnverifiedEmailUser()`

**📌 النسخة القديمة:**
```typescript
// ترجع DbUser مباشرة
export async function createUnverifiedEmailUser(...): Promise<DbUser> {
  // حفظ في جدول users
  await userRef.set({
    ...newUser,
    verified: false  // ← غير مفعل في نفس الجدول
  })
  return { id: userId, ...newUser }
}
```

**📌 النسخة الجديدة:**
```typescript
// ترجع PendingRegistration
export async function createUnverifiedEmailUser(...): Promise<PendingRegistration> {
  // حفظ في جدول pending_registrations
  await regRef.set({...newPending})
  return { id: registrationId, ...newPending }
}
```

---

#### 2. `verifyEmailToken()`

**📌 النسخة القديمة:**
```typescript
// يبحث في جدول users ويرجع DbUser
export async function verifyEmailToken(token: string): Promise<DbUser | null> {
  const usersRef = db.collection("users")
  const querySnapshot = await usersRef
    .where("verificationToken", "==", token)
    .get()
  // نسبة أمان منخفضة: mixed data
  return user
}
```

**📌 النسخة الجديدة:**
```typescript
// يبحث في جدول pending_registrations ويرجع PendingRegistration
export async function verifyEmailToken(token: string): Promise<PendingRegistration | null> {
  const registrationsRef = db.collection("pending_registrations")
  const querySnapshot = await registrationsRef
    .where("verificationToken", "==", token)
    .get()
  // نسبة أمان عالية: بيانات منفصلة
  return pending
}
```

---

#### 3. `markEmailAsVerified()`

**📌 النسخة القديمة:**
```typescript
// يحدث سجل موجود في جدول users
export async function markEmailAsVerified(userId: string): Promise<DbUser | null> {
  await userRef.update({
    verified: true,  // ← تحديث Flag فقط
    verificationToken: null,
    verificationTokenExpiry: null
  })
  // ترجع البيانات المحدثة من نفس الجدول
  return updatedDoc
}
```

**📌 النسخة الجديدة:**
```typescript
// ينقل البيانات من جدول إلى آخر
export async function markEmailAsVerified(pendingRegistrationId: string): Promise<DbUser | null> {
  // 1. جلب البيانات من pending_registrations
  const pending = await pendingRef.get()
  
  // 2. إنشاء مستخدم جديد في users
  await userRef.set({
    ...newUser,
    verified: true,  // ← مفعل مباشرة
    createdAt: pending.createdAt  // ← احتفاظ بوقت الإنشاء الأصلي
  })
  
  // 3. حذف التسجيل المعلق
  await pendingRef.delete()
  
  return { id: userId, ...newUser }
}
```

---

## 💾 تأثير قاعدة البيانات

### حجم البيانات:

| النظام | جدول users | جدول pending_registrations | المجموع |
|--------|----------|--------------------------|--------|
| **القديم** | ✅ 1000 مستخدم (500 مفعل + 500 معلق) | ❌ - | 1000 |
| **الجديد** | ✅ 500 مستخدم (مفعلين فقط) | ℹ️ 500 معلق | 1000 |

**النتيجة:** نفس الحجم الإجمالي، لكن **بيانات أنظف** و**أفضل أداءً**

---

## 🧪 سيناريوهات الاختبار

### السيناريو 1: المستخدم المسؤول ✅

```
1. يملا نموذج التسجيل
2. يتلقى بريد تحقق
3. يضغط على الرابط
4. يتم إنشاء حسابه في users
5. يمكنه تسجيل الدخول

✅ الحالة النهائية:
- جدول users: ✓ (يحتوي على حساب نشط)
- جدول pending_registrations: ✗ (فارغ)
```

### السيناريو 2: المستخدم الذي ينسى البريد ⏰

```
1. يملا نموذج التسجيل
2. يتلقى بريد تحقق
3. لا يضغط على الرابط
4. ينتظر 24 ساعة
5. تنتهي صلاحية الرمز

⏱️ الحالة النهائية (القديم):
- جدول users: ✓ غير مفعل (يشغل مساحة)

✅ الحالة النهائية (الجديد):
- جدول pending_registrations: يمكن حذفه تلقائياً
- جدول users: ✗ (فارغ - لا يوجد حساب)
```

### السيناريو 3: محاولة Spam 🚫

```
المهاجم يرسل 1000 بريد تسجيل مختلف

❌ النظام القديم:
- جدول users: ⬆️ 1000 سجل وهمي (يلوث البيانات)

✅ النظام الجديد:
- جدول pending_registrations: 1000 سجل معلق
- جدول users: ✗ (نام) - لا يتأثر
- يمكن حذف pending_registrations بسهولة
```

---

## 📈 الفوائد طويلة الأجل

### 1. **سهولة التحليلات**
```typescript
// جدول users يحتوي فقط على مستخدمين حقيقيين
const realUsersCount = await db.collection("users").count().get()
// النتيجة دقيقة 100%
```

### 2. **تنظيف سهل**
```typescript
// حذف التسجيلات القديمة بدون التأثير على المستخدمين الحقيقيين
const expired = await db.collection("pending_registrations")
  .where("verificationTokenExpiry", "<", now)
  .get()
batch.delete(...)  // آمن تماماً
```

### 3. **سرعة استعلامات المستخدمين**
```typescript
// لا حاجة لتصفية verified = true
const user = await findUserByEmail("user@example.com")
// النتيجة مضمونة أنها مفعلة
```

### 4. **أمان أفضل**
- بيانات منفصلة = حماية أفضل
- يمكن تطبيق قوانين Firestore مختلفة لكل جدول
- سهولة إضافة معالجات خاصة للتسجيلات المعلقة

---

## 🚀 الخلاصة

| النقطة | الفائدة |
|--------|--------|
| **النظافة** | جدول users نظيف جداً |
| **الأداء** | استعلامات أسرع |
| **الأمان** | حماية أفضل من Spam |
| **سهولة الإدارة** | تنظيف بسيط |
| **الموثوقية** | إحصائيات دقيقة |

---

**التحديث:** مارس 27، 2026
