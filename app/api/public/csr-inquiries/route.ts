import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import {
  ensureCsrTables,
  getCsrNotificationEmails,
  normalizeCsrCategory,
  publicCsrHeaders,
  resolveSchool,
  sendCsrInquiryEmail,
} from '@/lib/csr';
import { createNotification } from '@/lib/notifications';
import { logActivity, logEmail } from '@/lib/monitoring';
import { checkRateLimit, rateLimitResponse } from '@/lib/security/rateLimit';

export async function POST(req: Request) {
  try {
    const limit = await checkRateLimit(req, 'publicForm');
    if (!limit.allowed) return rateLimitResponse(limit.retryAfter);

    await ensureCsrTables();
    const body = await req.json();

    const companyName = String(body.companyName || '').trim();
    const contactPerson = String(body.contactPerson || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const phone = String(body.phone || '').trim();
    const category = normalizeCsrCategory(body.category);
    const budgetRange = String(body.budgetRange || '').trim();
    const message = String(body.message || '').trim();
    const panNumber = String(body.pan || body.donorPan || '').trim().toUpperCase();
    const school = await resolveSchool(body.schoolId, body.schoolName);

    if (!companyName || !contactPerson || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Company name, contact person and valid email are required' },
        { status: 400, headers: publicCsrHeaders }
      );
    }

    const result = await pool.query(
      `INSERT INTO "CsrInquiry" (
        "companyName", "contactPerson", email, phone, category, "budgetRange", message,
        source, status, "schoolId", "schoolName"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'PUBLIC', 'PENDING', $8, $9)
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
      source: 'PUBLIC',
      message: panNumber ? `${message}\n\n[80G TAX CLAIM PAN: ${panNumber}]` : message,
    });

    await logActivity({
      schoolId: school.schoolId,
      actorRole: 'PUBLIC',
      actorName: contactPerson,
      actorEmail: email,
      category: 'CSR',
      action: 'CSR_INQUIRY_CREATED',
      title: 'New CSR inquiry',
      message: `${companyName} submitted a CSR partnership inquiry.${panNumber ? ` (Requested 80G, PAN: ${panNumber})` : ''}`,
      status: 'PENDING',
      entityType: 'CsrInquiry',
      entityId: inquiry.id,
      link: '/superadmin/csr',
    });

    await Promise.all(recipients.map((recipientEmail) => logEmail({
      schoolId: school.schoolId,
      recipientEmail,
      recipientRole: 'SUPER_ADMIN',
      sourceRole: 'PUBLIC',
      sourceName: contactPerson,
      emailType: 'CSR_INQUIRY',
      subject: `New CSR inquiry - ${companyName}${panNumber ? ' (80G Requested)' : ''}`,
      status: emailSent ? 'SENT' : 'FAILED',
      relatedEntityType: 'CsrInquiry',
      relatedEntityId: inquiry.id,
      errorMessage: emailSent ? null : 'CSR inquiry email was not sent',
    })));

    await createNotification({
      title: panNumber ? '80G Certificate Requested! 📜' : 'New CSR inquiry',
      message: panNumber
        ? `${companyName} (${contactPerson}) requested 80G Certificate for CSR partnership. PAN: ${panNumber}, Phone: ${phone}, Email: ${email}.`
        : `${companyName} wants to support ${school.schoolName || 'Madni Education Trust'}.`,
      type: 'ACTION',
      priority: panNumber ? 'HIGH' : 'NORMAL',
      schoolId: school.schoolId,
      entityType: 'CsrInquiry',
      entityId: inquiry.id,
      link: '/superadmin/csr',
      audiences: [
        { type: 'ROLE', recipientRole: 'SUPER_ADMIN' },
        ...(school.schoolId ? [{ type: 'SCHOOL_ROLE' as const, recipientRole: 'SUB_ADMIN' as const, schoolId: school.schoolId }] : []),
      ],
    });

    return NextResponse.json({
      success: true,
      inquiry,
      emailSent,
      message: 'CSR inquiry submitted successfully.',
    }, { headers: publicCsrHeaders });
  } catch (error) {
    console.error('CSR public inquiry error:', error);
    return NextResponse.json({ error: 'Failed to submit CSR inquiry' }, { status: 500, headers: publicCsrHeaders });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: publicCsrHeaders });
}
