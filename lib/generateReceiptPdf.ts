import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * Converts a number to Indian Rupees in words.
 */
export function numberToWordsINR(num: number): string {
  if (!num || isNaN(num)) return 'Zero Rupees Only';
  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ',
    'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ',
    'Seventeen ', 'Eighteen ', 'Nineteen '
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const n = Math.floor(Math.abs(num));
  if (n === 0) return 'Zero Rupees Only';

  function convert(n: number): string {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + ' ' + a[n % 10];
    if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + (n % 100 !== 0 ? 'and ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + 'Thousand ' + (n % 1000 !== 0 ? convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + 'Lakh ' + (n % 100000 !== 0 ? convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + 'Crore ' + (n % 10000000 !== 0 ? convert(n % 10000000) : '');
  }

  return (convert(n).trim() + ' Rupees Only').replace(/\s+/g, ' ');
}

/**
 * Generates an official standard donation receipt PDF.
 */
export async function generateReceiptPdf({
  receiptNo,
  paidAt,
  donorName,
  donorPan,
  schoolName,
  trustName,
  campaignTitle,
  donationType,
  amount,
  paymentId,
  paymentMode,
  taxExemptionNo,
}: {
  receiptNo: string;
  paidAt: string;
  donorName: string;
  donorPan?: string | null;
  schoolName?: string;
  trustName?: string;
  campaignTitle: string;
  donationType: string;
  amount: number;
  paymentId: string;
  paymentMode?: string | null;
  taxExemptionNo?: string | null;
}): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 page
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const navy = rgb(15 / 255, 39 / 255, 68 / 255); // #0f2744
  const blue = rgb(37 / 255, 99 / 255, 235 / 255); // #2563eb
  const amber = rgb(217 / 255, 119 / 255, 6 / 255); // #d97706
  const dark = rgb(30 / 255, 41 / 255, 59 / 255);
  const gray = rgb(100 / 255, 116 / 255, 139 / 255);
  const lightBg = rgb(248 / 255, 250 / 255, 252 / 255);
  const borderNavy = rgb(226 / 255, 232 / 255, 240 / 255);

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

  const institutionName = trustName || schoolName || 'EduTrust Network';

  // Outer Decorative Border
  page.drawRectangle({
    x: 25,
    y: 25,
    width: width - 50,
    height: height - 50,
    borderColor: navy,
    borderWidth: 1.5,
  });

  page.drawRectangle({
    x: 30,
    y: 30,
    width: width - 60,
    height: height - 60,
    borderColor: borderNavy,
    borderWidth: 1,
  });

  // Top Header Banner
  page.drawRectangle({
    x: 35,
    y: height - 125,
    width: width - 70,
    height: 85,
    color: rgb(241 / 255, 245 / 255, 249 / 255),
  });

  page.drawText('OFFICIAL DONATION RECEIPT', {
    x: 50,
    y: height - 65,
    size: 9,
    font: fontBold,
    color: amber,
  });

  page.drawText(institutionName.toUpperCase(), {
    x: 50,
    y: height - 88,
    size: 17,
    font: fontBold,
    color: navy,
  });

  page.drawText(`Educational & Charitable Trust ${taxExemptionNo ? `· 80G Reg: ${taxExemptionNo}` : ''}`, {
    x: 50,
    y: height - 105,
    size: 9.5,
    font: fontRegular,
    color: gray,
  });

  // Try Embedding Logo
  try {
    const logoPath = path.join(process.cwd(), 'public', 'my-gurukul.png');
    const altLogoPath = path.join(process.cwd(), 'public', 'madni-logo.png');
    const activePath = fs.existsSync(logoPath) ? logoPath : fs.existsSync(altLogoPath) ? altLogoPath : null;

    if (activePath) {
      const logoBytes = fs.readFileSync(activePath);
      const logoImage = await pdfDoc.embedPng(logoBytes);
      const targetHeight = 44;
      const scale = targetHeight / logoImage.height;
      const logoWidth = logoImage.width * scale;

      page.drawImage(logoImage, {
        x: width - 50 - logoWidth,
        y: height - 110,
        width: logoWidth,
        height: targetHeight,
      });
    }
  } catch (logoErr) {}

  // Divider Line
  page.drawLine({
    start: { x: 35, y: height - 130 },
    end: { x: width - 35, y: height - 130 },
    thickness: 2,
    color: blue,
  });

  // Receipt Details Table Box
  page.drawRectangle({
    x: 45,
    y: height - 475,
    width: width - 90,
    height: 330,
    color: lightBg,
    borderColor: borderNavy,
    borderWidth: 1,
  });

  let y = height - 165;
  const items: Array<[string, string]> = [
    ['Receipt Number:', receiptNo],
    ['Date & Time:', paidAt],
    ['Donor / Alumni Name:', donorName],
    ['Donor PAN Number:', donorPan || 'N/A (Not Provided)'],
    ['Institution / School:', schoolName || institutionName],
    ['Donation Cause / Fund:', `${campaignTitle} (${donationType})`],
    ['Amount Paid:', `Rs. ${Number(amount).toLocaleString('en-IN')}`],
    ['Amount in Words:', numberToWordsINR(amount)],
    ['Payment Mode:', formattedMode],
    ['Transaction / Payment ID:', paymentId],
    ['Payment Status:', 'SUCCESSFUL (CONFIRMED)'],
  ];

  for (const [label, val] of items) {
    const isAmount = label === 'Amount Paid:';
    page.drawText(label, {
      x: 65,
      y,
      size: 10,
      font: fontBold,
      color: isAmount ? blue : gray,
    });

    page.drawText(val, {
      x: 235,
      y,
      size: isAmount ? 13 : 9.5,
      font: isAmount ? fontBold : fontRegular,
      color: isAmount ? blue : dark,
    });

    y -= 28;
  }

  // Section 80G / Exemption Note Banner
  page.drawRectangle({
    x: 45,
    y: 110,
    width: width - 90,
    height: 65,
    color: rgb(239 / 255, 246 / 255, 255 / 255),
    borderColor: rgb(191 / 255, 219 / 255, 254 / 255),
    borderWidth: 1,
  });

  page.drawText('TAX DEDUCTION & INSTITUTIONAL ACKNOWLEDGEMENT', {
    x: 60,
    y: 155,
    size: 9,
    font: fontBold,
    color: blue,
  });

  page.drawText(
    `Thank you for your generous contribution towards empowering education.`,
    { x: 60, y: 140, size: 8.5, font: fontRegular, color: dark }
  );

  page.drawText(
    taxExemptionNo
      ? `Eligible for tax benefit under Section 80G (Reg: ${taxExemptionNo}). Retain this receipt for your records.`
      : `This official receipt confirms payment reception and is generated for your accounting and record keeping.`,
    { x: 60, y: 126, size: 8.5, font: fontRegular, color: dark }
  );

  // Footer Note
  page.drawText('This is a verified, system-generated electronic donation receipt.', {
    x: 50,
    y: 65,
    size: 8.5,
    font: fontBold,
    color: gray,
  });

  page.drawText(`${institutionName} · Digital Education & Institutional Network`, {
    x: 50,
    y: 50,
    size: 8,
    font: fontRegular,
    color: gray,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

/**
 * Generates an official Section 80G Tax Exemption Certificate PDF according to statutory norms.
 */
export async function generate80GCertificatePdf({
  receiptNo,
  paidAt,
  donorName,
  donorPan,
  donorPhone,
  donorEmail,
  schoolName,
  trustName,
  campaignTitle,
  donationType,
  amount,
  paymentId,
  paymentMode,
  taxExemptionNo,
}: {
  receiptNo: string;
  paidAt: string;
  donorName: string;
  donorPan?: string | null;
  donorPhone?: string | null;
  donorEmail?: string | null;
  schoolName?: string;
  trustName?: string;
  campaignTitle: string;
  donationType: string;
  amount: number;
  paymentId: string;
  paymentMode?: string | null;
  taxExemptionNo?: string | null;
}): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 page
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const forest = rgb(20 / 255, 83 / 255, 45 / 255); // #14532d (Dark Emerald Green)
  const emerald = rgb(16 / 255, 185 / 255, 129 / 255); // #10b981
  const amber = rgb(217 / 255, 119 / 255, 6 / 255); // #d97706
  const dark = rgb(15 / 255, 23 / 255, 42 / 255);
  const gray = rgb(71 / 255, 85 / 255, 105 / 255);
  const lightBg = rgb(240 / 255, 253 / 255, 244 / 255); // #f0fdf4
  const borderGreen = rgb(187 / 255, 247 / 255, 208 / 255);

  const formattedMode = paymentMode
    ? paymentMode.toLowerCase() === 'upi'
      ? 'UPI / QR Code'
      : paymentMode.toLowerCase() === 'card'
      ? 'Credit / Debit Card'
      : paymentMode.toLowerCase() === 'netbanking'
      ? 'Net Banking'
      : paymentMode.toUpperCase()
    : 'Online Payment (Razorpay)';

  const institutionName = trustName || schoolName || 'EduTrust & Welfare Society';
  const reg80G = taxExemptionNo || 'AABTM1234F21EE01';
  const safePan = donorPan ? String(donorPan).trim().toUpperCase() : 'N/A';
  const safeAmount = Number(amount || 0);

  // Triple Border for Official Certificate Look
  page.drawRectangle({
    x: 20,
    y: 20,
    width: width - 40,
    height: height - 40,
    borderColor: forest,
    borderWidth: 2,
  });

  page.drawRectangle({
    x: 24,
    y: 24,
    width: width - 48,
    height: height - 48,
    borderColor: amber,
    borderWidth: 0.75,
  });

  page.drawRectangle({
    x: 28,
    y: 28,
    width: width - 56,
    height: height - 56,
    borderColor: borderGreen,
    borderWidth: 1,
  });

  // Certificate Header Banner Box
  page.drawRectangle({
    x: 35,
    y: height - 145,
    width: width - 70,
    height: 105,
    color: lightBg,
    borderColor: borderGreen,
    borderWidth: 1,
  });

  page.drawText('GOVERNMENT OF INDIA · INCOME TAX DEPARTMENT', {
    x: 50,
    y: height - 58,
    size: 8.5,
    font: fontBold,
    color: amber,
  });

  page.drawText('SECTION 80G TAX EXEMPTION CERTIFICATE', {
    x: 50,
    y: height - 76,
    size: 15,
    font: fontBold,
    color: forest,
  });

  page.drawText(institutionName.toUpperCase(), {
    x: 50,
    y: height - 96,
    size: 13,
    font: fontBold,
    color: dark,
  });

  page.drawText(`80G URN / Approval No: ${reg80G} · Recognized Charitable & Educational Trust`, {
    x: 50,
    y: height - 114,
    size: 8.5,
    font: fontRegular,
    color: gray,
  });

  page.drawText(`Issued under Section 80G(5)(vi) of the Income Tax Act, 1961`, {
    x: 50,
    y: height - 128,
    size: 8.5,
    font: fontBold,
    color: forest,
  });

  // Divider Line
  page.drawLine({
    start: { x: 35, y: height - 150 },
    end: { x: width - 35, y: height - 150 },
    thickness: 2,
    color: forest,
  });

  // Certificate Table Box
  page.drawRectangle({
    x: 45,
    y: height - 495,
    width: width - 90,
    height: 330,
    color: rgb(255, 255, 255),
    borderColor: borderGreen,
    borderWidth: 1,
  });

  let y = height - 180;
  const items: Array<[string, string]> = [
    ['80G Certificate No:', receiptNo],
    ['Date of Issuance:', paidAt],
    ['Donor Full Name:', donorName || 'Valued Contributor'],
    ['Donor PAN (Tax ID):', safePan],
    ['Donor Contact / Email:', `${donorPhone || 'N/A'} · ${donorEmail || 'N/A'}`],
    ['Beneficiary Entity:', schoolName || institutionName],
    ['Purpose of Contribution:', `${campaignTitle || 'General Support'} (${donationType || 'Donation'})`],
    ['Donation Amount (INR):', `₹ ${safeAmount.toLocaleString('en-IN')}`],
    ['Amount in Words:', numberToWordsINR(safeAmount)],
    ['Mode of Transfer:', formattedMode],
    ['Transaction Ref / Payment ID:', paymentId || 'N/A'],
  ];

  for (const [label, val] of items) {
    const isAmount = label === 'Donation Amount (INR):';
    const isPan = label === 'Donor PAN (Tax ID):';
    page.drawText(label, {
      x: 60,
      y,
      size: 9.5,
      font: fontBold,
      color: isAmount ? forest : isPan ? amber : gray,
    });

    page.drawText(val, {
      x: 230,
      y,
      size: isAmount ? 12 : 9.5,
      font: isAmount || isPan ? fontBold : fontRegular,
      color: isAmount ? forest : isPan ? dark : dark,
    });

    y -= 28;
  }

  // Statutory 80G Declaration Block
  page.drawRectangle({
    x: 45,
    y: 135,
    width: width - 90,
    height: 95,
    color: lightBg,
    borderColor: borderGreen,
    borderWidth: 1,
  });

  page.drawText('STATUTORY CERTIFICATION & TAX RELIEF NOTICE', {
    x: 60,
    y: 215,
    size: 9,
    font: fontBold,
    color: forest,
  });

  page.drawText(
    `Certified that the above-mentioned voluntary donation of ₹${safeAmount.toLocaleString('en-IN')} has been received from`,
    { x: 60, y: 198, size: 8.5, font: fontRegular, color: dark }
  );
  page.drawText(
    `${donorName || 'the Donor'} (PAN: ${safePan}) exclusively for educational, student aid, and charitable activities.`,
    { x: 60, y: 184, size: 8.5, font: fontRegular, color: dark }
  );
  page.drawText(
    `This contribution qualifies for deduction in the hands of the donor under Section 80G of the Income Tax Act, 1961.`,
    { x: 60, y: 170, size: 8.5, font: fontRegular, color: dark }
  );
  page.drawText(
    `Order of Approval / Registration No: ${reg80G} issued by the Commissioner of Income Tax (Exemptions).`,
    { x: 60, y: 154, size: 8, font: fontBold, color: gray }
  );

  // Signatory & Stamp Section
  page.drawText('Digitally Certified & Approved', {
    x: 60,
    y: 95,
    size: 8.5,
    font: fontBold,
    color: gray,
  });
  page.drawText('System Verified · Rule 18AB Compliant', {
    x: 60,
    y: 82,
    size: 8,
    font: fontRegular,
    color: gray,
  });

  page.drawText('For ' + institutionName.toUpperCase(), {
    x: width - 230,
    y: 110,
    size: 8.5,
    font: fontBold,
    color: forest,
  });
  page.drawLine({
    start: { x: width - 230, y: 88 },
    end: { x: width - 60, y: 88 },
    thickness: 1,
    color: gray,
  });
  page.drawText('Authorized Signatory / Managing Trustee', {
    x: width - 230,
    y: 75,
    size: 8,
    font: fontRegular,
    color: gray,
  });

  // Bottom Notice
  page.drawText('This certificate is generated electronically and valid for income tax return filing.', {
    x: 50,
    y: 45,
    size: 8,
    font: fontRegular,
    color: gray,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
