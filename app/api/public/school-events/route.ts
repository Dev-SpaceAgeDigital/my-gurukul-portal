import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { withPublicApi } from '@/lib/public-api';

export const dynamic = 'force-dynamic';

export const GET = withPublicApi(async () => {
  const result = await pool.query(`
    SELECT
      e.id,
      e.title,
      e.tagline,
      e.description,
      e.points,
      e."featuredImage",
      e.category,
      e.date,
      e."createdAt",
      s."schoolName",
      COALESCE(
        json_agg(
          json_build_object(
            'id', m.id,
            'mediaType', m."mediaType",
            'url', m.url
          )
        ) FILTER (WHERE m.id IS NOT NULL),
        '[]'
      ) as media
    FROM "Event" e
    JOIN "School" s ON e."schoolId" = s.id
    LEFT JOIN "EventMedia" m ON e.id = m."eventId"
    GROUP BY e.id, s."schoolName"
    ORDER BY e.date DESC, e."createdAt" DESC
    LIMIT 24
  `);

  return NextResponse.json({ events: result.rows });
}, { maxRequests: 60, cacheSeconds: 60 });
