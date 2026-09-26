import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ensureAlumniOnboardingTables } from '@/lib/alumniOnboarding';
import { createNotification } from '@/lib/notifications';
import { logActivity } from '@/lib/monitoring';
import { checkRateLimit, rateLimitResponse } from '@/lib/security/rateLimit';

const publicHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function GET(req: Request) {
  try {
    const limit = await checkRateLimit(req, 'publicRead');
    if (!limit.allowed) return rateLimitResponse(limit.retryAfter);

    await ensureAlumniOnboardingTables();
    const token = new URL(req.url).searchParams.get('token') || '';
    if (!token) return NextResponse.json({ error: 'Invite token is required' }, { status: 400, headers: publicHeaders });

    const inviteRes = await pool.query(
      `SELECT id, email, "schoolId", "schoolName", "batchYear", status, "expiresAt"
       FROM "AlumniInvite"
       WHERE token = $1
       LIMIT 1`,
      [token]
    );
    const invite = inviteRes.rows[0];
    if (!invite) return NextResponse.json({ error: 'Invite link is invalid' }, { status: 404, headers: publicHeaders });
    if (new Date(invite.expiresAt).getTime() < Date.now()) {
      return NextResponse.json({ error: 'Invite link has expired' }, { status: 410, headers: publicHeaders });
    }

    return NextResponse.json({ invite }, { headers: publicHeaders });
  } catch (error) {
    console.error('Alumni invite verify error:', error);
    return NextResponse.json({ error: 'Failed to verify invite' }, { status: 500, headers: publicHeaders });
  }
}

export async function POST(req: Request) {
  try {
    const limit = await checkRateLimit(req, 'publicForm');
    if (!limit.allowed) return rateLimitResponse(limit.retryAfter);

    await ensureAlumniOnboardingTables();
    const body = await req.json();
    const token = String(body.token || '').trim();
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const phone = String(body.phone || '').trim();
    const batchYear = String(body.batchYear || '').trim();
    const currentTitle = String(body.currentTitle || '').trim();
    const currentBio = String(body.currentBio || '').trim();
    const linkedIn = String(body.linkedIn || '').trim();

    if (!token || !name || !email.includes('@')) {
      return NextResponse.json({ error: 'Invite token, name and valid email are required' }, { status: 400, headers: publicHeaders });
    }

    const inviteRes = await pool.query(
      `SELECT id, email, "schoolId", "schoolName", "batchYear", "expiresAt"
       FROM "AlumniInvite"
       WHERE token = $1
       LIMIT 1`,
      [token]
    );
    const invite = inviteRes.rows[0];
    if (!invite) return NextResponse.json({ error: 'Invite link is invalid' }, { status: 404, headers: publicHeaders });
    if (new Date(invite.expiresAt).getTime() < Date.now()) {
      return NextResponse.json({ error: 'Invite link has expired' }, { status: 410, headers: publicHeaders });
    }
    if (invite.email && String(invite.email).toLowerCase() !== email) {
      return NextResponse.json({ error: 'This invite was issued for a different email address' }, { status: 400, headers: publicHeaders });
    }

    const existingAlumni = await pool.query('SELECT id FROM "Alumni" WHERE email = $1 LIMIT 1', [email]);
    if (existingAlumni.rows[0]) {
      return NextResponse.json({ error: 'You are already registered. Please login to the alumni portal.' }, { status: 400, headers: publicHeaders });
    }

    const existingStudent = await pool.query('SELECT id FROM "Student" WHERE LOWER(COALESCE("contactNo", \'\')) = LOWER($1) AND "schoolId" = $2 LIMIT 1', [phone, invite.schoolId]);
    const duplicatePending = await pool.query('SELECT id FROM "AlumniRegistrationRequest" WHERE LOWER(email) = LOWER($1) AND status = $2 LIMIT 1', [email, 'PENDING']);
    if (duplicatePending.rows[0]) {
      return NextResponse.json({ error: 'Your registration request is already pending approval.' }, { status: 400, headers: publicHeaders });
    }

    const result = await pool.query(
      `INSERT INTO "AlumniRegistrationRequest" (
        "inviteId", "schoolId", "schoolName", name, email, phone, "batchYear",
        "currentTitle", "currentBio", "linkedIn", status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PENDING')
      RETURNING *`,
      [
        invite.id,
        invite.schoolId,
        invite.schoolName,
        name,
        email,
        phone || null,
        batchYear || invite.batchYear || null,
        currentTitle || null,
        currentBio || null,
        linkedIn || null,
      ]
    );

    await pool.query('UPDATE "AlumniInvite" SET status = $1, "usedAt" = NOW(), "updatedAt" = NOW() WHERE id = $2', ['REGISTERED', invite.id]);

    await logActivity({
      schoolId: invite.schoolId,
      actorRole: 'PUBLIC',
      actorName: name,
      actorEmail: email,
      category: 'ALUMNI',
      action: 'OLD_STUDENT_REGISTRATION_SUBMITTED',
      title: 'Old student alumni request submitted',
      message: `${name} submitted an alumni registration request for ${invite.schoolName}.`,
      status: existingStudent.rows[0] ? 'PENDING_STUDENT_MATCH' : 'PENDING',
      entityType: 'AlumniRegistrationRequest',
      entityId: result.rows[0].id,
      link: '/subadmin/alumni',
    });

    await createNotification({
      title: 'New alumni registration request',
      message: `${name} is waiting for alumni approval.`,
      type: 'ACTION',
      priority: 'NORMAL',
      schoolId: invite.schoolId,
      entityType: 'AlumniRegistrationRequest',
      entityId: result.rows[0].id,
      link: '/subadmin/alumni',
      audiences: [{ type: 'SCHOOL_ROLE', recipientRole: 'SUB_ADMIN', schoolId: invite.schoolId }],
    });

    return NextResponse.json({
      success: true,
      request: result.rows[0],
      message: 'Registration submitted. School approval is required before login credentials are sent.',
    }, { headers: publicHeaders });
  } catch (error: any) {
    console.error('Alumni public registration error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to submit alumni registration' }, { status: 500, headers: publicHeaders });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: publicHeaders });
}
