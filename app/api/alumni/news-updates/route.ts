import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function isMissingNewsTable(error: any) {
  return error?.code === '42P01' || String(error?.message || '').includes('NewsUpdate');
}

export async function GET() {
  try {
    const session = await getSessionFromCookies('ALUMNI');
    if (!session || session.role !== 'ALUMNI') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const result = await pool.query(`
      SELECT
        n.id,
        n.title,
        n.description,
        n.category,
        n."publishDate",
        COALESCE(NULLIF(n."imageUrl", ''), s."imageUrls"[1]) as "imageUrl",
        n."createdAt",
        COALESCE(s."schoolName", 'All Schools') as "schoolName"
      FROM "NewsUpdate" n
      LEFT JOIN "School" s ON n."schoolId" = s.id
      WHERE n."isActive" = true
        AND (n."schoolId" IS NULL OR n."schoolId" = $1)
      ORDER BY COALESCE(n."publishDate", n."createdAt"::date) DESC, n."createdAt" DESC
      LIMIT 6
    `, [session.schoolId || null]);

    return NextResponse.json({ updates: result.rows });
  } catch (error: any) {
    console.error('Alumni news updates fetch error:', error);
    if (isMissingNewsTable(error)) {
      return NextResponse.json({ updates: [] });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
