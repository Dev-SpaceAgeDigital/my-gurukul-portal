import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, alumni, masterAdmins } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const { email, role } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (role === 'SUPER_MASTER_ADMIN') {
      await db
        .update(masterAdmins)
        .set({
          twoFactorSecret: null,
          twoFactorEnabled: false,
          backupCodes: null,
        })
        .where(eq(masterAdmins.email, cleanEmail));
    } else if (role === 'ALUMNI') {
      await db
        .update(alumni)
        .set({
          twoFactorSecret: null,
          twoFactorEnabled: false,
          backupCodes: null,
        })
        .where(eq(alumni.email, cleanEmail));
    } else {
      await db
        .update(users)
        .set({
          twoFactorSecret: null,
          twoFactorEnabled: false,
          backupCodes: null,
        })
        .where(eq(users.email, cleanEmail));
    }

    return NextResponse.json({
      success: true,
      message: '2FA has been disabled.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
