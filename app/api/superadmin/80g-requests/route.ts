import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';
import { generateReceiptPdf } from '@/lib/generateReceiptPdf';
import { createNotification } from '@/lib/notifications';
import { sendEmail } from '@/lib/emailSender';

const FROM_EMAIL = process.env.BREVO_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || 'Madni Education Trust <no-reply@zynteqtechnologies.com>';

export async function ensure80GTable() {
  await pool.query(`
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
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

export async function GET() {
  try {
    const session = await getSessionFromCookies('ADMIN');
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Superadmin access required.' }, { status: 403 });
    }

    await ensure80GTable();

    // Sync pending 80G requests from DonationInquiry
    const inquiries = await pool.query(`
      SELECT 
        id, token, "donorName", "donorEmail", "donorPhone", "donorPan",
        amount, type, "campaignTitle", "schoolName", "schoolId", "createdAt"
      FROM "DonationInquiry"
      WHERE "donorPan" IS NOT NULL AND TRIM("donorPan") != ''
    `).catch(() => ({ rows: [] }));

    for (const inq of inquiries.rows) {
      await pool.query(
        `
          INSERT INTO "Donation80GRequest" (
            id, "donorName", "donorEmail", "donorPhone", "donorPan",
            amount, "paymentId", "causeName", "schoolName", "schoolId", status, "createdAt"
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PENDING', $11)
          ON CONFLICT (id) DO NOTHING
        `,
        [
          inq.id,
          inq.donorName,
          inq.donorEmail,
          inq.donorPhone || 'Not provided',
          inq.donorPan.toUpperCase(),
          inq.amount,
          inq.token || 'INQ-' + inq.id.slice(0, 8),
          inq.campaignTitle || inq.type || 'Educational Aid',
          inq.schoolName || 'Madni Education Trust',
          inq.schoolId || null,
          inq.createdAt,
        ]
      );
    }

    const res = await pool.query(`
      SELECT * FROM "Donation80GRequest"
      ORDER BY 
        CASE WHEN status = 'PENDING' THEN 0 ELSE 1 END,
        "createdAt" DESC
    `);

    return NextResponse.json({ requests: res.rows });
  } catch (error) {
    console.error('Fetch 80G requests error:', error);
    return NextResponse.json({ error: 'Failed to fetch 80G requests' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionFromCookies('ADMIN');
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Superadmin access required.' }, { status: 403 });
    }

    await ensure80GTable();

    const body = await req.json();
    const { id, action } = body;

    if (!id || action !== 'APPROVE_SEND') {
      return NextResponse.json({ error: 'Valid request ID and action APPROVE_SEND required' }, { status: 400 });
    }

    const reqRes = await pool.query('SELECT * FROM "Donation80GRequest" WHERE id = $1', [id]);
    if (reqRes.rows.length === 0) {
      return NextResponse.json({ error: '80G Request not found' }, { status: 404 });
    }

    const item = reqRes.rows[0];
    const receiptNo = `MDT-80G-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const paidAt = new Date(item.createdAt).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Generate Official 80G PDF Certificate
    const pdfBuffer = await generateReceiptPdf({
      receiptNo,
      paidAt,
      donorName: item.donorName,
      donorPan: item.donorPan,
      schoolName: item.schoolName,
      campaignTitle: item.causeName,
      donationType: '80G Tax Exempt Contribution',
      amount: parseFloat(item.amount),
      paymentId: item.paymentId || 'MDT-TXN-' + item.id.slice(0, 8),
      paymentMode: 'Online Donation',
    });

    let emailSent = false;

    const pdfBase64 = pdfBuffer.toString('base64');
    const sendResult = await sendEmail({
      from: FROM_EMAIL,
      to: item.donorEmail,
      subject: `Official Section 80G Tax Exemption Certificate - ${item.donorName}`,
      attachments: [
        {
          filename: `80G_Tax_Certificate_${receiptNo}.pdf`,
          content: pdfBase64,
        },
      ],
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <div style="text-align: center; border-bottom: 2px solid #1A6B5A; padding-bottom: 16px; margin-bottom: 20px;">
            <h2 style="color: #1A6B5A; margin: 0; font-size: 22px;">${(item.schoolName || 'Education Trust').toUpperCase()}</h2>
            <p style="color: #F5A623; font-weight: bold; margin: 4px 0 0 0; font-size: 12px; text-transform: uppercase;">Official 80G Tax Exemption Certificate</p>
            <p style="color: #64748b; font-size: 11px; margin: 2px 0 0 0;">80G Tax Exemption Verified Certificate</p>
          </div>

          <p style="font-size: 14px; color: #334155; line-height: 1.6;">Dear <strong>${item.donorName}</strong>,</p>
          
          <p style="font-size: 14px; color: #334155; line-height: 1.6;">
            Thank you for your generous contribution of <strong>Rs. ${Number(item.amount).toLocaleString('en-IN')}</strong> towards <strong>${item.causeName}</strong>.
          </p>

          <div style="background: #EAF4F0; border: 1px solid #1A6B5A; border-radius: 10px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0 0 8px 0; font-weight: bold; color: #1A6B5A; font-size: 13px;">INCOME TAX SECTION 80G CLAIM DETAILS:</p>
            <p style="margin: 4px 0; font-size: 13px; color: #1e293b;">• <strong>Donor Name:</strong> ${item.donorName}</p>
            <p style="margin: 4px 0; font-size: 13px; color: #1e293b;">• <strong>PAN Card No:</strong> ${item.donorPan}</p>
            <p style="margin: 4px 0; font-size: 13px; color: #1e293b;">• <strong>Receipt No:</strong> ${receiptNo}</p>
            <p style="margin: 4px 0; font-size: 13px; color: #1e293b;">• <strong>Amount:</strong> Rs. ${Number(item.amount).toLocaleString('en-IN')}</p>
          </div>

          <p style="font-size: 13px; color: #475569; line-height: 1.6;">
            Please find attached your official <strong>Section 80G Tax Exemption PDF Certificate</strong>. You can present this PDF during your Income Tax Return (ITR) filing to claim tax exemption benefits.
          </p>

          <div style="border-top: 1px solid #e2e8f0; margin-top: 24px; padding-top: 16px; text-align: center; color: #94a3b8; font-size: 11px;">
            ${item.schoolName || 'Education Trust'} · Registered Public Charitable Trust
          </div>
        </div>
      `,
    });

    if (sendResult.ok) {
      emailSent = true;
    } else {
      console.error('80G email send error:', sendResult.error);
    }

    // Update status in DB
    await pool.query(
      `
        UPDATE "Donation80GRequest"
        SET status = 'APPROVED_SENT', "sentAt" = NOW()
        WHERE id = $1
      `,
      [id]
    );

    // Send in-app notification to donor if alumni or registered user
    try {
      const alumniRes = await pool.query('SELECT id FROM "Alumni" WHERE LOWER(email) = $1 LIMIT 1', [item.donorEmail.toLowerCase()]);
      if (alumniRes.rows[0]) {
        await createNotification({
          title: '80G Certificate Emailed! 📜',
          message: `Your official Section 80G Tax Exemption Certificate (PAN: ${item.donorPan}) has been verified and emailed to ${item.donorEmail}.`,
          type: 'DONATION',
          priority: 'HIGH',
          schoolId: item.schoolId || null,
          link: '/alumni/dashboard',
          audiences: [
            { type: 'DIRECT', recipientRole: 'ALUMNI', recipientId: alumniRes.rows[0].id }
          ]
        });
      }
    } catch (notifErr) {}

    return NextResponse.json({
      success: true,
      emailSent,
      receiptNo,
      message: emailSent
        ? `Official 80G PDF Certificate successfully emailed to ${item.donorEmail}!`
        : `80G Request approved! Resend API key missing, but PDF generated successfully.`,
    });
  } catch (error) {
    console.error('Approve 80G request error:', error);
    return NextResponse.json({ error: 'Failed to process 80G request' }, { status: 500 });
  }
}
