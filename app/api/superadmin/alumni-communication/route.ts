import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';
import { checkRateLimit, rateLimitResponse } from '@/lib/security/rateLimit';

export async function GET(req: Request) {
  try {
    const session = await getSessionFromCookies('SUPER_ADMIN');
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const limit = await checkRateLimit(req, 'authRead', session.userId);
    if (!limit.allowed) return rateLimitResponse(limit.retryAfter);

    const { searchParams } = new URL(req.url);
    const schoolId = searchParams.get('schoolId') || 'ALL';
    const batchYear = searchParams.get('batchYear') || 'ALL';
    const search = `%${(searchParams.get('search') || '').trim()}%`;

    const values: unknown[] = [search];
    const filters = ['(a.name ILIKE $1 OR a.email ILIKE $1 OR COALESCE(a."currentTitle", \'\') ILIKE $1)'];
    if (schoolId !== 'ALL') {
      values.push(schoolId);
      filters.push(`a."schoolId" = $${values.length}`);
    }
    if (batchYear !== 'ALL') {
      values.push(batchYear);
      filters.push(`a."batchYear" = $${values.length}`);
    }

    const [alumniRes, schoolsRes, batchesRes] = await Promise.all([
      pool.query(
        `SELECT a.id, a.name, a.email, a."batchYear", a."currentTitle", a."createdAt",
                s.id as "schoolId", COALESCE(s."schoolName", 'No School') as "schoolName"
         FROM "Alumni" a
         LEFT JOIN "School" s ON s.id = a."schoolId"
         WHERE ${filters.join(' AND ')}
         ORDER BY s."schoolName" ASC, a."batchYear" DESC, a.name ASC
         LIMIT 500`,
        values
      ),
      pool.query('SELECT id, "schoolName" FROM "School" ORDER BY "schoolName" ASC'),
      pool.query('SELECT DISTINCT "batchYear" FROM "Alumni" WHERE "batchYear" IS NOT NULL ORDER BY "batchYear" DESC'),
    ]);

    return NextResponse.json({
      alumni: alumniRes.rows,
      schools: schoolsRes.rows,
      batches: batchesRes.rows.map((row) => row.batchYear).filter(Boolean),
    });
  } catch (error) {
    console.error('Alumni communication fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch alumni communication data' }, { status: 500 });
  }
}
