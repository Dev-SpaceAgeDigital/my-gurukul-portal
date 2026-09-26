import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getSessionFromCookies('ADMIN');
    if (!session || session.role !== 'SUB_ADMIN' || !session.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const standardId = searchParams.get('standardId');
    let academicYearId = searchParams.get('academicYearId');

    let queryText = '';
    const params: any[] = [session.schoolId];

    if (!academicYearId) {
      const activeYearRes = await pool.query(
        `SELECT id FROM "AcademicYear" WHERE "isActive" = true LIMIT 1`
      );
      if (activeYearRes.rows.length > 0) {
        academicYearId = activeYearRes.rows[0].id;
      }
    }

    if (academicYearId) {
      queryText = `
        SELECT s.*, std."standardName", std."division", std."batchYear", se."rank", se."percentage", se."status" as "enrollmentStatus"
        FROM "StudentEnrollment" se
        JOIN "Student" s ON se."studentId" = s."id"
        LEFT JOIN "Standard" std ON se."standardId" = std."id"
        WHERE s."schoolId" = $1 AND se."academicYearId" = $2 AND se."status" = 'ACTIVE'
      `;
      params.push(academicYearId);
      
      if (standardId) {
        queryText += ' AND se."standardId" = $3';
        params.push(standardId);
      }
    } else {
      queryText = `
        SELECT s.*, std."standardName", std."division", std."batchYear"
        FROM "Student" s
        LEFT JOIN "Standard" std ON s."standardId" = std."id"
        WHERE s."schoolId" = $1
      `;
      if (standardId) {
        queryText += ' AND s."standardId" = $2';
        params.push(standardId);
      }
    }

    queryText += ' ORDER BY s."createdAt" DESC';

    const result = await pool.query(queryText, params);
    return NextResponse.json(result.rows);

  } catch (error: any) {
    console.error('Failed to fetch students:', error);
    return NextResponse.json({ error: 'Failed to retrieve student registry' }, { status: 500 });
  }
}
