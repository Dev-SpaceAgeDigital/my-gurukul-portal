import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';
import { ensureMonitoringTables } from '@/lib/monitoring';

type MonitoringTab = 'subadmin' | 'alumni';

export async function GET(request: Request) {
  try {
    const session = await getSessionFromCookies('SUB_ADMIN');
    if (!session || session.role !== 'SUB_ADMIN' || !session.schoolId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await ensureMonitoringTables();

    const { searchParams } = new URL(request.url);
    const tab = (searchParams.get('tab') || 'subadmin') as MonitoringTab;
    const search = `%${(searchParams.get('search') || '').trim()}%`;
    const type = searchParams.get('type') || 'ALL';
    const status = searchParams.get('status') || 'ALL';
    const limit = Math.min(parseInt(searchParams.get('limit') || '80', 10), 150);

    const rows = tab === 'alumni'
      ? await getAlumniMonitoring(session.schoolId, search, type, status, limit)
      : await getSubadminMonitoring(session.schoolId, search, type, status, limit);

    const stats = {
      total: rows.length,
      emails: rows.filter((row: any) => row.kind === 'EMAIL').length,
      failedEmails: rows.filter((row: any) => row.kind === 'EMAIL' && row.status === 'FAILED').length,
      pending: rows.filter((row: any) => String(row.status || '').toUpperCase() === 'PENDING').length,
    };

    return NextResponse.json({ rows, stats });
  } catch (error) {
    console.error('Subadmin monitoring fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch monitoring data' }, { status: 500 });
  }
}

async function getSubadminMonitoring(schoolId: string, search: string, type: string, status: string, limit: number) {
  const result = await pool.query(
    `
      WITH rows AS (
        SELECT
          id,
          'ACTIVITY' as kind,
          category as type,
          action,
          title,
          message,
          status,
          COALESCE("actorName", 'Subadmin') as actor,
          "actorEmail" as email,
          "entityType",
          "entityId",
          link,
          "createdAt"
        FROM "ActivityLog"
        WHERE "schoolId" = $1 AND "actorRole" = 'SUB_ADMIN'

        UNION ALL

        SELECT
          id,
          'EMAIL' as kind,
          "emailType" as type,
          'EMAIL_SENT' as action,
          subject as title,
          ('Email to ' || "recipientEmail") as message,
          status,
          COALESCE("sourceName", 'Subadmin') as actor,
          "recipientEmail" as email,
          "relatedEntityType" as "entityType",
          "relatedEntityId" as "entityId",
          null as link,
          "createdAt"
        FROM "EmailLog"
        WHERE "schoolId" = $1 AND "sourceRole" = 'SUB_ADMIN'
      )
      SELECT *
      FROM rows
      WHERE ($2 = 'ALL' OR type = $2)
        AND ($3 = 'ALL' OR status = $3)
        AND ($4 = '%%' OR title ILIKE $4 OR COALESCE(message, '') ILIKE $4 OR COALESCE(actor, '') ILIKE $4 OR COALESCE(email, '') ILIKE $4)
      ORDER BY "createdAt" DESC
      LIMIT $5
    `,
    [schoolId, type, status, search, limit]
  );

  return result.rows;
}

async function getAlumniMonitoring(schoolId: string, search: string, type: string, status: string, limit: number) {
  const result = await pool.query(
    `
      WITH rows AS (
        SELECT
          b.id::text as id,
          'ACTIVITY' as kind,
          'BLOG' as type,
          'BLOG_SUBMITTED' as action,
          b.title,
          'Blog submitted for moderation' as message,
          b.status,
          a.name as actor,
          a.email,
          'Blog' as "entityType",
          b.id::text as "entityId",
          '/subadmin/alumni' as link,
          b."createdAt"
        FROM "Blog" b
        LEFT JOIN "Alumni" a ON a.id = b."alumniId"
        WHERE b."schoolId" = $1

        UNION ALL

        SELECT
          ach.id::text as id,
          'ACTIVITY' as kind,
          'ACHIEVEMENT' as type,
          'ACHIEVEMENT_SUBMITTED' as action,
          ach.title,
          'Achievement submitted for moderation' as message,
          ach.status,
          a.name as actor,
          a.email,
          'Achievement' as "entityType",
          ach.id::text as "entityId",
          '/subadmin/alumni' as link,
          ach."createdAt"
        FROM "Achievement" ach
        LEFT JOIN "Alumni" a ON a.id = ach."alumniId"
        WHERE ach."schoolId" = $1

        UNION ALL

        SELECT
          c.id::text as id,
          'ACTIVITY' as kind,
          'CAREER' as type,
          'CAREER_SUBMITTED' as action,
          (c.role || ' at ' || c."companyName") as title,
          'Career opportunity submitted for review' as message,
          c.status,
          a.name as actor,
          a.email,
          'CareerOpportunity' as "entityType",
          c.id::text as "entityId",
          '/subadmin/alumni' as link,
          c."createdAt"
        FROM "CareerOpportunity" c
        LEFT JOIN "Alumni" a ON a.id = c."alumniId"
        WHERE c."schoolId" = $1

        UNION ALL

        SELECT
          m.id::text as id,
          'ACTIVITY' as kind,
          'MENTORSHIP' as type,
          'MENTORSHIP_SUBMITTED' as action,
          m.title,
          'Mentorship offer submitted for review' as message,
          m.status,
          a.name as actor,
          a.email,
          'MentorshipOffer' as "entityType",
          m.id::text as "entityId",
          '/subadmin/alumni' as link,
          m."createdAt"
        FROM "MentorshipOffer" m
        LEFT JOIN "Alumni" a ON a.id = m."alumniId"
        WHERE m."schoolId" = $1

        UNION ALL

        SELECT
          alog.id,
          'ACTIVITY' as kind,
          alog.category as type,
          alog.action,
          alog.title,
          alog.message,
          alog.status,
          COALESCE(alog."actorName", a.name, 'Alumni') as actor,
          COALESCE(alog."actorEmail", a.email) as email,
          alog."entityType",
          alog."entityId",
          alog.link,
          alog."createdAt"
        FROM "ActivityLog" alog
        LEFT JOIN "Alumni" a ON a.id::text = alog."actorId"
        WHERE alog."schoolId" = $1 AND alog."actorRole" = 'ALUMNI'

        UNION ALL

        SELECT
          elog.id,
          'EMAIL' as kind,
          elog."emailType" as type,
          'EMAIL_SENT' as action,
          elog.subject as title,
          ('Email to ' || elog."recipientEmail") as message,
          elog.status,
          COALESCE(a.name, elog."sourceName", 'System') as actor,
          elog."recipientEmail" as email,
          elog."relatedEntityType" as "entityType",
          elog."relatedEntityId" as "entityId",
          null as link,
          elog."createdAt"
        FROM "EmailLog" elog
        LEFT JOIN "Alumni" a ON a.id::text = elog."alumniId"
        WHERE elog."schoolId" = $1 AND (elog."recipientRole" = 'ALUMNI' OR elog."alumniId" IS NOT NULL)
      )
      SELECT DISTINCT ON (kind, type, action, "entityId") *
      FROM rows
      WHERE ($2 = 'ALL' OR type = $2)
        AND ($3 = 'ALL' OR status = $3)
        AND ($4 = '%%' OR title ILIKE $4 OR COALESCE(message, '') ILIKE $4 OR COALESCE(actor, '') ILIKE $4 OR COALESCE(email, '') ILIKE $4)
      ORDER BY kind, type, action, "entityId", "createdAt" DESC
      LIMIT $5
    `,
    [schoolId, type, status, search, limit]
  );

  return result.rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
