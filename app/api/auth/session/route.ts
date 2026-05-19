import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/server/auth/jwt';
import { findUserById, dbUserToAppUser } from '@/lib/server/db/users';
import { ApiResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('playSquareToken')?.value;
    
    if (!token) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'No session found' },
        { status: 401 }
      );
    }
    
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Invalid session' },
        { status: 401 }
      );
    }
    
    const dbUser = await findUserById(decoded.userId);
    
    if (!dbUser) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'User not found' },
        { status: 401 }
      );
    }
    
    const user = dbUserToAppUser(dbUser);
    
    return NextResponse.json<ApiResponse>({
      success: true,
      data: { user }
    });
    
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Failed to get session' },
      { status: 500 }
    );
  }
}