import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { withPublicApi } from '@/lib/public-api';

export const dynamic = 'force-dynamic';

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function slugAliases(schoolName: string) {
  const base = slugify(schoolName);
  return new Set([
    base,
    base.replace('-high', ''),
    base.replace('-public-high', '-public'),
    base.replace('-gujarati', ''),
  ]);
}

function pct(passed: number, appeared: number) {
  if (!appeared) return 'N/A';
  return `${((passed / appeared) * 100).toFixed(1)}%`;
}

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

export const GET = withPublicApi(async (req: NextRequest) => {
  const slug = req.nextUrl.searchParams.get('slug');
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 });

  const schoolsRes = await pool.query(`
    SELECT
      s.*,
      t."trustName",
      t."registrationNo" as "trustRegNo",
      t."establishmentYear" as "trustEstablishmentYear"
    FROM "School" s
    LEFT JOIN "Trust" t ON s."trustId" = t.id
    ORDER BY s."createdAt" DESC
  `);

  const school = schoolsRes.rows.find((row) => slugAliases(row.schoolName).has(slug));
  if (!school) return NextResponse.json({ error: 'School not found' }, { status: 404 });

  const schoolId = school.id;

  const [
    standardsRes,
    contentRes,
    resultsRes,
    toppersRes,
    eventsRes,
    projectsRes,
    financialAidRes,
    alumniStoriesRes,
    alumniAchievementsRes,
  ] = await Promise.all([
    pool.query('SELECT id, "standardName", division, stream, fees, "batchYear" FROM "Standard" WHERE "schoolId" = $1 ORDER BY "standardName" ASC, division ASC', [schoolId]),
    pool.query('SELECT * FROM "SchoolPageContent" WHERE "schoolId" = $1 LIMIT 1', [schoolId]).catch((error) => {
      if (error?.code === '42P01') return { rows: [] } as any;
      throw error;
    }),
    pool.query(`
      SELECT
        ay.label as year,
        COUNT(*) FILTER (WHERE std."standardName" ILIKE '%10%')::int as "sscAppeared",
        COUNT(*) FILTER (WHERE std."standardName" ILIKE '%10%' AND se.status IN ('PROMOTED','GRADUATED'))::int as "sscPassed",
        COUNT(*) FILTER (WHERE std."standardName" ILIKE '%12%')::int as "hscAppeared",
        COUNT(*) FILTER (WHERE std."standardName" ILIKE '%12%' AND se.status IN ('PROMOTED','GRADUATED'))::int as "hscPassed",
        COUNT(*) FILTER (WHERE se.status = 'REPEATING')::int as repeating,
        COUNT(*) FILTER (WHERE se.status = 'DROPPED')::int as dropped,
        COUNT(*) FILTER (WHERE se.status IN ('PROMOTED','GRADUATED'))::int as promoted
      FROM "StudentEnrollment" se
      JOIN "Student" st ON se."studentId" = st.id
      JOIN "Standard" std ON se."standardId" = std.id
      JOIN "AcademicYear" ay ON se."academicYearId" = ay.id
      WHERE st."schoolId" = $1 AND se.status <> 'ACTIVE'
      GROUP BY ay.label
      ORDER BY ay.label DESC
      LIMIT 3
    `, [schoolId]),
    pool.query(`
      SELECT
        st.name,
        std."standardName",
        std.stream,
        ay.label as year,
        se.rank,
        se.percentage
      FROM "StudentEnrollment" se
      JOIN "Student" st ON se."studentId" = st.id
      JOIN "Standard" std ON se."standardId" = std.id
      JOIN "AcademicYear" ay ON se."academicYearId" = ay.id
      WHERE st."schoolId" = $1 AND se.rank BETWEEN 1 AND 3
      ORDER BY ay.label DESC, se.rank ASC
      LIMIT 6
    `, [schoolId]),
    pool.query(`
      SELECT
        e.id, e.title, e.description, e.category, e.date, e."createdAt",
        COALESCE(
          json_agg(json_build_object('id', m.id, 'mediaType', m."mediaType", 'url', m.url))
          FILTER (WHERE m.id IS NOT NULL),
          '[]'
        ) as media
      FROM "Event" e
      LEFT JOIN "EventMedia" m ON e.id = m."eventId"
      WHERE e."schoolId" = $1
      GROUP BY e.id
      ORDER BY e.date DESC, e."createdAt" DESC
      LIMIT 36
    `, [schoolId]),
    pool.query(`
      SELECT id, title, description, type, "startDate", "estimatedCost", "paidAmount", "mediaUrl", "mediaType", "createdAt"
      FROM "Expense"
      WHERE "schoolId" = $1
      ORDER BY "createdAt" DESC
      LIMIT 12
    `, [schoolId]),
    pool.query(`
      SELECT
        std.id as "standardId",
        std."standardName",
        std.division,
        std.stream,
        std.fees,
        COUNT(CASE WHEN stu."isNeedy" = true AND stu."sponsorshipType" ILIKE '%Zakat%' THEN 1 END)::int as "zakatCount",
        COUNT(CASE WHEN stu."isNeedy" = true AND stu."sponsorshipType" ILIKE '%Lillah%' THEN 1 END)::int as "lillahCount",
        COALESCE(SUM(CASE WHEN stu."isNeedy" = true AND stu."sponsorshipType" ILIKE '%Zakat%' THEN stu."aidPaidAmount" ELSE 0 END), 0)::float as "zakatPaid",
        COALESCE(SUM(CASE WHEN stu."isNeedy" = true AND stu."sponsorshipType" ILIKE '%Lillah%' THEN stu."aidPaidAmount" ELSE 0 END), 0)::float as "lillahPaid"
      FROM "Standard" std
      LEFT JOIN "Student" stu ON std.id = stu."standardId"
      WHERE std."schoolId" = $1
      GROUP BY std.id, std."standardName", std.division, std.stream, std.fees
      ORDER BY std."standardName" ASC, std.division ASC
    `, [schoolId]),
    pool.query(`
      SELECT b.id, b.title, b.content, b."mediaUrl", b."mediaType", b."createdAt", a.name as "alumniName", a."currentTitle" as "alumniTitle"
      FROM "Blog" b
      JOIN "Alumni" a ON b."alumniId" = a.id
      WHERE b."schoolId" = $1 AND b.status = 'APPROVED'
      ORDER BY b."isFeatured" DESC, b."updatedAt" DESC
      LIMIT 6
    `, [schoolId]),
    pool.query(`
      SELECT ac.id, ac.title, ac.description, ac.category, ac.date, ac."mediaUrl", ac."mediaType", a.name as "alumniName", a."currentTitle" as "alumniTitle"
      FROM "Achievement" ac
      JOIN "Alumni" a ON ac."alumniId" = a.id
      WHERE ac."schoolId" = $1 AND ac.status = 'APPROVED'
      ORDER BY ac."isFeatured" DESC, ac."updatedAt" DESC
      LIMIT 6
    `, [schoolId]),
  ]);

  const results = resultsRes.rows.map((row) => ({
    ...row,
    sscRate: pct(Number(row.sscPassed), Number(row.sscAppeared)),
    hscRate: pct(Number(row.hscPassed), Number(row.hscAppeared)),
  }));

  return NextResponse.json({
    school,
    standards: standardsRes.rows,
    content: contentRes.rows[0] || null,
    results,
    toppers: toppersRes.rows,
    events: eventsRes.rows,
    projects: projectsRes.rows.map(normalizeExpenseMedia),
    financialAidNeeds: financialAidRes.rows,
    alumniStories: alumniStoriesRes.rows,
    alumniAchievements: alumniAchievementsRes.rows,
  });
}, { maxRequests: 60, cacheSeconds: 60 });
