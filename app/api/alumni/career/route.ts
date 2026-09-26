import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';
import { ensureCareerTables } from '@/lib/ensureCareerTables';
import { logActivity } from '@/lib/monitoring';

export async function GET(request: Request) {
  try {
    await ensureCareerTables();

    const session = await getSessionFromCookies('ALUMNI');
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const alumniId = (session as any).alumniId || session.userId;

    const result = await pool.query(`
      SELECT 
        c.*,
        COALESCE(i_int.interested_count, 0)::int as "interestedCount",
        COALESCE(i_ref.referral_count, 0)::int as "referralCount",
        CASE WHEN u_int.id IS NOT NULL THEN true ELSE false END as "userInterested",
        CASE WHEN u_ref.id IS NOT NULL THEN true ELSE false END as "userReferral"
      FROM "CareerOpportunity" c
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
      LEFT JOIN "CareerInterest" u_int ON c.id = u_int."careerId" AND u_int."alumniId" = $1 AND u_int."interestType" = 'INTERESTED'
      LEFT JOIN "CareerInterest" u_ref ON c.id = u_ref."careerId" AND u_ref."alumniId" = $1 AND u_ref."interestType" = 'REFERRAL_CONTACT'
      WHERE c."alumniId" = $1
      ORDER BY c."createdAt" DESC
    `, [alumniId]);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Career fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureCareerTables();

    const session = await getSessionFromCookies('ALUMNI');
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const alumniId = (session as any).alumniId || session.userId;
    const body = await request.json();
    const {
      type,
      companyName,
      companyLink,
      role,
      relation,
      description,
      category,
      location,
      workMode,
      salary,
      duration,
      experienceLevel,
      applyLink,
      deadline
    } = body;

    if (!type || !companyName || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get alumni's schoolId to associate with the post
    const alumniRes = await pool.query('SELECT name, email, "schoolId" FROM "Alumni" WHERE id = $1', [alumniId]);
    const schoolId = alumniRes.rows[0]?.schoolId;

    if (!schoolId) {
      return NextResponse.json({ error: 'Institutional record not found' }, { status: 404 });
    }

    const result = await pool.query(`
      INSERT INTO "CareerOpportunity" (
        "alumniId", "schoolId", "type", "companyName", "companyLink", "role", "relation", "description", "category",
        "location", "workMode", "salary", "duration", "experienceLevel", "applyLink", "deadline", "status"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'PENDING')
      RETURNING *
    `, [
      alumniId,
      schoolId,
      type,
      companyName,
      companyLink || null,
      role,
      relation || null,
      description || null,
      category || 'Engineering & Tech',
      location || null,
      workMode || 'ON_SITE',
      salary || null,
      duration || null,
      experienceLevel || null,
      applyLink || null,
      deadline ? new Date(deadline) : null
    ]);

    await createNotification({
      title: 'New career opening submitted',
      message: `${role} at ${companyName} is waiting for review.`,
      type: 'CAREER',
      priority: 'NORMAL',
      actorRole: 'ALUMNI',
      actorId: alumniId,
      schoolId,
      entityType: 'CareerOpportunity',
      entityId: result.rows[0].id,
      link: '/subadmin/alumni',
      audiences: [
        { type: 'ROLE', recipientRole: 'SUPER_ADMIN' },
        { type: 'SCHOOL_ROLE', recipientRole: 'SUB_ADMIN', schoolId },
        { type: 'SCHOOL_ALUMNI', schoolId },
      ],
    });

    await logActivity({
      schoolId,
      actorRole: 'ALUMNI',
      actorId: alumniId,
      actorName: alumniRes.rows[0]?.name,
      actorEmail: alumniRes.rows[0]?.email,
      category: 'CAREER',
      action: 'CAREER_SUBMITTED',
      title: `${role} at ${companyName}`,
      message: 'Career opportunity submitted for review.',
      status: 'PENDING',
      entityType: 'CareerOpportunity',
      entityId: result.rows[0].id,
      link: '/subadmin/alumni',
    });

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Career creation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
