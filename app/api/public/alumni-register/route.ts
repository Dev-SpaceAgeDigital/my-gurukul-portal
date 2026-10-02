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
    const url = new URL(req.url);
    const token = url.searchParams.get('token') || '';
    const schoolIdParam = url.searchParams.get('schoolId') || '';

    let invite = null;
    if (token) {
      const inviteRes = await pool.query(
        `SELECT id, email, "schoolId", "schoolName", "batchYear", status, "expiresAt"
         FROM "AlumniInvite"
         WHERE token = $1
         LIMIT 1`,
        [token]
      );
      invite = inviteRes.rows[0] || null;
      if (invite && new Date(invite.expiresAt).getTime() < Date.now()) {
        return NextResponse.json({ error: 'Invite link has expired' }, { status: 410, headers: publicHeaders });
      }
    }

    // Always fetch schools list so user can select or see their school
    const schoolsRes = await pool.query(
      `SELECT id, "schoolName", "imageUrls", "establishYear", address
       FROM "School"
       ORDER BY "schoolName" ASC`
    );
    const schools = schoolsRes.rows;

    let selectedSchool = null;
    const targetSchoolId = invite?.schoolId || schoolIdParam;
    if (targetSchoolId) {
      selectedSchool = schools.find((s: any) => s.id === targetSchoolId) || null;
    } else if (schools.length === 1) {
      selectedSchool = schools[0];
    }

    return NextResponse.json({
      invite,
      schools,
      selectedSchool,
    }, { headers: publicHeaders });
  } catch (error) {
    console.error('Alumni invite verify error:', error);
    return NextResponse.json({ error: 'Failed to verify registration details' }, { status: 500, headers: publicHeaders });
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
    const countryCode = String(body.countryCode || '+91').trim();
    const rawPhone = String(body.phone || body.mobileNumber || '').trim();
    const batchYear = String(body.batchYear || '').trim();
    const currentTitle = String(body.currentTitle || '').trim();
    const currentBio = String(body.currentBio || '').trim();
    const linkedIn = String(body.linkedIn || '').trim();
    let schoolId = String(body.schoolId || '').trim();

    if (!name || !email.includes('@')) {
      return NextResponse.json({ error: 'Full name and a valid email address are required' }, { status: 400, headers: publicHeaders });
    }

    let inviteId: string | null = null;
    let schoolName = '';

    if (token) {
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
      inviteId = invite.id;
      schoolId = invite.schoolId;
      schoolName = invite.schoolName || '';
    }

    if (!schoolId) {
      return NextResponse.json({ error: 'Please select the school you graduated from' }, { status: 400, headers: publicHeaders });
    }

    if (!schoolName) {
      const schoolRes = await pool.query('SELECT "schoolName" FROM "School" WHERE id = $1', [schoolId]);
      if (schoolRes.rows.length === 0) {
        return NextResponse.json({ error: 'Selected school not found' }, { status: 404, headers: publicHeaders });
      }
      schoolName = schoolRes.rows[0].schoolName;
    }

    // Check if alumni already exists for this email
    const existingAlumni = await pool.query('SELECT id FROM "Alumni" WHERE LOWER(email) = LOWER($1) LIMIT 1', [email]);
    if (existingAlumni.rows[0]) {
      return NextResponse.json({ error: 'You are already registered in the Alumni Directory. Please login directly.' }, { status: 400, headers: publicHeaders });
    }

    // Check if duplicate pending registration exists
    const duplicatePending = await pool.query('SELECT id FROM "AlumniRegistrationRequest" WHERE LOWER(email) = LOWER($1) AND status = $2 LIMIT 1', [email, 'PENDING']);
    if (duplicatePending.rows[0]) {
      return NextResponse.json({ error: 'Your registration request has already been submitted and is pending school approval.' }, { status: 400, headers: publicHeaders });
    }

    const apaarId = String(body.apaarId || '').trim();
    const udiseNo = String(body.udiseNo || body.udiscNo || '').trim();

    const fullPhone = rawPhone ? (rawPhone.startsWith('+') ? rawPhone : `${countryCode} ${rawPhone}`.trim()) : null;

    const result = await pool.query(
      `INSERT INTO "AlumniRegistrationRequest" (
        "inviteId", "schoolId", "schoolName", name, email, phone, "countryCode", "mobileNumber", "batchYear",
        "currentTitle", "currentBio", "linkedIn", "apaarId", "udiseNo", status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'PENDING')
      RETURNING *`,
      [
        inviteId,
        schoolId,
        schoolName,
        name,
        email,
        fullPhone,
        countryCode,
        rawPhone || null,
        batchYear || null,
        currentTitle || null,
        currentBio || null,
        linkedIn || null,
        apaarId || null,
        udiseNo || null,
      ]
    );

    if (token && inviteId) {
      await pool.query('UPDATE "AlumniInvite" SET status = $1, "usedAt" = NOW(), "updatedAt" = NOW() WHERE id = $2', ['REGISTERED', inviteId]);
    }

    await logActivity({
      schoolId: schoolId,
      actorRole: 'PUBLIC',
      actorName: name,
      actorEmail: email,
      category: 'ALUMNI',
      action: 'OLD_STUDENT_REGISTRATION_SUBMITTED',
      title: 'Old student alumni request submitted',
      message: `${name} submitted an alumni registration request for ${schoolName}.`,
      status: 'PENDING',
      entityType: 'AlumniRegistrationRequest',
      entityId: result.rows[0].id,
      link: '/subadmin/alumni',
    });

    await createNotification({
      title: 'New alumni registration request',
      message: `${name} registered for ${schoolName} and is waiting for approval.`,
      type: 'ACTION',
      priority: 'NORMAL',
      schoolId: schoolId,
      entityType: 'AlumniRegistrationRequest',
      entityId: result.rows[0].id,
      link: '/subadmin/alumni',
      audiences: [
        { type: 'SCHOOL_ROLE', recipientRole: 'SUB_ADMIN', schoolId: schoolId },
        { type: 'ROLE', recipientRole: 'SUPER_ADMIN' },
      ],
    });

    return NextResponse.json({
      success: true,
      request: result.rows[0],
      schoolName,
      message: `Registration submitted for ${schoolName}. The school administration will review your details and email your login credentials.`,
    }, { headers: publicHeaders });
  } catch (error: any) {
    console.error('Alumni public registration error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to submit alumni registration' }, { status: 500, headers: publicHeaders });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: publicHeaders });
}
