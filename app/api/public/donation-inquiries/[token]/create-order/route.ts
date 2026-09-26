import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import pool from '@/lib/db';
import { ensureDonationInquiryTable, publicDonationHeaders } from '@/lib/donationInquiry';

type RouteContext = {
  params: Promise<{ token: string }>;
};

export async function POST(_req: Request, context: RouteContext) {
  try {
    await ensureDonationInquiryTable();
    const { token } = await context.params;

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json({ error: 'Razorpay keys not configured' }, { status: 500, headers: publicDonationHeaders });
    }

    const inquiryRes = await pool.query(
      `SELECT id, token, amount, type, "campaignId", "campaignTitle", "schoolId", "schoolName", status, "expiresAt"
       FROM "DonationInquiry"
       WHERE token = $1
       LIMIT 1`,
      [token]
    );

    const inquiry = inquiryRes.rows[0];
    if (!inquiry) {
      return NextResponse.json({ error: 'Donation link not found' }, { status: 404, headers: publicDonationHeaders });
    }
    if (inquiry.status === 'PAID') {
      return NextResponse.json({ error: 'This donation link is already paid' }, { status: 409, headers: publicDonationHeaders });
    }
    if (new Date(inquiry.expiresAt).getTime() < Date.now()) {
      return NextResponse.json({ error: 'This donation link has expired' }, { status: 410, headers: publicDonationHeaders });
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const order = await razorpay.orders.create({
      amount: Math.round(Number(inquiry.amount) * 100),
      currency: 'INR',
      receipt: `don_${inquiry.id}`.slice(0, 40),
      notes: {
        donationInquiryId: inquiry.id,
        type: inquiry.type,
        campaignId: inquiry.campaignId || '',
        schoolId: inquiry.schoolId || '',
      },
    });

    await pool.query(
      'UPDATE "DonationInquiry" SET "razorpayOrderId" = $1, "updatedAt" = NOW() WHERE id = $2',
      [order.id, inquiry.id]
    );

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
    }, { headers: publicDonationHeaders });
  } catch (error: any) {
    console.error('Donation order creation error:', error);
    return NextResponse.json({ error: 'Failed to create donation payment order' }, { status: 500, headers: publicDonationHeaders });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: publicDonationHeaders });
}
