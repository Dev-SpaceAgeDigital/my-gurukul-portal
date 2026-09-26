import crypto from 'crypto';
import pool from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { escapeHtml } from '@/lib/donationInquiry';
import { logEmail } from '@/lib/monitoring';
import { sendEmail } from '@/lib/emailSender';

let ensured = false;

export async function ensureAlumniOnboardingTables() {
  if (ensured) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "AlumniInvite" (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      token text UNIQUE NOT NULL,
      email varchar(255),
      "schoolId" uuid NOT NULL,
      "schoolName" varchar(255),
      "batchYear" varchar(100),
      message text,
      status varchar(30) NOT NULL DEFAULT 'SENT',
      "createdBy" uuid,
      "expiresAt" timestamp with time zone NOT NULL,
      "usedAt" timestamp with time zone,
      "createdAt" timestamp with time zone DEFAULT now(),
      "updatedAt" timestamp with time zone DEFAULT now()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "AlumniRegistrationRequest" (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "inviteId" uuid,
      "schoolId" uuid NOT NULL,
      "schoolName" varchar(255),
      name varchar(255) NOT NULL,
      email varchar(255) NOT NULL,
      phone varchar(50),
      "batchYear" varchar(100),
      "currentTitle" varchar(255),
      "currentBio" text,
      "linkedIn" text,
      status varchar(30) NOT NULL DEFAULT 'PENDING',
      "reviewedBy" uuid,
      "reviewedAt" timestamp with time zone,
      "alumniId" uuid,
      "rejectionReason" text,
      "createdAt" timestamp with time zone DEFAULT now(),
      "updatedAt" timestamp with time zone DEFAULT now()
    )
  `);

  await pool.query('CREATE INDEX IF NOT EXISTS "AlumniInvite_token_idx" ON "AlumniInvite" (token)');
  await pool.query('CREATE INDEX IF NOT EXISTS "AlumniInvite_school_idx" ON "AlumniInvite" ("schoolId", status, "createdAt" DESC)');
  await pool.query('CREATE INDEX IF NOT EXISTS "AlumniRegistrationRequest_school_idx" ON "AlumniRegistrationRequest" ("schoolId", status, "createdAt" DESC)');
  await pool.query('CREATE UNIQUE INDEX IF NOT EXISTS "AlumniRegistrationRequest_pending_email_idx" ON "AlumniRegistrationRequest" (LOWER(email)) WHERE status = \'PENDING\'');

  ensured = true;
}

export function createAlumniInviteToken() {
  return crypto.randomBytes(32).toString('base64url');
}

export function createTemporaryPassword() {
  return crypto.randomBytes(4).toString('hex');
}

export function getAlumniBaseUrl(req?: Request) {
  const configured = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL;
  const origin = req?.headers.get('origin');
  return (configured || origin || 'http://localhost:3000').replace(/\/$/, '');
}

export async function sendAlumniInviteEmail({
  to,
  schoolName,
  batchYear,
  inviteLink,
  message,
}: {
  to: string;
  schoolName: string;
  batchYear?: string | null;
  inviteLink: string;
  message?: string | null;
}) {
  const result = await sendEmail({
    to,
    subject: `Join the ${schoolName} Alumni Family`,
    html: `
      <div style="font-family:Arial,sans-serif;background:#f4f7f6;padding:28px;">
        <div style="max-width:580px;margin:0 auto;background:#fff;border-radius:16px;border:1px solid #e0e7e5;padding:28px;">
          <h2 style="color:#1A6B5A;margin:0 0 10px;">Join the Madni Alumni Family</h2>
          <p style="color:#4a5568;line-height:1.7;">You have been invited to register as an alumni of <strong>${escapeHtml(schoolName)}</strong>${batchYear ? `, batch ${escapeHtml(batchYear)}` : ''}.</p>
          ${message ? `<p style="color:#4a5568;line-height:1.7;">${escapeHtml(message)}</p>` : ''}
          <p style="color:#4a5568;line-height:1.7;">After you submit your details, the school subadmin will verify and approve your request. Login credentials will be emailed only after approval.</p>
          <a href="${escapeHtml(inviteLink)}" style="display:inline-block;background:#1A6B5A;color:#fff;text-decoration:none;padding:13px 24px;border-radius:10px;font-weight:700;">Register as Alumni</a>
        </div>
      </div>
    `,
  });

  if (!result.ok) {
    console.error('Alumni invite email failed:', result.error);
    return false;
  }
  return true;
}

export async function sendAlumniCredentialsEmail({
  to,
  name,
  schoolName,
  batchYear,
  password,
  request,
}: {
  to: string;
  name: string;
  schoolName: string;
  batchYear?: string | null;
  password: string;
  request?: Request;
}) {
  const loginUrl = `${getAlumniBaseUrl(request)}/alumni/login`;
  const result = await sendEmail({
    to,
    subject: `Your ${schoolName} Alumni Portal Credentials`,
    html: `
      <div style="font-family:Arial,sans-serif;background:#f4f7f6;padding:28px;">
        <div style="max-width:580px;margin:0 auto;background:#fff;border-radius:16px;border:1px solid #e0e7e5;padding:28px;">
          <h2 style="color:#1A6B5A;margin:0 0 10px;">Alumni Registration Approved</h2>
          <p style="color:#4a5568;line-height:1.7;">Dear <strong>${escapeHtml(name)}</strong>, your alumni request for <strong>${escapeHtml(schoolName)}</strong>${batchYear ? `, batch ${escapeHtml(batchYear)}` : ''} has been approved.</p>
          <div style="background:#f8faf9;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin:18px 0;">
            <p style="margin:0 0 8px;color:#4a5568;"><strong>Email:</strong> ${escapeHtml(to)}</p>
            <p style="margin:0;color:#4a5568;"><strong>Temporary Password:</strong> <code style="background:#fff;border:1px solid #cbd5e1;border-radius:6px;padding:3px 8px;color:#1A6B5A;font-weight:700;">${escapeHtml(password)}</code></p>
          </div>
          <a href="${escapeHtml(loginUrl)}" style="display:inline-block;background:#1A6B5A;color:#fff;text-decoration:none;padding:13px 24px;border-radius:10px;font-weight:700;">Open Alumni Portal</a>
        </div>
      </div>
    `,
  });

  if (!result.ok) {
    console.error('Alumni credentials email failed:', result.error);
    return false;
  }
  return true;
}

export async function createApprovedAlumniFromRequest(registration: any, request?: Request) {
  const password = createTemporaryPassword();
  const hashedPassword = await hashPassword(password);
  const email = String(registration.email).trim().toLowerCase();

  const existing = await pool.query('SELECT id FROM "Alumni" WHERE email = $1 LIMIT 1', [email]);
  if (existing.rows[0]) {
    throw new Error('Alumni account already exists for this email');
  }

  const alumniRes = await pool.query(
    `INSERT INTO "Alumni" (
      name, email, password, "batchYear", "currentTitle", "currentBio", "linkedIn", "schoolId"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [
      registration.name,
      email,
      hashedPassword,
      registration.batchYear || 'Unknown',
      registration.currentTitle || null,
      registration.currentBio || null,
      registration.linkedIn || null,
      registration.schoolId,
    ]
  );

  const emailSent = await sendAlumniCredentialsEmail({
    to: email,
    name: registration.name,
    schoolName: registration.schoolName || 'Madni Education Trust',
    batchYear: registration.batchYear,
    password,
    request,
  });

  await logEmail({
    schoolId: registration.schoolId,
    alumniId: alumniRes.rows[0].id,
    recipientEmail: email,
    recipientRole: 'ALUMNI',
    sourceRole: 'SUB_ADMIN',
    emailType: 'ALUMNI_INVITE_APPROVED_CREDENTIALS',
    subject: `Your ${registration.schoolName || 'Madni'} Alumni Portal Credentials`,
    status: emailSent ? 'SENT' : (process.env.BREVO_API_KEY || process.env.RESEND_API_KEY ? 'FAILED' : 'SKIPPED'),
    relatedEntityType: 'AlumniRegistrationRequest',
    relatedEntityId: registration.id,
    errorMessage: emailSent ? null : 'Credentials email was not sent',
  });

  return { alumni: alumniRes.rows[0], password, emailSent };
}
