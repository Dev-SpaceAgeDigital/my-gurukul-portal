import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getSessionFromCookies('ALUMNI');
    if (!session || session.role !== 'ALUMNI') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parseDateParam = (param: string | null) => {
      if (!param) return null;
      const num = Number(param);
      if (!isNaN(num) && num > 0) return new Date(num);
      const d = new Date(param);
      return isNaN(d.getTime()) ? null : d;
    };

    const feedSince = parseDateParam(searchParams.get('feedSince'));
    const memoriesSince = parseDateParam(searchParams.get('memoriesSince'));
    const giveBackSince = parseDateParam(searchParams.get('giveBackSince'));
    const myPostsSince = parseDateParam(searchParams.get('myPostsSince'));
    const impactSince = parseDateParam(searchParams.get('impactSince'));

    // Fetch alumni email and schoolId
    const alumniRes = await pool.query('SELECT email, "schoolId" FROM "Alumni" WHERE id = $1', [session.userId]);
    const alumni = alumniRes.rows[0];
    const email = alumni?.email || '';

    // 1. Community Feed Badge Count
    let feedCount = 0;
    if (feedSince) {
      const feedRes = await pool.query(
        `SELECT (
          (SELECT COUNT(*) FROM "CareerOpportunity" WHERE status = 'APPROVED' AND "createdAt" > $1) +
          (SELECT COUNT(*) FROM "MentorshipOffer" WHERE status = 'APPROVED' AND "createdAt" > $1) +
          (SELECT COUNT(*) FROM "Blog" WHERE status = 'APPROVED' AND "createdAt" > $1) +
          (SELECT COUNT(*) FROM "Achievement" WHERE status = 'APPROVED' AND "createdAt" > $1)
        )::int as count`,
        [feedSince]
      ).catch(() => ({ rows: [{ count: 0 }] }));
      feedCount = feedRes.rows[0]?.count || 0;
    }

    // 2. School Memories Badge Count
    let memoriesCount = 0;
    if (memoriesSince) {
      const memRes = await pool.query(
        `SELECT COUNT(*)::int as count FROM "Event" WHERE "createdAt" > $1`,
        [memoriesSince]
      ).catch(() => ({ rows: [{ count: 0 }] }));
      memoriesCount = memRes.rows[0]?.count || 0;
    }

    // 3. Give Back Badge Count (Urgent Needs / Causes)
    let giveBackCount = 0;
    if (giveBackSince) {
      const gbRes = await pool.query(
        `SELECT COUNT(*)::int as count FROM "Expense" WHERE type IN ('CONSTRUCTION', 'EVENT') AND "createdAt" > $1`,
        [giveBackSince]
      ).catch(() => ({ rows: [{ count: 0 }] }));
      giveBackCount = gbRes.rows[0]?.count || 0;
    }

    // 4. My Posts Badge Count (User's posts that got approved or rejected)
    let myPostsCount = 0;
    if (myPostsSince) {
      const mpRes = await pool.query(
        `SELECT (
          (SELECT COUNT(*) FROM "CareerOpportunity" WHERE "alumniId" = $1 AND status IN ('APPROVED', 'REJECTED') AND "updatedAt" > $2) +
          (SELECT COUNT(*) FROM "MentorshipOffer" WHERE "alumniId" = $1 AND status IN ('APPROVED', 'REJECTED') AND "updatedAt" > $2) +
          (SELECT COUNT(*) FROM "Blog" WHERE "alumniId" = $1 AND status IN ('APPROVED', 'REJECTED') AND "updatedAt" > $2) +
          (SELECT COUNT(*) FROM "Achievement" WHERE "alumniId" = $1 AND status IN ('APPROVED', 'REJECTED') AND "updatedAt" > $2)
        )::int as count`,
        [session.userId, myPostsSince]
      ).catch(() => ({ rows: [{ count: 0 }] }));
      myPostsCount = mpRes.rows[0]?.count || 0;
    }

    // 5. My Impact Badge Count (Donations / Receipts)
    let impactCount = 0;
    if (impactSince && email) {
      const impRes = await pool.query(
        `SELECT COUNT(*)::int as count FROM "Transaction" WHERE "donorEmail" = $1 AND status = 'SUCCESS' AND "createdAt" > $2`,
        [email, impactSince]
      ).catch(() => ({ rows: [{ count: 0 }] }));
      impactCount = impRes.rows[0]?.count || 0;
    }

    return NextResponse.json({
      feed: feedCount,
      memories: memoriesCount,
      giveBack: giveBackCount,
      myPosts: myPostsCount,
      impact: impactCount,
    });
  } catch (error) {
    console.error('Failed to fetch tab badges:', error);
    return NextResponse.json({ feed: 0, memories: 0, giveBack: 0, myPosts: 0, impact: 0 });
  }
}
