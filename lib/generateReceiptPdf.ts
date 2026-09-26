import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function generateReceiptPdf({
  receiptNo,
  paidAt,
  donorName,
  donorPan,
  schoolName,
  campaignTitle,
  donationType,
  amount,
  paymentId,
  paymentMode,
}: {
  receiptNo: string;
  paidAt: string;
  donorName: string;
  donorPan?: string | null;
  schoolName: string;
  campaignTitle: string;
  donationType: string;
  amount: number;
  paymentId: string;
  paymentMode?: string | null;
}): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // Standard A4 page
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const teal = rgb(26 / 255, 107 / 255, 90 / 255); // #1A6B5A
  const amber = rgb(245 / 255, 166 / 255, 35 / 255); // #F5A623
  const dark = rgb(28 / 255, 28 / 255, 28 / 255);
  const gray = rgb(100 / 255, 116 / 255, 139 / 255);
  const lightBg = rgb(250 / 255, 248 / 255, 244 / 255);
  const borderTeal = rgb(234 / 255, 244 / 255, 240 / 255);

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

  // Outer Decorative Double Border Box
  page.drawRectangle({
    x: 30,
    y: 30,
    width: width - 60,
    height: height - 60,
    borderColor: teal,
    borderWidth: 2,
  });

  page.drawRectangle({
    x: 35,
    y: 35,
    width: width - 70,
    height: height - 70,
    borderColor: borderTeal,
    borderWidth: 1,
  });

  // Top Header Section
  page.drawText('OFFICIAL 80G TAX EXEMPTION DONATION RECEIPT', {
    x: 50,
    y: height - 75,
    size: 10,
    font: fontBold,
    color: amber,
  });

  page.drawText('MADNI EDUCATION TRUST', {
    x: 50,
    y: height - 102,
    size: 22,
    font: fontBold,
    color: teal,
  });

  page.drawText('Registered Public Charitable Trust · Section 80G Compliant', {
    x: 50,
    y: height - 120,
    size: 10,
    font: fontRegular,
    color: gray,
  });

  // Top Right Logo Image
  try {
    const logoPath = path.join(process.cwd(), 'public', 'madni-logo.png');
    const altLogoPath = path.join(process.cwd(), '..', 'madni-education-userside-', 'public', 'images', 'MadniEdu-Logo.png');
    const activePath = fs.existsSync(logoPath) ? logoPath : fs.existsSync(altLogoPath) ? altLogoPath : null;

    if (activePath) {
      const logoBytes = fs.readFileSync(activePath);
      const logoImage = await pdfDoc.embedPng(logoBytes);
      const targetHeight = 50;
      const scale = targetHeight / logoImage.height;
      const logoWidth = logoImage.width * scale;

      page.drawImage(logoImage, {
        x: width - 50 - logoWidth,
        y: height - 122,
        width: logoWidth,
        height: targetHeight,
      });
    }
  } catch (logoErr) {
    console.error('Failed to embed logo in receipt PDF:', logoErr);
  }

  // Horizontal Separator Line
  page.drawLine({
    start: { x: 50, y: height - 135 },
    end: { x: width - 50, y: height - 135 },
    thickness: 2,
    color: teal,
  });

  // Receipt Meta Grid Container Box
  page.drawRectangle({
    x: 50,
    y: height - 465,
    width: width - 100,
    height: 305,
    color: lightBg,
    borderColor: rgb(226 / 255, 232 / 255, 240 / 255),
    borderWidth: 1,
  });

  // Items List in Receipt
  let y = height - 175;
  const items: Array<[string, string]> = [
    ['Receipt Number:', receiptNo],
    ['Date & Time:', paidAt],
    ['Donor Name:', donorName],
    ['PAN Card Number:', donorPan || 'N/A (Not Provided)'],
    ['Beneficiary School:', schoolName],
    ['Donation Purpose:', `${campaignTitle} (${donationType})`],
    ['Amount Paid:', `Rs. ${amount.toLocaleString('en-IN')}`],
    ['Payment Mode:', formattedMode],
    ['Razorpay Payment ID:', paymentId],
    ['Payment Status:', 'SUCCESSFUL (PAID)'],
  ];

  for (const [label, val] of items) {
    const isAmount = label === 'Amount Paid:';
    page.drawText(label, {
      x: 70,
      y,
      size: 11,
      font: fontBold,
      color: isAmount ? teal : gray,
    });

    page.drawText(val, {
      x: 230,
      y,
      size: isAmount ? 15 : 11,
      font: isAmount ? fontBold : fontRegular,
      color: isAmount ? teal : dark,
    });

    y -= 28;
  }

  // Section 80G Tax Exemption Guarantee Banner Box
  page.drawRectangle({
    x: 50,
    y: 110,
    width: width - 100,
    height: 70,
    color: rgb(234 / 255, 244 / 255, 240 / 255),
    borderColor: teal,
    borderWidth: 1,
  });

  page.drawText('INCOME TAX DEDUCTION BENEFIT (SECTION 80G)', {
    x: 65,
    y: 160,
    size: 10,
    font: fontBold,
    color: teal,
  });

  page.drawText('Donations to Madni Education Trust are eligible for tax deduction under Section 80G', {
    x: 65,
    y: 144,
    size: 9.5,
    font: fontRegular,
    color: dark,
  });

  page.drawText('of the Income Tax Act, 1961. Please retain this PDF for your official tax return filing.', {
    x: 65,
    y: 130,
    size: 9.5,
    font: fontRegular,
    color: dark,
  });

  // Footer Note
  page.drawText('This is an official computer-generated PDF donation receipt.', {
    x: 50,
    y: 70,
    size: 9,
    font: fontBold,
    color: gray,
  });

  page.drawText('Madni Education Trust · Junabazar,Karjan, Gujarat, India', {
    x: 50,
    y: 55,
    size: 8.5,
    font: fontRegular,
    color: gray,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
