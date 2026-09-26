import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET analytics ranking and candidates for a specified year
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const yearStr = searchParams.get('year') || new Date().getFullYear().toString();
    const year = parseInt(yearStr, 10);
    const schoolId = searchParams.get('schoolId');

    // 1. Check if an Alumni of the Year is already awarded for this year & school
    let existingAwardQuery = `
      SELECT aoy.*, a.name as "alumniName", a."profilePic", a."currentTitle", a."batchYear", s."schoolName"
      FROM "AlumniOfTheYear" aoy
      JOIN "Alumni" a ON aoy."alumniId" = a.id
      LEFT JOIN "School" s ON aoy."schoolId" = s.id
      WHERE aoy.year = $1
    `;
    const awardQueryParams: any[] = [year];

    if (schoolId) {
      existingAwardQuery += ` AND (aoy."schoolId" = $2 OR aoy."schoolId" IS NULL)`;
      awardQueryParams.push(schoolId);
    }
    existingAwardQuery += ` LIMIT 1`;

    const existingAwardRes = await pool.query(existingAwardQuery, awardQueryParams);
    const currentAward = existingAwardRes.rows[0] || null;

    // 2. Fetch all Alumni & compute annual stats for the requested year
    let alumniQuery = `
      SELECT a.id, a.name, a.email, a."profilePic", a."currentTitle", a."batchYear", a."schoolId", s."schoolName"
      FROM "Alumni" a
      LEFT JOIN "School" s ON a."schoolId" = s.id
    `;
    const alumniQueryParams: any[] = [];
    if (schoolId) {
      alumniQuery += ` WHERE a."schoolId" = $1`;
      alumniQueryParams.push(schoolId);
    }

    const alumniRes = await pool.query(alumniQuery, alumniQueryParams);
    const alumniList = alumniRes.rows;

    // Fetch metric counts for the given year
    const yearStart = `${year}-01-01 00:00:00`;
    const yearEnd = `${year}-12-31 23:59:59`;

    // Fetch jobs posted per alumni in year
    const jobsRes = await pool.query(`
      SELECT "alumniId", COUNT(*)::int as count 
      FROM "CareerOpportunity" 
      WHERE "createdAt" >= $1 AND "createdAt" <= $2
      GROUP BY "alumniId"
    `, [yearStart, yearEnd]);
    const jobsMap = new Map(jobsRes.rows.map(r => [r.alumniId, r.count]));

    // Fetch mentorships offered per alumni in year
    const mentRes = await pool.query(`
      SELECT "alumniId", COUNT(*)::int as count 
      FROM "MentorshipOffer" 
      WHERE "createdAt" >= $1 AND "createdAt" <= $2
      GROUP BY "alumniId"
    `, [yearStart, yearEnd]);
    const mentorshipMap = new Map(mentRes.rows.map(r => [r.alumniId, r.count]));

    // Fetch achievements posted per alumni in year
    const achRes = await pool.query(`
      SELECT "alumniId", COUNT(*)::int as count 
      FROM "Achievement" 
      WHERE "createdAt" >= $1 AND "createdAt" <= $2
      GROUP BY "alumniId"
    `, [yearStart, yearEnd]);
    const achievementMap = new Map(achRes.rows.map(r => [r.alumniId, r.count]));

    // Fetch contributions per alumni in year
    const contribRes = await pool.query(`
      SELECT "alumniId", COALESCE(SUM(amount), 0)::float as total_amount, COUNT(*)::int as count 
      FROM "AlumniContribution" 
      WHERE "createdAt" >= $1 AND "createdAt" <= $2
      GROUP BY "alumniId"
    `, [yearStart, yearEnd]);
    const contribMap = new Map(contribRes.rows.map(r => [r.alumniId, { totalAmount: r.total_amount, count: r.count }]));

    // Combine candidate metrics
    const candidates = alumniList.map(alum => {
      const jobsCount = jobsMap.get(alum.id) || 0;
      const mentorshipsCount = mentorshipMap.get(alum.id) || 0;
      const achievementsCount = achievementMap.get(alum.id) || 0;
      const contrib = contribMap.get(alum.id) || { totalAmount: 0, count: 0 };

      // Total score heuristic
      const score = (contrib.totalAmount / 1000) + (jobsCount * 25) + (mentorshipsCount * 20) + (achievementsCount * 10);

      return {
        ...alum,
        stats: {
          jobsCount,
          mentorshipsCount,
          achievementsCount,
          financialAidTotal: contrib.totalAmount,
          contributionsCount: contrib.count,
          totalScore: Math.round(score)
        }
      };
    });

    // Rank candidates into categories
    const topFinancial = [...candidates].sort((a, b) => b.stats.financialAidTotal - a.stats.financialAidTotal)[0] || null;
    const topCareer = [...candidates].sort((a, b) => b.stats.jobsCount - a.stats.jobsCount)[0] || null;
    const topMentorship = [...candidates].sort((a, b) => (b.stats.mentorshipsCount + b.stats.achievementsCount) - (a.stats.mentorshipsCount + a.stats.achievementsCount))[0] || null;

    return NextResponse.json({
      year,
      currentAward,
      categories: {
        topFinancial: topFinancial?.stats.financialAidTotal > 0 ? topFinancial : null,
        topCareer: topCareer?.stats.jobsCount > 0 ? topCareer : null,
        topMentorship: (topMentorship?.stats.mentorshipsCount > 0 || topMentorship?.stats.achievementsCount > 0) ? topMentorship : null,
      },
      candidates: candidates.sort((a, b) => b.stats.totalScore - a.stats.totalScore)
    });
  } catch (error: any) {
    console.error('Error fetching Alumni of the Year candidates:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch candidate analytics' }, { status: 500 });
  }
}

// POST to award or update Alumni of the Year
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      schoolId,
      alumniId,
      year,
      headline,
      reason,
      highlights,
      totalFinancialAid,
      studentsHelpedCount,
      jobsPostedCount,
      mentorshipsCount,
      mediaUrl,
      awardedByUserId
    } = body;

    if (!alumniId || !year || !headline || !reason) {
      return NextResponse.json({ error: 'Missing required fields: alumniId, year, headline, and reason' }, { status: 400 });
    }

    // Delete any existing award for this year and school
    if (schoolId) {
      await pool.query(`DELETE FROM "AlumniOfTheYear" WHERE year = $1 AND "schoolId" = $2`, [year, schoolId]);
    } else {
      await pool.query(`DELETE FROM "AlumniOfTheYear" WHERE year = $1 AND "schoolId" IS NULL`, [year]);
    }

    // Insert new winner
    const insertRes = await pool.query(`
      INSERT INTO "AlumniOfTheYear" (
        "schoolId", "alumniId", "year", "headline", "reason", "highlights",
        "totalFinancialAid", "studentsHelpedCount", "jobsPostedCount", "mentorshipsCount",
        "mediaUrl", "awardedByUserId"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      schoolId || null,
      alumniId,
      parseInt(year, 10),
      headline,
      reason,
      highlights || [],
      totalFinancialAid || 0,
      studentsHelpedCount || 0,
      jobsPostedCount || 0,
      mentorshipsCount || 0,
      mediaUrl || null,
      awardedByUserId || null
    ]);

    return NextResponse.json({ success: true, award: insertRes.rows[0] });
  } catch (error: any) {
    console.error('Error saving Alumni of the Year:', error);
    return NextResponse.json({ error: error.message || 'Failed to save Alumni of the Year' }, { status: 500 });
  }
}
