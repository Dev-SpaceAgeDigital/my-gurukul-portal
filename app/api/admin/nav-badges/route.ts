import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';
import { ensure80GTable } from '@/app/api/superadmin/80g-requests/route';
import { ensureCsrTables } from '@/lib/csr';
import { ensureAlumniOnboardingTables } from '@/lib/alumniOnboarding';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSessionFromCookies('ADMIN');
    if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'SUB_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const badges: Record<string, number> = {};

    if (session.role === 'SUPER_ADMIN') {
      // 1. 80G Certificate Requests
      try {
        await ensure80GTable();
        const res80g = await pool.query(
          `SELECT COUNT(*)::int as count FROM "Donation80GRequest" WHERE status = 'PENDING'`
        );
        if (res80g.rows[0]?.count > 0) {
          badges['80G Requests'] = res80g.rows[0].count;
        }
      } catch (err) {
        console.error('Failed to get 80G badge count:', err);
      }

      // 2. CSR Management Inquiries
      try {
        await ensureCsrTables();
        const resCsr = await pool.query(
          `SELECT COUNT(*)::int as count FROM "CsrInquiry" WHERE status = 'PENDING'`
        );
        if (resCsr.rows[0]?.count > 0) {
          badges['CSR Management'] = resCsr.rows[0].count;
        }
      } catch (err) {
        console.error('Failed to get CSR badge count:', err);
      }

      // 3. Alumni Communication (Pending Alumni Verification Requests)
      try {
        await ensureAlumniOnboardingTables();
        const resAlumni = await pool.query(
          `SELECT COUNT(*)::int as count FROM "AlumniRegistrationRequest" req
           LEFT JOIN "School" s ON req."schoolId" = s.id
           WHERE req.status = 'PENDING' ${session.trustId ? `AND s."trustId" = '${session.trustId}'` : ''}`
        );
        if (resAlumni.rows[0]?.count > 0) {
          badges['Alumni Communication'] = resAlumni.rows[0].count;
        }
      } catch (err) {
        console.error('Failed to get Alumni communication badge count:', err);
      }

      // 4. Donations & Projects (Pending Inquiries)
      try {
        const resDonations = await pool.query(
          `SELECT COUNT(*)::int as count FROM "DonationInquiry" WHERE status = 'PENDING'`
        );
        if (resDonations.rows[0]?.count > 0) {
          badges['Donations & Projects'] = resDonations.rows[0].count;
        }
      } catch (err) {
        // Table might not exist or empty
      }

      // 5. Needy Students Count
      try {
        const resNeedy = await pool.query(
          `SELECT COUNT(*)::int as count FROM "Student" st
           LEFT JOIN "School" s ON st."schoolId" = s.id
           WHERE st."isNeedy" = true ${session.trustId ? `AND s."trustId" = '${session.trustId}'` : ''}`
        );
        if (resNeedy.rows[0]?.count > 0) {
          badges['Students'] = resNeedy.rows[0].count;
        }
      } catch (err) {
        // Ignore if column missing
      }
    } else if (session.role === 'SUB_ADMIN') {
      const schoolId = session.schoolId;

      if (schoolId) {
        // 1. Alumni (Pending Verification Requests for this School)
        try {
          await ensureAlumniOnboardingTables();
          const resAlumni = await pool.query(
            `SELECT COUNT(*)::int as count FROM "AlumniRegistrationRequest"
             WHERE "schoolId" = $1 AND status = 'PENDING'`,
            [schoolId]
          );
          if (resAlumni.rows[0]?.count > 0) {
            badges['Alumni'] = resAlumni.rows[0].count;
          }
        } catch (err) {
          console.error('Failed to get subadmin Alumni badge count:', err);
        }

        // 2. CSR Management (Pending CSR Inquiries for this School)
        try {
          await ensureCsrTables();
          const resCsr = await pool.query(
            `SELECT COUNT(*)::int as count FROM "CsrInquiry"
             WHERE ("schoolId" = $1 OR "schoolId" IS NULL) AND status = 'PENDING'`,
            [schoolId]
          );
          if (resCsr.rows[0]?.count > 0) {
            badges['CSR Management'] = resCsr.rows[0].count;
          }
        } catch (err) {
          console.error('Failed to get subadmin CSR badge count:', err);
        }

        // 3. Donations (Pending Inquiries for this School)
        try {
          const resDonations = await pool.query(
            `SELECT COUNT(*)::int as count FROM "DonationInquiry"
             WHERE "schoolId" = $1 AND status = 'PENDING'`,
            [schoolId]
          );
          if (resDonations.rows[0]?.count > 0) {
            badges['Donations'] = resDonations.rows[0].count;
          }
        } catch (err) {
          // Ignore
        }

        // 4. Students (Needy Students in this School)
        try {
          const resNeedy = await pool.query(
            `SELECT COUNT(*)::int as count FROM "Student"
             WHERE "schoolId" = $1 AND "isNeedy" = true`,
            [schoolId]
          );
          if (resNeedy.rows[0]?.count > 0) {
            badges['Students'] = resNeedy.rows[0].count;
          }
        } catch (err) {
          // Ignore
        }
      }
    }

    return NextResponse.json({ success: true, badges });
  } catch (error) {
    console.error('Failed to fetch admin nav badges:', error);
    return NextResponse.json({ error: 'Failed to fetch nav badges' }, { status: 500 });
  }
}
