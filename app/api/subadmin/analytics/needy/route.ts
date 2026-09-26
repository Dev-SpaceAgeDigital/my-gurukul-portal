import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSessionFromCookies('ADMIN');
    if (!session || session.role !== 'SUB_ADMIN' || !session.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // 1. Fetch effective sponsorshipMode for this School
    const schoolModeRes = await pool.query(
      `SELECT COALESCE(s."sponsorshipMode", t."sponsorshipMode", 'ZAKAT_LILLAH') as "sponsorshipMode"
       FROM "School" s
       LEFT JOIN "Trust" t ON s."trustId" = t.id
       WHERE s.id = $1`,
      [session.schoolId]
    );
    const sponsorshipMode = schoolModeRes.rows[0]?.sponsorshipMode || 'ZAKAT_LILLAH';

    const queryText = `
      SELECT 
        std.id, 
        std."standardName", 
        std.division, 
        std.fees,
        COUNT(s.id) FILTER (WHERE s."isNeedy" = true) as total_needy,
        COUNT(s.id) FILTER (WHERE s."isNeedy" = true AND s."sponsorshipType" ILIKE '%Zakat%') as zakat_count,
        COUNT(s.id) FILTER (WHERE s."isNeedy" = true AND s."sponsorshipType" ILIKE '%Lillah%') as lillah_count,
        COUNT(s.id) FILTER (WHERE s."isNeedy" = true AND (s."sponsorshipType" ILIKE '%Donation%' OR s."sponsorshipType" ILIKE '%Scholarship%' OR s."sponsorshipType" ILIKE '%Zakat%' OR s."sponsorshipType" ILIKE '%Lillah%' OR s."sponsorshipType" IS NOT NULL)) as donation_count,
        COUNT(s.id) FILTER (WHERE s."isUnderRTE" = true) as rte_count,
        COALESCE(SUM(CASE WHEN s."isNeedy" = true AND s."sponsorshipType" ILIKE '%Zakat%' THEN s."aidPaidAmount" ELSE 0 END), 0) as zakat_paid,
        COALESCE(SUM(CASE WHEN s."isNeedy" = true AND s."sponsorshipType" ILIKE '%Lillah%' THEN s."aidPaidAmount" ELSE 0 END), 0) as lillah_paid,
        COALESCE(SUM(CASE WHEN s."isNeedy" = true THEN s."aidPaidAmount" ELSE 0 END), 0) as total_paid
      FROM "Standard" std
      LEFT JOIN "Student" s ON std.id = s."standardId"
      WHERE std."schoolId" = $1
      GROUP BY std.id, std."standardName", std.division, std.fees
      ORDER BY std."standardName" ASC
    `;

    const result = await pool.query(queryText, [session.schoolId]);
    
    // Process results to include amounts (Total Required - Already Paid)
    const processed = result.rows.map(row => {
      const fees = parseFloat(row.fees) || 0;
      const zakat_total = parseInt(row.zakat_count) * fees;
      const lillah_total = parseInt(row.lillah_count) * fees;
      const total_needy_total = parseInt(row.total_needy) * fees;
      const total_paid = parseFloat(row.total_paid) || 0;
      
      return {
        ...row,
        sponsorshipMode,
        zakat_amount: Math.max(0, zakat_total - parseFloat(row.zakat_paid)),
        lillah_amount: Math.max(0, lillah_total - parseFloat(row.lillah_paid)),
        donation_amount: Math.max(0, total_needy_total - total_paid),
        total_needy_amount: Math.max(0, total_needy_total - total_paid)
      };
    });

    return NextResponse.json({
      sponsorshipMode,
      records: processed
    });

  } catch (error: any) {
    console.error('Failed to fetch needy analytics:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
