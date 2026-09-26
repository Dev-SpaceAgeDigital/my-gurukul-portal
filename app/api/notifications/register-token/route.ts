import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';

// Ensure the UserFcmToken table exists (the single source-of-truth read by sendPushToUsers)
async function ensureUserFcmTokenTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "UserFcmToken" (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "userId" TEXT NOT NULL,
      "role" VARCHAR(50) NOT NULL,
      token TEXT NOT NULL UNIQUE,
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS "UserFcmToken_userId_idx" ON "UserFcmToken" ("userId")
  `);
}

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Valid FCM token is required' }, { status: 400 });
    }

    await ensureUserFcmTokenTable();

    // 1. Check ADMIN session (SUPER_ADMIN or SUB_ADMIN)
    let session = await getSessionFromCookies('ADMIN');
    if (session) {
      const role = session.role; // 'SUPER_ADMIN' | 'SUB_ADMIN'

      // Upsert into UserFcmToken — this is the table sendPushToUsers() reads from
      await pool.query(
        `INSERT INTO "UserFcmToken" ("userId", "role", token, "updatedAt")
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (token) DO UPDATE
           SET "userId" = $1, "role" = $2, "updatedAt" = NOW()`,
        [session.userId, role, token]
      );

      return NextResponse.json({ success: true, role });
    }

    // 2. Check ALUMNI session
    session = await getSessionFromCookies('ALUMNI');
    if (session) {
      await pool.query(
        `INSERT INTO "UserFcmToken" ("userId", "role", token, "updatedAt")
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (token) DO UPDATE
           SET "userId" = $1, "role" = $2, "updatedAt" = NOW()`,
        [session.userId, 'ALUMNI', token]
      );

      return NextResponse.json({ success: true, role: 'ALUMNI' });
    }

    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  } catch (error: any) {
    console.error('Save FCM Token Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
