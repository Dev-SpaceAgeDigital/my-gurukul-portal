import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import {
  createDonationToken,
  ensureDonationInquiryTable,
  getPaymentBaseUrl,
  normalizeDonationType,
  publicDonationHeaders,
  sendDonationPayLinkEmail,
} from '@/lib/donationInquiry';
import { createNotification } from '@/lib/notifications';
import { logEmail } from '@/lib/monitoring';
import { checkRateLimit, rateLimitResponse } from '@/lib/security/rateLimit';

export async function POST(req: Request) {
  // Public donation inquiry creation endpoint
  try {
    const limit = await checkRateLimit(req, 'payment');
    if (!limit.allowed) return rateLimitResponse(limit.retryAfter);

    await ensureDonationInquiryTable();

    const body = await req.json();
    const donorName = String(body.name || '').trim();
    const donorEmail = String(body.email || '').trim().toLowerCase();
    const donorPhone = String(body.phone || '').trim();
    const donorPan = String(body.pan || body.donorPan || '').trim().toUpperCase();
    const isAlumni = Boolean(body.isAlumni);
    const amount = Number(body.amount);
    const donationType = normalizeDonationType(body.type);
    const campaignId = String(body.campaign || '').trim();
    let campaignTitle = String(body.campaignTitle || '').trim();
    let schoolName = String(body.schoolName || '').trim();
    let schoolId: string | null = body.schoolId ? String(body.schoolId) : null;
    let referenceId: string | null = null;
    let paymentType = donationType;

    if (!donorName || !donorEmail || !donorPhone || !Number.isFinite(amount) || amount < 100) {
      return NextResponse.json({ error: 'Name, email, phone and a minimum amount of Rs. 100 are required' }, { status: 400, headers: publicDonationHeaders });
    }

    if (campaignId.startsWith('school-')) {
      schoolId = campaignId.replace(/^school-/, '') || null;
    } else if (campaignId && campaignId !== 'general') {
      const expenseRes = await pool.query(
        'SELECT id, title, type, "schoolId", "estimatedCost", "paidAmount" FROM "Expense" WHERE id = $1 LIMIT 1',
        [campaignId]
      );
      const expense = expenseRes.rows[0];
      if (expense) {
        referenceId = expense.id;
        schoolId = expense.schoolId;
        campaignTitle = campaignTitle || expense.title;
        paymentType = String(expense.type || '').toUpperCase() === 'CONSTRUCTION' ? 'CONSTRUCTION' : String(expense.type || donationType).toUpperCase();
      } else if (['ZAKAT', 'LILLAH', 'SADKA'].includes(paymentType)) {
        referenceId = campaignId;
      }
    }

    if (!schoolId && schoolName) {
      const schoolRes = await pool.query(
        'SELECT id, "schoolName" FROM "School" WHERE LOWER("schoolName") = LOWER($1) LIMIT 1',
        [schoolName]
      );
      if (schoolRes.rows[0]) {
        schoolId = schoolRes.rows[0].id;
        schoolName = schoolRes.rows[0].schoolName;
      }
    }

    if (schoolId && !schoolName) {
      const schoolRes = await pool.query('SELECT "schoolName" FROM "School" WHERE id = $1 LIMIT 1', [schoolId]);
      schoolName = schoolRes.rows[0]?.schoolName || schoolName;
    }

    const token = createDonationToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const paymentLink = `${getPaymentBaseUrl(req)}/donate/pay/${token}`;

    const result = await pool.query(
      `INSERT INTO "DonationInquiry" (
        token, "donorName", "donorEmail", "donorPhone", "donorPan", "isAlumni", amount, type,
        "campaignId", "campaignTitle", "schoolId", "schoolName", message, "expiresAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id, token, "donorEmail", amount, status, "expiresAt"`,
      [
        token,
        donorName,
        donorEmail,
        donorPhone,
        donorPan || null,
        isAlumni,
        amount,
        paymentType,
        referenceId || campaignId || null,
        campaignTitle || 'General donation',
        schoolId,
        schoolName || 'Madni Education Trust',
        body.message || null,
        expiresAt,
      ]
    );

    const emailSent = await sendDonationPayLinkEmail({
      to: donorEmail,
      donorName,
      amount,
      campaignTitle: campaignTitle || 'General donation',
      schoolName: schoolName || 'Madni Education Trust',
      paymentLink,
    });

    await logEmail({
      schoolId,
      recipientEmail: donorEmail,
      recipientRole: 'PUBLIC',
      sourceRole: 'SYSTEM',
      emailType: 'DONATION_PAYMENT_LINK',
      subject: 'Your secure Madni Education donation payment link',
      status: emailSent ? 'SENT' : 'FAILED',
      relatedEntityType: 'DonationInquiry',
      relatedEntityId: result.rows[0].id,
      errorMessage: emailSent ? null : 'Donation payment link email was not sent',
    });

    await createNotification({
      title: 'New donation inquiry',
      message: `${donorName} started a Rs. ${amount.toLocaleString('en-IN')} donation for ${campaignTitle || 'General donation'}.`,
      type: 'DONATION',
      priority: 'NORMAL',
      schoolId,
      entityType: 'DonationInquiry',
      entityId: result.rows[0].id,
      link: '/superadmin/dashboard',
      audiences: [
        { type: 'ROLE', recipientRole: 'SUPER_ADMIN' },
        ...(schoolId ? [{ type: 'SCHOOL_ROLE' as const, recipientRole: 'SUB_ADMIN' as const, schoolId }] : []),
      ],
    });

    return NextResponse.json({
      success: true,
      inquiry: result.rows[0],
      paymentLink,
      emailSent,
      message: emailSent
        ? `Payment link sent to ${donorEmail}`
        : 'Inquiry saved. Email is not configured, so use the returned payment link.',
    }, { headers: publicDonationHeaders });
  } catch (error: any) {
    console.error('Donation inquiry creation error:', error);
    return NextResponse.json({ error: 'Failed to create donation inquiry' }, { status: 500, headers: publicDonationHeaders });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: publicDonationHeaders });
}
