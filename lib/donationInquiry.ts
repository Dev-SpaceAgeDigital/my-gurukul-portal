import crypto from 'crypto';
import pool from '@/lib/db';
import { sendEmail } from '@/lib/emailSender';

export const publicDonationHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

let ensured = false;
let transactionEnsured = false;

export async function ensureDonationInquiryTable() {
  if (ensured) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "DonationInquiry" (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      token text UNIQUE NOT NULL,
      "donorName" varchar(255) NOT NULL,
      "donorEmail" varchar(255) NOT NULL,
      "donorPhone" varchar(50) NOT NULL,
      "donorPan" varchar(30),
      "isAlumni" boolean DEFAULT false,
      amount numeric(12,2) NOT NULL,
      type varchar(50) NOT NULL,
      "campaignId" text,
      "campaignTitle" text,
      "schoolId" uuid,
      "schoolName" varchar(255),
      message text,
      status varchar(30) DEFAULT 'PENDING',
      "razorpayOrderId" text,
      "razorpayPaymentId" text,
      "paymentMode" varchar(50),
      "paidAt" timestamp with time zone,
      "expiresAt" timestamp with time zone NOT NULL,
      "createdAt" timestamp with time zone DEFAULT now(),
      "updatedAt" timestamp with time zone DEFAULT now()
    )
  `);

  await pool.query('CREATE INDEX IF NOT EXISTS "DonationInquiry_token_idx" ON "DonationInquiry" (token)');
  await pool.query('CREATE INDEX IF NOT EXISTS "DonationInquiry_status_idx" ON "DonationInquiry" (status, "createdAt")');
  await pool.query('ALTER TABLE "DonationInquiry" ADD COLUMN IF NOT EXISTS "donorPan" varchar(30)');
  await pool.query('ALTER TABLE "DonationInquiry" ADD COLUMN IF NOT EXISTS "isAlumni" boolean DEFAULT false');
  ensured = true;
}

export async function ensureDonationTransactionTable() {
  if (transactionEnsured) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "Transaction" (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      amount numeric(12,2) NOT NULL,
      type varchar(50) NOT NULL,
      "donorName" varchar(255),
      "donorEmail" varchar(255),
      "donorPhone" varchar(50),
      "razorpayPaymentId" text,
      "razorpayOrderId" text,
      status varchar(30) DEFAULT 'PENDING',
      "schoolId" uuid,
      "referenceId" text,
      "paymentMode" varchar(50),
      "createdAt" timestamp with time zone DEFAULT now(),
      "updatedAt" timestamp with time zone DEFAULT now()
    )
  `);

  await pool.query('ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS amount numeric(12,2) NOT NULL DEFAULT 0');
  await pool.query('ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS type varchar(50) NOT NULL DEFAULT \'LILLAH\'');
  await pool.query('ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "donorName" varchar(255)');
  await pool.query('ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "donorEmail" varchar(255)');
  await pool.query('ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "donorPhone" varchar(50)');
  await pool.query('ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS status varchar(30) DEFAULT \'PENDING\'');
  await pool.query('ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "schoolId" uuid');
  await pool.query('ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "paymentMode" varchar(50)');
  await pool.query('ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "referenceId" text');
  await pool.query('ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "razorpayOrderId" text');
  await pool.query('ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "razorpayPaymentId" text');
  await pool.query('ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now()');
  await pool.query('ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp with time zone DEFAULT now()');
  await pool.query('CREATE INDEX IF NOT EXISTS "Transaction_donor_email_idx" ON "Transaction" ("donorEmail", status)');
  await pool.query('CREATE INDEX IF NOT EXISTS "Transaction_school_idx" ON "Transaction" ("schoolId", status)');
  transactionEnsured = true;
}

export function createDonationToken() {
  return crypto.randomBytes(32).toString('base64url');
}

export function normalizeDonationType(type: string) {
  const key = String(type || '').trim().toLowerCase();
  if (key === 'zakat') return 'ZAKAT';
  if (key === 'sadaqah' || key === 'sadqa' || key === 'sadka') return 'SADKA';
  if (key === 'csr') return 'CSR';
  return 'LILLAH';
}

export function escapeHtml(value: unknown) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function getPaymentBaseUrl(req: Request) {
  const configured =
    process.env.PUBLIC_DONATION_SITE_URL ||
    process.env.NEXT_PUBLIC_USER_SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL;
  const origin = req.headers.get('origin');
  return (configured || origin || 'http://localhost:3000').replace(/\/$/, '');
}

export async function sendDonationPayLinkEmail({
  to,
  donorName,
  amount,
  campaignTitle,
  schoolName,
  paymentLink,
}: {
  to: string;
  donorName: string;
  amount: number;
  campaignTitle: string;
  schoolName: string;
  paymentLink: string;
}) {
  const result = await sendEmail({
    to,
    subject: 'Your secure Madni Education donation payment link',
    html: `
      <div style="font-family: Arial, sans-serif; background: #FAF8F4; padding: 28px;">
        <div style="max-width: 560px; margin: 0 auto; background: #fff; border: 1px solid #E5E7EB; border-radius: 16px; padding: 28px;">
          <h2 style="color: #1A6B5A; margin: 0 0 10px;">Madni Education Trust</h2>
          <p style="font-size: 15px; color: #333;">As-salamu alaykum, <strong>${escapeHtml(donorName)}</strong>.</p>
          <p style="font-size: 15px; color: #555; line-height: 1.7;">Thank you for your donation enquiry. Please use the secure payment link below to complete your contribution.</p>
          <div style="background: #F7FBF9; border-radius: 12px; padding: 16px; margin: 18px 0;">
            <p style="margin: 0 0 8px; color: #555;"><strong>Amount:</strong> Rs. ${amount.toLocaleString('en-IN')}</p>
            <p style="margin: 0 0 8px; color: #555;"><strong>Purpose:</strong> ${escapeHtml(campaignTitle)}</p>
            <p style="margin: 0; color: #555;"><strong>School:</strong> ${escapeHtml(schoolName)}</p>
          </div>
          <a href="${escapeHtml(paymentLink)}" style="display: inline-block; background: #1A6B5A; color: #fff; text-decoration: none; padding: 13px 24px; border-radius: 999px; font-weight: 700;">Pay Now</a>
          <p style="font-size: 12px; color: #888; margin-top: 18px; line-height: 1.6;">This link is unique to your enquiry and will expire automatically.</p>
        </div>
      </div>
    `,
  });

  if (!result.ok) {
    console.error('Donation pay link email failed:', result.error);
    return false;
  }

  return true;
}

export async function sendDonationReceiptEmail({
  to,
  donorName,
  donorPan,
  amount,
  donationType,
  campaignTitle,
  schoolName,
  paymentId,
  receiptNo,
  paymentMode,
}: {
  to: string;
  donorName: string;
  donorPan?: string | null;
  amount: number;
  donationType: string;
  campaignTitle: string;
  schoolName: string;
  paymentId: string;
  receiptNo: string;
  paymentMode?: string | null;
}) {
  const paidAt = new Date().toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  });

  const formattedMode = paymentMode
    ? paymentMode.toLowerCase() === 'upi'
      ? 'UPI / QR Code'
      : paymentMode.toLowerCase() === 'card'
      ? 'Credit / Debit Card'
      : paymentMode.toLowerCase() === 'netbanking'
      ? 'Net Banking'
      : paymentMode.toLowerCase() === 'wallet'
      ? 'Digital Wallet'
      : paymentMode.toUpperCase()
    : 'Online Payment (Razorpay)';

  let pdfBase64: string | null = null;
  try {
    const { generateReceiptPdf } = await import('@/lib/generateReceiptPdf');
    const pdfBuffer = await generateReceiptPdf({
      receiptNo,
      paidAt,
      donorName,
      donorPan,
      schoolName,
      campaignTitle,
      donationType,
      amount,
      paymentId,
      paymentMode: formattedMode,
    });
    pdfBase64 = pdfBuffer.toString('base64');
  } catch (pdfErr) {
    console.error('Failed to generate PDF attachment for receipt:', pdfErr);
  }

  const result = await sendEmail({
    to,
    subject: `Madni Education Trust donation receipt ${receiptNo}`,
    attachments: pdfBase64
      ? [
          {
            filename: `Donation_Receipt_${receiptNo}.pdf`,
            content: pdfBase64,
          },
        ]
      : [],
    html: `
      <div style="font-family: Arial, sans-serif; background: #FAF8F4; padding: 28px;">
        <div style="max-width: 640px; margin: 0 auto; background: #fff; border: 2px solid #1A6B5A; border-radius: 16px; padding: 28px;">
          <div style="text-align: center; border-bottom: 2px solid #1A6B5A; padding-bottom: 16px; margin-bottom: 18px;">
            <div style="font-size: 11px; font-weight: 800; color: #F5A623; letter-spacing: 0.12em; text-transform: uppercase;">Official Donation Receipt</div>
            <h2 style="color: #1A6B5A; margin: 6px 0 4px;">MADNI EDUCATION TRUST</h2>
            <p style="font-size: 12px; color: #555; line-height: 1.5; margin: 0;">Registered Public Charitable Trust<br />80G Tax Exemption Donation Receipt</p>
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tbody>
              <tr><td style="padding: 10px 0; color: #555;">Receipt No.</td><td style="padding: 10px 0; font-weight: 700;">${escapeHtml(receiptNo)}</td></tr>
              <tr><td style="padding: 10px 0; color: #555;">Date & Time</td><td style="padding: 10px 0; font-weight: 700;">${escapeHtml(paidAt)}</td></tr>
              <tr><td style="padding: 10px 0; color: #555;">Donor</td><td style="padding: 10px 0; font-weight: 700;">${escapeHtml(donorName)}</td></tr>
              ${donorPan ? `<tr><td style="padding: 10px 0; color: #555;">PAN</td><td style="padding: 10px 0; font-weight: 700;">${escapeHtml(donorPan)}</td></tr>` : ''}
              <tr><td style="padding: 10px 0; color: #555;">School</td><td style="padding: 10px 0; font-weight: 700;">${escapeHtml(schoolName)}</td></tr>
              <tr><td style="padding: 10px 0; color: #555;">Purpose</td><td style="padding: 10px 0; font-weight: 700;">${escapeHtml(campaignTitle)} (${escapeHtml(donationType)})</td></tr>
              <tr><td style="padding: 12px 0; color: #1A6B5A; font-weight: 800;">Amount Received</td><td style="padding: 12px 0; color: #1A6B5A; font-size: 22px; font-weight: 800;">Rs. ${amount.toLocaleString('en-IN')}</td></tr>
              <tr><td style="padding: 10px 0; color: #555;">Payment Mode</td><td style="padding: 10px 0; font-weight: 700; color: #1A6B5A;">${escapeHtml(formattedMode)}</td></tr>
              <tr><td style="padding: 10px 0; color: #555;">Razorpay Payment ID</td><td style="padding: 10px 0; font-weight: 700;">${escapeHtml(paymentId)}</td></tr>
            </tbody>
          </table>
          <p style="font-size: 12px; color: #666; line-height: 1.6; background: #FFF8EC; padding: 12px; border-radius: 10px;">This is a computer-generated receipt. Please find attached the official PDF receipt for your 80G tax records.</p>
        </div>
      </div>
    `,
  });

  if (!result.ok) {
    console.error('Donation receipt email failed:', result.error);
    return false;
  }

  return true;
}
