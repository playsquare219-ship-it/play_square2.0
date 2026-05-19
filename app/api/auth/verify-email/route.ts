import { NextRequest, NextResponse } from 'next/server';
import { verifyEmailToken, markEmailAsVerified, dbUserToAppUser } from '@/lib/server/db/users';
import { generateToken } from '@/lib/server/auth/jwt';
import { ApiResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    if (!token) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'لم يتم توفير رمز التحقق' },
        { status: 400 }
      );
    }
    
    console.log('[VerifyEmail] Attempting to verify token');
    
    // التحقق من صحة الرمز في pending_registrations
    const pending = await verifyEmailToken(token);
    
    if (!pending) {
      console.log('[VerifyEmail] Invalid or expired token');
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'رمز التحقق غير صحيح أو منتهي الصلاحية' },
        { status: 401 }
      );
    }
    
    console.log('[VerifyEmail] Valid token found for:', pending.email);
    
    // نقل بيانات المستخدم من pending_registrations إلى users
    const verifiedUser = await markEmailAsVerified(pending.id);
    
    if (!verifiedUser) {
      console.log('[VerifyEmail] Failed to verify user');
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'فشل التحقق من البريد' },
        { status: 500 }
      );
    }
    
    console.log('[VerifyEmail] User verified successfully:', pending.email);
    
    // إنشاء JWT Token لتسجيل الدخول التلقائي
    const appUser = dbUserToAppUser(verifiedUser);
    const jwtToken = generateToken(appUser.id, appUser.phoneOrEmail);
    
    // إعادة توجيه لصفحة تسجيل الدخول مع رسالة نجاح
    const response = NextResponse.redirect(new URL('/auth/login?verified=true', request.url));
    
    // حفظ الـ Token في Cookie
    response.cookies.set('playSquareToken', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7
    });
    
    return response;
    
  } catch (error) {
    console.error('[VerifyEmail] Error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'حدث خطأ أثناء التحقق' },
      { status: 500 }
    );
  }
}
