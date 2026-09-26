CREATE TABLE IF NOT EXISTS "AlumniInvite" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text UNIQUE NOT NULL,
  email varchar(255),
  "schoolId" uuid NOT NULL,
  "schoolName" varchar(255),
  "batchYear" varchar(100),
  message text,
  status varchar(30) NOT NULL DEFAULT 'SENT',
  "createdBy" uuid,
  "expiresAt" timestamp with time zone NOT NULL,
  "usedAt" timestamp with time zone,
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "AlumniRegistrationRequest" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "inviteId" uuid,
  "schoolId" uuid NOT NULL,
  "schoolName" varchar(255),
  name varchar(255) NOT NULL,
  email varchar(255) NOT NULL,
  phone varchar(50),
  "batchYear" varchar(100),
  "currentTitle" varchar(255),
  "currentBio" text,
  "linkedIn" text,
  status varchar(30) NOT NULL DEFAULT 'PENDING',
  "reviewedBy" uuid,
  "reviewedAt" timestamp with time zone,
  "alumniId" uuid,
  "rejectionReason" text,
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "AlumniInvite_token_idx" ON "AlumniInvite" (token);
CREATE INDEX IF NOT EXISTS "AlumniInvite_school_idx" ON "AlumniInvite" ("schoolId", status, "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "AlumniRegistrationRequest_school_idx" ON "AlumniRegistrationRequest" ("schoolId", status, "createdAt" DESC);
CREATE UNIQUE INDEX IF NOT EXISTS "AlumniRegistrationRequest_pending_email_idx" ON "AlumniRegistrationRequest" (LOWER(email)) WHERE status = 'PENDING';
