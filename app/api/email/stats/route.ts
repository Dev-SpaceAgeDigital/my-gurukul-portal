import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { emailLogs, schools, trusts } from '@/lib/db/schema';
import { eq, desc, sql, gte, and } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const trustId = searchParams.get('trustId');
    const schoolId = searchParams.get('schoolId');

    // Auto-migrate EmailLog table columns if needed
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "EmailLog" (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          "trustId" uuid REFERENCES "Trust"(id) ON DELETE CASCADE,
          "schoolId" uuid REFERENCES "School"(id) ON DELETE CASCADE,
          "recipientEmail" varchar(255) NOT NULL,
          "recipientRole" varchar(50),
          "emailType" varchar(100) NOT NULL,
          subject varchar(255) NOT NULL,
          provider varchar(50) DEFAULT 'BREVO' NOT NULL,
          status varchar(50) DEFAULT 'SENT' NOT NULL,
          "errorMessage" text,
          "createdAt" timestamptz DEFAULT NOW()
        )
      `);
    } catch (e) {
      console.warn('EmailLog table check:', e);
    }

    const conditions = [];
    if (trustId) conditions.push(eq(emailLogs.trustId, trustId));
    if (schoolId) conditions.push(eq(emailLogs.schoolId, schoolId));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Fetch recent 50 logs
    const logs = await db
      .select()
      .from(emailLogs)
      .where(whereClause)
      .orderBy(desc(emailLogs.createdAt))
      .limit(50);

    // Fetch today's count
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayConditions = [gte(emailLogs.createdAt, today)];
    if (trustId) todayConditions.push(eq(emailLogs.trustId, trustId));
    if (schoolId) todayConditions.push(eq(emailLogs.schoolId, schoolId));

    const todayLogs = await db
      .select({ count: sql<number>`count(*)::int`, status: emailLogs.status })
      .from(emailLogs)
      .where(and(...todayConditions))
      .groupBy(emailLogs.status);

    let sentToday = 0;
    let failedToday = 0;
    todayLogs.forEach((row) => {
      if (row.status === 'SENT') sentToday += row.count;
      if (row.status === 'FAILED') failedToday += row.count;
    });

    // Determine Brevo Key Provider Status
    let brevoStatus = 'GLOBAL_PLATFORM_KEY';
    if (schoolId) {
      const [sch] = await db.select().from(schools).where(eq(schools.id, schoolId)).limit(1);
      if (sch?.brevoApiKey) {
        brevoStatus = 'SCHOOL_DEDICATED_KEY';
      } else if (sch?.trustId) {
        const [tr] = await db.select().from(trusts).where(eq(trusts.id, sch.trustId)).limit(1);
        if (tr?.brevoApiKey) brevoStatus = 'TRUST_SHARED_KEY';
      }
    } else if (trustId) {
      const [tr] = await db.select().from(trusts).where(eq(trusts.id, trustId)).limit(1);
      if (tr?.brevoApiKey) brevoStatus = 'TRUST_SHARED_KEY';
    }

    return NextResponse.json({
      success: true,
      stats: {
        sentToday,
        failedToday,
        totalToday: sentToday + failedToday,
        brevoStatus,
        dailyBrevoLimit: brevoStatus === 'GLOBAL_PLATFORM_KEY' ? 300 : 'UNLIMITED_PAID_PLAN',
      },
      logs,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
