import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { checkRateLimit, rateLimitResponse } from '@/lib/security/rateLimit';
import pool from '@/lib/db';

export async function POST(request: Request) {
  try {
    const limit = await checkRateLimit(request, 'payment');
    if (!limit.allowed) return rateLimitResponse(limit.retryAfter);

    const { amount, type, referenceId, schoolId, trustId, studentName, description } = await request.json();

    if (!amount || !type || (!schoolId && !trustId)) {
      return NextResponse.json({ error: 'Missing required payment details (amount, type, schoolId or trustId)' }, { status: 400 });
    }

    let keyId = process.env.RAZORPAY_KEY_ID;
    let keySecret = process.env.RAZORPAY_KEY_SECRET;
    let resolvedSchoolName = 'School';
    let resolvedTrustName = 'Trust';
    let resolvedTrustId = trustId || null;
    let resolvedSchoolId = schoolId || null;

    // Resolve tenant's RazorPay credentials & names from DB
    if (schoolId) {
      const schoolRes = await pool.query(
        `SELECT s."razorpayKeyId", s."razorpayKeySecret", s."schoolName", s."trustId",
                t."razorpayKeyId" as "trustKeyId", t."razorpayKeySecret" as "trustKeySecret", t."trustName"
         FROM "School" s
         LEFT JOIN "Trust" t ON s."trustId" = t.id
         WHERE s.id = $1`,
        [schoolId]
      );

      if (schoolRes.rows.length > 0) {
        const row = schoolRes.rows[0];
        keyId = row.razorpayKeyId || row.trustKeyId || keyId;
        keySecret = row.razorpayKeySecret || row.trustKeySecret || keySecret;
        resolvedSchoolName = row.schoolName || resolvedSchoolName;
        resolvedTrustName = row.trustName || resolvedTrustName;
        resolvedTrustId = row.trustId || resolvedTrustId;
      }
    } else if (trustId) {
      const trustRes = await pool.query(
        `SELECT "razorpayKeyId", "razorpayKeySecret", "trustName" FROM "Trust" WHERE id = $1`,
        [trustId]
      );
      if (trustRes.rows.length > 0) {
        const row = trustRes.rows[0];
        keyId = row.razorpayKeyId || keyId;
        keySecret = row.razorpayKeySecret || keySecret;
        resolvedTrustName = row.trustName || resolvedTrustName;
      }
    }

    if (!keyId || !keySecret) {
      return NextResponse.json({ error: 'Payment Gateway credentials not configured for this trust/school' }, { status: 400 });
    }

    // Initialize RazorPay client dynamically with tenant keys
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const options = {
      amount: Math.round(amount * 100), // Convert to Paise
      currency: 'INR',
      receipt: `rcpt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      notes: {
        platform: 'My Gurukul SaaS',
        paymentType: type || 'FEE_PAYMENT',
        referenceId: referenceId || 'N/A',
        studentName: studentName || 'N/A',
        description: description || 'School Fee / Donation',
        schoolId: resolvedSchoolId || 'N/A',
        schoolName: resolvedSchoolName,
        trustId: resolvedTrustId || 'N/A',
        trustName: resolvedTrustName,
      }
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      ...order,
      keyId: keyId // Return keyId so checkout modal uses client's RazorPay Key
    });

  } catch (error: any) {
    console.error('Razorpay order creation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create payment order' }, { status: 500 });
  }
}
