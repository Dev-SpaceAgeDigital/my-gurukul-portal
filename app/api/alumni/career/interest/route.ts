import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';
import { ensureCareerTables } from '@/lib/ensureCareerTables';
import { createNotification } from '@/lib/notifications';

export async function POST(request: Request) {
  try {
    await ensureCareerTables();

    const session = await getSessionFromCookies('ALUMNI');
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const alumniId = (session as any).alumniId || session.userId;
    const { careerId, interestType } = await request.json();

    if (!careerId || !interestType) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    if (!['INTERESTED', 'REFERRAL_CONTACT'].includes(interestType)) {
      return NextResponse.json({ error: 'Invalid interest type' }, { status: 400 });
    }

    // Remove any opposite interest type for this career/post for this alumni
    const otherType = interestType === 'INTERESTED' ? 'REFERRAL_CONTACT' : 'INTERESTED';
    await pool.query(
      'DELETE FROM "CareerInterest" WHERE "careerId" = $1 AND "alumniId" = $2 AND "interestType" = $3',
      [careerId, alumniId, otherType]
    );

    // Check existing record
    const existing = await pool.query(
      'SELECT id FROM "CareerInterest" WHERE "careerId" = $1 AND "alumniId" = $2 AND "interestType" = $3',
      [careerId, alumniId, interestType]
    );

    let active = false;

    if (existing.rows.length > 0) {
      // Toggle off (remove)
      await pool.query(
        'DELETE FROM "CareerInterest" WHERE "careerId" = $1 AND "alumniId" = $2 AND "interestType" = $3',
        [careerId, alumniId, interestType]
      );
      active = false;
    } else {
      // Toggle on (insert)
      await pool.query(
        'INSERT INTO "CareerInterest" ("careerId", "alumniId", "interestType") VALUES ($1, $2, $3)',
        [careerId, alumniId, interestType]
      );
      active = true;

      // Find opportunity author to send notification
      try {
        const [careerPost, mentorshipPost, senderAlumni] = await Promise.all([
          pool.query('SELECT "alumniId", role as title, "schoolId" FROM "CareerOpportunity" WHERE id = $1', [careerId]),
          pool.query('SELECT "alumniId", title, "schoolId" FROM "MentorshipOffer" WHERE id = $1', [careerId]),
          pool.query('SELECT name FROM "Alumni" WHERE id = $1', [alumniId]),
        ]);

        const targetPost = careerPost.rows[0] || mentorshipPost.rows[0];
        const senderName = senderAlumni.rows[0]?.name || 'An alumni';

        if (targetPost && targetPost.alumniId && targetPost.alumniId !== alumniId) {
          const typeLabel = interestType === 'INTERESTED' ? 'is interested in' : 'has referral contacts for';
          await createNotification({
            title: `New opportunity interest: ${targetPost.title}`,
            message: `${senderName} ${typeLabel} your posted opportunity.`,
            type: 'ACTION',
            priority: 'NORMAL',
            actorRole: 'ALUMNI',
            actorId: alumniId,
            schoolId: targetPost.schoolId,
            link: '/alumni/registrations',
            audiences: [
              { type: 'DIRECT', recipientRole: 'ALUMNI', recipientId: targetPost.alumniId },
            ],
          });
        }
      } catch (notifyErr) {
        console.warn('Could not send interest notification:', notifyErr);
      }
    }

    // Count updated totals for both
    const [intCountRes, refCountRes] = await Promise.all([
      pool.query('SELECT COUNT(*)::int as count FROM "CareerInterest" WHERE "careerId" = $1 AND "interestType" = $2', [careerId, 'INTERESTED']),
      pool.query('SELECT COUNT(*)::int as count FROM "CareerInterest" WHERE "careerId" = $1 AND "interestType" = $2', [careerId, 'REFERRAL_CONTACT']),
    ]);

    return NextResponse.json({
      success: true,
      active,
      interestType,
      interestedCount: intCountRes.rows[0]?.count || 0,
      referralCount: refCountRes.rows[0]?.count || 0,
    });
  } catch (error) {
    console.error('Error toggling career interest:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
