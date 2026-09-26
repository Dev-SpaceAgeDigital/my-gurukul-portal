import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, alumni, masterAdmins } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyTotpToken } from '@/lib/auth/totp2fa';

export async function POST(req: Request) {
  try {
    const { email, role, secret, token, backupCodes } = await req.json();

    if (!email || !secret || !token) {
      return NextResponse.json({ error: 'Email, secret, and 6-digit TOTP code required' }, { status: 400 });
    }

    const isValid = verifyTotpToken(secret, token);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid 6-digit authenticator code' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (role === 'SUPER_MASTER_ADMIN') {
      await db
        .update(masterAdmins)
        .set({
          twoFactorSecret: secret,
          twoFactorEnabled: true,
          backupCodes: backupCodes || [],
        })
        .where(eq(masterAdmins.email, cleanEmail));
    } else if (role === 'ALUMNI') {
      await db
        .update(alumni)
        .set({
          twoFactorSecret: secret,
          twoFactorEnabled: true,
          backupCodes: backupCodes || [],
        })
        .where(eq(alumni.email, cleanEmail));
    } else {
      await db
        .update(users)
        .set({
          twoFactorSecret: secret,
          twoFactorEnabled: true,
          backupCodes: backupCodes || [],
        })
        .where(eq(users.email, cleanEmail));
    }

    return NextResponse.json({
      success: true,
      message: '2FA has been successfully enabled for your account.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
