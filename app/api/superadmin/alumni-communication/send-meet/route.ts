import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';
import { escapeHtml } from '@/lib/donationInquiry';
import { logEmail, logActivity } from '@/lib/monitoring';
import { checkRateLimit, rateLimitResponse } from '@/lib/security/rateLimit';
import { sendEmail } from '@/lib/emailSender';

async function ensureAlumniMeetTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "AlumniMeet" (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "trustId" UUID,
      "schoolId" UUID,
      subject VARCHAR(255) NOT NULL,
      "meetLink" TEXT NOT NULL,
      "meetingDate" DATE,
      "meetingTime" VARCHAR(50),
      "meetingAt" TIMESTAMPTZ,
      message TEXT,
      "alumniIds" UUID[] DEFAULT '{}',
      "sentCount" INT DEFAULT 0,
      "failedCount" INT DEFAULT 0,
      "createdById" UUID,
      "createdAt" TIMESTAMPTZ DEFAULT NOW()
    );
  `).catch((e) => console.error('Error creating AlumniMeet table:', e));
}

async function sendMeetEmail({
  to,
  name,
  subject,
  meetLink,
  message,
  formattedDate,
  formattedTime,
  schoolId,
  schoolName,
  trustName,
}: {
  to: string;
  name: string;
  subject: string;
  meetLink: string;
  message: string;
  formattedDate?: string;
  formattedTime?: string;
  schoolId?: string;
  schoolName?: string;
  trustName?: string;
}) {
  const brandTitle = schoolName ? `${schoolName} | ${trustName || 'Alumni Network'}` : (trustName || 'Alumni Network');
  
  const result = await sendEmail({
    to,
    schoolId,
    schoolName,
    trustName,
    subject,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; padding: 32px 16px;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <div style="background: #1A6B5A; color: #ffffff; padding: 26px 24px; text-align: center;">
            <h2 style="margin: 0; font-size: 20px; font-weight: 700;">${escapeHtml(brandTitle.toUpperCase())}</h2>
            <p style="margin: 6px 0 0; color: rgba(255, 255, 255, 0.85); font-size: 13px;">Official Alumni Meet Invitation</p>
          </div>
          
          <div style="padding: 28px 24px; color: #1e293b;">
            <p style="margin: 0 0 14px; font-size: 15px; color: #334155;">Dear <strong>${escapeHtml(name)}</strong>,</p>
            <p style="margin: 0 0 20px; color: #475569; font-size: 14px; line-height: 1.6;">${escapeHtml(message)}</p>
            
            ${(formattedDate || formattedTime) ? `
              <div style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;">
                <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Schedule Details</div>
                ${formattedDate ? `<div style="font-size: 14px; font-weight: 600; color: #1e293b; margin-bottom: 4px;">📅 Date: <span style="font-weight: 700; color: #1A6B5A;">${escapeHtml(formattedDate)}</span></div>` : ''}
                ${formattedTime ? `<div style="font-size: 14px; font-weight: 600; color: #1e293b;">⏰ Time: <span style="font-weight: 700; color: #1A6B5A;">${escapeHtml(formattedTime)}</span></div>` : ''}
              </div>
            ` : ''}
            
            <div style="text-align: center; margin: 26px 0 16px;">
              <a href="${escapeHtml(meetLink)}" target="_blank" style="display: inline-block; background: #1A6B5A; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 14px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                🎥 Join Google Meet
              </a>
            </div>
            
            <p style="margin: 20px 0 0; font-size: 12px; color: #94a3b8; text-align: center; word-break: break-all;">
              Meeting Link: <a href="${escapeHtml(meetLink)}" style="color: #1A6B5A;">${escapeHtml(meetLink)}</a>
            </p>
          </div>
          
          <div style="background: #f8fafc; border-top: 1px solid #f1f5f9; padding: 14px 24px; text-align: center; font-size: 11px; color: #94a3b8;">
            Sent by ${escapeHtml(trustName || 'Trust Governance')} Alumni Relations Office
          </div>
        </div>
      </div>
    `,
  });

  return result.ok;
}

export async function POST(req: Request) {
  try {
    const session = await getSessionFromCookies('SUPER_ADMIN');
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await ensureAlumniMeetTable();

    const limit = await checkRateLimit(req, 'mutation', session.userId);
    if (!limit.allowed) return rateLimitResponse(limit.retryAfter);

    const body = await req.json();
    const alumniIds = Array.isArray(body.alumniIds) ? body.alumniIds.map(String).filter(Boolean) : [];
    const subject = String(body.subject || 'Alumni Google Meet Invitation').trim();
    const meetLink = String(body.meetLink || '').trim();
    const message = String(body.message || 'Please join the alumni meet using the link below.').trim();
    const meetingDate = body.meetingDate ? String(body.meetingDate).trim() : null; // YYYY-MM-DD
    const meetingTime = body.meetingTime ? String(body.meetingTime).trim() : null; // HH:mm
    
    // Construct valid timestamp
    let meetingAt: string | null = null;
    let formattedDate: string | undefined = undefined;
    let formattedTime: string | undefined = undefined;

    if (meetingDate) {
      const timePart = meetingTime ? (meetingTime.length === 5 ? `${meetingTime}:00` : meetingTime) : '10:00:00';
      meetingAt = `${meetingDate}T${timePart}`;
      
      try {
        const dObj = new Date(`${meetingDate}T${timePart}`);
        if (!isNaN(dObj.getTime())) {
          formattedDate = dObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
        } else {
          formattedDate = meetingDate;
        }
      } catch {
        formattedDate = meetingDate;
      }
    }

    if (meetingTime) {
      try {
        const [hours, minutes] = meetingTime.split(':');
        const hNum = parseInt(hours, 10);
        const ampm = hNum >= 12 ? 'PM' : 'AM';
        const h12 = hNum % 12 || 12;
        formattedTime = `${String(h12).padStart(2, '0')}:${minutes} ${ampm}`;
      } catch {
        formattedTime = meetingTime;
      }
    }

    if (alumniIds.length === 0 || !meetLink.startsWith('http')) {
      return NextResponse.json({ error: 'Please select alumni and enter a valid Google Meet link (starting with http/https).' }, { status: 400 });
    }

    const alumniRes = await pool.query(
      `SELECT a.id, a.name, a.email, a."schoolId", s."schoolName", t."trustName"
       FROM "Alumni" a
       LEFT JOIN "School" s ON s.id = a."schoolId"
       LEFT JOIN "Trust" t ON s."trustId" = t.id
       WHERE a.id = ANY($1::uuid[])`,
      [alumniIds]
    );

    let sent = 0;
    let failed = 0;
    for (const alumni of alumniRes.rows) {
      const ok = await sendMeetEmail({
        to: alumni.email,
        name: alumni.name,
        subject,
        meetLink,
        message,
        formattedDate,
        formattedTime,
        schoolId: alumni.schoolId,
        schoolName: alumni.schoolName,
        trustName: alumni.trustName,
      });
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
        errorMessage: ok ? null : 'Meet email delivery failed',
      });
    }

    // Persist meet record into AlumniMeet table
    const sampleSchoolId = alumniRes.rows[0]?.schoolId || null;
    await pool.query(
      `INSERT INTO "AlumniMeet" (subject, "meetLink", "meetingDate", "meetingTime", "meetingAt", message, "alumniIds", "sentCount", "failedCount", "createdById", "schoolId")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        subject,
        meetLink,
        meetingDate || null,
        meetingTime || null,
        meetingAt || null,
        message,
        alumniIds,
        sent,
        failed,
        session.userId,
        sampleSchoolId,
      ]
    ).catch((e) => console.error('Error inserting AlumniMeet row:', e));

    await logActivity({
      actorRole: 'SUPER_ADMIN',
      actorId: session.userId,
      actorEmail: session.email,
      category: 'ALUMNI',
      action: 'ALUMNI_MEET_EMAIL_SENT',
      title: 'Alumni Google Meet Invites Sent',
      message: `Meet link email sent to ${sent} alumni. Failed/skipped: ${failed}. Scheduled Date: ${formattedDate || 'N/A'}, Time: ${formattedTime || 'N/A'}.`,
      status: failed > 0 ? 'PARTIAL' : 'SENT',
      entityType: 'Alumni',
      metadata: { sent, failed, count: alumniRes.rows.length, meetingDate, meetingTime, meetingAt },
    });

    return NextResponse.json({ success: true, sent, failed, total: alumniRes.rows.length });
  } catch (error) {
    console.error('Meet email send error:', error);
    return NextResponse.json({ error: 'Failed to send Meet emails' }, { status: 500 });
  }
}

