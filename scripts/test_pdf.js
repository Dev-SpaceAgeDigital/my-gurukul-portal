const { generateReceiptPdf } = require('../lib/generateReceiptPdf');

async function test() {
  try {
    const buf = await generateReceiptPdf({
      receiptNo: 'MDT-2026-TEST',
      paidAt: '29 Jul 2026',
      donorName: 'Zahid Qureshi',
      donorPan: 'ABCDE1234F',
      schoolName: 'Markaz Public School',
      campaignTitle: 'Std. 3 - Div. A,B,C',
      donationType: 'Zakat',
      amount: 70000,
      paymentId: 'pay_test123',
    });
    console.log('PDF generated successfully, size:', buf.length);
  } catch (err) {
    console.error('PDF error:', err);
  }
}
test();
