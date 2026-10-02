import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSessionFromCookies } from '@/lib/auth';
import { ensureMonitoringTables } from '@/lib/monitoring';

export const dynamic = 'force-dynamic';

type MonitoringTab = 'subadmin' | 'alumni';

export async function GET(request: Request) {
  try {
    const session = await getSessionFromCookies('ADMIN');
    if (!session || (session.role !== 'SUB_ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await ensureMonitoringTables();

    const { searchParams } = new URL(request.url);
    const requestedSchoolId = searchParams.get('schoolId');
    const schoolId = session.role === 'SUPER_ADMIN' ? (requestedSchoolId || session.schoolId) : session.schoolId;

    if (!schoolId) {
      return NextResponse.json({
        rows: [],
        stats: { total: 0, emails: 0, failedEmails: 0, pending: 0 },
      });
    }

    const tab = (searchParams.get('tab') || 'subadmin') as MonitoringTab;
    const search = `%${(searchParams.get('search') || '').trim()}%`;
    const type = searchParams.get('type') || 'ALL';
    const status = searchParams.get('status') || 'ALL';
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 200);

    const rows = tab === 'alumni'
      ? await getAlumniMonitoring(schoolId, search, type, status, limit)
      : await getSubadminMonitoring(schoolId, search, type, status, limit);

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
        -- 1. Explicit Activity Log
        SELECT
          id,
          'ACTIVITY' as kind,
          category as type,
          action,
          title,
          message,
          COALESCE(status, 'SUCCESS') as status,
          COALESCE("actorName", 'Subadmin') as actor,
          "actorEmail" as email,
          "entityType",
          "entityId",
          link,
          "createdAt"
        FROM "ActivityLog"
        WHERE "schoolId"::text = $1::text AND "actorRole" IN ('SUB_ADMIN', 'ADMIN')

        UNION ALL

        -- 2. Explicit Email Log
        SELECT
          id,
          'EMAIL' as kind,
          "emailType" as type,
          'EMAIL_SENT' as action,
          subject as title,
          ('Email dispatched to ' || "recipientEmail") as message,
          COALESCE(status, 'SENT') as status,
          COALESCE("sourceName", 'Subadmin') as actor,
          "recipientEmail" as email,
          "relatedEntityType" as "entityType",
          "relatedEntityId" as "entityId",
          null as link,
          "createdAt"
        FROM "EmailLog"
        WHERE "schoolId"::text = $1::text AND ("sourceRole" IN ('SUB_ADMIN', 'ADMIN') OR "sourceRole" IS NULL)

        UNION ALL

        -- 3. Live Events Published
        SELECT
          id::text as id,
          'ACTIVITY' as kind,
          'EVENT' as type,
          'EVENT_PUBLISHED' as action,
          title,
          COALESCE(description, 'Campus event published for community') as message,
          'SUCCESS' as status,
          'School Officer' as actor,
          null as email,
          'Event' as "entityType",
          id::text as "entityId",
          '/subadmin/events' as link,
          "createdAt"
        FROM "Event"
        WHERE "schoolId"::text = $1::text

        UNION ALL

        -- 4. Live Projects / Costs Created
        SELECT
          id::text as id,
          'ACTIVITY' as kind,
          'PROJECT' as type,
          'PROJECT_CREATED' as action,
          title,
          ('Target Budget: ₹' || COALESCE("estimatedCost"::text, '0') || ' | Category: ' || type) as message,
          'SUCCESS' as status,
          'School Officer' as actor,
          null as email,
          'Expense' as "entityType",
          id::text as "entityId",
          '/subadmin/accounts' as link,
          "createdAt"
        FROM "Expense"
        WHERE "schoolId"::text = $1::text

        UNION ALL

        -- 5. Live News & Updates Published
        SELECT
          id::text as id,
          'ACTIVITY' as kind,
          'UPDATE' as type,
          'UPDATE_PUBLISHED' as action,
          title,
          COALESCE(description, 'School announcement broadcasted') as message,
          'SUCCESS' as status,
          'School Officer' as actor,
          null as email,
          'NewsUpdate' as "entityType",
          id::text as "entityId",
          '/subadmin/updates' as link,
          "createdAt"
        FROM "NewsUpdate"
        WHERE "schoolId"::text = $1::text

        UNION ALL

        -- 6. Student Enrollments / Admissions
        SELECT
          id::text as id,
          'ACTIVITY' as kind,
          'STUDENT' as type,
          'STUDENT_ENROLLED' as action,
          ('Enrolled: ' || name) as title,
          ('Class: ' || COALESCE("currentClass", 'N/A') || ' | Code: ' || COALESCE("studentCode", 'N/A') || CASE WHEN "isNeedy" THEN ' (Needy Aid)' ELSE '' END) as message,
          'SUCCESS' as status,
          COALESCE("fatherName", 'Admissions') as actor,
          null as email,
          'Student' as "entityType",
          id::text as "entityId",
          '/subadmin/students' as link,
          "createdAt"
        FROM "Student"
        WHERE "schoolId"::text = $1::text

        UNION ALL

        -- 7. Donations Received
        SELECT
          id::text as id,
          'ACTIVITY' as kind,
          'DONATION' as type,
          'DONATION_RECEIVED' as action,
          ('Donation Received: ₹' || amount::text) as title,
          ('Donor: ' || COALESCE("donorName", 'Donor') || ' | Category: ' || type) as message,
          COALESCE(status, 'SUCCESS') as status,
          COALESCE("donorName", 'Donor') as actor,
          "donorEmail" as email,
          'Transaction' as "entityType",
          id::text as "entityId",
          '/subadmin/donations' as link,
          "createdAt"
        FROM "Transaction"
        WHERE "schoolId"::text = $1::text
      )
      SELECT DISTINCT ON (kind, type, "entityId", title) *
      FROM rows
      WHERE ($2 = 'ALL' OR type = $2)
        AND ($3 = 'ALL' OR status = $3)
        AND ($4 = '%%' OR title ILIKE $4 OR COALESCE(message, '') ILIKE $4 OR COALESCE(actor, '') ILIKE $4 OR COALESCE(email, '') ILIKE $4)
      ORDER BY kind, type, "entityId", title, "createdAt" DESC
      LIMIT $5
    `,
    [schoolId, type, status, search, limit]
  );

  return result.rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

async function getAlumniMonitoring(schoolId: string, search: string, type: string, status: string, limit: number) {
  const result = await pool.query(
    `
      WITH rows AS (
        -- 1. Alumni Registration Requests (Pending / Approved / Rejected)
        SELECT
          req.id::text as id,
          'ACTIVITY' as kind,
          'ALUMNI_REGISTRATION' as type,
          'REGISTRATION_SUBMITTED' as action,
          ('Alumni Registration: ' || req.name) as title,
          ('Batch: ' || COALESCE(req."batchYear", 'N/A') || ' | Role: ' || COALESCE(req."currentTitle", 'Alumni Member') || CASE WHEN req.status = 'PENDING' THEN ' (Pending School Verification)' ELSE ' (' || req.status || ')' END) as message,
          req.status,
          req.name as actor,
          req.email,
          'AlumniRegistrationRequest' as "entityType",
          req.id::text as "entityId",
          '/subadmin/alumni' as link,
          req."createdAt"
        FROM "AlumniRegistrationRequest" req
        WHERE req."schoolId"::text = $1::text

        UNION ALL

        -- 2. Verified Active Alumni Profiles
        SELECT
          a.id::text as id,
          'ACTIVITY' as kind,
          'ALUMNI_PROFILE' as type,
          'ALUMNI_JOINED' as action,
          ('Verified Alumni: ' || a.name) as title,
          ('Batch: ' || COALESCE(a."batchYear", 'N/A') || ' | Role: ' || COALESCE(a."currentTitle", 'Alumni Member')) as message,
          'APPROVED' as status,
          a.name as actor,
          a.email,
          'Alumni' as "entityType",
          a.id::text as "entityId",
          '/subadmin/alumni' as link,
          a."createdAt"
        FROM "Alumni" a
        WHERE a."schoolId"::text = $1::text

        UNION ALL

        -- 3. Blogs Submitted
        SELECT
          b.id::text as id,
          'ACTIVITY' as kind,
          'BLOG' as type,
          'BLOG_SUBMITTED' as action,
          b.title,
          'Blog submitted by alumni for moderation' as message,
          COALESCE(b.status, 'PENDING') as status,
          COALESCE(a.name, 'Alumni Author') as actor,
          a.email,
          'Blog' as "entityType",
          b.id::text as "entityId",
          '/subadmin/alumni' as link,
          b."createdAt"
        FROM "Blog" b
        LEFT JOIN "Alumni" a ON a.id = b."alumniId"
        WHERE (COALESCE(b."schoolId"::text, a."schoolId"::text) = $1::text)

        UNION ALL

        -- 4. Achievements Submitted
        SELECT
          ach.id::text as id,
          'ACTIVITY' as kind,
          'ACHIEVEMENT' as type,
          'ACHIEVEMENT_SUBMITTED' as action,
          ach.title,
          'Alumni achievement story submitted for moderation' as message,
          COALESCE(ach.status, 'PENDING') as status,
          COALESCE(a.name, 'Alumni') as actor,
          a.email,
          'Achievement' as "entityType",
          ach.id::text as "entityId",
          '/subadmin/alumni' as link,
          ach."createdAt"
        FROM "Achievement" ach
        LEFT JOIN "Alumni" a ON a.id = ach."alumniId"
        WHERE (COALESCE(ach."schoolId"::text, a."schoolId"::text) = $1::text)

        UNION ALL

        -- 5. Career Opportunities Submitted
        SELECT
          c.id::text as id,
          'ACTIVITY' as kind,
          'CAREER' as type,
          'CAREER_SUBMITTED' as action,
          (c.role || ' at ' || c."companyName") as title,
          'Career / Job opportunity posted by alumni' as message,
          COALESCE(c.status, 'PENDING') as status,
          COALESCE(a.name, 'Alumni') as actor,
          a.email,
          'CareerOpportunity' as "entityType",
          c.id::text as "entityId",
          '/subadmin/alumni' as link,
          c."createdAt"
        FROM "CareerOpportunity" c
        LEFT JOIN "Alumni" a ON a.id = c."alumniId"
        WHERE (COALESCE(c."schoolId"::text, a."schoolId"::text) = $1::text)

        UNION ALL

        -- 6. Mentorship Offers Submitted
        SELECT
          m.id::text as id,
          'ACTIVITY' as kind,
          'MENTORSHIP' as type,
          'MENTORSHIP_SUBMITTED' as action,
          m.title,
          'Mentorship guidance offered by alumni' as message,
          COALESCE(m.status, 'PENDING') as status,
          COALESCE(a.name, 'Alumni') as actor,
          a.email,
          'MentorshipOffer' as "entityType",
          m.id::text as "entityId",
          '/subadmin/alumni' as link,
          m."createdAt"
        FROM "MentorshipOffer" m
        LEFT JOIN "Alumni" a ON a.id = m."alumniId"
        WHERE (COALESCE(m."schoolId"::text, a."schoolId"::text) = $1::text)

        UNION ALL

        -- 7. Alumni Contributions
        SELECT
          ac.id::text as id,
          'ACTIVITY' as kind,
          'CONTRIBUTION' as type,
          'CONTRIBUTION_SUBMITTED' as action,
          ac.title,
          ('Alumni contribution: ' || ac."contributionType" || CASE WHEN ac.amount IS NOT NULL THEN ' (₹' || ac.amount::text || ')' ELSE '' END) as message,
          COALESCE(ac.status, 'APPROVED') as status,
          COALESCE(a.name, 'Alumni Contributor') as actor,
          a.email,
          'AlumniContribution' as "entityType",
          ac.id::text as "entityId",
          '/subadmin/alumni' as link,
          ac."createdAt"
        FROM "AlumniContribution" ac
        LEFT JOIN "Alumni" a ON a.id = ac."alumniId"
        WHERE (COALESCE(ac."schoolId"::text, a."schoolId"::text) = $1::text)

        UNION ALL

        -- 8. Opportunity Registrations (Alumni applications)
        SELECT
          op.id::text as id,
          'ACTIVITY' as kind,
          'OPPORTUNITY_APPLICATION' as type,
          'APPLICATION_SUBMITTED' as action,
          ('Opportunity Application: ' || op.name) as title,
          ('Applied for ' || op."postType" || ' | Phone: ' || COALESCE(op."phoneNo", 'N/A')) as message,
          'SUCCESS' as status,
          op.name as actor,
          op.email,
          'OpportunityRegistration' as "entityType",
          op.id::text as "entityId",
          '/subadmin/alumni' as link,
          op."createdAt"
        FROM "OpportunityRegistration" op
        LEFT JOIN "Alumni" a ON a.id = op."alumniId"
        WHERE (a."schoolId"::text = $1::text)

        UNION ALL

        -- 9. Explicit Alumni Activity Logs
        SELECT
          alog.id,
          'ACTIVITY' as kind,
          alog.category as type,
          alog.action,
          alog.title,
          alog.message,
          COALESCE(alog.status, 'SUCCESS') as status,
          COALESCE(alog."actorName", a.name, 'Alumni') as actor,
          COALESCE(alog."actorEmail", a.email) as email,
          alog."entityType",
          alog."entityId",
          alog.link,
          alog."createdAt"
        FROM "ActivityLog" alog
        LEFT JOIN "Alumni" a ON a.id::text = alog."actorId"
        WHERE (alog."schoolId"::text = $1::text OR a."schoolId"::text = $1::text) AND alog."actorRole" = 'ALUMNI'

        UNION ALL

        -- 10. Explicit Alumni Email Logs
        SELECT
          elog.id,
          'EMAIL' as kind,
          elog."emailType" as type,
          'EMAIL_SENT' as action,
          elog.subject as title,
          ('Email dispatched to ' || elog."recipientEmail") as message,
          COALESCE(elog.status, 'SENT') as status,
          COALESCE(a.name, elog."sourceName", 'System') as actor,
          elog."recipientEmail" as email,
          elog."relatedEntityType" as "entityType",
          elog."relatedEntityId" as "entityId",
          null as link,
          elog."createdAt"
        FROM "EmailLog" elog
        LEFT JOIN "Alumni" a ON a.id::text = elog."alumniId"
        WHERE (elog."schoolId"::text = $1::text OR a."schoolId"::text = $1::text) AND (elog."recipientRole" = 'ALUMNI' OR elog."alumniId" IS NOT NULL)
      )
      SELECT DISTINCT ON (kind, type, "entityId", title) *
      FROM rows
      WHERE ($2 = 'ALL' OR type = $2)
        AND ($3 = 'ALL' OR status = $3)
        AND ($4 = '%%' OR title ILIKE $4 OR COALESCE(message, '') ILIKE $4 OR COALESCE(actor, '') ILIKE $4 OR COALESCE(email, '') ILIKE $4)
      ORDER BY kind, type, "entityId", title, "createdAt" DESC
      LIMIT $5
    `,
    [schoolId, type, status, search, limit]
  );

  return result.rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
