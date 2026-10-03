import { generateReceiptPdf, generate80GCertificatePdf } from './lib/generateReceiptPdf.ts';

async function testAll() {
  try {
    console.log('1. Testing generateReceiptPdf...');
    const r1 = await generateReceiptPdf({
      receiptNo: 'REC-1234',
      paidAt: '03 Oct 2026',
      donorName: 'Test Donor',
      donorPan: 'ABCDE1234F',
      schoolName: 'School 1',
      trustName: 'Trust 1',
      campaignTitle: 'Education',
      donationType: 'ZAKAT',
      amount: 10000,
      paymentId: 'pay_123',
    });
    console.log('generateReceiptPdf SUCCESS! Length:', r1.length);

    console.log('2. Testing generate80GCertificatePdf...');
    const r2 = await generate80GCertificatePdf({
      receiptNo: '80G-1234',
      paidAt: '03 Oct 2026',
      donorName: 'Test Donor',
      donorPan: 'ABCDE1234F',
      donorPhone: '+919876543210',
      donorEmail: 'test@example.com',
      schoolName: 'School 1',
      trustName: 'Trust 1',
      campaignTitle: 'Education Aid',
      donationType: 'DONATION',
      amount: 25000,
      paymentId: 'pay_456',
    });
    console.log('generate80GCertificatePdf SUCCESS! Length:', r2.length);

    console.log('\n ALL PDF GENERATION TESTS PASSED PERFECTLY!');
  } catch (err) {
    console.error('TEST FAILED:', err);
  }
}

testAll();
