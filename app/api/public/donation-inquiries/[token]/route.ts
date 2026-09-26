import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ensureDonationInquiryTable, publicDonationHeaders } from '@/lib/donationInquiry';

type RouteContext = {
  params: Promise<{ token: string }>;
};

export async function GET(_req: Request, context: RouteContext) {
  try {
    await ensureDonationInquiryTable();
    const { token } = await context.params;

    const result = await pool.query(
      `SELECT
        id, token, "donorName", "donorEmail", "donorPhone", amount, type,
        "campaignId", "campaignTitle", "schoolId", "schoolName", message,
        status, "razorpayPaymentId", "paidAt", "expiresAt"
      FROM "DonationInquiry"
      WHERE token = $1
      LIMIT 1`,
      [token]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Donation link not found' }, { status: 404, headers: publicDonationHeaders });
    }

    const inquiry = result.rows[0];
    const expired = new Date(inquiry.expiresAt).getTime() < Date.now();

    return NextResponse.json({ inquiry: { ...inquiry, expired } }, { headers: publicDonationHeaders });
  } catch (error: any) {
    console.error('Donation inquiry fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch donation inquiry' }, { status: 500, headers: publicDonationHeaders });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: publicDonationHeaders });
}
