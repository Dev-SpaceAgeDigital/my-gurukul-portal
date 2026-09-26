import pool from '@/lib/db';
import { escapeHtml, publicDonationHeaders } from '@/lib/donationInquiry';
import { sendEmail } from '@/lib/emailSender';

let ensured = false;

export const publicCsrHeaders = publicDonationHeaders;

export type CsrInquirySource = 'PUBLIC' | 'ALUMNI';

export async function ensureCsrTables() {
  if (ensured) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "CsrInquiry" (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "companyName" varchar(255) NOT NULL,
      "contactPerson" varchar(255) NOT NULL,
      email varchar(255) NOT NULL,
      phone varchar(50),
      category varchar(120) NOT NULL,
      "budgetRange" varchar(120),
      message text,
      source varchar(30) NOT NULL DEFAULT 'PUBLIC',
      status varchar(30) NOT NULL DEFAULT 'PENDING',
      "schoolId" uuid,
      "schoolName" varchar(255),
      "referredByAlumniId" uuid,
      "referredByAlumniName" varchar(255),
      "referredByAlumniEmail" varchar(255),
      notes text,
      "createdAt" timestamp with time zone DEFAULT now(),
      "updatedAt" timestamp with time zone DEFAULT now()
    )
  `);

  await pool.query('CREATE INDEX IF NOT EXISTS "CsrInquiry_status_idx" ON "CsrInquiry" (status, "createdAt" DESC)');
  await pool.query('CREATE INDEX IF NOT EXISTS "CsrInquiry_school_idx" ON "CsrInquiry" ("schoolId", status, "createdAt" DESC)');
  await pool.query('CREATE INDEX IF NOT EXISTS "CsrInquiry_alumni_idx" ON "CsrInquiry" ("referredByAlumniId", "createdAt" DESC)');

  ensured = true;
}

export function normalizeCsrStatus(status: unknown) {
  const clean = String(status || '').trim().toUpperCase();
  if (['PENDING', 'CONTACTED', 'APPROVED', 'REJECTED'].includes(clean)) return clean;
  return 'PENDING';
}

export function normalizeCsrCategory(category: unknown) {
  const clean = String(category || '').trim();
  return clean || 'General CSR Support';
}

export async function resolveSchool(schoolId?: unknown, schoolName?: unknown) {
  const id = String(schoolId || '').trim();
  const name = String(schoolName || '').trim();

  if (id) {
    const result = await pool.query('SELECT id, "schoolName" FROM "School" WHERE id = $1 LIMIT 1', [id]);
    if (result.rows[0]) return { schoolId: result.rows[0].id as string, schoolName: result.rows[0].schoolName as string };
  }

  if (name) {
    const result = await pool.query('SELECT id, "schoolName" FROM "School" WHERE LOWER("schoolName") = LOWER($1) LIMIT 1', [name]);
    if (result.rows[0]) return { schoolId: result.rows[0].id as string, schoolName: result.rows[0].schoolName as string };
  }

  return { schoolId: null as string | null, schoolName: name || null };
}

export async function getCsrNotificationEmails(schoolId?: string | null) {
  const recipients = new Set<string>();

  const superadminRes = await pool.query('SELECT email FROM "User" WHERE role = $1', ['SUPER_ADMIN']);
  superadminRes.rows.forEach((row) => {
    if (row.email) recipients.add(String(row.email).trim().toLowerCase());
  });

  if (schoolId) {
    const subadminRes = await pool.query('SELECT email FROM "User" WHERE role = $1 AND "schoolId" = $2', ['SUB_ADMIN', schoolId]);
    subadminRes.rows.forEach((row) => {
      if (row.email) recipients.add(String(row.email).trim().toLowerCase());
    });
  }

  return Array.from(recipients);
}

export async function sendCsrInquiryEmail({
  to,
  companyName,
  contactPerson,
  email,
  phone,
  category,
  budgetRange,
  schoolName,
  source,
  referredBy,
  message,
}: {
  to: string[];
  companyName: string;
  contactPerson: string;
  email: string;
  phone?: string | null;
  category: string;
  budgetRange?: string | null;
  schoolName?: string | null;
  source: CsrInquirySource;
  referredBy?: string | null;
  message?: string | null;
}) {
  if (to.length === 0) return false;

  const result = await sendEmail({
    to,
    subject: `New CSR inquiry - ${companyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; background:#FAF8F4; padding:28px;">
        <div style="max-width:620px;margin:0 auto;background:#fff;border:1px solid #E5E7EB;border-radius:16px;padding:28px;">
          <h2 style="color:#1A6B5A;margin:0 0 8px;">New CSR inquiry</h2>
          <p style="color:#555;line-height:1.6;">A CSR partnership request has been submitted through the Madni Education system.</p>
          <div style="background:#F7FBF9;border-radius:12px;padding:16px;margin:18px 0;color:#444;line-height:1.8;">
            <div><strong>Company:</strong> ${escapeHtml(companyName)}</div>
            <div><strong>Contact:</strong> ${escapeHtml(contactPerson)}</div>
            <div><strong>Email:</strong> ${escapeHtml(email)}</div>
            <div><strong>Phone:</strong> ${escapeHtml(phone || 'Not provided')}</div>
            <div><strong>Category:</strong> ${escapeHtml(category)}</div>
            <div><strong>Budget:</strong> ${escapeHtml(budgetRange || 'Not specified')}</div>
            <div><strong>School:</strong> ${escapeHtml(schoolName || 'Any school / trust level')}</div>
            <div><strong>Source:</strong> ${escapeHtml(source)}</div>
            ${referredBy ? `<div><strong>Referred by:</strong> ${escapeHtml(referredBy)}</div>` : ''}
          </div>
          ${message ? `<p style="color:#555;line-height:1.7;"><strong>Message:</strong><br>${escapeHtml(message)}</p>` : ''}
        </div>
      </div>
    `,
  });

  if (!result.ok) {
    console.error('CSR inquiry email failed:', result.error);
    return false;
  }

  return true;
}
