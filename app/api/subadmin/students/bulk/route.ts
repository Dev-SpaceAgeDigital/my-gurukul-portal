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

    const getField = (obj: any, ...aliases: string[]) => {
      if (!obj) return undefined;
      for (const alias of aliases) {
        if (obj[alias] !== undefined && obj[alias] !== null && String(obj[alias]).trim() !== '') {
          return obj[alias];
        }
      }
      const keys = Object.keys(obj);
      for (const alias of aliases) {
        const normAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
        const matchedKey = keys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === normAlias);
        if (matchedKey && obj[matchedKey] !== undefined && obj[matchedKey] !== null && String(obj[matchedKey]).trim() !== '') {
          return obj[matchedKey];
        }
      }
      return undefined;
    };

    const parseDate = (val: any): Date | null => {
      if (!val) return null;
      if (val instanceof Date) {
        return isNaN(val.getTime()) ? null : val;
      }
      if (typeof val === 'number') {
        // Excel serial date format
        const date = new Date((val - (25567 + 2)) * 86400 * 1000);
        return isNaN(date.getTime()) ? null : date;
      }
      const str = String(val).trim();
      if (!str) return null;

      // DD-MM-YYYY or DD/MM/YYYY
      const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
      if (dmyMatch) {
        const day = parseInt(dmyMatch[1], 10);
        const month = parseInt(dmyMatch[2], 10) - 1;
        const year = parseInt(dmyMatch[3], 10);
        const d = new Date(Date.UTC(year, month, day));
        return isNaN(d.getTime()) ? null : d;
      }

      // YYYY-MM-DD
      const ymdMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
      if (ymdMatch) {
        const year = parseInt(ymdMatch[1], 10);
        const month = parseInt(ymdMatch[2], 10) - 1;
        const day = parseInt(ymdMatch[3], 10);
        const d = new Date(Date.UTC(year, month, day));
        return isNaN(d.getTime()) ? null : d;
      }

      const d = new Date(str);
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
            return clean === 'yes' || clean === 'true' || clean === '1' || clean === 'y';
          }
          return false;
        };

        const rawRTE = getField(s, 'Is Under RTE', 'Under RTE', 'RTE', 'isUnderRTE');
        const isRTE = isTrueVal(rawRTE);

        const rawNeedy = getField(s, 'Is Needy', 'Needy', 'isNeedy');
        const isNeedy = isRTE ? false : isTrueVal(rawNeedy);

        // Normalize Sponsorship Type
        const rawSponsorship = String(getField(s, 'Sponsorship Type', 'Sponsorship', 'sponsorshipType') || '').trim();
        let finalSponsorshipType = rawSponsorship.toUpperCase();
        if (sponsorshipMode === 'DONATION') {
          if (
            finalSponsorshipType === 'DONATION' ||
            finalSponsorshipType === 'ZAKAT' ||
            finalSponsorshipType === 'LILLAH' ||
            finalSponsorshipType === 'SCHOLARSHIP' ||
            finalSponsorshipType === 'AID' ||
            finalSponsorshipType === 'YES' ||
            finalSponsorshipType === 'Y'
          ) {
            finalSponsorshipType = 'DONATION';
          } else if (finalSponsorshipType === 'GENERAL' || finalSponsorshipType === 'NO' || finalSponsorshipType === 'N' || finalSponsorshipType === 'NONE') {
            finalSponsorshipType = 'GENERAL';
          } else {
            finalSponsorshipType = isNeedy ? 'DONATION' : 'GENERAL';
          }
        } else {
          if (finalSponsorshipType === 'DONATION' || finalSponsorshipType === 'YES' || finalSponsorshipType === 'Y' || finalSponsorshipType === 'SCHOLARSHIP' || finalSponsorshipType === 'AID') {
            finalSponsorshipType = 'ZAKAT';
          } else if (finalSponsorshipType !== 'ZAKAT' && finalSponsorshipType !== 'LILLAH') {
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
            getField(s, 'Student Name', 'Name', 'studentName', 'name') || 'Unknown',
            getField(s, 'Student Code', 'studentCode', 'Code'),
            getField(s, 'Student Category', 'Category', 'category'),
            getField(s, 'User ID', 'User ID Ref', 'userIdRef', 'userId'),
            parseDate(getField(s, 'Admission date', 'Admission Date', 'admissionDate', 'Date of Admission')),
            getField(s, 'GR SR No.', 'GR SR No', 'GR No.', 'GR No', 'grSrNo', 'grNo', 'GR. NO.', 'GR / SR No.'),
            getField(s, 'Admission Type', 'admissionType'),
            getField(s, 'Current Class', 'currentClass', 'Class', 'Standard'),
            getField(s, 'Section', 'section', 'Division', 'Div'),
            parseDate(getField(s, 'Date of Birth', 'DOB', 'dateOfBirth', 'Birth Date')),
            parseInt(getField(s, 'Student Age', 'Age', 'age')) || null,
            getField(s, 'Gender', 'gender'),
            getField(s, 'Contact No.', 'Contact No', 'Contact', 'Mobile', 'Phone', 'contactNo'),
            getField(s, 'Aadhar No.', 'Aadhar No', 'Aadhar', 'Aadhaar No.', 'Aadhaar No', 'Aadhaar', 'aadharNo'),
            getField(s, 'PAN No.', 'PAN No', 'PAN', 'panNo'),
            getField(s, 'APAAR ID', 'APAAR Id', 'Apaar ID', 'Apaar Id', 'apaarId', 'APAAR No'),
            getField(s, 'Address', 'address'),
            getField(s, 'City', 'city'),
            getField(s, 'State', 'state'),
            getField(s, 'Country', 'country'),
            getField(s, 'Father Name', "Father's Name", 'fatherName'),
            getField(s, 'Father Number', 'Father Contact', 'Father Mobile', 'fatherNumber'),
            getField(s, 'Mother Name', "Mother's Name", 'motherName'),
            getField(s, 'Mother Number', 'Mother Contact', 'Mother Mobile', 'motherNumber'),
            getField(s, 'Account Holder Name', 'Account Holder', 'accountHolderName'),
            getField(s, 'Account Number', 'Account No.', 'Account No', 'accountNumber'),
            getField(s, 'Bank Name', 'bankName'),
            getField(s, 'IFSC Code', 'IFSC', 'ifscCode'),
            finalSponsorshipType,
            isNeedy,
            isRTE,
            standardId,
            session.schoolId,
            newStudentId
          ]
        );

        if (activeYearId) {
          try {
            await client.query(
              `INSERT INTO "StudentEnrollment" (
                id, "studentId", "standardId", "academicYearId", status, "createdAt", "updatedAt"
              ) VALUES (
                gen_random_uuid(), $1, $2, $3, 'ACTIVE', NOW(), NOW()
              )`,
              [newStudentId, standardId, activeYearId]
            );
          } catch (enrollErr) {
            console.warn('Enrollment record insert skipped or failed:', enrollErr);
          }
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
