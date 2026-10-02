import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSessionFromCookies('ADMIN');
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const trustFilter = session.trustId ? `WHERE "trustId" = '${session.trustId}'` : '';
    const schoolTrustFilter = session.trustId ? `WHERE s."trustId" = '${session.trustId}'` : '';

    // 1. Core Summary Metrics
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM "User" ${session.trustId ? `WHERE "trustId" = '${session.trustId}'` : ''}) as "totalUsers",
        (SELECT COUNT(*) FROM "Trust" ${session.trustId ? `WHERE id = '${session.trustId}'` : ''}) as "activeTrusts",
        (SELECT COUNT(*) FROM "School" ${trustFilter}) as "totalSchools",
        (SELECT COUNT(*) FROM "Student" st LEFT JOIN "School" s ON st."schoolId" = s.id ${schoolTrustFilter}) as "totalStudents",
        (SELECT COUNT(*) FROM "Student" st LEFT JOIN "School" s ON st."schoolId" = s.id WHERE st."isNeedy" = true ${session.trustId ? `AND s."trustId" = '${session.trustId}'` : ''}) as "needyStudents",
        (SELECT COUNT(*) FROM "Alumni" al LEFT JOIN "School" s ON al."schoolId" = s.id ${schoolTrustFilter}) as "alumniBase"
    `;

    const statsRes = await pool.query(statsQuery);
    const rawStats = statsRes.rows[0] || {};

    // 2. Pending Alumni Requests Count
    let pendingAlumniRequests = 0;
    try {
      const reqRes = await pool.query(`
        SELECT COUNT(*) as count FROM "AlumniRegistrationRequest" req
        LEFT JOIN "School" s ON req."schoolId" = s.id
        WHERE req.status = 'PENDING' ${session.trustId ? `AND s."trustId" = '${session.trustId}'` : ''}
      `);
      pendingAlumniRequests = parseInt(reqRes.rows[0]?.count || '0', 10);
    } catch {
      // Table may not have pending rows
    }

    // 3. Donation Metrics
    let totalDonations = 0;
    let donationsThisMonth = 0;
    let recentDonations: any[] = [];
    try {
      const donSummaryRes = await pool.query(`
        SELECT 
          COALESCE(SUM(t.amount), 0) as "totalRaised",
          COALESCE(SUM(CASE WHEN t."createdAt" >= date_trunc('month', CURRENT_DATE) THEN t.amount ELSE 0 END), 0) as "thisMonth"
        FROM "Transaction" t
        LEFT JOIN "School" s ON t."schoolId" = s.id
        WHERE (t.status = 'SUCCESS' OR t.status IS NULL)
        ${session.trustId ? `AND s."trustId" = '${session.trustId}'` : ''}
      `);
      totalDonations = parseFloat(donSummaryRes.rows[0]?.totalRaised || '0');
      donationsThisMonth = parseFloat(donSummaryRes.rows[0]?.thisMonth || '0');

      const recentTxRes = await pool.query(`
        SELECT 
          t.id,
          t.amount,
          t."donorName",
          t.type,
          t.status,
          t."createdAt",
          s."schoolName"
        FROM "Transaction" t
        LEFT JOIN "School" s ON t."schoolId" = s.id
        ${session.trustId ? `WHERE s."trustId" = '${session.trustId}'` : ''}
        ORDER BY t."createdAt" DESC
        LIMIT 5
      `);
      recentDonations = recentTxRes.rows;
    } catch (e) {
      console.error('Error fetching donation summary:', e);
    }

    // 4. Pending 80G Tax Exemption Requests
    let pending80GCount = 0;
    try {
      const g80Res = await pool.query(`
        SELECT COUNT(*) as count FROM "Donation80GRequest" req
        LEFT JOIN "School" s ON req."schoolId" = s.id::text
        WHERE req.status = 'PENDING'
        ${session.trustId ? `AND s."trustId" = '${session.trustId}'` : ''}
      `);
      pending80GCount = parseInt(g80Res.rows[0]?.count || '0', 10);
    } catch {
      // 80G table may not be initialized yet
    }

    // 5. Active Projects & Budget Progress
    let activeProjects: any[] = [];
    let activeProjectsCount = 0;
    try {
      const projRes = await pool.query(`
        SELECT 
          e.id,
          e.title,
          e.type,
          e."estimatedCost",
          e."paidAmount",
          e."createdAt",
          s."schoolName"
        FROM "Expense" e
        LEFT JOIN "School" s ON e."schoolId" = s.id
        ${session.trustId ? `WHERE s."trustId" = '${session.trustId}'` : ''}
        ORDER BY e."createdAt" DESC
        LIMIT 4
      `);
      activeProjects = projRes.rows.map((p) => {
        const est = parseFloat(p.estimatedCost || '0');
        const paid = parseFloat(p.paidAmount || '0');
        const progress = est > 0 ? Math.min(100, Math.round((paid / est) * 100)) : 0;
        return {
          ...p,
          estimatedCost: est,
          paidAmount: paid,
          progress,
        };
      });
      activeProjectsCount = activeProjects.length;
    } catch (e) {
      console.error('Error fetching active projects:', e);
    }

    // 6. School Infrastructure Health List
    let schoolsList: any[] = [];
    try {
      const schoolsRes = await pool.query(`
        SELECT 
          s.id,
          s."schoolName",
          s."establishYear",
          t."trustName",
          (SELECT COUNT(*) FROM "Student" st WHERE st."schoolId" = s.id) as "studentCount",
          (SELECT COUNT(*) FROM "User" u WHERE u."schoolId" = s.id AND u.role = 'SUB_ADMIN') as "subadminCount",
          (SELECT COUNT(*) FROM "Alumni" al WHERE al."schoolId" = s.id) as "alumniCount",
          COALESCE((SELECT SUM(tx.amount) FROM "Transaction" tx WHERE tx."schoolId" = s.id AND (tx.status = 'SUCCESS' OR tx.status IS NULL)), 0) as "totalRaised"
        FROM "School" s
        LEFT JOIN "Trust" t ON s."trustId" = t.id
        ${session.trustId ? `WHERE s."trustId" = '${session.trustId}'` : ''}
        ORDER BY s."schoolName" ASC
        LIMIT 10
      `);
      schoolsList = schoolsRes.rows.map((sch) => ({
        id: sch.id,
        schoolName: sch.schoolName,
        establishYear: sch.establishYear,
        trustName: sch.trustName || 'Trust Group',
        studentCount: parseInt(sch.studentCount || '0', 10),
        subadminCount: parseInt(sch.subadminCount || '0', 10),
        alumniCount: parseInt(sch.alumniCount || '0', 10),
        totalRaised: parseFloat(sch.totalRaised || '0'),
      }));
    } catch (e) {
      console.error('Error fetching school health list:', e);
    }

    // 7. Recent Audit Log Stream
    let recentActivity: any[] = [];
    try {
      const actRes = await pool.query(`
        SELECT 
          id,
          "actorName",
          "actorRole",
          title,
          category,
          status,
          "createdAt"
        FROM "ActivityLog"
        ORDER BY "createdAt" DESC
        LIMIT 6
      `);
      recentActivity = actRes.rows;
    } catch {
      // ActivityLog may be empty
    }

    return NextResponse.json({
      totalUsers: parseInt(rawStats.totalUsers || '0', 10),
      activeTrusts: parseInt(rawStats.activeTrusts || '0', 10),
      totalSchools: parseInt(rawStats.totalSchools || '0', 10),
      totalStudents: parseInt(rawStats.totalStudents || '0', 10),
      needyStudents: parseInt(rawStats.needyStudents || '0', 10),
      alumniBase: parseInt(rawStats.alumniBase || '0', 10),
      pendingAlumniRequests,
      totalDonations,
      donationsThisMonth,
      pending80GCount,
      activeProjectsCount,
      activeProjects,
      schoolsList,
      recentDonations,
      recentActivity,
    });
  } catch (error: any) {
    console.error('Failed to fetch admin stats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
