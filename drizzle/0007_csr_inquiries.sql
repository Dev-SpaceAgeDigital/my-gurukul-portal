CREATE TABLE IF NOT EXISTS "CsrInquiry" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "companyName" varchar(255) NOT NULL,
  "contactPerson" varchar(255) NOT NULL,
  email varchar(255) NOT NULL,
  phone varchar(50),
  category varchar(120) NOT NULL,
  "budgetRange" varchar(120),
  message text,
  source varchar(30) NOT NULL DEFAULT 'PUBLIC',
  status varchar(30) NOT NULL DEFAULT 'PENDING',
  "schoolId" uuid,
  "schoolName" varchar(255),
  "referredByAlumniId" uuid,
  "referredByAlumniName" varchar(255),
  "referredByAlumniEmail" varchar(255),
  notes text,
  "createdAt" timestamp with time zone DEFAULT now(),
  "updatedAt" timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "CsrInquiry_status_idx" ON "CsrInquiry" (status, "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "CsrInquiry_school_idx" ON "CsrInquiry" ("schoolId", status, "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "CsrInquiry_alumni_idx" ON "CsrInquiry" ("referredByAlumniId", "createdAt" DESC);
