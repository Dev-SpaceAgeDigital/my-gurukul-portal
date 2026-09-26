import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { withPublicApi } from '@/lib/public-api';

export const dynamic = 'force-dynamic';

export const GET = withPublicApi(async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const alumniId = searchParams.get('alumniId');
  const storyId = searchParams.get('storyId');

  if (!alumniId && !storyId) {
    return NextResponse.json({ error: 'alumniId or storyId required' }, { status: 400 });
  }

  // Get blog/achievement for storyId to find alumniId
  let resolvedAlumniId = alumniId;

  if (!resolvedAlumniId && storyId) {
    const blogRes = await pool.query(
      `SELECT "alumniId" FROM "Blog" WHERE id = $1 LIMIT 1`,
      [storyId]
    );
    if (blogRes.rows.length > 0) {
      resolvedAlumniId = blogRes.rows[0].alumniId;
    } else {
      const achRes = await pool.query(
        `SELECT "alumniId" FROM "Achievement" WHERE id = $1 LIMIT 1`,
        [storyId]
      );
      resolvedAlumniId = achRes.rows[0]?.alumniId || null;
    }
  }

  if (!resolvedAlumniId) {
    return NextResponse.json({ error: 'Alumni not found' }, { status: 404 });
  }

  // Fetch alumni profile
  const alumniRes = await pool.query(`
    SELECT 
      a.id,
      a.name,
      a.email,
      a."batchYear",
      a."currentTitle",
      a."currentBio",
      a."profilePic",
      a."linkedIn",
      a."workLink",
      s."schoolName",
      s.id as "schoolId"
    FROM "Alumni" a
    LEFT JOIN "School" s ON a."schoolId" = s.id
    WHERE a.id = $1
    LIMIT 1
  `, [resolvedAlumniId]);

  if (alumniRes.rows.length === 0) {
    return NextResponse.json({ error: 'Alumni not found' }, { status: 404 });
  }
  const alumni = alumniRes.rows[0];

  // Fetch their blog stories
  const blogsRes = await pool.query(`
    SELECT id, title, content, "mediaUrl", "mediaType", "isFeatured", "createdAt"
    FROM "Blog"
    WHERE "alumniId" = $1 AND status = 'APPROVED'
    ORDER BY "isTopFeatured" DESC, "isFeatured" DESC, "createdAt" DESC
  `, [resolvedAlumniId]);

  // Fetch their achievements
  const achRes = await pool.query(`
    SELECT id, title, description, category, "mediaUrl", "createdAt"
    FROM "Achievement"
    WHERE "alumniId" = $1 AND status = 'APPROVED'
    ORDER BY "isFeatured" DESC, "createdAt" DESC
  `, [resolvedAlumniId]);

  // Fetch jobs and internships (CareerOpportunity table, if exists)
  let careers: any[] = [];
  try {
    const carRes = await pool.query(`
      SELECT id, type, "companyName", "companyLink", role, relation, description
      FROM "CareerOpportunity"
      WHERE "alumniId" = $1 AND status = 'APPROVED'
      ORDER BY type ASC, "createdAt" DESC
    `, [resolvedAlumniId]);
    careers = carRes.rows;
  } catch (_) { /* table may not exist yet */ }

  // Fetch mentorships (MentorshipOffer table, if exists)
  let mentorships: any[] = [];
  try {
    const menRes = await pool.query(`
      SELECT id, title, description, "targetStudent", availability
      FROM "MentorshipOffer"
      WHERE "alumniId" = $1 AND status = 'APPROVED'
      ORDER BY "createdAt" DESC
    `, [resolvedAlumniId]);
    mentorships = menRes.rows;
  } catch (_) { /* table may not exist yet */ }

  return NextResponse.json({
    alumni,
    blogs: blogsRes.rows,
    achievements: achRes.rows,
    careers,
    mentorships,
  });
}, { maxRequests: 60, cacheSeconds: 10 });
