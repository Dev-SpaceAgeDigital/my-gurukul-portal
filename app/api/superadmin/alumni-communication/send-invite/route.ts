import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';
import {
  createAlumniInviteToken,
  ensureAlumniOnboardingTables,
  getAlumniBaseUrl,
  sendAlumniInviteEmail,
} from '@/lib/alumniOnboarding';
import { logActivity, logEmail } from '@/lib/monitoring';
import { checkRateLimit, rateLimitResponse } from '@/lib/security/rateLimit';

export async function POST(req: Request) {
  try {
    const session = await getSessionFromCookies('SUPER_ADMIN');
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const limit = await checkRateLimit(req, 'mutation', session.userId);
    if (!limit.allowed) return rateLimitResponse(limit.retryAfter);

    await ensureAlumniOnboardingTables();
    const body = await req.json();
    const schoolId = String(body.schoolId || '').trim();
    const batchYear = String(body.batchYear || '').trim();
    const message = String(body.message || '').trim();
    const emails = String(body.emails || '')
      .split(/[\s,;]+/)
      .map((email) => email.trim().toLowerCase())
      .filter((email) => email.includes('@'));

    if (!schoolId || emails.length === 0) {
      return NextResponse.json({ error: 'School and at least one email are required' }, { status: 400 });
    }

    const schoolRes = await pool.query('SELECT id, "schoolName" FROM "School" WHERE id = $1 LIMIT 1', [schoolId]);
    const school = schoolRes.rows[0];
    if (!school) return NextResponse.json({ error: 'School not found' }, { status: 404 });

    const uniqueEmails = Array.from(new Set(emails)).slice(0, 200);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const baseUrl = getAlumniBaseUrl(req);
    let sent = 0;
    let failed = 0;

    for (const email of uniqueEmails) {
      const token = createAlumniInviteToken();
      const inviteRes = await pool.query(
        `INSERT INTO "AlumniInvite" (
          token, email, "schoolId", "schoolName", "batchYear", message, "createdBy", "expiresAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [token, email, school.id, school.schoolName, batchYear || null, message || null, session.userId, expiresAt]
      );

      const inviteLink = `${baseUrl}/alumni/register?token=${encodeURIComponent(token)}`;
      const ok = await sendAlumniInviteEmail({
        to: email,
        schoolName: school.schoolName,
        batchYear,
        inviteLink,
        message,
      });
      if (ok) sent += 1; else failed += 1;

      await logEmail({
        schoolId: school.id,
        recipientEmail: email,
        recipientRole: 'PUBLIC',
        sourceRole: 'SUPER_ADMIN',
        sourceId: session.userId,
        sourceName: session.email,
        emailType: 'ALUMNI_FAMILY_INVITE',
        subject: `Join the ${school.schoolName} Alumni Family`,
        status: ok ? 'SENT' : (process.env.BREVO_API_KEY || process.env.RESEND_API_KEY ? 'FAILED' : 'SKIPPED'),
        relatedEntityType: 'AlumniInvite',
        relatedEntityId: inviteRes.rows[0].id,
        errorMessage: ok ? null : 'Invite email was not sent',
      });
    }

    await logActivity({
      schoolId: school.id,
      actorRole: 'SUPER_ADMIN',
      actorId: session.userId,
      actorEmail: session.email,
      category: 'ALUMNI',
      action: 'ALUMNI_FAMILY_INVITES_SENT',
      title: 'Alumni family invites sent',
      message: `${sent} invite emails sent for ${school.schoolName}. Failed/skipped: ${failed}.`,
      status: failed > 0 ? 'PARTIAL' : 'SENT',
      entityType: 'AlumniInvite',
      metadata: { sent, failed, total: uniqueEmails.length },
    });

    return NextResponse.json({ success: true, sent, failed, total: uniqueEmails.length });
  } catch (error) {
    console.error('Alumni invite send error:', error);
    return NextResponse.json({ error: 'Failed to send alumni invites' }, { status: 500 });
  }
}
