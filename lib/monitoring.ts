import { randomUUID } from 'crypto';
import pool from '@/lib/db';

export type MonitoringRole = 'SUPER_ADMIN' | 'SUB_ADMIN' | 'ALUMNI' | 'SYSTEM' | 'PUBLIC';

export type LogActivityInput = {
  schoolId?: string | null;
  actorRole: MonitoringRole;
  actorId?: string | null;
  actorName?: string | null;
  actorEmail?: string | null;
  category: string;
  action: string;
  title: string;
  message?: string | null;
  status?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  link?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type LogEmailInput = {
  schoolId?: string | null;
  alumniId?: string | null;
  recipientEmail: string;
  recipientRole?: MonitoringRole | null;
  direction?: 'SENT' | 'RECEIVED';
  sourceRole?: MonitoringRole | null;
  sourceId?: string | null;
  sourceName?: string | null;
  emailType: string;
  subject: string;
  status: 'SENT' | 'FAILED' | 'SKIPPED';
  provider?: string | null;
  providerMessageId?: string | null;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  errorMessage?: string | null;
};

export async function ensureMonitoringTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "ActivityLog" (
      id text PRIMARY KEY,
      "schoolId" text,
      "actorRole" varchar(50) NOT NULL,
      "actorId" text,
      "actorName" varchar(255),
      "actorEmail" varchar(255),
      category varchar(80) NOT NULL,
      action varchar(120) NOT NULL,
      title varchar(255) NOT NULL,
      message text,
      status varchar(50),
      "entityType" varchar(80),
      "entityId" text,
      link text,
      metadata jsonb,
      "createdAt" timestamptz NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS "EmailLog" (
      id text PRIMARY KEY,
      "schoolId" text,
      "alumniId" text,
      "recipientEmail" varchar(255) NOT NULL,
      "recipientRole" varchar(50),
      direction varchar(20) NOT NULL DEFAULT 'SENT',
      "sourceRole" varchar(50),
      "sourceId" text,
      "sourceName" varchar(255),
      "emailType" varchar(100) NOT NULL,
      subject varchar(255) NOT NULL,
      status varchar(30) NOT NULL,
      provider varchar(80),
      "providerMessageId" text,
      "relatedEntityType" varchar(80),
      "relatedEntityId" text,
      "errorMessage" text,
      "createdAt" timestamptz NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query('CREATE INDEX IF NOT EXISTS "ActivityLog_school_idx" ON "ActivityLog" ("schoolId", "actorRole", "createdAt" DESC)');
  await pool.query('CREATE INDEX IF NOT EXISTS "EmailLog_school_idx" ON "EmailLog" ("schoolId", "sourceRole", "status", "createdAt" DESC)');
  await pool.query('CREATE INDEX IF NOT EXISTS "EmailLog_recipient_idx" ON "EmailLog" ("recipientEmail", "createdAt" DESC)');
}

export async function logActivity(input: LogActivityInput) {
  try {
    await ensureMonitoringTables();
    await pool.query(
      `
        INSERT INTO "ActivityLog" (
          id, "schoolId", "actorRole", "actorId", "actorName", "actorEmail",
          category, action, title, message, status, "entityType", "entityId", link, metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb)
      `,
      [
        randomUUID(),
        input.schoolId || null,
        input.actorRole,
        input.actorId || null,
        input.actorName || null,
        input.actorEmail || null,
        input.category,
        input.action,
        input.title,
        input.message || null,
        input.status || null,
        input.entityType || null,
        input.entityId || null,
        input.link || null,
        input.metadata ? JSON.stringify(input.metadata) : null,
      ]
    );
  } catch (error) {
    console.error('Activity log error:', error);
  }
}

export async function logEmail(input: LogEmailInput) {
  try {
    await ensureMonitoringTables();
    await pool.query(
      `
        INSERT INTO "EmailLog" (
          id, "schoolId", "alumniId", "recipientEmail", "recipientRole", direction,
          "sourceRole", "sourceId", "sourceName", "emailType", subject, status, provider,
          "providerMessageId", "relatedEntityType", "relatedEntityId", "errorMessage"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      `,
      [
        randomUUID(),
        input.schoolId || null,
        input.alumniId || null,
        input.recipientEmail.trim().toLowerCase(),
        input.recipientRole || null,
        input.direction || 'SENT',
        input.sourceRole || null,
        input.sourceId || null,
        input.sourceName || null,
        input.emailType,
        input.subject,
        input.status,
        input.provider || 'RESEND',
        input.providerMessageId || null,
        input.relatedEntityType || null,
        input.relatedEntityId || null,
        input.errorMessage || null,
      ]
    );
  } catch (error) {
    console.error('Email log error:', error);
  }
}
