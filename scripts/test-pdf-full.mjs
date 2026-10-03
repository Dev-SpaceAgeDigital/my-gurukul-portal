import { generateReceiptPdf, generate80GCertificatePdf } from '../lib/generateReceiptPdf.ts';

async function run() {
  try {
    console.log('Testing generateReceiptPdf...');
    const receiptBuffer = await generateReceiptPdf({
      receiptNo: 'REC-2026-9901',
      paidAt: '03 Oct 2026',
      donorName: 'Zahid Qureshi',
      donorPan: 'ABCDE1234F',
      schoolName: 'Madni High School',
      trustName: 'Madni Education & Charitable Trust',
      campaignTitle: 'Classroom Infrastructure',
      donationType: 'CONSTRUCTION',
      amount: 15000,
      paymentId: 'pay_P12345678',
      paymentMode: 'UPI',
      taxExemptionNo: 'AABTM1234F21EE01',
    });
    console.log('Receipt PDF generated successfully! Length:', receiptBuffer.length);

    console.log('Testing generate80GCertificatePdf...');
    const certBuffer = await generate80GCertificatePdf({
      receiptNo: '80G-2026-4412',
      paidAt: '03 Oct 2026',
      donorName: 'Zahid Qureshi',
      donorPan: 'ABCDE1234F',
      donorPhone: '+91 9876543210',
      donorEmail: 'zahid@example.com',
      schoolName: 'Madni High School',
      trustName: 'Madni Education & Charitable Trust',
      campaignTitle: 'Needy Student Aid',
      donationType: 'ZAKAT',
      amount: 25000,
      paymentId: 'pay_P87654321',
      paymentMode: 'Net Banking',
      taxExemptionNo: 'AABTM1234F21EE01',
    });
    console.log('80G Certificate PDF generated successfully! Length:', certBuffer.length);

  } catch (err) {
    console.error('PDF Generation Error:', err);
  }
}

run();
