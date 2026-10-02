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
    const filterSchoolId = searchParams.get('schoolId');
    const filterYear = searchParams.get('year');
    const filterCategory = searchParams.get('category');
    const search = searchParams.get('search')?.trim().toLowerCase();

    // 1. Fetch all schools accessible to SuperAdmin
    let schoolsQuery = `SELECT id, "schoolName" FROM "School"`;
    const schoolParams: any[] = [];
    if (session.trustId) {
      schoolsQuery += ` WHERE "trustId" = $1`;
      schoolParams.push(session.trustId);
    }
    schoolsQuery += ` ORDER BY "schoolName" ASC`;
    const schoolsRes = await pool.query(schoolsQuery, schoolParams);
    const schools = schoolsRes.rows;
    const accessibleSchoolIds = schools.map((s) => s.id);

    // 2. Query Transactions
    const txParams: any[] = [];
    let txWhere = `WHERE 1=1`;

    if (accessibleSchoolIds.length > 0) {
      txParams.push(accessibleSchoolIds);
      txWhere += ` AND t."schoolId" = ANY($${txParams.length}::uuid[])`;
    }

    if (filterSchoolId && filterSchoolId !== 'ALL') {
      txParams.push(filterSchoolId);
      txWhere += ` AND t."schoolId" = $${txParams.length}`;
    }

    if (filterYear && filterYear !== 'ALL') {
      txParams.push(parseInt(filterYear, 10));
      txWhere += ` AND EXTRACT(YEAR FROM t."createdAt")::int = $${txParams.length}`;
    }

    if (filterCategory && filterCategory !== 'ALL') {
      txParams.push(filterCategory);
      txWhere += ` AND t.type = $${txParams.length}`;
    }

    if (search) {
      txParams.push(`%${search}%`);
      txWhere += ` AND (LOWER(t."donorName") LIKE $${txParams.length} OR LOWER(COALESCE(t."donorEmail", '')) LIKE $${txParams.length} OR LOWER(COALESCE(t."razorpayPaymentId", '')) LIKE $${txParams.length})`;
    }

    const txQuery = `
      SELECT
        t.*,
        s."schoolName",
        EXTRACT(YEAR FROM t."createdAt")::int as year,
        CASE
          WHEN e.id IS NOT NULL THEN 'PROJECT'
          WHEN std.id IS NOT NULL THEN 'STANDARD'
          ELSE 'GENERAL'
        END as "targetType",
        COALESCE(e.id::text, std.id::text, t."referenceId"::text) as "targetId",
        COALESCE(
          e.title,
          CONCAT(
            std."standardName",
            CASE WHEN std.division IS NOT NULL AND std.division <> '' THEN CONCAT(' - ', std.division) ELSE '' END,
            CASE WHEN std.stream IS NOT NULL AND std.stream <> '' THEN CONCAT(' (', std.stream, ')') ELSE '' END
          ),
          'General Institutional Fund'
        ) as "targetLabel"
      FROM "Transaction" t
      LEFT JOIN "School" s ON t."schoolId" = s.id
      LEFT JOIN "Expense" e ON t."referenceId" = e.id AND t.type IN ('CONSTRUCTION', 'EVENT')
      LEFT JOIN "Standard" std ON t."referenceId" = std.id AND t.type IN ('FINANCIAL_AID', 'ZAKAT', 'LILLAH', 'SADKA', 'GENERAL')
      ${txWhere}
      ORDER BY t."createdAt" DESC
    `;

    const txRes = await pool.query(txQuery, txParams);
    const transactions = txRes.rows;

    // 3. Query Projects / Expenses
    const expParams: any[] = [];
    let expWhere = `WHERE 1=1`;

    if (accessibleSchoolIds.length > 0) {
      expParams.push(accessibleSchoolIds);
      expWhere += ` AND e."schoolId" = ANY($${expParams.length}::uuid[])`;
    }

    if (filterSchoolId && filterSchoolId !== 'ALL') {
      expParams.push(filterSchoolId);
      expWhere += ` AND e."schoolId" = $${expParams.length}`;
    }

    const expQuery = `
      SELECT
        e.*,
        s."schoolName"
      FROM "Expense" e
      LEFT JOIN "School" s ON e."schoolId" = s.id
      ${expWhere}
      ORDER BY e."createdAt" DESC
    `;

    const expRes = await pool.query(expQuery, expParams);
    const projects = expRes.rows;

    // 4. Calculate Aggregate Stats
    const totalDonations = transactions.reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);
    const totalProjectEstimated = projects.reduce((acc, p) => acc + (parseFloat(p.estimatedCost) || 0), 0);
    const totalProjectPaid = projects.reduce((acc, p) => acc + (parseFloat(p.paidAmount) || 0), 0);
    const fundingGap = Math.max(0, totalProjectEstimated - totalDonations);

    // Extract available years
    const yearsSet = new Set<number>();
    transactions.forEach((t) => {
      if (t.year) yearsSet.add(t.year);
    });
    projects.forEach((p) => {
      if (p.startDate) {
        const y = new Date(p.startDate).getFullYear();
        if (!isNaN(y)) yearsSet.add(y);
      }
    });
    const years = Array.from(yearsSet).sort((a, b) => b - a);

    return NextResponse.json({
      success: true,
      stats: {
        totalDonations,
        totalDonationsCount: transactions.length,
        totalProjectEstimated,
        totalProjectPaid,
        fundingGap,
        projectsCount: projects.length,
      },
      transactions,
      projects,
      schools,
      years,
    });
  } catch (error: any) {
    console.error('Superadmin donations fetch error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
