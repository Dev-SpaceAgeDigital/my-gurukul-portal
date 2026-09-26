import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function normalizeExpenseMedia(row: any) {
  const mediaUrls = (() => {
    if (!row.mediaUrl) return [];
    try {
      const parsed = JSON.parse(row.mediaUrl);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [row.mediaUrl];
    } catch {
      return [row.mediaUrl];
    }
  })();

  return {
    ...row,
    mediaUrl: mediaUrls[0] || null,
    mediaUrls,
    mediaType: mediaUrls.length ? 'IMAGE' : row.mediaType,
  };
}

export async function GET() {
  try {
    const session = await getSessionFromCookies('ALUMNI');
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch all construction/event costs across ALL schools
    const expensesRes = await pool.query(`
      SELECT
        e.*,
        s."schoolName",
        0::float as "myDonatedAmount"
      FROM "Expense" e
      JOIN "School" s ON e."schoolId" = s.id
      ORDER BY e."createdAt" DESC
    `);

    // 2. Aggregate Financial Aid Needs (School -> Standard -> Category)
    const financialAidRes = await pool.query(`
      SELECT 
        sc.id as "schoolId",
        sc."schoolName",
        std.id as "standardId",
        std."standardName",
        std.fees,
        COUNT(CASE WHEN stu."isNeedy" = true AND stu."sponsorshipType" ILIKE '%Zakat%' THEN 1 END)::int as "zakatCount",
        COUNT(CASE WHEN stu."isNeedy" = true AND stu."sponsorshipType" ILIKE '%Sadka%' THEN 1 END)::int as "sadkaCount",
        COUNT(CASE WHEN stu."isNeedy" = true AND stu."sponsorshipType" ILIKE '%Lillah%' THEN 1 END)::int as "lillahCount",
        COUNT(CASE WHEN stu."isUnderRTE" = true THEN 1 END)::int as "rteCount",
        COALESCE(SUM(CASE WHEN stu."isNeedy" = true AND stu."sponsorshipType" ILIKE '%Zakat%' THEN stu."aidPaidAmount" ELSE 0 END), 0)::float as "zakatPaid",
        COALESCE(SUM(CASE WHEN stu."isNeedy" = true AND stu."sponsorshipType" ILIKE '%Sadka%' THEN stu."aidPaidAmount" ELSE 0 END), 0)::float as "sadkaPaid",
        COALESCE(SUM(CASE WHEN stu."isNeedy" = true AND stu."sponsorshipType" ILIKE '%Lillah%' THEN stu."aidPaidAmount" ELSE 0 END), 0)::float as "lillahPaid",
        0::float as "myZakatDonated",
        0::float as "mySadkaDonated",
        0::float as "myLillahDonated",
        0::float as "myTotalDonated",
        COUNT(stu.id)::int as "totalStudentsCount"
      FROM "School" sc
      JOIN "Standard" std ON sc.id = std."schoolId"
      JOIN "Student" stu ON std.id = stu."standardId"
      GROUP BY sc.id, sc."schoolName", std.id, std."standardName", std.fees
      HAVING (COUNT(CASE WHEN stu."isNeedy" = true THEN 1 END) > 0 OR COUNT(CASE WHEN stu."isUnderRTE" = true THEN 1 END) > 0)
      ORDER BY sc."schoolName" ASC, std.id ASC
    `);

    return NextResponse.json({
      expenses: expensesRes.rows.map(normalizeExpenseMedia),
      financialAid: financialAidRes.rows
    });

  } catch (error: any) {
    console.error('Alumni needs fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
