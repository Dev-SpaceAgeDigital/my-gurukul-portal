import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getSessionFromCookies('SUPER_ADMIN');
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const standardId = searchParams.get('standardId');
    const academicYearId = searchParams.get('academicYearId');

    if (!standardId) {
      return NextResponse.json({ error: 'Standard ID is required' }, { status: 400 });
    }

    if (academicYearId) {
      const enrollmentsRes = await pool.query(`
        SELECT s.*, se."rank", se."percentage", se."status" as "enrollmentStatus"
        FROM "StudentEnrollment" se
        JOIN "Student" s ON se."studentId" = s."id"
        WHERE se."standardId" = $1 AND se."academicYearId" = $2 AND se."status" = 'ACTIVE'
        ORDER BY se."percentage" DESC NULLS LAST
      `, [standardId, academicYearId]);

      if (enrollmentsRes.rows.length > 0) {
        return NextResponse.json(enrollmentsRes.rows);
      }
    }

    // Fallback if no enrollments exist for that batch (or batch is not provided)
    const fallbackRes = await pool.query(`
      SELECT s.*, NULL as "rank", NULL as "percentage", 'ACTIVE' as "enrollmentStatus"
      FROM "Student" s
      WHERE s."standardId" = $1
      ORDER BY s."name" ASC
    `, [standardId]);

    return NextResponse.json(fallbackRes.rows);

  } catch (error) {
    console.error('SuperAdmin students fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
