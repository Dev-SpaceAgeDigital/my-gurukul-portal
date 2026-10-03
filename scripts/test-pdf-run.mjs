import { PDFDocument, StandardFonts } from 'pdf-lib';

function sanitizePdfText(text) {
  if (text === null || text === undefined) return '';
  return String(text)
    .replace(/₹/g, 'Rs. ')
    .replace(/[•·]/g, '|')
    .replace(/[–—]/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[^\x00-\x7F]/g, '');
}

async function test() {
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
    console.log('Testing sanitized text with Rupee and symbols...');
    const text1 = sanitizePdfText('Donation Amount: ₹ 5,000.00');
    const text2 = sanitizePdfText('80G URN / Approval · Recognized Trust');
    const text3 = sanitizePdfText('• Certified that voluntary donation of ₹10,000 received — Valid');

    page.drawText(text1, { x: 50, y: 700, font, size: 12 });
    page.drawText(text2, { x: 50, y: 650, font, size: 12 });
    page.drawText(text3, { x: 50, y: 600, font, size: 12 });

    const bytes = await pdfDoc.save();
    console.log('SUCCESS! PDF generated cleanly without errors. Bytes:', bytes.length);
  } catch (err) {
    console.error('CRASH DETECTED:', err.message);
  }
}

test();
