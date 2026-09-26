import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Valid token is required' }, { status: 400 });
    }

    let session = await getSessionFromCookies('ADMIN');
    if (!session) {
      session = await getSessionFromCookies('ALUMNI');
    }

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Ensure UserFcmToken table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "UserFcmToken" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" TEXT NOT NULL,
        "role" VARCHAR(50) NOT NULL,
        token TEXT NOT NULL UNIQUE,
        "createdAt" TIMESTAMPTZ DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Upsert FCM Token
    await pool.query(
      `
        INSERT INTO "UserFcmToken" ("userId", "role", token, "updatedAt")
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (token)
        DO UPDATE SET "userId" = EXCLUDED."userId", "role" = EXCLUDED."role", "updatedAt" = NOW()
      `,
      [session.userId, session.role, token]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save FCM token error:', error);
    return NextResponse.json({ error: 'Failed to save token' }, { status: 500 });
  }
}
