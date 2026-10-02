import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromCookies, hashPassword } from '@/lib/auth';
import { ensureAlumniFeaturedColumn } from '@/lib/ensureAlumniFeaturedColumn';
import { createNotification } from '@/lib/notifications';
import { logActivity, logEmail } from '@/lib/monitoring';
import crypto from 'crypto';

export async function GET(request: Request) {
	  try {
	    const session = await getSessionFromCookies('ADMIN');
	    if (!session || session.role !== 'SUB_ADMIN' || !session.schoolId) {
	      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
	    }
	    await ensureAlumniFeaturedColumn();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'directory';
    const standardFilter = searchParams.get('standard') || 'All';

    let standardCondition = `(std."standardName" ILIKE '%10%' OR std."standardName" ILIKE '%11%' OR std."standardName" ILIKE '%12%')`;
    if (standardFilter !== 'All') {
      // Extract numeric part (e.g. "10th" -> "10") to match "Class 10", "10", "10th"
      const numericGrade = standardFilter.replace(/\D/g, ''); 
      standardCondition = `std."standardName" ILIKE '%${numericGrade}%'`;
    }

    if (type === 'eligible') {
      // Fetch eligible students not already in Alumni table
      const result = await pool.query(`
        SELECT s.id, s.name, s."studentCode", s."contactNo", std."standardName", std."batchYear"
        FROM "Student" s
        JOIN "Standard" std ON s."standardId" = std.id
        LEFT JOIN "Alumni" a ON s.id = a."studentId"
        WHERE s."schoolId" = $1 
        AND ${standardCondition}
        AND a.id IS NULL
      `, [session.schoolId]);
      return NextResponse.json(result.rows);
    } else {
      // Fetch Alumni directory with their standard info
      const dirCondition = standardFilter === 'All' ? `(${standardCondition} OR std.id IS NULL)` : standardCondition;
      
      const result = await pool.query(`
        SELECT a.id, a.name, a.email, a."linkedIn", a."batchYear", a."studentId", a."createdAt", a."isFeatured", a.phone, a."countryCode", a."mobileNumber", std."standardName"
        FROM "Alumni" a
        LEFT JOIN "Student" s ON a."studentId" = s.id
        LEFT JOIN "Standard" std ON s."standardId" = std.id
        WHERE a."schoolId" = $1 
        AND ${dirCondition}
        ORDER BY a."batchYear" DESC, a.name ASC
      `, [session.schoolId]);
      return NextResponse.json(result.rows);
    }

  } catch (error: any) {
    console.error('Alumni fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
	  }
	}

export async function PATCH(request: Request) {
	  try {
	    const session = await getSessionFromCookies('ADMIN');
	    if (!session || session.role !== 'SUB_ADMIN' || !session.schoolId) {
	      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
	    }
	    await ensureAlumniFeaturedColumn();

    const { id, isFeatured } = await request.json();
    if (!id || typeof isFeatured !== 'boolean') {
      return NextResponse.json({ error: 'Alumni ID and featured status are required' }, { status: 400 });
    }

    const alumniRes = await pool.query(
      'SELECT id FROM "Alumni" WHERE id = $1 AND "schoolId" = $2',
      [id, session.schoolId]
    );

    if (alumniRes.rows.length === 0) {
      return NextResponse.json({ error: 'Alumni not found for this school' }, { status: 404 });
    }

    if (isFeatured) {
      await pool.query(
        'UPDATE "Alumni" SET "isFeatured" = false, "updatedAt" = NOW() WHERE "schoolId" = $1',
        [session.schoolId]
      );
    }

    const result = await pool.query(
      'UPDATE "Alumni" SET "isFeatured" = $1, "updatedAt" = NOW() WHERE id = $2 AND "schoolId" = $3 RETURNING *',
      [isFeatured, id, session.schoolId]
    );

    if (isFeatured) {
      await createNotification({
        title: 'Featured alumni selected',
        message: `${result.rows[0].name} was selected for the public impact section.`,
        type: 'MONITORING',
        priority: 'NORMAL',
        actorRole: 'SUB_ADMIN',
        actorId: session.userId,
        schoolId: session.schoolId,
        entityType: 'Alumni',
        entityId: id,
        link: '/superadmin/school',
        audiences: [{ type: 'ROLE', recipientRole: 'SUPER_ADMIN' }],
      });
      await logActivity({
        schoolId: session.schoolId,
        actorRole: 'SUB_ADMIN',
        actorId: session.userId,
        actorEmail: session.email,
        category: 'ALUMNI',
        action: 'FEATURED_ALUMNI_SELECTED',
        title: 'Featured alumni selected',
        message: `${result.rows[0].name} was selected for the public impact section.`,
        status: 'SUCCESS',
        entityType: 'Alumni',
        entityId: id,
        link: '/subadmin/alumni',
      });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error('Alumni feature update error:', error);
    return NextResponse.json({ error: 'Failed to update featured alumni' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies('ADMIN');
    if (!session || session.role !== 'SUB_ADMIN' || !session.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { studentId, gmailId, linkedIn, batchYear, countryCode = '+91', phoneNumber, phone } = await request.json();

    if (!studentId || !gmailId) {
      return NextResponse.json({ error: 'Student ID and Gmail are required' }, { status: 400 });
    }

    // Fetch student info
    const studentRes = await pool.query(
      'SELECT name FROM "Student" WHERE id = $1 AND "schoolId" = $2',
      [studentId, session.schoolId]
    );

    if (studentRes.rows.length === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const studentName = studentRes.rows[0].name;
    const generatedPassword = crypto.randomBytes(4).toString('hex'); // 8 char hex password
    const hashedPassword = await hashPassword(generatedPassword);

    // Check if alumni already exists for this email
    const existing = await pool.query('SELECT id FROM "Alumni" WHERE email = $1', [gmailId]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Alumni with this email already exists' }, { status: 400 });
    }

    const rawPhone = phoneNumber || phone || '';
    const fullPhone = rawPhone ? `${countryCode} ${rawPhone}`.trim() : null;

    const result = await pool.query(`
      INSERT INTO "Alumni" (
        name, email, password, "linkedIn", "batchYear", "studentId", "schoolId", "phone", "countryCode", "mobileNumber"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [studentName, gmailId, hashedPassword, linkedIn || null, batchYear || 'Unknown', studentId, session.schoolId, fullPhone, countryCode, rawPhone || null]);

    // Query School Name for welcome email
    let schoolName = 'School Administration';
    try {
      const schoolRes = await pool.query('SELECT "schoolName" FROM "School" WHERE id = $1', [session.schoolId]);
      if (schoolRes.rows.length > 0) schoolName = schoolRes.rows[0].schoolName;
    } catch (_) {}

    // Send Welcome Email with generated credentials via Resend API
    let emailSent = false;
    if (process.env.RESEND_API_KEY) {
      try {
        const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/alumni/login`;
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL || 'Alumni Portal <no-reply@zynteqtechnologies.com>',
            to: [gmailId.trim().toLowerCase()],
            subject: `Welcome to ${schoolName} Alumni Network - Account Credentials`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${schoolName} Alumni Access</title>
              </head>
              <body style="margin:0; padding:0; background-color:#f4f7f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f4f7f6; padding: 30px 10px;">
                  <tr>
                    <td align="center">
                      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e0e7e5; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                        <tr>
                          <td style="background-color: #1A6B5A; padding: 28px 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px;">${schoolName.toUpperCase()}</h1>
                            <p style="color: #c5e8df; margin: 4px 0 0 0; font-size: 13px;">Alumni & Institutional Portal</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 32px 30px; color: #2c3e50;">
                            <p style="font-size: 15px; margin: 0 0 16px 0; color: #1c2d3d; font-weight: 600;">Dear ${studentName},</p>
                            <p style="font-size: 14px; line-height: 1.6; margin: 0 0 24px 0; color: #4a5568;">
                              We are pleased to inform you that your alumni account for <strong>${schoolName}</strong> (Batch of ${batchYear || 'Graduated'}) has been authorized by the school administration.
                            </p>

                            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8faf9; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
                              <tr>
                                <td style="padding: 20px;">
                                  <p style="font-size: 11px; font-weight: 700; color: #1A6B5A; text-transform: uppercase; margin: 0 0 12px 0; letter-spacing: 1px;">Account Access Details</p>
                                  <p style="font-size: 13px; margin: 0 0 8px 0; color: #4a5568;"><strong>Username / Email:</strong> ${gmailId}</p>
                                  <p style="font-size: 13px; margin: 0; color: #4a5568;"><strong>Temporary Password:</strong> <code style="background-color: #ffffff; padding: 3px 8px; border-radius: 6px; border: 1px solid #cbd5e1; color: #1A6B5A; font-family: monospace; font-size: 14px; font-weight: 700;">${generatedPassword}</code></p>
                                </td>
                              </tr>
                            </table>

                            <p style="font-size: 13px; line-height: 1.6; margin: 0 0 24px 0; color: #4a5568;">
                              You may now log in to update your profile, connect with fellow alumni, and explore career opportunities.
                            </p>

                            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 10px;">
                              <tr>
                                <td align="center">
                                  <a href="${loginUrl}" target="_blank" style="background-color: #1A6B5A; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">
                                    Access Alumni Portal
                                  </a>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="background-color: #f8faf9; padding: 18px 30px; text-align: center; border-top: 1px solid #edf2f7;">
                            <p style="font-size: 11px; color: #718096; margin: 0;">Madni Education Trust Administration · Karjan, Gujarat</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </body>
              </html>
            `,
          }),
        });
	        if (resendRes.ok) emailSent = true;
          await logEmail({
            schoolId: session.schoolId,
            alumniId: result.rows[0].id,
            recipientEmail: gmailId,
            recipientRole: 'ALUMNI',
            sourceRole: 'SUB_ADMIN',
            sourceId: session.userId,
            sourceName: session.email,
            emailType: 'ALUMNI_CREDENTIALS',
            subject: `Welcome to ${schoolName} Alumni Network - Account Credentials`,
            status: resendRes.ok ? 'SENT' : 'FAILED',
            relatedEntityType: 'Alumni',
            relatedEntityId: result.rows[0].id,
            errorMessage: resendRes.ok ? null : `Resend returned ${resendRes.status}`,
          });
	      } catch (err) {
	        console.error('Error dispatching alumni authorization email via Resend:', err);
          await logEmail({
            schoolId: session.schoolId,
            alumniId: result.rows[0].id,
            recipientEmail: gmailId,
            recipientRole: 'ALUMNI',
            sourceRole: 'SUB_ADMIN',
            sourceId: session.userId,
            sourceName: session.email,
            emailType: 'ALUMNI_CREDENTIALS',
            subject: `Welcome to ${schoolName} Alumni Network - Account Credentials`,
            status: 'FAILED',
            relatedEntityType: 'Alumni',
            relatedEntityId: result.rows[0].id,
            errorMessage: err instanceof Error ? err.message : 'Failed to send email',
          });
	      }
	    } else {
        await logEmail({
          schoolId: session.schoolId,
          alumniId: result.rows[0].id,
          recipientEmail: gmailId,
          recipientRole: 'ALUMNI',
          sourceRole: 'SUB_ADMIN',
          sourceId: session.userId,
          sourceName: session.email,
          emailType: 'ALUMNI_CREDENTIALS',
          subject: `Welcome to ${schoolName} Alumni Network - Account Credentials`,
          status: 'SKIPPED',
          relatedEntityType: 'Alumni',
          relatedEntityId: result.rows[0].id,
          errorMessage: 'RESEND_API_KEY not configured',
        });
	    }

    // Return plain password + emailSent status to subadmin
	    await createNotification({
      title: 'New alumni account authorized',
      message: `${studentName} was added to the alumni portal.`,
      type: 'MONITORING',
      priority: 'NORMAL',
      actorRole: 'SUB_ADMIN',
      actorId: session.userId,
      schoolId: session.schoolId,
      entityType: 'Alumni',
      entityId: result.rows[0].id,
      link: '/superadmin/school',
      audiences: [
        { type: 'ROLE', recipientRole: 'SUPER_ADMIN' },
        { type: 'DIRECT', recipientRole: 'ALUMNI', recipientId: result.rows[0].id },
	      ],
	    });

      await logActivity({
        schoolId: session.schoolId,
        actorRole: 'SUB_ADMIN',
        actorId: session.userId,
        actorEmail: session.email,
        category: 'ALUMNI',
        action: 'ALUMNI_ACCOUNT_AUTHORIZED',
        title: 'New alumni account authorized',
        message: `${studentName} was added to the alumni portal.`,
        status: 'SUCCESS',
        entityType: 'Alumni',
        entityId: result.rows[0].id,
        link: '/subadmin/alumni',
        metadata: { emailSent },
      });

    return NextResponse.json({
      ...result.rows[0],
      password: generatedPassword,
      emailSent,
    });

  } catch (error: any) {
    console.error('Alumni creation error:', error);
    return NextResponse.json({ error: 'Failed to authorize alumni conversion' }, { status: 500 });
  }
}
