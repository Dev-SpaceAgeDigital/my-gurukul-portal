import { NextResponse } from 'next/server';
import crypto from 'crypto';
import pool from '@/lib/db';
import { createNotification } from '@/lib/notifications';
import { checkRateLimit, rateLimitResponse } from '@/lib/security/rateLimit';

export async function POST(request: Request) {
  const limit = await checkRateLimit(request, 'payment');
  if (!limit.allowed) return rateLimitResponse(limit.retryAfter);

  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      amount,
      type,
      referenceId,
      schoolId,
      donorName,
      donorEmail,
      donorPhone,
      donorPan,
      request80G,
      campaignTitle,
      causeName
    } = await request.json();

    const cleanPan = donorPan ? String(donorPan).trim().toUpperCase() : null;

    // 1. Verify Signature
    const secret = process.env.RAZORPAY_KEY_SECRET!;
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    // Fetch payment details from Razorpay to get the method
    let paymentMode = 'unknown';
    try {
      const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_RXNuiBfUb7KG4A';
      const rzpRes = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, {
        headers: {
          Authorization: `Basic ${Buffer.from(`${keyId}:${secret}`).toString('base64')}`
        }
      });
      if (rzpRes.ok) {
        const paymentData = await rzpRes.json();
        paymentMode = paymentData.method || 'unknown';
      }
    } catch (err) {
      console.error('Failed to fetch razorpay payment details', err);
    }

    // 2. Database Update Transactionally
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Record Transaction
      await client.query(`
        INSERT INTO "Transaction" (
          amount, type, "donorName", "donorEmail", "donorPhone", "donorPan",
          "razorpayPaymentId", "razorpayOrderId", status, "schoolId", "referenceId", "paymentMode"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        amount, type, donorName || 'Anonymous', donorEmail, donorPhone, cleanPan,
        razorpay_payment_id, razorpay_order_id, 'SUCCESS', schoolId, referenceId, paymentMode
      ]);

      // If PAN is provided and email matches alumni, save PAN in alumni profile
      if (cleanPan && donorEmail) {
        await client.query(
          `UPDATE "Alumni" SET "panNo" = $1 WHERE LOWER(email) = $2 AND ("panNo" IS NULL OR "panNo" = '')`,
          [cleanPan, donorEmail.toLowerCase()]
        ).catch(() => {});
      }

      // If PAN is provided or 80G requested, create 80G Request record for SuperAdmin approval
      if (cleanPan || request80G) {
        let schoolNameVal = 'EduTrust Network';
        if (schoolId) {
          const sRes = await client.query('SELECT "schoolName" FROM "School" WHERE id = $1 LIMIT 1', [schoolId]);
          if (sRes.rows[0]) schoolNameVal = sRes.rows[0].schoolName;
        }

        const causeVal = causeName || campaignTitle || type || 'Educational Support';

        await client.query(`
          CREATE TABLE IF NOT EXISTS "Donation80GRequest" (
            id TEXT PRIMARY KEY,
            "donorName" VARCHAR(255) NOT NULL,
            "donorEmail" VARCHAR(255) NOT NULL,
            "donorPhone" VARCHAR(50),
            "donorPan" VARCHAR(20) NOT NULL,
            amount NUMERIC(12, 2) NOT NULL,
            "paymentId" VARCHAR(100),
            "causeName" VARCHAR(255) NOT NULL,
            "schoolName" VARCHAR(255) NOT NULL,
            "schoolId" TEXT,
            status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
            "sentAt" TIMESTAMPTZ,
            "receiptNo" VARCHAR(100),
            "alumniId" UUID,
            "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
        `);

        await client.query(`
          INSERT INTO "Donation80GRequest" (
            id, "donorName", "donorEmail", "donorPhone", "donorPan",
            amount, "paymentId", "causeName", "schoolName", "schoolId", status, "createdAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PENDING', NOW())
          ON CONFLICT (id) DO UPDATE SET
            "donorPan" = EXCLUDED."donorPan",
            "amount" = EXCLUDED."amount",
            "paymentId" = EXCLUDED."paymentId"
        `, [
          razorpay_payment_id,
          donorName || 'Alumni Donor',
          donorEmail || '',
          donorPhone || '',
          cleanPan || '',
          amount,
          razorpay_payment_id,
          causeVal,
          schoolNameVal,
          schoolId || null
        ]).catch(e => console.error('Failed to insert Donation80GRequest:', e));
      }

      // Deduct from Expense or Student
      if (type === 'CONSTRUCTION' || type === 'EVENT') {
        await client.query(
          'UPDATE "Expense" SET "paidAmount" = "paidAmount" + $1 WHERE id = $2',
          [amount, referenceId]
        );
      } else if (['ZAKAT', 'LILLAH', 'SADKA', 'DONATION', 'AID', 'FEE_PAYMENT'].includes(type!)) {
        // Distribute amount among needy students in this standard for this category
        let studentsRes;
        if (type === 'DONATION' || type === 'AID' || type === 'FEE_PAYMENT') {
          studentsRes = await client.query(`
            SELECT s.id, std.fees, s."aidPaidAmount"
            FROM "Student" s
            JOIN "Standard" std ON s."standardId" = std.id
            WHERE s."standardId" = $1 AND s."isNeedy" = true
            ORDER BY s.id ASC
          `, [referenceId]);
        } else {
          studentsRes = await client.query(`
            SELECT s.id, std.fees, s."aidPaidAmount"
            FROM "Student" s
            JOIN "Standard" std ON s."standardId" = std.id
            WHERE s."standardId" = $1 AND s."sponsorshipType" ILIKE $2 AND s."isNeedy" = true
            ORDER BY s.id ASC
          `, [referenceId, `%${type}%`]);
        }

        let remaining = amount;
        for (const student of studentsRes.rows) {
          if (remaining <= 0) break;
          const needed = student.fees - student.aidPaidAmount;
          if (needed <= 0) continue;

          const toAdd = Math.min(remaining, needed);
          await client.query(
            'UPDATE "Student" SET "aidPaidAmount" = "aidPaidAmount" + $1 WHERE id = $2',
            [toAdd, student.id]
          );
          remaining -= toAdd;
        }
      }

      await client.query('COMMIT');
    } catch (dbErr) {
      await client.query('ROLLBACK');
      throw dbErr;
    } finally {
      client.release();
    }

    // 1. Detailed Notification with amount for Superadmin & Subadmin
    await createNotification({
      title: 'Donation payment received',
      message: `${donorName || 'A donor'} paid Rs. ${Number(amount).toLocaleString('en-IN')} for ${type}.`,
      type: 'DONATION',
      priority: 'HIGH',
      schoolId,
      entityType: 'Transaction',
      entityId: razorpay_payment_id,
      link: '/subadmin/dashboard',
      audiences: [
        { type: 'ROLE', recipientRole: 'SUPER_ADMIN' },
        ...(schoolId ? [{ type: 'SCHOOL_ROLE' as const, recipientRole: 'SUB_ADMIN' as const, schoolId }] : []),
      ],
    });

    // 2. Private Confirmation ONLY to the donating Alumni (Never broadcast to other alumni)
    if (donorEmail) {
      try {
        const alumniCheck = await pool.query('SELECT id FROM "Alumni" WHERE LOWER(email) = $1 LIMIT 1', [donorEmail.toLowerCase()]);
        if (alumniCheck.rows.length > 0) {
          const donorAlumniId = alumniCheck.rows[0].id;
          await createNotification({
            title: 'Donation Received - Thank You! 🎉',
            message: `Your contribution of Rs. ${Number(amount).toLocaleString('en-IN')} towards ${type} was successful.`,
            type: 'DONATION',
            priority: 'HIGH',
            schoolId,
            entityType: 'Transaction',
            entityId: razorpay_payment_id,
            link: '/alumni/dashboard',
            audiences: [
              { type: 'DIRECT', recipientRole: 'ALUMNI', recipientId: donorAlumniId }
            ],
          });
        }
      } catch {}
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ error: 'Failed to verify institutional donation' }, { status: 500 });
  }
}
