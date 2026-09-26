import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSessionFromCookies('ALUMNI');
    if (!session || session.role !== 'ALUMNI') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const result = await pool.query(`
      SELECT a.id, a.name, a.email, a."batchYear", a."linkedIn", a."profilePic", a."currentTitle", a."currentBio", a."workLink", a.industry, a.phone, a."countryCode", a.country, a.state, a.city, s."schoolName"
      FROM "Alumni" a
      LEFT JOIN "School" s ON a."schoolId" = s.id
      ORDER BY a.name ASC
    `);

    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error('Fetch alumni directory error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
