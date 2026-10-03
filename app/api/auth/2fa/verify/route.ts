import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, alumni, masterAdmins } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyTotpToken, verifyBackupCode } from '@/lib/auth/totp2fa';
import { createAlumniToken, encryptSession, setSessionCookie, type UserRole } from '@/lib/auth';

const redirectMap: Record<UserRole, string> = {
  SUPER_ADMIN: '/superadmin/dashboard',
  SUB_ADMIN: '/subadmin/dashboard',
  ALUMNI: '/alumni/dashboard',
};

export async function POST(req: Request) {
  try {
    const { email, role, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and 2FA code / Backup Code required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = String(code).trim();

    let account: any = null;
    let tableType: 'masterAdmin' | 'alumni' | 'user' = 'user';

    if (role === 'SUPER_MASTER_ADMIN') {
      const [ma] = await db.select().from(masterAdmins).where(eq(masterAdmins.email, cleanEmail)).limit(1);
      account = ma;
      tableType = 'masterAdmin';
    } else if (role === 'ALUMNI') {
      const [al] = await db.select().from(alumni).where(eq(alumni.email, cleanEmail)).limit(1);
      account = al;
      tableType = 'alumni';
    } else {
      const [u] = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);
      account = u;
      tableType = 'user';
    }

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    if (!account.twoFactorEnabled || !account.twoFactorSecret) {
      return NextResponse.json({ error: '2FA is not enabled for this account' }, { status: 400 });
    }

    // Try TOTP token verification first (6 digits)
    let isValid = verifyTotpToken(account.twoFactorSecret, cleanCode);

    // If TOTP verification fails, attempt backup code verification
    if (!isValid && Array.isArray(account.backupCodes)) {
      const backupResult = verifyBackupCode(account.backupCodes, cleanCode);
      if (backupResult.valid) {
        isValid = true;
        // Consume backup code by updating remaining codes list
        if (tableType === 'masterAdmin') {
          await db.update(masterAdmins).set({ backupCodes: backupResult.remainingCodes }).where(eq(masterAdmins.email, cleanEmail));
        } else if (tableType === 'alumni') {
          await db.update(alumni).set({ backupCodes: backupResult.remainingCodes }).where(eq(alumni.email, cleanEmail));
        } else {
          await db.update(users).set({ backupCodes: backupResult.remainingCodes }).where(eq(users.email, cleanEmail));
        }
      }
    }

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid 6-digit Authenticator code or Backup Code' }, { status: 401 });
    }

    // Set Session Cookie for authenticated user (30 days default)
    const targetRole = (role === 'ALUMNI' ? 'ALUMNI' : (account.role || role || 'SUB_ADMIN')) as UserRole;
    let redirectTo = redirectMap[targetRole] || '/alumni/dashboard';
    const rememberMe = true;

    if (targetRole === 'ALUMNI') {
      const token = await createAlumniToken({
        userId: account.id,
        role: 'ALUMNI',
        email: account.email,
        schoolId: account.schoolId,
        tokenVersion: account.tokenVersion ?? 1,
      }, rememberMe);
      await setSessionCookie(token, 'ALUMNI', rememberMe);
    } else if (targetRole === 'SUB_ADMIN' || targetRole === 'SUPER_ADMIN') {
      const token = await encryptSession({
        userId: account.id,
        role: targetRole,
        email: account.email,
        schoolId: account.schoolId,
        tokenVersion: account.tokenVersion ?? 1,
      }, rememberMe);
      await setSessionCookie(token, targetRole, rememberMe);
    }

    return NextResponse.json({
      success: true,
      redirectTo,
      user: {
        id: account.id,
        name: account.name,
        email: account.email,
        role: targetRole,
        schoolId: account.schoolId || null,
      },
    });
  } catch (error: any) {
    console.error('2FA verification error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
