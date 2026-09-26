import { NextResponse } from 'next/server';
import crypto from 'crypto';
import pool from '@/lib/db';
import {
  ensureDonationInquiryTable,
  ensureDonationTransactionTable,
  publicDonationHeaders,
  sendDonationReceiptEmail,
} from '@/lib/donationInquiry';
import { createNotification } from '@/lib/notifications';
import { logEmail } from '@/lib/monitoring';
import { checkRateLimit, rateLimitResponse } from '@/lib/security/rateLimit';

type RouteContext = {
  params: Promise<{ token: string }>;
};

export async function POST(req: Request, context: RouteContext) {
  try {
    const limit = await checkRateLimit(req, 'payment');
    if (!limit.allowed) return rateLimitResponse(limit.retryAfter);

    await ensureDonationInquiryTable();
    await ensureDonationTransactionTable();
    const { token } = await context.params;
    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body;
    const donorPan = body.donorPan ? String(body.donorPan).trim().toUpperCase() : null;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing Razorpay payment response' }, { status: 400, headers: publicDonationHeaders });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return NextResponse.json({ error: 'Razorpay secret not configured' }, { status: 500, headers: publicDonationHeaders });
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400, headers: publicDonationHeaders });
    }

    const inquiryRes = await pool.query(
      `SELECT *
       FROM "DonationInquiry"
       WHERE token = $1 AND "razorpayOrderId" = $2
       LIMIT 1`,
      [token, razorpay_order_id]
    );

    const inquiry = inquiryRes.rows[0];
    if (!inquiry) {
      return NextResponse.json({ error: 'Donation inquiry not found for this order' }, { status: 404, headers: publicDonationHeaders });
    }
    if (inquiry.status === 'PAID') {
      return NextResponse.json({ success: true, alreadyPaid: true }, { headers: publicDonationHeaders });
    }
    if (new Date(inquiry.expiresAt).getTime() < Date.now()) {
      return NextResponse.json({ error: 'This donation link has expired' }, { status: 410, headers: publicDonationHeaders });
    }

    let paymentMode = 'unknown';
    try {
      const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      const rzpRes = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, {
        headers: {
          Authorization: `Basic ${Buffer.from(`${keyId}:${secret}`).toString('base64')}`,
        },
      });
      if (rzpRes.ok) {
        const paymentData = await rzpRes.json();
        paymentMode = paymentData.method || 'unknown';
      }
    } catch (error) {
      console.error('Failed to fetch donation payment mode:', error);
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(`
        INSERT INTO "Transaction" (
          amount, type, "donorName", "donorEmail", "donorPhone",
          "razorpayPaymentId", "razorpayOrderId", status, "schoolId", "referenceId", "paymentMode"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'SUCCESS', $8, $9, $10)
      `, [
        Number(inquiry.amount),
        inquiry.type,
        inquiry.donorName,
        inquiry.donorEmail,
        inquiry.donorPhone,
        razorpay_payment_id,
        razorpay_order_id,
        inquiry.schoolId,
        inquiry.campaignId,
        paymentMode,
      ]);

      if ((inquiry.type === 'CONSTRUCTION' || inquiry.type === 'EVENT') && inquiry.campaignId) {
        await client.query(
          'UPDATE "Expense" SET "paidAmount" = COALESCE("paidAmount", 0) + $1 WHERE id = $2',
          [Number(inquiry.amount), inquiry.campaignId]
        );
      } else if (['ZAKAT', 'LILLAH', 'SADKA'].includes(String(inquiry.type || '').toUpperCase()) && inquiry.campaignId) {
        const studentsRes = await client.query(`
          SELECT s.id, std.fees, COALESCE(s."aidPaidAmount", 0) as "aidPaidAmount"
          FROM "Student" s
          JOIN "Standard" std ON s."standardId" = std.id
          WHERE s."standardId" = $1 AND s."sponsorshipType" ILIKE $2 AND s."isNeedy" = true
          ORDER BY s.id ASC
        `, [inquiry.campaignId, `%${inquiry.type}%`]);

        let remaining = Number(inquiry.amount);
        for (const student of studentsRes.rows) {
          if (remaining <= 0) break;
          const needed = Number(student.fees) - Number(student.aidPaidAmount);
          if (needed <= 0) continue;

          const toAdd = Math.min(remaining, needed);
          await client.query(
            'UPDATE "Student" SET "aidPaidAmount" = COALESCE("aidPaidAmount", 0) + $1 WHERE id = $2',
            [toAdd, student.id]
          );
          remaining -= toAdd;
        }
      }

      const finalPan = donorPan || inquiry.donorPan;

      await client.query(
        `UPDATE "DonationInquiry"
         SET status = 'PAID', "razorpayPaymentId" = $1, "paymentMode" = $2, "donorPan" = COALESCE($3, "donorPan"), "paidAt" = NOW(), "updatedAt" = NOW()
         WHERE id = $4`,
        [razorpay_payment_id, paymentMode, finalPan, inquiry.id]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    const receiptNo = `MDT-${new Date().getFullYear()}-${String(inquiry.id).slice(0, 8).toUpperCase()}`;
    const finalPanForReceipt = donorPan || inquiry.donorPan;
    const receiptEmailSent = await sendDonationReceiptEmail({
      to: inquiry.donorEmail,
      donorName: inquiry.donorName,
      donorPan: finalPanForReceipt,
      amount: Number(inquiry.amount),
      donationType: inquiry.type,
      campaignTitle: inquiry.campaignTitle || 'General donation',
      schoolName: inquiry.schoolName || 'Madni Education Trust',
      paymentId: razorpay_payment_id,
      receiptNo,
      paymentMode,
    });

    await logEmail({
      schoolId: inquiry.schoolId,
      recipientEmail: inquiry.donorEmail,
      recipientRole: 'PUBLIC',
      sourceRole: 'SYSTEM',
      emailType: 'DONATION_RECEIPT',
      subject: `Madni Education Trust donation receipt ${receiptNo}`,
      status: receiptEmailSent ? 'SENT' : 'FAILED',
      relatedEntityType: 'DonationInquiry',
      relatedEntityId: inquiry.id,
      errorMessage: receiptEmailSent ? null : 'Donation receipt email was not sent',
    });

    await createNotification({
      title: 'Donation payment received',
      message: `${inquiry.donorName} paid Rs. ${Number(inquiry.amount).toLocaleString('en-IN')} for ${inquiry.campaignTitle || inquiry.type}.`,
      type: 'DONATION',
      priority: 'HIGH',
      schoolId: inquiry.schoolId,
      entityType: 'DonationInquiry',
      entityId: inquiry.id,
      link: '/superadmin/dashboard',
      audiences: [
        { type: 'ROLE', recipientRole: 'SUPER_ADMIN' },
        ...(inquiry.schoolId ? [{ type: 'SCHOOL_ROLE' as const, recipientRole: 'SUB_ADMIN' as const, schoolId: inquiry.schoolId }] : []),
      ],
    });

    return NextResponse.json({ success: true, receiptNo, receiptEmailSent }, { headers: publicDonationHeaders });
  } catch (error: any) {
    console.error('Donation payment verification error:', error);
    return NextResponse.json({ error: 'Failed to verify donation payment' }, { status: 500, headers: publicDonationHeaders });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: publicDonationHeaders });
}
