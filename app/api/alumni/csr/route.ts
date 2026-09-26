import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';
import {
  ensureCsrTables,
  getCsrNotificationEmails,
  normalizeCsrCategory,
  resolveSchool,
  sendCsrInquiryEmail,
} from '@/lib/csr';
import { createNotification } from '@/lib/notifications';
import { logActivity, logEmail } from '@/lib/monitoring';
import { checkRateLimit, rateLimitResponse } from '@/lib/security/rateLimit';

export async function GET(req: Request) {
  try {
    const session = await getSessionFromCookies('ALUMNI');
    if (!session || session.role !== 'ALUMNI') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const limit = await checkRateLimit(req, 'authRead', session.userId);
    if (!limit.allowed) return rateLimitResponse(limit.retryAfter);

    await ensureCsrTables();
    const result = await pool.query(
      `SELECT * FROM "CsrInquiry"
       WHERE "referredByAlumniId" = $1
       ORDER BY "createdAt" DESC
       LIMIT 80`,
      [session.userId]
    );

    return NextResponse.json({ inquiries: result.rows });
  } catch (error) {
    console.error('Alumni CSR fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch CSR referrals' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionFromCookies('ALUMNI');
    if (!session || session.role !== 'ALUMNI') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const limit = await checkRateLimit(req, 'mutation', session.userId);
    if (!limit.allowed) return rateLimitResponse(limit.retryAfter);

    await ensureCsrTables();
    const body = await req.json();

    const alumniRes = await pool.query(
      'SELECT id, name, email, "schoolId" FROM "Alumni" WHERE id = $1 LIMIT 1',
      [session.userId]
    );
    const alumni = alumniRes.rows[0];
    if (!alumni) return NextResponse.json({ error: 'Alumni profile not found' }, { status: 404 });

    const companyName = String(body.companyName || '').trim();
    const contactPerson = String(body.contactPerson || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const phone = String(body.phone || '').trim();
    const category = normalizeCsrCategory(body.category);
    const budgetRange = String(body.budgetRange || '').trim();
    const message = String(body.message || '').trim();
    const school = await resolveSchool(body.schoolId || alumni.schoolId, body.schoolName);

    if (!companyName || !contactPerson || !email.includes('@')) {
      return NextResponse.json({ error: 'Company name, contact person and valid email are required' }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO "CsrInquiry" (
        "companyName", "contactPerson", email, phone, category, "budgetRange", message,
        source, status, "schoolId", "schoolName",
        "referredByAlumniId", "referredByAlumniName", "referredByAlumniEmail"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'ALUMNI', 'PENDING', $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        companyName,
        contactPerson,
        email,
        phone || null,
        category,
        budgetRange || null,
        message || null,
        school.schoolId,
        school.schoolName,
        alumni.id,
        alumni.name,
        alumni.email,
      ]
    );

    const inquiry = result.rows[0];
    const recipients = await getCsrNotificationEmails(school.schoolId);
    const emailSent = await sendCsrInquiryEmail({
      to: recipients,
      companyName,
      contactPerson,
      email,
      phone,
      category,
      budgetRange,
      schoolName: school.schoolName,
      source: 'ALUMNI',
      referredBy: `${alumni.name} (${alumni.email})`,
      message,
    });

    await logActivity({
      schoolId: school.schoolId,
      actorRole: 'ALUMNI',
      actorId: alumni.id,
      actorName: alumni.name,
      actorEmail: alumni.email,
      category: 'CSR',
      action: 'CSR_REFERRAL_CREATED',
      title: 'CSR referral submitted',
      message: `${alumni.name} referred ${companyName} for CSR support.`,
      status: 'PENDING',
      entityType: 'CsrInquiry',
      entityId: inquiry.id,
      link: '/subadmin/csr',
    });

    await Promise.all(recipients.map((recipientEmail) => logEmail({
      schoolId: school.schoolId,
      alumniId: alumni.id,
      recipientEmail,
      recipientRole: 'SUPER_ADMIN',
      sourceRole: 'ALUMNI',
      sourceId: alumni.id,
      sourceName: alumni.name,
      emailType: 'CSR_REFERRAL',
      subject: `New CSR inquiry - ${companyName}`,
      status: emailSent ? 'SENT' : 'FAILED',
      relatedEntityType: 'CsrInquiry',
      relatedEntityId: inquiry.id,
      errorMessage: emailSent ? null : 'CSR referral email was not sent',
    })));

    await createNotification({
      title: 'New alumni CSR referral',
      message: `${alumni.name} referred ${companyName} for CSR support.`,
      type: 'ACTION',
      priority: 'NORMAL',
      actorRole: 'ALUMNI',
      actorId: alumni.id,
      schoolId: school.schoolId,
      entityType: 'CsrInquiry',
      entityId: inquiry.id,
      link: '/subadmin/csr',
      audiences: [
        { type: 'ROLE', recipientRole: 'SUPER_ADMIN' },
        ...(school.schoolId ? [{ type: 'SCHOOL_ROLE' as const, recipientRole: 'SUB_ADMIN' as const, schoolId: school.schoolId }] : []),
      ],
    });

    return NextResponse.json({ success: true, inquiry, message: 'CSR referral submitted successfully.' });
  } catch (error) {
    console.error('Alumni CSR create error:', error);
    return NextResponse.json({ error: 'Failed to submit CSR referral' }, { status: 500 });
  }
}
