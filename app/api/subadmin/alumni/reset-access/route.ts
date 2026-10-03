import crypto from 'crypto';
import { NextResponse } from 'next/server';
import pool, { query } from '@/lib/db';
import { getSessionFromCookies, hashPassword } from '@/lib/auth';
import { logActivity, logEmail } from '@/lib/monitoring';
import { sendEmail } from '@/lib/emailSender';
import { checkRateLimit, rateLimitResponse } from '@/lib/security/rateLimit';

export async function POST(request: Request) {
  try {
    const limit = await checkRateLimit(request, 'mutation');
    if (!limit.allowed) return rateLimitResponse(limit.retryAfter);

    const session = await getSessionFromCookies('SUB_ADMIN');
    if (!session || session.role !== 'SUB_ADMIN' || !session.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { alumniId } = await request.json();
    if (!alumniId) return NextResponse.json({ error: 'Alumni ID is required' }, { status: 400 });

    const alumniRes = await pool.query(
      'SELECT id, name, email, "schoolId" FROM "Alumni" WHERE id = $1 AND "schoolId" = $2',
      [alumniId, session.schoolId]
    );
    const alumni = alumniRes.rows[0];
    if (!alumni) return NextResponse.json({ error: 'Alumni not found for this school' }, { status: 404 });

    const temporaryPassword = crypto.randomBytes(4).toString('hex');
    const hashedPassword = await hashPassword(temporaryPassword);
    await query('UPDATE "Alumni" SET password = $1, "tokenVersion" = COALESCE("tokenVersion", 1) + 1, "updatedAt" = NOW() WHERE id = $2', [hashedPassword, alumni.id]);

    const schoolName = alumni.schoolName || 'School Administration';
    let emailSent = false;
    const subject = `Your ${schoolName} Alumni portal access has been reset`;

    try {
      const emailResult = await sendEmail({
        to: alumni.email,
        subject,
        schoolName: schoolName,
        html: `
          <div style="font-family: Arial, sans-serif; background: #f4f7f6; padding: 28px;">
            <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border: 1px solid #dbe7e4; border-radius: 16px; overflow: hidden;">
              <div style="background: #1A6B5A; color: #ffffff; padding: 24px; text-align: center;">
                <h2 style="margin: 0; font-size: 20px;">${schoolName.toUpperCase()}</h2>
                <p style="margin: 6px 0 0; color: #c5e8df; font-size: 13px;">Alumni access reset</p>
              </div>
              <div style="padding: 28px; color: #1f2937;">
                <p style="margin: 0 0 14px; font-size: 15px;">Hello <strong>${escapeHtml(alumni.name)}</strong>,</p>
                <p style="margin: 0 0 18px; color: #4b5563; font-size: 14px; line-height: 1.6;">Your school administration reset your alumni portal access. Use this temporary password to login, then update your password from your profile.</p>
                <div style="font-size: 22px; letter-spacing: 4px; font-weight: 800; color: #1A6B5A; background: #EAF4F0; border-radius: 12px; padding: 16px; text-align: center;">${temporaryPassword}</div>
              </div>
            </div>
          </div>
        `
      });
      emailSent = emailResult.ok;

      await logEmail({
        schoolId: session.schoolId,
        alumniId: alumni.id,
        recipientEmail: alumni.email,
        recipientRole: 'ALUMNI',
        sourceRole: 'SUB_ADMIN',
        sourceId: session.userId,
        sourceName: session.email,
        emailType: 'ALUMNI_ACCESS_RESET',
        subject,
        status: emailResult.ok ? 'SENT' : 'FAILED',
        relatedEntityType: 'Alumni',
        relatedEntityId: alumni.id,
        errorMessage: emailResult.ok ? null : emailResult.error || 'Failed to send email',
      });
    } catch (error) {
      await logEmail({
        schoolId: session.schoolId,
        alumniId: alumni.id,
        recipientEmail: alumni.email,
        recipientRole: 'ALUMNI',
        sourceRole: 'SUB_ADMIN',
        sourceId: session.userId,
        sourceName: session.email,
        emailType: 'ALUMNI_ACCESS_RESET',
        subject,
        status: 'FAILED',
        relatedEntityType: 'Alumni',
        relatedEntityId: alumni.id,
        errorMessage: error instanceof Error ? error.message : 'Failed to send reset access email',
      });
    }

    await logActivity({
      schoolId: session.schoolId,
      actorRole: 'SUB_ADMIN',
      actorId: session.userId,
      actorEmail: session.email,
      category: 'ALUMNI_ACCESS',
      action: 'ALUMNI_ACCESS_RESET',
      title: 'Alumni access reset',
      message: `${alumni.name} access was reset by subadmin.`,
      status: emailSent ? 'SENT' : 'SUCCESS',
      entityType: 'Alumni',
      entityId: alumni.id,
      link: '/subadmin/alumni',
    });

    return NextResponse.json({
      success: true,
      id: alumni.id,
      name: alumni.name,
      email: alumni.email,
      password: temporaryPassword,
      emailSent,
    });
  } catch (error) {
    console.error('Alumni reset access error:', error);
    return NextResponse.json({ error: 'Failed to reset alumni access' }, { status: 500 });
  }
}

function escapeHtml(value: string) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
