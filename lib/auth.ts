import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import pool from '@/lib/db';

const SESSION_SECRET_STR = process.env.SESSION_SECRET || 'default_super_secure_session_secret_32_characters_long_min';
const JWT_SECRET_STR = process.env.JWT_SECRET || 'default_super_secure_jwt_secret_32_characters_long_min';

const SESSION_SECRET = new TextEncoder().encode(SESSION_SECRET_STR);
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STR);

export type UserRole = 'SUPER_ADMIN' | 'SUB_ADMIN' | 'ALUMNI';

export interface AuthSession {
  userId: string;
  role: UserRole;
  email: string;
  schoolId?: string;
  trustId?: string;
  tokenVersion?: number;
}

// Password utility
export async function hashPassword(password: string) {
  return await bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string) {
  return await bcrypt.compare(password, hash);
}

// Session management (for Admins - 30 days when rememberMe is true)
export async function encryptSession(payload: AuthSession, rememberMe: boolean = true) {
  const expiry = rememberMe ? '30d' : '24h';
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiry)
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

// JWT management (for Alumni - 30 days when rememberMe is true)
export async function createAlumniToken(payload: AuthSession, rememberMe: boolean = true) {
  const expiry = rememberMe ? '30d' : '24h';
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiry)
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

// Cookie helpers (30 days default persistence)
export async function setSessionCookie(token: string, role: UserRole, rememberMe: boolean = true) {
  const cookieStore = await cookies();

  // Clear other session cookies to prevent multi-session conflicts (shadowing)
  Object.keys(COOKIE_NAMES).forEach((key) => {
    const r = key as UserRole;
    if (r !== role) {
      cookieStore.delete(COOKIE_NAMES[r]);
    }
  });

  const cookieName = COOKIE_NAMES[role];
  const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24; // 30 days vs 24 hours

  cookieStore.set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  });
}

/**
 * Validates session and checks tokenVersion in DB to support the password-reset Kill Switch
 */
async function validateTokenVersion(session: AuthSession | null): Promise<AuthSession | null> {
  if (!session) return null;
  if (!session.tokenVersion) return session; // Backward compatibility with active legacy sessions

  try {
    if (session.role === 'ALUMNI') {
      const res = await pool.query('SELECT "tokenVersion", "status" FROM "Alumni" WHERE id = $1 LIMIT 1', [session.userId]);
      if (res.rows.length === 0) return null;
      const currentVersion = res.rows[0].tokenVersion ?? 1;
      if (currentVersion !== session.tokenVersion) return null;
    } else {
      const res = await pool.query('SELECT "tokenVersion", "status" FROM "User" WHERE id = $1 LIMIT 1', [session.userId]);
      if (res.rows.length === 0) return null;
      if (res.rows[0].status && res.rows[0].status !== 'ACTIVE') return null;
      const currentVersion = res.rows[0].tokenVersion ?? 1;
      if (currentVersion !== session.tokenVersion) return null;
    }
  } catch {
    // If DB check fails intermittently, preserve valid decrypted session
  }

  return session;
}

export async function getSessionFromCookies(role: UserRole | 'ADMIN') {
  const cookieStore = await cookies();
  
  if (role === 'ADMIN') {
    // Prioritize SUPER_ADMIN check over SUB_ADMIN to avoid privilege shadowing issues
    const superadminToken = cookieStore.get(COOKIE_NAMES.SUPER_ADMIN)?.value;
    if (superadminToken) {
      const session = await decryptSession(superadminToken);
      if (session) {
        const validated = await validateTokenVersion(session);
        if (validated) return validated;
      }
    }
    const subadminToken = cookieStore.get(COOKIE_NAMES.SUB_ADMIN)?.value;
    if (subadminToken) {
      const session = await decryptSession(subadminToken);
      if (session) {
        const validated = await validateTokenVersion(session);
        if (validated) return validated;
      }
    }
    return null;
  }

  const cookieName = COOKIE_NAMES[role];
  const token = cookieStore.get(cookieName)?.value;
  if (!token) return null;

  let session: AuthSession | null = null;
  if (role === 'ALUMNI') {
    session = await verifyAlumniToken(token);
  } else {
    session = await decryptSession(token);
  }

  return await validateTokenVersion(session);
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAMES.SUPER_ADMIN);
  cookieStore.delete(COOKIE_NAMES.SUB_ADMIN);
  cookieStore.delete(COOKIE_NAMES.ALUMNI);
}
