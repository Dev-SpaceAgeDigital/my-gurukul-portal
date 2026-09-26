import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';

export async function POST(request: Request) {
  const client = await pool.connect();
  try {
    const session = await getSessionFromCookies('ADMIN');
    if (!session || session.role !== 'SUB_ADMIN' || !session.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { students, standardId } = await request.json();

    if (!Array.isArray(students) || students.length === 0) {
      return NextResponse.json({ error: 'No student data provided' }, { status: 400 });
    }

    if (!standardId) {
      return NextResponse.json({ error: 'Standard is required' }, { status: 400 });
    }

    const standardCheck = await client.query(
      `SELECT id FROM "Standard" WHERE id = $1 AND "schoolId" = $2`,
      [standardId, session.schoolId]
    );
    if (standardCheck.rowCount === 0) {
      return NextResponse.json({ error: 'Standard not found or unauthorized' }, { status: 403 });
    }

    const maxStudents = 1000;
    if (students.length > maxStudents) {
      return NextResponse.json({ error: `Please import ${maxStudents} students or fewer at one time` }, { status: 400 });
    }

    const parseDate = (val: any) => {
      if (!val) return null;
      // Handle Excel date serial numbers if needed, but XLSX usually converts to string/Date
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d;
    };

    await client.query('BEGIN');

    // Fetch the active academic year for initial enrollment logging
    const activeYearRes = await client.query(
      `SELECT id FROM "AcademicYear" WHERE "isActive" = true LIMIT 1`
    );
    const activeYearId = activeYearRes.rows[0]?.id;

    // Fetch school sponsorshipMode
    const schoolModeRes = await client.query(
      `SELECT COALESCE(s."sponsorshipMode", t."sponsorshipMode", 'ZAKAT_LILLAH') as "sponsorshipMode"
       FROM "School" s
       LEFT JOIN "Trust" t ON s."trustId" = t.id
       WHERE s.id = $1`,
      [session.schoolId]
    );
    const sponsorshipMode = schoolModeRes.rows[0]?.sponsorshipMode || 'ZAKAT_LILLAH';

    try {
      for (const s of students) {
        // Generate a new random UUID for the student first to link history cleanly
        const studentIdRes = await client.query('SELECT gen_random_uuid() as id');
        const newStudentId = studentIdRes.rows[0].id;

            const isTrueVal = (val: any) => {
              if (val === true || val === 1) return true;
              if (typeof val === 'string') {
                const clean = val.trim().toLowerCase();
                return clean === 'yes' || clean === 'true' || clean === '1';
              }
              return false;
            };

            const isRTE = isTrueVal(s['Is Under RTE']);
            const isNeedy = isRTE ? false : isTrueVal(s['Is Needy']);

            // Normalize Sponsorship Type
            let rawSponsorship = s['Sponsorship Type'] ? String(s['Sponsorship Type']).trim() : '';
            let finalSponsorshipType = rawSponsorship.toUpperCase();
            if (sponsorshipMode === 'DONATION') {
              if (finalSponsorshipType === 'ZAKAT' || finalSponsorshipType === 'LILLAH' || finalSponsorshipType === 'SCHOLARSHIP' || finalSponsorshipType === 'AID' || finalSponsorshipType === 'YES') {
                finalSponsorshipType = 'DONATION';
              } else if (!finalSponsorshipType) {
                finalSponsorshipType = isNeedy ? 'DONATION' : 'GENERAL';
              }
            } else {
              if (!finalSponsorshipType) {
                finalSponsorshipType = isNeedy ? 'ZAKAT' : 'GENERAL';
              }
            }

            await client.query(
              `INSERT INTO "Student" (
                id, name, "studentCode", category, "userIdRef", "admissionDate", 
                "grSrNo", "admissionType", "currentClass", section, "dateOfBirth", 
                age, gender, "contactNo", "aadharNo", "panNo", "apaarId", 
                address, city, state, country, "fatherName", "fatherNumber", 
                "motherName", "motherNumber", "accountHolderName", "accountNumber", 
                "bankName", "ifscCode", "sponsorshipType", "isNeedy", "isUnderRTE", 
                "standardId", "schoolId", "createdAt", "updatedAt"
              ) VALUES (
                $34, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 
                $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, 
                $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, NOW(), NOW()
              )`,
              [
                s['Student Name'] || 'Unknown',
                s['Student Code'],
                s['Student Category'],
                s['User ID'],
                parseDate(s['Admission date']),
                s['GR SR No.'],
                s['Admission Type'],
                s['Current Class'],
                s['Section'],
                parseDate(s['Date of Birth']),
                parseInt(s['Student Age']) || null,
                s['Gender'],
                s['Contact No.'],
                s['Aadhar No.'],
                s['PAN No.'],
                s['APAAR ID'],
                s['Address'],
                s['City'],
                s['State'],
                s['Country'],
                s['Father Name'],
                s['Father Number'],
                s['Mother Name'],
                s['Mother Number'],
                s['Account Holder Name'],
                s['Account Number'],
                s['Bank Name'],
                s['IFSC Code'],
                finalSponsorshipType,
                isNeedy,
                isRTE,
                standardId,
                session.schoolId,
                newStudentId
              ]
            );

        if (activeYearId) {
          await client.query(
            `INSERT INTO "StudentEnrollment" (
              id, "studentId", "standardId", "academicYearId", status, "createdAt", "updatedAt"
            ) VALUES (
              gen_random_uuid(), $1, $2, $3, 'ACTIVE', NOW(), NOW()
            )`,
            [newStudentId, standardId, activeYearId]
          );
        }
      }
      await client.query('COMMIT');
      return NextResponse.json({ success: true, count: students.length });
    } catch (dbError) {
      await client.query('ROLLBACK');
      console.error('Database error during bulk insert:', dbError);
      throw dbError;
    }

  } catch (error: any) {
    console.error('Bulk student import error:', error);
    return NextResponse.json({ 
      error: 'Failed to synchronize student registry', 
      details: error.message 
    }, { status: 500 });
  } finally {
    client.release();
  }
}
