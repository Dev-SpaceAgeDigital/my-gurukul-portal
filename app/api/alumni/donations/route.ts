import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSessionFromCookies('ALUMNI');
    if (!session || !session.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const txRes = await pool.query(`
      SELECT 
        t.id,
        t.amount,
        t.type,
        t."createdAt",
        t.status,
        t."paymentMode",
        t."referenceId",
        t."razorpayPaymentId",
        s."schoolName",
        CASE 
          WHEN t.type IN ('CONSTRUCTION', 'EVENT') THEN e.title
          WHEN t.type IN ('ZAKAT', 'LILLAH', 'SADKA', 'GENERAL') THEN 'Standard ' || std."standardName"
          ELSE 'General Donation'
        END as "referenceName"
      FROM "Transaction" t
      LEFT JOIN "School" s ON t."schoolId" = s.id
      LEFT JOIN "Expense" e ON t."referenceId" = e.id AND t.type IN ('CONSTRUCTION', 'EVENT')
      LEFT JOIN "Standard" std ON t."referenceId" = std.id AND t.type IN ('ZAKAT', 'LILLAH', 'SADKA', 'GENERAL')
      WHERE t."donorEmail" = $1 AND t.status = 'SUCCESS'
      ORDER BY t."createdAt" DESC
    `, [session.email]);

    return NextResponse.json(txRes.rows);

  } catch (error: any) {
    console.error('Donation history fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
