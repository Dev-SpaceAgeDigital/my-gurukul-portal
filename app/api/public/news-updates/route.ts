import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { withPublicApi } from '@/lib/public-api';

export const dynamic = 'force-dynamic';

export const GET = withPublicApi(async () => {
  let result;

  try {
    result = await pool.query(`
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
      ORDER BY COALESCE(n."publishDate", n."createdAt"::date) DESC, n."createdAt" DESC
    `);
  } catch (error: any) {
    if (error?.code === '42P01' || String(error?.message || '').includes('NewsUpdate')) {
      return NextResponse.json({ updates: [] });
    }
    throw error;
  }

  return NextResponse.json({ updates: result.rows });
}, { maxRequests: 60, cacheSeconds: 30 });
