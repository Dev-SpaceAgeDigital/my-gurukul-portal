CREATE TABLE IF NOT EXISTS "SchoolPageContent" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "schoolId" uuid NOT NULL UNIQUE REFERENCES "School"("id") ON DELETE cascade,
  "tagline" text,
  "aboutTitle" varchar(255),
  "aboutDescription" text,
  "aboutHighlights" text[],
  "academicPrograms" jsonb DEFAULT '[]'::jsonb,
  "facilities" jsonb DEFAULT '[]'::jsonb,
  "activityCategories" jsonb DEFAULT '[]'::jsonb,
  "teachers" jsonb DEFAULT '[]'::jsonb,
  "admissionInfo" jsonb DEFAULT '{}'::jsonb,
  "donationInfo" jsonb DEFAULT '{}'::jsonb,
  "updatedBy" uuid REFERENCES "User"("id") ON DELETE set null,
  "createdAt" timestamp DEFAULT now(),
  "updatedAt" timestamp DEFAULT now()
);
