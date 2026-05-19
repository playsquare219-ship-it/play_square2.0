import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Timestamp } from 'firebase-admin/firestore';
import { createUnverifiedEmailUser } from '@/lib/server/db/users';
import { sendVerificationEmail } from '@/lib/server/email/mailer';
import { ApiResponse, RegisterInput } from '@/types';

const registerSchema = z.object({
  firstName: z.string().min(2, 'الاسم الأول يجب أن يكون حرفين على الأقل'),
  lastName: z.string().min(2, 'الاسم الأخير يجب أن يكون حرفين على الأقل'),
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
  phone: z.string().optional(),
  wilaya: z.string().optional(),
  baladia: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const body: RegisterInput = await request.json();
    
    // التحقق من صحة المدخلات
    const validatedData = registerSchema.parse(body);
    
    // تشفير كلمة المرور
    const passwordHash = await bcrypt.hash(validatedData.password, 10);
    
    // إنشاء رمز التحقق (token عشوائي)
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    // حساب انتهاء الصلاحية (24 ساعة)
    const verificationTokenExpiry = Timestamp.fromDate(
      new Date(Date.now() + 24 * 60 * 60 * 1000)
    );
    
    // إنشاء المستخدم بحالة غير مفعّلة
    const dbUser = await createUnverifiedEmailUser({
      email: validatedData.email,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      passwordHash,
      verificationToken,
      verificationTokenExpiry,
      wilaya: validatedData.wilaya,
      baladia: validatedData.baladia,
    });
    
    // بناء رابط التحقق
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `http://localhost:3000`;
    const verificationLink = `${baseUrl}/api/auth/verify-email?token=${verificationToken}`;
    
    console.log('[Register] Verification link:', verificationLink);
    console.log('[Register] Email user configured:', !!process.env.EMAIL_USER);
    console.log('[Register] Sending email to:', validatedData.email);
    
    // إرسال بريد التحقق
    const emailSent = await sendVerificationEmail(
      validatedData.email,
      validatedData.firstName,
      verificationLink
    );
    
    console.log('[Register] Email send result:', emailSent);
    
    if (!emailSent) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'فشل إرسال بريد التحقق' },
        { status: 500 }
      );
    }
    
    return NextResponse.json<ApiResponse>({
      success: true,
      data: { 
        message: 'تم إرسال بريد تحقق إلى بريدك الإلكتروني. يرجى التحقق من البريد لإكمال التسجيل.' 
      }
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    
    console.error('Registration error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: error instanceof Error ? error.message : 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}