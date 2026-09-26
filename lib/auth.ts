import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

const SESSION_SECRET_STR = process.env.SESSION_SECRET;
const JWT_SECRET_STR = process.env.JWT_SECRET;

if (!SESSION_SECRET_STR || SESSION_SECRET_STR.length < 32) {
  throw new Error('SESSION_SECRET must be at least 32 characters long and set in environment variables.');
}
if (!JWT_SECRET_STR || JWT_SECRET_STR.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long and set in environment variables.');
}

const SESSION_SECRET = new TextEncoder().encode(SESSION_SECRET_STR);
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STR);

export type UserRole = 'SUPER_ADMIN' | 'SUB_ADMIN' | 'ALUMNI';

export interface AuthSession {
  userId: string;
  role: UserRole;
  email: string;
  schoolId?: string;
}

// Password utility
export async function hashPassword(password: string) {
  return await bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string) {
  return await bcrypt.compare(password, hash);
}

// Session management (for Admins)
export async function encryptSession(payload: AuthSession) {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(SESSION_SECRET);
}

export async function decryptSession(token: string) {
  try {
    const { payload } = await jwtVerify(token, SESSION_SECRET, {
      algorithms: ['HS256'],
    });
    return payload as unknown as AuthSession;
  } catch (error) {
    return null;
  }
}

// JWT management (for Alumni)
export async function createAlumniToken(payload: AuthSession) {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('12h')
    .sign(JWT_SECRET);
}

export async function verifyAlumniToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    });
    return payload as unknown as AuthSession;
  } catch (error) {
    return null;
  }
}

const COOKIE_NAMES: Record<UserRole, string> = {
  SUPER_ADMIN: 'superadmin-session',
  SUB_ADMIN: 'subadmin-session',
  ALUMNI: 'alumni-token'
};

// Cookie helpers
export async function setSessionCookie(token: string, role: UserRole) {
    const cookieStore = await cookies();

    // Clear other session cookies to prevent multi-session conflicts (shadowing)
    Object.keys(COOKIE_NAMES).forEach((key) => {
        const r = key as UserRole;
        if (r !== role) {
            cookieStore.delete(COOKIE_NAMES[r]);
        }
    });

    const cookieName = COOKIE_NAMES[role];
    cookieStore.set(cookieName, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: role === 'ALUMNI' ? 60 * 60 * 12 : 60 * 60 * 24, // 12h for alumni, 24h for admins
    });
}

export async function getSessionFromCookies(role: UserRole | 'ADMIN') {
    const cookieStore = await cookies();
    
    if (role === 'ADMIN') {
        // Prioritize SUPER_ADMIN check over SUB_ADMIN to avoid privilege shadowing issues
        const superadminToken = cookieStore.get(COOKIE_NAMES.SUPER_ADMIN)?.value;
        if (superadminToken) {
            const session = await decryptSession(superadminToken);
            if (session) return session;
        }
        const subadminToken = cookieStore.get(COOKIE_NAMES.SUB_ADMIN)?.value;
        if (subadminToken) {
            const session = await decryptSession(subadminToken);
            if (session) return session;
        }
        return null;
    }

    const cookieName = COOKIE_NAMES[role];
    const token = cookieStore.get(cookieName)?.value;
    if (!token) return null;

    if (role === 'ALUMNI') {
        return await verifyAlumniToken(token);
    } else {
        return await decryptSession(token);
    }
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAMES.SUPER_ADMIN);
    cookieStore.delete(COOKIE_NAMES.SUB_ADMIN);
    cookieStore.delete(COOKIE_NAMES.ALUMNI);
}
