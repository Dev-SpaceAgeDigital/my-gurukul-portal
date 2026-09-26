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
);

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
);

CREATE INDEX IF NOT EXISTS "ActivityLog_school_idx" ON "ActivityLog" ("schoolId", "actorRole", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "EmailLog_school_idx" ON "EmailLog" ("schoolId", "sourceRole", "status", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "EmailLog_recipient_idx" ON "EmailLog" ("recipientEmail", "createdAt" DESC);
