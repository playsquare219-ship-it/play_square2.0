import { NextRequest, NextResponse } from 'next/server';
import { verifyGoogleIdToken } from '@/lib/server/firebase/admin';
import { createOrUpdateGoogleUser, dbUserToAppUser } from '@/lib/server/db/users';
import { generateToken } from '@/lib/server/auth/jwt';
import { sendWelcomeEmail } from '@/lib/server/email/mailer';
import { ApiResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idToken } = body;
    
    if (!idToken) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No token provided' },
        { status: 400 }
      );
    }
    
    // التحقق من التوكن مع Firebase Admin واستخراج بيانات المستخدم من التوكن
    const decodedToken = await verifyGoogleIdToken(idToken);
    
    if (!decodedToken || !decodedToken.email) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    // استخراج بيانات المستخدم من التوكن المُتحقق منه (أكثر أماناً من بيانات العميل)
    const nameParts = (decodedToken.name || '')?.split(' ') || [];
    const firstName = nameParts[0] || decodedToken.email.split('@')[0];
    const lastName = nameParts.slice(1).join(' ') || '';
    
    // إنشاء أو تحديث المستخدم في Firestore
    const isNewUser = await checkIfUserExists(decodedToken.email);
    const dbUser = await createOrUpdateGoogleUser({
      email: decodedToken.email,
      firstName,
      lastName,
      photoURL: decodedToken.picture || undefined,
    });
    
    // إرسال بريد ترحيب إذا كان مستخدم جديد
    if (!isNewUser) {
      await sendWelcomeEmail(dbUser.email, firstName, 'google');
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
    console.error('Google auth error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'فشل تسجيل الدخول بـ Google' },
      { status: 500 }
    );
  }
}

// دالة مساعدة للتحقق من وجود المستخدم
async function checkIfUserExists(email: string): Promise<boolean> {
  const { findUserByEmail } = await import('@/lib/server/db/users');
  const user = await findUserByEmail(email);
  return !!user;
}