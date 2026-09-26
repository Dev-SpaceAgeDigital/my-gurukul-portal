import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { publicDonationHeaders } from '@/lib/donationInquiry';
import { logEmail } from '@/lib/monitoring';
import { checkRateLimit, rateLimitResponse } from '@/lib/security/rateLimit';

export async function OPTIONS() {
  return NextResponse.json({}, { headers: publicDonationHeaders });
}

export async function POST(request: Request) {
  try {
    const limit = await checkRateLimit(request, 'otp');
    if (!limit.allowed) return rateLimitResponse(limit.retryAfter);

    const body = await request.json();
    const { email, action } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400, headers: publicDonationHeaders });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // Query Alumni table
    const alumniRes = await pool.query(
      `SELECT a.*, s."schoolName" FROM "Alumni" a LEFT JOIN "School" s ON a."schoolId" = s.id WHERE LOWER(a.email) = $1`,
      [cleanEmail]
    );

    if (alumniRes.rows.length === 0) {
      return NextResponse.json({
        exists: false,
        message: 'This email is not registered in the Alumni database. If you are an alumnus, please contact school administration.'
      }, { headers: publicDonationHeaders });
    }

    const alumnus = alumniRes.rows[0];
    const isForgotPassword = action === 'forgot_password';

    // Prepare Resend Email if API key is configured
    if (process.env.RESEND_API_KEY) {
      const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/alumni/login`;
      
      const subject = isForgotPassword 
        ? `Madni Alumni Portal — Password Reset Request`
        : `Madni Alumni Portal — Your Direct Login Link`;

      const emailHtml = isForgotPassword ? `
        <div style="font-family: Arial, sans-serif; background: #FAF8F4; padding: 28px;">
          <div style="max-width: 600px; margin: 0 auto; background: #fff; border: 2px solid #1A6B5A; border-radius: 16px; padding: 28px;">
            <div style="text-align: center; border-bottom: 2px solid #1A6B5A; padding-bottom: 16px; margin-bottom: 18px;">
              <h2 style="color: #1A6B5A; margin: 6px 0 4px;">MADNI EDUCATION TRUST</h2>
              <p style="font-size: 13px; color: #F5A623; font-weight: 700;">Alumni Password Reset Request</p>
            </div>
            <p style="font-size: 15px; color: #333;">As-salamu alaykum, <strong>${alumnus.name}</strong>.</p>
            <p style="font-size: 15px; color: #555; line-height: 1.7;">You have requested a password reset for your Madni Alumni Portal account.</p>
            <div style="background: #FFF8EC; border-left: 4px solid #F5A623; padding: 16px; margin: 20px 0; border-radius: 8px;">
              <p style="margin: 0; color: #854D0E; font-size: 14px; font-weight: 700;">
                📌 Security Notice: Please ping / contact your school administration at Madni Education Trust to reset your password or update your login credentials.
              </p>
            </div>
            <p style="font-size: 13px; color: #666; margin-top: 20px;">School: <strong>${alumnus.schoolName || 'Madni Education Trust'}</strong></p>
          </div>
        </div>
      ` : `
        <div style="font-family: Arial, sans-serif; background: #FAF8F4; padding: 28px;">
          <div style="max-width: 600px; margin: 0 auto; background: #fff; border: 2px solid #1A6B5A; border-radius: 16px; padding: 28px;">
            <div style="text-align: center; border-bottom: 2px solid #1A6B5A; padding-bottom: 16px; margin-bottom: 18px;">
              <h2 style="color: #1A6B5A; margin: 6px 0 4px;">MADNI EDUCATION TRUST</h2>
              <p style="font-size: 13px; color: #1A6B5A; font-weight: 700;">Alumni Portal Access Link</p>
            </div>
            <p style="font-size: 15px; color: #333;">As-salamu alaykum, <strong>${alumnus.name}</strong>.</p>
            <p style="font-size: 15px; color: #555; line-height: 1.7;">Your email has been verified in the Madni Alumni Database (${alumnus.schoolName || 'Madni Trust'}). Click below to access your Alumni Creator & Impact Portal.</p>
            <div style="text-align: center; margin: 24px 0;">
              <a href="${loginUrl}" style="display: inline-block; background: #1A6B5A; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 999px; font-weight: 700; font-size: 15px;">
                Access Alumni Portal →
              </a>
            </div>
          </div>
        </div>
      `;

      try {
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL || 'Madni Education <no-reply@resend.dev>',
            to: [cleanEmail],
            subject,
            html: emailHtml,
          }),
        });
        await logEmail({
          schoolId: alumnus.schoolId,
          alumniId: alumnus.id,
          recipientEmail: cleanEmail,
          recipientRole: 'ALUMNI',
          sourceRole: 'SYSTEM',
          emailType: isForgotPassword ? 'PASSWORD_RESET_INSTRUCTION' : 'LOGIN_LINK',
          subject,
          status: resendRes.ok ? 'SENT' : 'FAILED',
          relatedEntityType: 'Alumni',
          relatedEntityId: alumnus.id,
          errorMessage: resendRes.ok ? null : `Resend returned ${resendRes.status}`,
        });
      } catch (err) {
        console.error('Failed to send Resend email:', err);
        await logEmail({
          schoolId: alumnus.schoolId,
          alumniId: alumnus.id,
          recipientEmail: cleanEmail,
          recipientRole: 'ALUMNI',
          sourceRole: 'SYSTEM',
          emailType: isForgotPassword ? 'PASSWORD_RESET_INSTRUCTION' : 'LOGIN_LINK',
          subject,
          status: 'FAILED',
          relatedEntityType: 'Alumni',
          relatedEntityId: alumnus.id,
          errorMessage: err instanceof Error ? err.message : 'Failed to send email',
        });
      }
    } else {
      await logEmail({
        schoolId: alumnus.schoolId,
        alumniId: alumnus.id,
        recipientEmail: cleanEmail,
        recipientRole: 'ALUMNI',
        sourceRole: 'SYSTEM',
        emailType: isForgotPassword ? 'PASSWORD_RESET_INSTRUCTION' : 'LOGIN_LINK',
        subject: isForgotPassword ? 'Madni Alumni Portal - Password Reset Request' : 'Madni Alumni Portal - Your Direct Login Link',
        status: 'SKIPPED',
        relatedEntityType: 'Alumni',
        relatedEntityId: alumnus.id,
        errorMessage: 'RESEND_API_KEY not configured',
      });
    }

    return NextResponse.json({
      exists: true,
      alumniName: alumnus.name,
      schoolName: alumnus.schoolName || 'Madni Education Trust',
      message: isForgotPassword 
        ? 'A security message has been sent to your email with instructions to ping school administration for password reset.'
        : 'Alumni verified! Direct login link has been sent to your registered email address.'
    }, { headers: publicDonationHeaders });
  } catch (error: any) {
    console.error('Error checking alumni email:', error);
    return NextResponse.json({ error: 'Failed to verify email' }, { status: 500, headers: publicDonationHeaders });
  }
}
