import { randomUUID } from 'crypto';
import pool from '@/lib/db';
import { sendPushToUsers } from '@/lib/fcmAdmin';

export type NotificationRole = 'SUPER_ADMIN' | 'SUB_ADMIN' | 'ALUMNI';

type Audience =
  | { type: 'DIRECT'; recipientRole: NotificationRole; recipientId: string }
  | { type: 'ROLE'; recipientRole: NotificationRole }
  | { type: 'SCHOOL_ROLE'; recipientRole: NotificationRole; schoolId: string }
  | { type: 'SCHOOL_ALUMNI'; schoolId: string };

export type CreateNotificationInput = {
  title: string;
  message: string;
  type?: 'INFO' | 'ACTION' | 'DONATION' | 'CONTENT' | 'CAREER' | 'MONITORING';
  priority?: 'LOW' | 'NORMAL' | 'HIGH';
  actorRole?: NotificationRole;
  actorId?: string;
  schoolId?: string | null;
  entityType?: string;
  entityId?: string | null;
  link?: string | null;
  audiences: Audience[];
};

export async function ensureNotificationTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "Notification" (
      id text PRIMARY KEY,
      title varchar(255) NOT NULL,
      message text NOT NULL,
      type varchar(50) NOT NULL DEFAULT 'INFO',
      priority varchar(20) NOT NULL DEFAULT 'NORMAL',
      "actorRole" varchar(50),
      "actorId" text,
      "recipientRole" varchar(50) NOT NULL,
      "recipientId" text NOT NULL,
      "schoolId" text,
      "entityType" varchar(80),
      "entityId" text,
      link text,
      "isRead" boolean NOT NULL DEFAULT false,
      "readAt" timestamptz,
      "createdAt" timestamptz NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query('CREATE INDEX IF NOT EXISTS "Notification_recipient_idx" ON "Notification" ("recipientRole", "recipientId", "isRead", "createdAt" DESC)');
  await pool.query('CREATE INDEX IF NOT EXISTS "Notification_school_idx" ON "Notification" ("schoolId", "createdAt" DESC)');
}

async function resolveAudience(audience: Audience) {
  if (audience.type === 'DIRECT') {
    return [{ recipientRole: audience.recipientRole, recipientId: audience.recipientId }];
  }

  if (audience.type === 'ROLE') {
    const result = await pool.query(
      'SELECT id, role FROM "User" WHERE role = $1',
      [audience.recipientRole]
    );
    return result.rows.map((row) => ({ recipientRole: row.role as NotificationRole, recipientId: row.id as string }));
  }

  if (audience.type === 'SCHOOL_ROLE') {
    const result = await pool.query(
      'SELECT id, role FROM "User" WHERE role = $1 AND "schoolId" = $2',
      [audience.recipientRole, audience.schoolId]
    );
    return result.rows.map((row) => ({ recipientRole: row.role as NotificationRole, recipientId: row.id as string }));
  }

  const result = await pool.query(
    'SELECT id FROM "Alumni" WHERE "schoolId" = $1',
    [audience.schoolId]
  );
  return result.rows.map((row) => ({ recipientRole: 'ALUMNI' as NotificationRole, recipientId: row.id as string }));
}

export async function createNotification(input: CreateNotificationInput) {
  try {
    await ensureNotificationTable();

    const recipientMap = new Map<string, { recipientRole: NotificationRole; recipientId: string }>();
    for (const audience of input.audiences) {
      const recipients = await resolveAudience(audience);
      recipients.forEach((recipient) => {
        if (recipient.recipientId !== input.actorId) {
          recipientMap.set(`${recipient.recipientRole}:${recipient.recipientId}`, recipient);
        }
      });
    }

    const recipients = Array.from(recipientMap.values());
    if (recipients.length === 0) return;

    const values: unknown[] = [];
    const placeholders = recipients.map((recipient, index) => {
      const base = index * 14;
      values.push(
        randomUUID(),
        input.title,
        input.message,
        input.type || 'INFO',
        input.priority || 'NORMAL',
        input.actorRole || null,
        input.actorId || null,
        recipient.recipientRole,
        recipient.recipientId,
        input.schoolId || null,
        input.entityType || null,
        input.entityId || null,
        input.link || null,
        false
      );
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10}, $${base + 11}, $${base + 12}, $${base + 13}, $${base + 14})`;
    });

    await pool.query(`
      INSERT INTO "Notification" (
        id, title, message, type, priority, "actorRole", "actorId",
        "recipientRole", "recipientId", "schoolId", "entityType", "entityId", link, "isRead"
      )
      VALUES ${placeholders.join(', ')}
    `, values);

    // Resolve icon url (School.logoUrl -> Trust.logoUrl -> /my-gurukul.png)
    let pushIcon = '/my-gurukul.png';
    if (input.schoolId) {
      try {
        const logoRes = await pool.query(
          `SELECT s."logoUrl" as "schoolLogo", t."logoUrl" as "trustLogo"
           FROM "School" s
           LEFT JOIN "Trust" t ON s."trustId" = t.id
           WHERE s.id = $1`,
          [input.schoolId]
        );
        if (logoRes.rows.length > 0) {
          pushIcon = logoRes.rows[0].schoolLogo || logoRes.rows[0].trustLogo || '/my-gurukul.png';
        }
      } catch (lErr) {
        console.error('Failed to resolve logo for notification push:', lErr);
      }
    }

    // Trigger FCM Web Push notification to all target device tokens with dynamic school logo
    const recipientUserIds = recipients.map((r) => r.recipientId);
    await sendPushToUsers(recipientUserIds, input.title, input.message, input.link, pushIcon);
  } catch (error) {
    console.error('Notification create error:', error);
  }
}
