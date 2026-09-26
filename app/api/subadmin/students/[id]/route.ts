import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getSessionFromCookies('ADMIN');
    if (!session || session.role !== 'SUB_ADMIN' || !session.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // 1. Get student profile details
    const studentRes = await pool.query(
      'SELECT s.*, std."standardName", std."division" FROM "Student" s LEFT JOIN "Standard" std ON s."standardId" = std."id" WHERE s.id = $1 AND s."schoolId" = $2',
      [id, session.schoolId]
    );

    if (studentRes.rows.length === 0) {
      return NextResponse.json({ error: 'Student not found or unauthorized' }, { status: 404 });
    }

    const student = studentRes.rows[0];

    // 2. Fetch all academic history records
    const historyRes = await pool.query(
      `SELECT se.*, std."standardName", std."division", ay."label" as "academicYear"
       FROM "StudentEnrollment" se
       LEFT JOIN "Standard" std ON se."standardId" = std."id"
       LEFT JOIN "AcademicYear" ay ON se."academicYearId" = ay."id"
       WHERE se."studentId" = $1
       ORDER BY ay."label" ASC`,
      [id]
    );

    return NextResponse.json({
      student,
      history: historyRes.rows
    });

  } catch (error: any) {
    console.error('Failed to retrieve student details and history:', error);
    return NextResponse.json({ error: 'Failed to retrieve student details and history' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getSessionFromCookies('ADMIN');
    if (!session || session.role !== 'SUB_ADMIN' || !session.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();

    // Verification: ensure the student belongs to the school
    const checkResult = await pool.query(
      'SELECT id FROM "Student" WHERE id = $1 AND "schoolId" = $2',
      [id, session.schoolId]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: 'Student not found or unauthorized' }, { status: 404 });
    }

    let {
      name, studentCode, category, userIdRef, admissionDate, 
      grSrNo, admissionType, currentClass, section, dateOfBirth, 
      age, gender, contactNo, aadharNo, panNo, apaarId, 
      address, city, state, country, fatherName, fatherNumber, 
      motherName, motherNumber, accountHolderName, accountNumber, 
      bankName, ifscCode, sponsorshipType, isNeedy, isUnderRTE, 
      standardId
    } = body;

    // Enforce Institutional Logic: RTE students are NOT needy
    if (isUnderRTE === true) {
      isNeedy = false;
    }

    const parseDate = (val: any) => {
      if (!val) return null;
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d;
    };

    await pool.query(
      `UPDATE "Student" SET
        name = $1, "studentCode" = $2, category = $3, "userIdRef" = $4, "admissionDate" = $5, 
        "grSrNo" = $6, "admissionType" = $7, "currentClass" = $8, section = $9, "dateOfBirth" = $10, 
        age = $11, gender = $12, "contactNo" = $13, "aadharNo" = $14, "panNo" = $15, "apaarId" = $16, 
        address = $17, city = $18, state = $19, country = $20, "fatherName" = $21, "fatherNumber" = $22, 
        "motherName" = $23, "motherNumber" = $24, "accountHolderName" = $25, "accountNumber" = $26, 
        "bankName" = $27, "ifscCode" = $28, "sponsorshipType" = $29, "isNeedy" = $30, "isUnderRTE" = $31, 
        "standardId" = $32, "updatedAt" = NOW()
      WHERE id = $33 AND "schoolId" = $34`,
      [
        name, studentCode, category, userIdRef, parseDate(admissionDate),
        grSrNo, admissionType, currentClass, section, parseDate(dateOfBirth),
        parseInt(age) || null, gender, contactNo, aadharNo, panNo, apaarId,
        address, city, state, country, fatherName, fatherNumber,
        motherName, motherNumber, accountHolderName, accountNumber,
        bankName, ifscCode, sponsorshipType, isNeedy, isUnderRTE,
        standardId, id, session.schoolId
      ]
    );

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Failed to update student:', error);
    return NextResponse.json({ error: 'Failed to update student record' }, { status: 500 });
  }
}
