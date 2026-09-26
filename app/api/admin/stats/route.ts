import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSessionFromCookies('SUPER_ADMIN');
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM "User") as "totalUsers",
        (SELECT COUNT(*) FROM "Trust") as "activeTrusts",
        (SELECT COUNT(*) FROM "School") as "totalSchools",
        (SELECT COUNT(*) FROM "Alumni") as "alumniBase"
    `;

    const result = await pool.query(statsQuery);
    const stats = result.rows[0];

    // Convert counts to numbers
    return NextResponse.json({
      totalUsers: parseInt(stats.totalUsers),
      activeTrusts: parseInt(stats.activeTrusts),
      totalSchools: parseInt(stats.totalSchools),
      alumniBase: parseInt(stats.alumniBase)
    });

  } catch (error: any) {
    console.error('Failed to fetch admin stats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
