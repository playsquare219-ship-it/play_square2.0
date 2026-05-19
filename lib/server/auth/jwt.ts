import jwt from 'jsonwebtoken';
import { SessionData } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = '7d';

// الدوال الموجودة
export function generateToken(userId: string, email: string): string {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyToken(token: string): SessionData | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SessionData;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function decodeToken(token: string): SessionData | null {
  try {
    const decoded = jwt.decode(token) as SessionData;
    return decoded;
  } catch (error) {
    return null;
  }
}

// ✅ إضافة الدوال المطلوبة بواسطة session.ts
export function signSessionJwt(payload: { userId: string; email: string }): string {
  return generateToken(payload.userId, payload.email);
}

export function verifySessionJwt(token: string): { userId: string; email: string } | null {
  return verifyToken(token);
}