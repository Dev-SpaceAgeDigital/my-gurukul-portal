import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';
import { ensureAlumniFeedInteractions } from '@/lib/ensureAlumniFeedInteractions';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await getSessionFromCookies('ALUMNI');
    if (!session || session.role !== 'ALUMNI') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await ensureAlumniFeedInteractions();

    const body = await req.json();
    const { feedItemId, itemType = 'general', feedItemIds } = body;

    const alumniId = (session as any).alumniId || session.userId;

    // Handle batch item view registration
    if (Array.isArray(feedItemIds) && feedItemIds.length > 0) {
      for (const id of feedItemIds) {
        if (id) {
          await pool.query(
            `INSERT INTO "AlumniFeedView" ("alumniId", "feedItemId", "itemType")
             VALUES ($1, $2, $3)
             ON CONFLICT ("alumniId", "feedItemId") DO NOTHING`,
            [alumniId, id, itemType]
          );
        }
      }
      return NextResponse.json({ success: true });
    }

    if (!feedItemId) {
      return NextResponse.json({ error: 'Missing feedItemId' }, { status: 400 });
    }

    // Insert view record for single post
    await pool.query(
      `INSERT INTO "AlumniFeedView" ("alumniId", "feedItemId", "itemType")
       VALUES ($1, $2, $3)
       ON CONFLICT ("alumniId", "feedItemId") DO NOTHING`,
      [alumniId, feedItemId, itemType]
    );

    // Fetch updated total view count
    const countRes = await pool.query(
      `SELECT COUNT(*)::int as count FROM "AlumniFeedView" WHERE "feedItemId" = $1`,
      [feedItemId]
    );
    const viewCount = countRes.rows[0]?.count || 0;

    return NextResponse.json({
      success: true,
      viewCount,
    });
  } catch (error: any) {
    console.error('Error in /api/alumni/community/view:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
