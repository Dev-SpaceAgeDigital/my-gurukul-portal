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
    const { feedItemId, itemType = 'general', liked } = body;

    if (!feedItemId) {
      return NextResponse.json({ error: 'Missing feedItemId' }, { status: 400 });
    }

    const alumniId = (session as any).alumniId || session.userId;

    // Check existing like
    const existingRes = await pool.query(
      `SELECT id FROM "AlumniFeedLike" WHERE "alumniId" = $1 AND "feedItemId" = $2`,
      [alumniId, feedItemId]
    );

    const isCurrentlyLiked = existingRes.rows.length > 0;
    let targetLiked: boolean;

    if (typeof liked === 'boolean') {
      targetLiked = liked;
    } else {
      targetLiked = !isCurrentlyLiked;
    }

    if (targetLiked && !isCurrentlyLiked) {
      await pool.query(
        `INSERT INTO "AlumniFeedLike" ("alumniId", "feedItemId", "itemType")
         VALUES ($1, $2, $3)
         ON CONFLICT ("alumniId", "feedItemId") DO NOTHING`,
        [alumniId, feedItemId, itemType]
      );
    } else if (!targetLiked && isCurrentlyLiked) {
      await pool.query(
        `DELETE FROM "AlumniFeedLike" WHERE "alumniId" = $1 AND "feedItemId" = $2`,
        [alumniId, feedItemId]
      );
    }

    // Fetch updated total likes count for this post
    const countRes = await pool.query(
      `SELECT COUNT(*)::int as count FROM "AlumniFeedLike" WHERE "feedItemId" = $1`,
      [feedItemId]
    );
    const likeCount = countRes.rows[0]?.count || 0;

    return NextResponse.json({
      success: true,
      liked: targetLiked,
      likeCount,
    });
  } catch (error: any) {
    console.error('Error in /api/alumni/community/like:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
