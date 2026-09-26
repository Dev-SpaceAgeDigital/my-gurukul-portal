import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSessionFromCookies('ADMIN');
    if (!session || session.role !== 'SUB_ADMIN' || !session.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM "Student" WHERE "schoolId" = $1) as "totalStudents",
        (SELECT COUNT(*) FROM "Standard" WHERE "schoolId" = $1) as "activeStandards",
        (SELECT COALESCE(SUM(amount), 0) FROM "Transaction" WHERE "schoolId" = $1) as "totalDonations",
        (SELECT COALESCE(SUM(amount), 0) FROM "Transaction" WHERE "schoolId" = $1 AND type = 'CONSTRUCTION') as "constructionDonations",
        (SELECT COALESCE(SUM(amount), 0) FROM "Transaction" WHERE "schoolId" = $1 AND type IN ('ZAKAT', 'LILLAH', 'SADKA', 'FINANCIAL_AID')) as "financialAidDonations",
        (
          SELECT COALESCE(SUM(std.fees), 0) 
          FROM "Student" s 
          JOIN "Standard" std ON s."standardId" = std.id 
          WHERE s."schoolId" = $1
        ) as "totalFeesPotential"
    `;

    const result = await pool.query(statsQuery, [session.schoolId]);
    const stats = result.rows[0];

	    const recentTransactionsQuery = `
	      SELECT id, amount, "donorName", type, "createdAt"
	      FROM "Transaction"
	      WHERE "schoolId" = $1
	      ORDER BY "createdAt" DESC
	      LIMIT 10
	    `;
	    const recentTransactions = await pool.query(recentTransactionsQuery, [session.schoolId]);

	    const academicYearQuery = `
	      SELECT label
	      FROM "AcademicYear"
	      WHERE "isActive" = true
	      ORDER BY "createdAt" DESC
	      LIMIT 1
	    `;
	    const academicYear = await pool.query(academicYearQuery);
	
	    return NextResponse.json({
      totalStudents: parseInt(stats.totalStudents) || 0,
      activeStandards: parseInt(stats.activeStandards) || 0,
      totalDonations: parseFloat(stats.totalDonations) || 0,
	      constructionDonations: parseFloat(stats.constructionDonations) || 0,
	      financialAidDonations: parseFloat(stats.financialAidDonations) || 0,
	      totalFeesPotential: parseFloat(stats.totalFeesPotential) || 0,
	      activeAcademicYear: academicYear.rows[0]?.label || null,
	      recentTransactions: recentTransactions.rows
	    });

  } catch (error: any) {
    console.error('Failed to fetch subadmin stats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
