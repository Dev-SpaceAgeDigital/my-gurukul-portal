import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';
import { createApprovedAlumniFromRequest, ensureAlumniOnboardingTables } from '@/lib/alumniOnboarding';
import { createNotification } from '@/lib/notifications';
import { logActivity } from '@/lib/monitoring';
import { checkRateLimit, rateLimitResponse } from '@/lib/security/rateLimit';

export async function GET(req: Request) {
  try {
    const session = await getSessionFromCookies('SUB_ADMIN');
    if (!session || session.role !== 'SUB_ADMIN' || !session.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const limit = await checkRateLimit(req, 'authRead', session.userId);
    if (!limit.allowed) return rateLimitResponse(limit.retryAfter);

    await ensureAlumniOnboardingTables();
    const status = new URL(req.url).searchParams.get('status') || 'PENDING';
    const result = await pool.query(
      `SELECT * FROM "AlumniRegistrationRequest"
       WHERE "schoolId" = $1 AND ($2 = 'ALL' OR status = $2)
       ORDER BY "createdAt" DESC
       LIMIT 120`,
      [session.schoolId, status]
    );

    return NextResponse.json({ requests: result.rows });
  } catch (error) {
    console.error('Alumni requests fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch alumni requests' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getSessionFromCookies('SUB_ADMIN');
    if (!session || session.role !== 'SUB_ADMIN' || !session.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const limit = await checkRateLimit(req, 'mutation', session.userId);
    if (!limit.allowed) return rateLimitResponse(limit.retryAfter);

    await ensureAlumniOnboardingTables();
    const body = await req.json();
    const id = String(body.id || '').trim();
    const action = String(body.action || '').trim().toUpperCase();
    const rejectionReason = String(body.rejectionReason || '').trim();

    if (!id || !['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json({ error: 'Request ID and valid action are required' }, { status: 400 });
    }

    const reqRes = await pool.query(
      `SELECT * FROM "AlumniRegistrationRequest"
       WHERE id = $1 AND "schoolId" = $2
       LIMIT 1`,
      [id, session.schoolId]
    );
    const registration = reqRes.rows[0];
    if (!registration) return NextResponse.json({ error: 'Registration request not found' }, { status: 404 });
    if (registration.status !== 'PENDING') return NextResponse.json({ error: 'This request is already reviewed' }, { status: 400 });

    if (action === 'REJECT') {
      const result = await pool.query(
        `UPDATE "AlumniRegistrationRequest"
         SET status = 'REJECTED', "reviewedBy" = $1, "reviewedAt" = NOW(),
             "rejectionReason" = $2, "updatedAt" = NOW()
         WHERE id = $3
         RETURNING *`,
        [session.userId, rejectionReason || null, id]
      );

      await logActivity({
        schoolId: session.schoolId,
        actorRole: 'SUB_ADMIN',
        actorId: session.userId,
        actorEmail: session.email,
        category: 'ALUMNI',
        action: 'OLD_STUDENT_REGISTRATION_REJECTED',
        title: 'Alumni request rejected',
        message: `${registration.name} was rejected for alumni access.`,
        status: 'REJECTED',
        entityType: 'AlumniRegistrationRequest',
        entityId: id,
        link: '/subadmin/alumni',
      });

      return NextResponse.json({ success: true, request: result.rows[0] });
    }

    const created = await createApprovedAlumniFromRequest(registration, req);
    const result = await pool.query(
      `UPDATE "AlumniRegistrationRequest"
       SET status = 'APPROVED', "reviewedBy" = $1, "reviewedAt" = NOW(),
           "alumniId" = $2, "updatedAt" = NOW()
       WHERE id = $3
       RETURNING *`,
      [session.userId, created.alumni.id, id]
    );

    await createNotification({
      title: 'Alumni request approved',
      message: `${registration.name} was approved and credentials were sent.`,
      type: 'MONITORING',
      priority: 'NORMAL',
      actorRole: 'SUB_ADMIN',
      actorId: session.userId,
      schoolId: session.schoolId,
      entityType: 'Alumni',
      entityId: created.alumni.id,
      link: '/superadmin/alumni',
      audiences: [{ type: 'ROLE', recipientRole: 'SUPER_ADMIN' }],
    });

    await logActivity({
      schoolId: session.schoolId,
      actorRole: 'SUB_ADMIN',
      actorId: session.userId,
      actorEmail: session.email,
      category: 'ALUMNI',
      action: 'OLD_STUDENT_REGISTRATION_APPROVED',
      title: 'Alumni request approved',
      message: `${registration.name} was approved and alumni credentials were generated.`,
      status: 'APPROVED',
      entityType: 'AlumniRegistrationRequest',
      entityId: id,
      link: '/subadmin/alumni',
      metadata: { alumniId: created.alumni.id, emailSent: created.emailSent },
    });

    return NextResponse.json({
      success: true,
      request: result.rows[0],
      alumni: created.alumni,
      emailSent: created.emailSent,
      password: created.password,
    });
  } catch (error: any) {
    console.error('Alumni request review error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to review alumni request' }, { status: 500 });
  }
}
