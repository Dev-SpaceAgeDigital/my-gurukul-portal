import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';

export async function GET(request: Request) {
  try {
    const session = await getSessionFromCookies('ADMIN');
    if (!session || session.role !== 'SUB_ADMIN' || !session.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch both Jobs and Mentorships for this sub-admin's school
    const jobsRes = await pool.query(`
      SELECT 
        c.*, 
        a.name as "alumniName", 
        a.email as "alumniEmail",
        COALESCE(i_int.interested_count, 0)::int as "interestedCount",
        COALESCE(i_ref.referral_count, 0)::int as "referralCount"
      FROM "CareerOpportunity" c
      JOIN "Alumni" a ON c."alumniId" = a.id
      LEFT JOIN (
        SELECT "careerId", COUNT(*)::int as interested_count
        FROM "CareerInterest"
        WHERE "interestType" = 'INTERESTED'
        GROUP BY "careerId"
      ) i_int ON c.id = i_int."careerId"
      LEFT JOIN (
        SELECT "careerId", COUNT(*)::int as referral_count
        FROM "CareerInterest"
        WHERE "interestType" = 'REFERRAL_CONTACT'
        GROUP BY "careerId"
      ) i_ref ON c.id = i_ref."careerId"
      WHERE c."schoolId" = $1
      ORDER BY c."createdAt" DESC
    `, [session.schoolId]);

    const mentorshipsRes = await pool.query(`
      SELECT m.*, a.name as "alumniName", a.email as "alumniEmail"
      FROM "MentorshipOffer" m
      JOIN "Alumni" a ON m."alumniId" = a.id
      WHERE m."schoolId" = $1
      ORDER BY m."createdAt" DESC
    `, [session.schoolId]);

    const blogsRes = await pool.query(`
      SELECT b.*, a.name as "alumniName", a.email as "alumniEmail", a."currentTitle" as "alumniTitle"
      FROM "Blog" b
      JOIN "Alumni" a ON b."alumniId" = a.id
      WHERE b."schoolId" = $1
      ORDER BY b."createdAt" DESC
    `, [session.schoolId]);

    const achievementsRes = await pool.query(`
      SELECT ac.*, a.name as "alumniName", a.email as "alumniEmail", a."currentTitle" as "alumniTitle"
      FROM "Achievement" ac
      JOIN "Alumni" a ON ac."alumniId" = a.id
      WHERE ac."schoolId" = $1
      ORDER BY ac."createdAt" DESC
    `, [session.schoolId]);

    return NextResponse.json({
      jobs: jobsRes.rows,
      mentorships: mentorshipsRes.rows,
      blogs: blogsRes.rows,
      achievements: achievementsRes.rows
    });

  } catch (error) {
    console.error('Interactions fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSessionFromCookies('ADMIN');
    if (!session || session.role !== 'SUB_ADMIN' || !session.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id, type, status, isFeatured } = await request.json();

    if (!id || !type || (!status && typeof isFeatured !== 'boolean')) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const tableMap: Record<string, string> = {
      job: 'CareerOpportunity',
      mentorship: 'MentorshipOffer',
      blog: 'Blog',
      achievement: 'Achievement',
    };
    const table = tableMap[type];

    if (!table) {
      return NextResponse.json({ error: 'Invalid interaction type' }, { status: 400 });
    }
    
    // Verify ownership before update
    const checkRes = await pool.query(`SELECT id, status FROM "${table}" WHERE id = $1 AND "schoolId" = $2`, [id, session.schoolId]);
    if (checkRes.rows.length === 0) {
      return NextResponse.json({ error: 'Interaction not found for this school' }, { status: 404 });
    }

    if (typeof isFeatured === 'boolean') {
      if (type !== 'blog' && type !== 'achievement') {
        return NextResponse.json({ error: 'Featured selection is only available for blogs and achievements' }, { status: 400 });
      }

      const currentStatus = status || checkRes.rows[0].status;
      if (isFeatured && currentStatus !== 'APPROVED') {
        return NextResponse.json({ error: 'Only approved content can be featured' }, { status: 400 });
      }

      if (isFeatured) {
        await pool.query(`UPDATE "${table}" SET "isFeatured" = false, "updatedAt" = NOW() WHERE "schoolId" = $1`, [session.schoolId]);
      }
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (status) {
      params.push(status);
      updates.push(`status = $${params.length}`);

      if (status !== 'APPROVED' && (type === 'blog' || type === 'achievement')) {
        updates.push(`"isFeatured" = false`);
      }
    }

    if (typeof isFeatured === 'boolean') {
      params.push(isFeatured);
      updates.push(`"isFeatured" = $${params.length}`);
    }

    updates.push(`"updatedAt" = NOW()`);
    params.push(id);

    const result = await pool.query(`
      UPDATE "${table}"
      SET ${updates.join(', ')}
      WHERE id = $${params.length}
      RETURNING *
    `, params);

    const updatedRow = result.rows[0];

    // Trigger Notifications if status changed to APPROVED
    if (status === 'APPROVED' && updatedRow) {
      try {
        const itemTitle = updatedRow.title || updatedRow.role || updatedRow.companyName || 'Update';
        const alumniId = updatedRow.alumniId;
        let authorName = 'An Alumni';

        if (alumniId) {
          const alumniRes = await pool.query('SELECT name FROM "Alumni" WHERE id = $1', [alumniId]);
          if (alumniRes.rows[0]?.name) {
            authorName = alumniRes.rows[0].name;
          }

          // 1. Direct Notification to the Author
          await createNotification({
            title: 'Post Approved! 🎉',
            message: `Your ${type} "${itemTitle}" has been approved and is now live on the feed.`,
            type: 'CONTENT',
            priority: 'NORMAL',
            schoolId: session.schoolId,
            actorId: session.userId,
            actorRole: 'SUB_ADMIN',
            link: '/alumni/dashboard',
            audiences: [
              { type: 'DIRECT', recipientRole: 'ALUMNI', recipientId: alumniId }
            ]
          });
        }

        // 2. Broadcast Notification to ALL School Alumni (Excludes author via actorId)
        await createNotification({
          title: `New Post by ${authorName}`,
          message: `${authorName} posted "${itemTitle}". Check it out on the community feed!`,
          type: 'CONTENT',
          priority: 'NORMAL',
          schoolId: session.schoolId,
          actorId: alumniId || session.userId,
          actorRole: 'ALUMNI',
          link: '/alumni/dashboard',
          audiences: [
            { type: 'SCHOOL_ALUMNI', schoolId: session.schoolId }
          ]
        });
      } catch (notifErr) {
        console.error('Approval notification error:', notifErr);
      }
    }

    return NextResponse.json(updatedRow);

  } catch (error) {
    console.error('Interaction update error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
