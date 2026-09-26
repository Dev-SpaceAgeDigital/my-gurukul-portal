import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';
import { ensureCareerTables } from '@/lib/ensureCareerTables';

export async function POST(request: Request) {
  try {
    await ensureCareerTables();

    const session = await getSessionFromCookies('ALUMNI');
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const alumniId = (session as any).alumniId || session.userId;
    const { careerId, interestType } = await request.json();

    if (!careerId || !interestType) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    if (!['INTERESTED', 'REFERRAL_CONTACT'].includes(interestType)) {
      return NextResponse.json({ error: 'Invalid interest type' }, { status: 400 });
    }

    // Check existing record
    const existing = await pool.query(
      'SELECT id FROM "CareerInterest" WHERE "careerId" = $1 AND "alumniId" = $2 AND "interestType" = $3',
      [careerId, alumniId, interestType]
    );

    let active = false;

    if (existing.rows.length > 0) {
      // Toggle off (remove)
      await pool.query(
        'DELETE FROM "CareerInterest" WHERE "careerId" = $1 AND "alumniId" = $2 AND "interestType" = $3',
        [careerId, alumniId, interestType]
      );
      active = false;
    } else {
      // Toggle on (insert)
      await pool.query(
        'INSERT INTO "CareerInterest" ("careerId", "alumniId", "interestType") VALUES ($1, $2, $3)',
        [careerId, alumniId, interestType]
      );
      active = true;
    }

    // Count updated totals
    const countRes = await pool.query(
      'SELECT COUNT(*)::int as count FROM "CareerInterest" WHERE "careerId" = $1 AND "interestType" = $2',
      [careerId, interestType]
    );

    const updatedCount = countRes.rows[0]?.count || 0;

    return NextResponse.json({
      success: true,
      active,
      count: updatedCount,
      interestType,
    });
  } catch (error) {
    console.error('Error toggling career interest:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
