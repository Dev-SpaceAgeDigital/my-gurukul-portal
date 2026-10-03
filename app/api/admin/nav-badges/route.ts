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
      try {
        await ensure80GTable();
        // Count pending 80G requests
        const res80g = await pool.query(
          `SELECT COUNT(*)::int as count FROM "Donation80GRequest" WHERE status = 'PENDING'`
        );
        badges['80G Requests'] = res80g.rows[0]?.count || 0;
      } catch (err) {
        console.error('Failed to get 80G badge count:', err);
      }

      try {
        await ensureCsrTables();
        // Count pending CSR inquiries
        const resCsr = await pool.query(
          `SELECT COUNT(*)::int as count FROM "CsrInquiry" WHERE status = 'PENDING'`
        );
        badges['CSR Management'] = resCsr.rows[0]?.count || 0;
      } catch (err) {
        console.error('Failed to get CSR badge count:', err);
      }

      try {
        await ensureAlumniOnboardingTables();
        // Count pending alumni onboarding requests
        const resAlumni = await pool.query(
          `SELECT COUNT(*)::int as count FROM "AlumniRegistrationRequest" req
           LEFT JOIN "School" s ON req."schoolId" = s.id
           WHERE req.status = 'PENDING' ${session.trustId ? `AND s."trustId" = '${session.trustId}'` : ''}`
        );
        badges['Alumni Communication'] = resAlumni.rows[0]?.count || 0;
      } catch (err) {
        console.error('Failed to get Alumni communication badge count:', err);
      }

      try {
        // Count pending donation inquiries
        const resDonations = await pool.query(
          `SELECT COUNT(*)::int as count FROM "DonationInquiry" WHERE status = 'PENDING'`
        );
        if (resDonations.rows[0]?.count) {
          badges['Donations & Projects'] = resDonations.rows[0]?.count || 0;
        }
      } catch (err) {
        // Table might not exist or empty
      }
    } else if (session.role === 'SUB_ADMIN') {
      const schoolId = session.schoolId;

      if (schoolId) {
        try {
          await ensureAlumniOnboardingTables();
          // Count pending alumni verification requests for this school
          const resAlumni = await pool.query(
            `SELECT COUNT(*)::int as count FROM "AlumniRegistrationRequest"
             WHERE "schoolId" = $1 AND status = 'PENDING'`,
            [schoolId]
          );
          badges['Alumni'] = resAlumni.rows[0]?.count || 0;
        } catch (err) {
          console.error('Failed to get subadmin Alumni badge count:', err);
        }

        try {
          await ensureCsrTables();
          // Count pending CSR inquiries relevant to this school
          const resCsr = await pool.query(
            `SELECT COUNT(*)::int as count FROM "CsrInquiry"
             WHERE ("schoolId" = $1 OR "schoolId" IS NULL) AND status = 'PENDING'`,
            [schoolId]
          );
          badges['CSR Management'] = resCsr.rows[0]?.count || 0;
        } catch (err) {
          console.error('Failed to get subadmin CSR badge count:', err);
        }

        try {
          // Count pending donation inquiries for this school
          const resDonations = await pool.query(
            `SELECT COUNT(*)::int as count FROM "DonationInquiry"
             WHERE "schoolId" = $1 AND status = 'PENDING'`,
            [schoolId]
          );
          badges['Donations'] = resDonations.rows[0]?.count || 0;
        } catch (err) {
          // Ignore if table missing
        }
      }
    }

    return NextResponse.json({ success: true, badges });
  } catch (error) {
    console.error('Failed to fetch admin nav badges:', error);
    return NextResponse.json({ error: 'Failed to fetch nav badges' }, { status: 500 });
  }
}
