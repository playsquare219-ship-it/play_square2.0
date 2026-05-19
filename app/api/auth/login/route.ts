import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyEmailPassword, dbUserToAppUser } from '@/lib/server/db/users';
import { generateToken } from '@/lib/server/auth/jwt';
import { ApiResponse, LoginInput } from '@/types';

const loginSchema = z.object({
  email: z.string().email('البريد الإلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل')
});

export async function POST(request: NextRequest) {
  try {
    const body: LoginInput = await request.json();
    
    // التحقق من صحة المدخلات
    const validatedData = loginSchema.parse(body);
    
    // التحقق من المستخدم في Firestore
    const dbUser = await verifyEmailPassword(
      validatedData.email,
      validatedData.password
    );
    
    if (!dbUser) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }
    
    // تحويل إلى AppUser
    const user = dbUserToAppUser(dbUser);
    
    // إنشاء JWT Token
    const token = generateToken(user.id, user.phoneOrEmail);
    
    // إعداد الـ Cookie
    const response = NextResponse.json<ApiResponse>({
      success: true,
      data: { user, token }
    });
    
    response.cookies.set('playSquareToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7
    });
    
    return response;
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    
    console.error('Login error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}