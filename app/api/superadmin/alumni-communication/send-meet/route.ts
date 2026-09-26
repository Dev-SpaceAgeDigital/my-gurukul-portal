import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';
import { escapeHtml } from '@/lib/donationInquiry';
import { logEmail, logActivity } from '@/lib/monitoring';
import { checkRateLimit, rateLimitResponse } from '@/lib/security/rateLimit';
import { sendEmail } from '@/lib/emailSender';

async function sendMeetEmail(to: string, name: string, subject: string, meetLink: string, message: string, meetingAt?: string) {
  const result = await sendEmail({
    to,
    subject,
    html: `
      <div style="font-family:Arial,sans-serif;background:#f4f7f6;padding:28px;">
        <div style="max-width:580px;margin:0 auto;background:#fff;border-radius:16px;border:1px solid #e0e7e5;padding:28px;">
          <h2 style="color:#1A6B5A;margin:0 0 10px;">Madni Alumni Meet</h2>
          <p style="color:#4a5568;line-height:1.7;">Dear <strong>${escapeHtml(name)}</strong>,</p>
          ${meetingAt ? `<p style="color:#4a5568;"><strong>Meeting Time:</strong> ${escapeHtml(meetingAt)}</p>` : ''}
          <p style="color:#4a5568;line-height:1.7;">${escapeHtml(message)}</p>
          <a href="${escapeHtml(meetLink)}" style="display:inline-block;background:#1A6B5A;color:#fff;text-decoration:none;padding:13px 24px;border-radius:10px;font-weight:700;">Join Google Meet</a>
        </div>
      </div>
    `,
  });

  if (!result.ok) {
    console.error('Meet email failed:', result.error);
    return false;
  }
  return true;
}

export async function POST(req: Request) {
  try {
    const session = await getSessionFromCookies('SUPER_ADMIN');
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const limit = await checkRateLimit(req, 'mutation', session.userId);
    if (!limit.allowed) return rateLimitResponse(limit.retryAfter);

    const body = await req.json();
    const alumniIds = Array.isArray(body.alumniIds) ? body.alumniIds.map(String).filter(Boolean) : [];
    const subject = String(body.subject || 'Madni Alumni Google Meet Invitation').trim();
    const meetLink = String(body.meetLink || '').trim();
    const message = String(body.message || 'Please join the alumni meet using the link below.').trim();
    const meetingAt = String(body.meetingAt || '').trim();

    if (alumniIds.length === 0 || !meetLink.startsWith('http')) {
      return NextResponse.json({ error: 'Select alumni and enter a valid Meet link' }, { status: 400 });
    }

    const alumniRes = await pool.query(
      `SELECT a.id, a.name, a.email, a."schoolId", s."schoolName"
       FROM "Alumni" a
       LEFT JOIN "School" s ON s.id = a."schoolId"
       WHERE a.id = ANY($1::uuid[])`,
      [alumniIds]
    );

    let sent = 0;
    let failed = 0;
    for (const alumni of alumniRes.rows) {
      const ok = await sendMeetEmail(alumni.email, alumni.name, subject, meetLink, message, meetingAt);
      if (ok) sent += 1; else failed += 1;
      await logEmail({
        schoolId: alumni.schoolId,
        alumniId: alumni.id,
        recipientEmail: alumni.email,
        recipientRole: 'ALUMNI',
        sourceRole: 'SUPER_ADMIN',
        sourceId: session.userId,
        sourceName: session.email,
        emailType: 'ALUMNI_GOOGLE_MEET',
        subject,
        status: ok ? 'SENT' : (process.env.BREVO_API_KEY || process.env.RESEND_API_KEY ? 'FAILED' : 'SKIPPED'),
        relatedEntityType: 'Alumni',
        relatedEntityId: alumni.id,
        errorMessage: ok ? null : 'Meet email was not sent',
      });
    }

    await logActivity({
      actorRole: 'SUPER_ADMIN',
      actorId: session.userId,
      actorEmail: session.email,
      category: 'ALUMNI',
      action: 'ALUMNI_MEET_EMAIL_SENT',
      title: 'Google Meet email sent',
      message: `Meet link email sent to ${sent} alumni. Failed/skipped: ${failed}.`,
      status: failed > 0 ? 'PARTIAL' : 'SENT',
      entityType: 'Alumni',
      metadata: { sent, failed, count: alumniRes.rows.length },
    });

    return NextResponse.json({ success: true, sent, failed, total: alumniRes.rows.length });
  } catch (error) {
    console.error('Meet email send error:', error);
    return NextResponse.json({ error: 'Failed to send Meet emails' }, { status: 500 });
  }
}
