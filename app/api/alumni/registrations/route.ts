import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';
import { ensureCareerTables } from '@/lib/ensureCareerTables';

export async function GET(request: Request) {
  try {
    await ensureCareerTables();

    const session = await getSessionFromCookies('ALUMNI');
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const alumniId = (session as any).alumniId || session.userId;

    const { searchParams } = new URL(request.url);
    const postType = (searchParams.get('postType') || '').toUpperCase();
    const postId = searchParams.get('postId');

    if (!['CAREER', 'MENTORSHIP'].includes(postType) || !postId) {
      return NextResponse.json({ error: 'Missing opportunity details' }, { status: 400 });
    }

    const postResult = postType === 'CAREER'
      ? await pool.query(
          `SELECT id, role AS title, "companyName" AS subtitle, type
           FROM "CareerOpportunity"
           WHERE id = $1 AND "alumniId" = $2`,
          [postId, alumniId]
        )
      : await pool.query(
          `SELECT id, title, category AS subtitle, 'MENTORSHIP' AS type
           FROM "MentorshipOffer"
           WHERE id = $1 AND "alumniId" = $2`,
          [postId, alumniId]
        );

    const post = postResult.rows[0];
    if (!post) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    const registrationsResult = await pool.query(
      `SELECT id, name, email, "phoneNo", "linkedInUrl", "createdAt"
       FROM "OpportunityRegistration"
       WHERE "postType" = $1 AND "postId" = $2 AND "alumniId" = $3
       ORDER BY "createdAt" DESC`,
      [postType, postId, alumniId]
    );

    return NextResponse.json({ post, registrations: registrationsResult.rows });
  } catch (error) {
    console.error('Alumni registrations fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
