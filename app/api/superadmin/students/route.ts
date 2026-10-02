import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getSessionFromCookies('ADMIN');
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId');
    const standardId = searchParams.get('standardId');
    const academicYearId = searchParams.get('academicYearId');
    const search = searchParams.get('search')?.trim().toLowerCase();

    // 1. Get schools accessible to SuperAdmin
    let schoolsQuery = `SELECT id, "schoolName" FROM "School"`;
    const schoolParams: any[] = [];
    if (session.trustId) {
      schoolsQuery += ` WHERE "trustId" = $1`;
      schoolParams.push(session.trustId);
    }
    schoolsQuery += ` ORDER BY "schoolName" ASC`;
    const schoolsRes = await pool.query(schoolsQuery, schoolParams);
    const accessibleSchools = schoolsRes.rows;
    const accessibleSchoolIds = accessibleSchools.map((s) => s.id);

    // 2. Build Query
    const params: any[] = [];
    let whereClauses: string[] = ['1=1'];

    if (accessibleSchoolIds.length > 0) {
      params.push(accessibleSchoolIds);
      whereClauses.push(`s."schoolId" = ANY($${params.length}::uuid[])`);
    }

    if (schoolId && schoolId !== 'ALL' && schoolId !== '') {
      params.push(schoolId);
      whereClauses.push(`s."schoolId" = $${params.length}`);
    }

    if (standardId && standardId !== 'ALL' && standardId !== '') {
      params.push(standardId);
      whereClauses.push(`s."standardId" = $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      whereClauses.push(`(LOWER(s."name") LIKE $${params.length} OR LOWER(COALESCE(s."studentCode", '')) LIKE $${params.length})`);
    }

    let joinEnrollment = '';
    if (academicYearId && academicYearId !== 'ALL' && academicYearId !== '') {
      params.push(academicYearId);
      joinEnrollment = `LEFT JOIN "StudentEnrollment" se ON se."studentId" = s."id" AND se."academicYearId" = $${params.length}`;
    } else {
      joinEnrollment = `LEFT JOIN "StudentEnrollment" se ON se."studentId" = s."id" AND se."status" = 'ACTIVE'`;
    }

    const query = `
      SELECT 
        s.id,
        s.name,
        s."studentCode",
        s."schoolId",
        s."standardId",
        s."createdAt",
        sch."schoolName",
        std."standardName",
        COALESCE(se."rank", 0) as rank,
        COALESCE(se."percentage", 0) as percentage,
        COALESCE(se."status", 'ACTIVE') as "enrollmentStatus"
      FROM "Student" s
      LEFT JOIN "School" sch ON s."schoolId" = sch.id
      LEFT JOIN "Standard" std ON s."standardId" = std.id
      ${joinEnrollment}
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY COALESCE(se."percentage", 0) DESC, s."name" ASC
      LIMIT 200
    `;

    const result = await pool.query(query, params);
    return NextResponse.json(result.rows);

  } catch (error: any) {
    console.error('SuperAdmin students fetch error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

