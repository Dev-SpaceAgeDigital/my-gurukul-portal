import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSessionFromCookies('ADMIN');
    if (!session || session.role !== 'SUB_ADMIN' || !session.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await pool.query(`
      SELECT
        t.*,
        EXTRACT(YEAR FROM t."createdAt")::int as year,
        CASE
          WHEN e.id IS NOT NULL THEN 'PROJECT'
          WHEN std.id IS NOT NULL THEN 'STANDARD'
          ELSE 'GENERAL'
        END as "targetType",
        COALESCE(e.id::text, std.id::text, t."referenceId"::text) as "targetId",
        COALESCE(
          e.title,
          CONCAT(
            std."standardName",
            CASE WHEN std.division IS NOT NULL AND std.division <> '' THEN CONCAT(' - ', std.division) ELSE '' END,
            CASE WHEN std.stream IS NOT NULL AND std.stream <> '' THEN CONCAT(' (', std.stream, ')') ELSE '' END
          ),
          'General donation'
        ) as "targetLabel",
        std."batchYear" as "standardBatchYear"
      FROM "Transaction" t
      LEFT JOIN "Expense" e
        ON t."referenceId" = e.id AND t.type IN ('CONSTRUCTION', 'EVENT')
      LEFT JOIN "Standard" std
        ON t."referenceId" = std.id AND t.type IN ('FINANCIAL_AID', 'ZAKAT', 'LILLAH', 'SADKA', 'GENERAL')
      WHERE t."schoolId" = $1
      ORDER BY t."createdAt" DESC
    `, [session.schoolId]);

    return NextResponse.json(result.rows);

  } catch (error: any) {
    console.error('Transactions fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
