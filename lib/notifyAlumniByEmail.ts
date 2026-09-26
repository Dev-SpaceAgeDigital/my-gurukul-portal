import pool from '@/lib/db';
import { logEmail } from '@/lib/monitoring';
import { sendEmail } from '@/lib/emailSender';

interface BroadcastNotificationPayload {
  schoolId: string;
  type: 'EVENT' | 'UPDATE';
  title: string;
  description?: string | null;
  date?: string | null;
  category?: string | null;
  imageUrl?: string | null;
  sourceRole?: 'SUPER_ADMIN' | 'SUB_ADMIN' | 'SYSTEM';
  sourceId?: string | null;
  sourceName?: string | null;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
}

export async function broadcastEmailToAlumni(payload: BroadcastNotificationPayload) {
  try {
    const { schoolId, type, title, description, date, category, imageUrl } = payload;

    // Fetch school name and all registered alumni emails for this school
    const [schoolRes, alumniRes] = await Promise.all([
      pool.query('SELECT "schoolName", email FROM "School" WHERE id = $1', [schoolId]),
      pool.query('SELECT id, name, email FROM "Alumni" WHERE "schoolId" = $1 AND email IS NOT NULL', [schoolId]),
    ]);

    const schoolName = schoolRes.rows[0]?.schoolName || 'Madni Education Trust School';
    const schoolEmail = schoolRes.rows[0]?.email || undefined;
    const alumniList = alumniRes.rows.filter((r) => r.email && r.email.includes('@'));

    if (alumniList.length === 0) {
      console.log(`No alumni registered with email for schoolId ${schoolId}`);
      return;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const recipientEmails = alumniList.map((a) => a.email.trim().toLowerCase());

    const isEvent = type === 'EVENT';
    const subject = isEvent
      ? `📢 New School Event: ${title} - ${schoolName}`
      : `📢 Campus Announcement: ${title} - ${schoolName}`;

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="margin:0; padding:0; background-color:#f4f7f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f4f7f6; padding: 30px 10px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e0e7e5; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                <tr>
                  <td style="background-color: #1A6B5A; padding: 28px 30px; text-align: center;">
                    <p style="color: #F5A623; margin: 0 0 4px 0; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;">
                      ${isEvent ? '🎉 Upcoming School Event' : '📢 Official Campus Update'}
                    </p>
                    <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">MADNI EDUCATION TRUST</h1>
                    <p style="color: #c5e8df; margin: 4px 0 0 0; font-size: 13px;">${schoolName}</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 32px 30px; color: #2c3e50;">
                    <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                      ${category ? `<span style="background: #EAF4F0; color: #1A6B5A; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 999px; text-transform: uppercase;">${category}</span>` : ''}
                      ${date ? `<span style="background: #FFF8EC; color: #B45309; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 999px;">📅 ${date}</span>` : ''}
                    </div>

                    <h2 style="font-size: 20px; font-weight: 800; color: #1c2d3d; margin: 0 0 14px 0;">${title}</h2>

                    ${description ? `
                      <p style="font-size: 14px; line-height: 1.7; color: #4a5568; margin: 0 0 24px 0;">
                        ${description.replace(/\n/g, '<br/>')}
                      </p>
                    ` : ''}

                    ${imageUrl ? `
                      <div style="margin-bottom: 24px; border-radius: 12px; overflow: hidden; border: 1px solid #edf2f7;">
                        <img src="${imageUrl}" alt="${title}" style="width: 100%; max-height: 320px; object-fit: cover; display: block;" />
                      </div>
                    ` : ''}

                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 24px; margin-bottom: 10px;">
                      <tr>
                        <td align="center">
                          <a href="${appUrl}/alumni/dashboard" target="_blank" style="background-color: #1A6B5A; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">
                            View in Alumni Portal →
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="background-color: #f8faf9; padding: 18px 30px; text-align: center; border-top: 1px solid #edf2f7;">
                    <p style="font-size: 11px; color: #718096; margin: 0;">
                      Sent to registered alumni of ${schoolName} · Madni Education Trust
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const sendResult = await sendEmail({
      to: recipientEmails,
      subject,
      html: htmlBody,
      schoolName,
      schoolEmail,
    });

    await Promise.all(recipientEmails.map((email) => {
      const alumnus = alumniList.find((item) => item.email.trim().toLowerCase() === email);
      return logEmail({
        schoolId,
        alumniId: alumnus?.id || null,
        recipientEmail: email,
        recipientRole: 'ALUMNI',
        sourceRole: payload.sourceRole || 'SUB_ADMIN',
        sourceId: payload.sourceId || null,
        sourceName: payload.sourceName || null,
        emailType: type,
        subject,
        status: sendResult.ok ? 'SENT' : sendResult.provider === 'NONE' ? 'SKIPPED' : 'FAILED',
        provider: sendResult.provider,
        providerMessageId: sendResult.messageId || null,
        relatedEntityType: payload.relatedEntityType || type,
        relatedEntityId: payload.relatedEntityId || null,
        errorMessage: sendResult.ok ? null : sendResult.error || 'Broadcast email failed',
      });
    }));

    console.log(`Dispatched ${type} broadcast email to ${recipientEmails.length} alumni for ${schoolName}`);
  } catch (error) {
    console.error('Error broadcasting alumni email:', error);
    await logEmail({
      schoolId: payload.schoolId,
      recipientEmail: 'school-alumni-broadcast',
      recipientRole: 'ALUMNI',
      sourceRole: payload.sourceRole || 'SUB_ADMIN',
      sourceId: payload.sourceId || null,
      sourceName: payload.sourceName || null,
      emailType: payload.type,
      subject: payload.title,
      status: 'FAILED',
      relatedEntityType: payload.relatedEntityType || payload.type,
      relatedEntityId: payload.relatedEntityId || null,
      errorMessage: error instanceof Error ? error.message : 'Broadcast email failed',
    });
  }
}
