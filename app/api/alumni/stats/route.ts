import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';
import { ensureCsrTables } from '@/lib/csr';

function normalizeExpenseMedia(row: any) {
  if (!row) return null;
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
    if (!session || session.role !== 'ALUMNI') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await ensureCsrTables();

    const alumniQuery = `
      SELECT a.name, a.email, a."batchYear", a."linkedIn", a."profilePic", a."currentTitle", a."currentBio", a."workLink", a."schoolId", s."schoolName"
      FROM "Alumni" a
      LEFT JOIN "School" s ON a."schoolId" = s.id
      WHERE a.id = $1
    `;
    const alumniResult = await pool.query(alumniQuery, [session.userId]);
    const alumni = alumniResult.rows[0];

    const careerQuery = `SELECT COUNT(*)::int as count, COUNT(*) FILTER (WHERE status = 'PENDING')::int as pending FROM "CareerOpportunity" WHERE "alumniId" = $1`;
    const mentorshipQuery = `SELECT COUNT(*)::int as count, COUNT(*) FILTER (WHERE status = 'PENDING')::int as pending FROM "MentorshipOffer" WHERE "alumniId" = $1`;
    const blogsQuery = `SELECT COUNT(*)::int as count, COUNT(*) FILTER (WHERE status = 'PENDING')::int as pending FROM "Blog" WHERE "alumniId" = $1`;
    const achievementsQuery = `SELECT COUNT(*)::int as count, COUNT(*) FILTER (WHERE status = 'PENDING')::int as pending FROM "Achievement" WHERE "alumniId" = $1`;
    const csrQuery = `SELECT COUNT(*)::int as count, COUNT(*) FILTER (WHERE status = 'PENDING')::int as pending FROM "CsrInquiry" WHERE "referredByAlumniId" = $1`;

    const [careerRes, mentorshipRes, blogsRes, achievementsRes, csrRes] = await Promise.all([
      pool.query(careerQuery, [session.userId]),
      pool.query(mentorshipQuery, [session.userId]),
      pool.query(blogsQuery, [session.userId]),
      pool.query(achievementsQuery, [session.userId]),
      pool.query(csrQuery, [session.userId])
    ]);

    const donationQuery = `SELECT COALESCE(SUM(amount), 0) as total FROM "Transaction" WHERE "donorEmail" = $1 AND status = 'SUCCESS'`;
    const donationRes = await pool.query(donationQuery, [alumni.email]);
    const totalDonated = parseFloat(donationRes.rows[0].total) || 0;

    const urgentCauseQuery = `SELECT * FROM "Expense" WHERE "type" IN ('CONSTRUCTION', 'EVENT') ORDER BY "createdAt" DESC LIMIT 1`;
    const urgentCauseRes = await pool.query(urgentCauseQuery);
    const urgentCause = normalizeExpenseMedia(urgentCauseRes.rows[0] || null);

    const totalAlumniRes = await pool.query(`SELECT COUNT(*)::int as count FROM "Alumni"`).catch(() => ({ rows: [{ count: 0 }] }));
    const totalJobsRes = await pool.query(`SELECT COUNT(*)::int as count FROM "CareerOpportunity" WHERE status = 'APPROVED'`).catch(() => ({ rows: [{ count: 0 }] }));
    const totalMentorsRes = await pool.query(`SELECT COUNT(*)::int as count FROM "MentorshipOffer" WHERE status = 'APPROVED'`).catch(() => ({ rows: [{ count: 0 }] }));

    const upcomingMeetRes = await pool.query(
      `SELECT subject, "createdAt"
       FROM "EmailLog"
       WHERE "recipientEmail" = $1 AND "emailType" = 'ALUMNI_GOOGLE_MEET'
       ORDER BY "createdAt" DESC
       LIMIT 1`,
      [alumni.email]
    ).catch(() => ({ rows: [] }));

    const awardedSpotlightRes = await pool.query(`
      SELECT
        a.id,
        a.name,
        a."currentTitle",
        a."currentBio",
        a."batchYear",
        a."profilePic",
        s."schoolName",
        aoy.headline,
        aoy.reason,
        aoy.highlights,
        aoy.year
      FROM "AlumniOfTheYear" aoy
      JOIN "Alumni" a ON aoy."alumniId" = a.id
      LEFT JOIN "School" s ON a."schoolId" = s.id
      ORDER BY aoy.year DESC, aoy."createdAt" DESC
      LIMIT 3
    `).catch(() => ({ rows: [] }));

    const spotlightIds = awardedSpotlightRes.rows.map((row: any) => row.id).filter(Boolean);
    const fallbackSpotlightRes = await pool.query(`
      SELECT a.id, a.name, a."currentTitle", a."currentBio", a."batchYear", a."profilePic", s."schoolName"
      FROM "Alumni" a
      LEFT JOIN "School" s ON a."schoolId" = s.id
      ${spotlightIds.length ? `WHERE a.id <> ALL($1::uuid[])` : ''}
      ORDER BY a."createdAt" ASC
      LIMIT ${Math.max(0, 3 - awardedSpotlightRes.rows.length)}
    `, spotlightIds.length ? [spotlightIds] : []).catch(() => ({ rows: [] }));

    const spotlights = [
      ...awardedSpotlightRes.rows,
      ...fallbackSpotlightRes.rows.map((row: any) => ({
        ...row,
        headline: row.currentTitle || 'Madni Alumni Community Leader',
        reason: `${row.name} is highlighted for being part of the Madni alumni network and inspiring students through career growth, community connection, and continued support.`,
        highlights: [
          row.schoolName ? `Represents ${row.schoolName}` : 'Represents the Madni alumni community',
          row.batchYear ? `Batch of ${row.batchYear}` : 'Connected with the alumni family',
          row.currentTitle || 'Committed to student inspiration and community support',
        ],
        year: new Date().getFullYear(),
        isFallback: true,
      })),
    ].slice(0, 3);

    const profileFields = [
      alumni.name,
      alumni.email,
      alumni.batchYear,
      alumni.linkedIn,
      alumni.profilePic,
      alumni.currentTitle,
      alumni.currentBio,
      alumni.workLink,
    ];
    const completedFields = profileFields.filter((value) => String(value || '').trim()).length;
    const profileCompletion = Math.round((completedFields / profileFields.length) * 100);
    const summary = {
      careerPosts: careerRes.rows[0]?.count || 0,
      mentorshipOffers: mentorshipRes.rows[0]?.count || 0,
      blogs: blogsRes.rows[0]?.count || 0,
      achievements: achievementsRes.rows[0]?.count || 0,
      csrReferrals: csrRes.rows[0]?.count || 0,
      donations: totalDonated,
    };
    const pending = {
      career: careerRes.rows[0]?.pending || 0,
      mentorship: mentorshipRes.rows[0]?.pending || 0,
      blogs: blogsRes.rows[0]?.pending || 0,
      achievements: achievementsRes.rows[0]?.pending || 0,
      csr: csrRes.rows[0]?.pending || 0,
    };

    return NextResponse.json({
      alumni,
      urgentCause,
      spotlight: spotlights[0] || null,
      spotlights,
      profileCompletion,
      summary,
      pending,
      upcomingMeet: upcomingMeetRes.rows[0] || null,
      stats: {
        totalPosts: summary.careerPosts + summary.mentorshipOffers + summary.blogs + summary.achievements + summary.csrReferrals,
        totalDonated,
        totalAlumni: totalAlumniRes.rows[0]?.count || 0,
        activeJobs: totalJobsRes.rows[0]?.count || 0,
        totalMentors: totalMentorsRes.rows[0]?.count || 0,
      }
    });

  } catch (error: any) {
    console.error('Failed to fetch alumni stats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
