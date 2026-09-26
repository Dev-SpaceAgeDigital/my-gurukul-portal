import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { withPublicApi } from '@/lib/public-api';

export const dynamic = 'force-dynamic';

export const GET = withPublicApi(async () => {
  const blogsRes = await pool.query(`
    SELECT
      b.id,
      b.title,
      b.content,
      b.tags,
      b."mediaUrl",
      b."mediaType",
      b."isFeatured",
      b."isTopFeatured",
      b."createdAt",
      a.name as "alumniName",
      a."currentTitle" as "alumniTitle",
      a."batchYear",
      s."schoolName"
    FROM "Blog" b
    JOIN "Alumni" a ON b."alumniId" = a.id
    JOIN "School" s ON b."schoolId" = s.id
    WHERE b.status = 'APPROVED' AND (b."isTopFeatured" = true OR b."isFeatured" = true)
    ORDER BY b."isTopFeatured" DESC, b."isFeatured" DESC, b."createdAt" DESC
  `);

  const achievementsRes = await pool.query(`
    SELECT
      ac.id,
      ac.title,
      ac.description,
      ac.date,
      ac.category,
      ac."mediaUrl",
      ac."mediaType",
      ac."isFeatured",
      ac."createdAt",
      a.name as "alumniName",
      a."currentTitle" as "alumniTitle",
      a."batchYear",
      s."schoolName"
    FROM "Achievement" ac
    JOIN "Alumni" a ON ac."alumniId" = a.id
    JOIN "School" s ON ac."schoolId" = s.id
    WHERE ac.status = 'APPROVED' AND ac."isFeatured" = true
    ORDER BY ac."isFeatured" DESC, ac."createdAt" DESC
  `);

  return NextResponse.json({
    stories: blogsRes.rows,
    achievements: achievementsRes.rows,
  });
}, { maxRequests: 60, cacheSeconds: 30 });
