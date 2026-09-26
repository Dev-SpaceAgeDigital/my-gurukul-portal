import pool from '@/lib/db';

let ensured = false;

export async function ensureSchoolPageColumns() {
  if (ensured) return;

  try {
    // Create table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "SchoolPageContent" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "schoolId" uuid NOT NULL UNIQUE REFERENCES "School"("id") ON DELETE CASCADE,
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
        "updatedBy" uuid REFERENCES "User"("id") ON DELETE SET NULL,
        "createdAt" timestamp DEFAULT NOW(),
        "updatedAt" timestamp DEFAULT NOW()
      );
    `);

    // Ensure all columns exist for older table instances
    await pool.query('ALTER TABLE "SchoolPageContent" ADD COLUMN IF NOT EXISTS "tagline" text');
    await pool.query('ALTER TABLE "SchoolPageContent" ADD COLUMN IF NOT EXISTS "aboutTitle" varchar(255)');
    await pool.query('ALTER TABLE "SchoolPageContent" ADD COLUMN IF NOT EXISTS "aboutDescription" text');
    await pool.query('ALTER TABLE "SchoolPageContent" ADD COLUMN IF NOT EXISTS "aboutHighlights" text[]');
    await pool.query('ALTER TABLE "SchoolPageContent" ADD COLUMN IF NOT EXISTS "academicPrograms" jsonb DEFAULT \'[]\'::jsonb');
    await pool.query('ALTER TABLE "SchoolPageContent" ADD COLUMN IF NOT EXISTS "facilities" jsonb DEFAULT \'[]\'::jsonb');
    await pool.query('ALTER TABLE "SchoolPageContent" ADD COLUMN IF NOT EXISTS "activityCategories" jsonb DEFAULT \'[]\'::jsonb');
    await pool.query('ALTER TABLE "SchoolPageContent" ADD COLUMN IF NOT EXISTS "teachers" jsonb DEFAULT \'[]\'::jsonb');
    await pool.query('ALTER TABLE "SchoolPageContent" ADD COLUMN IF NOT EXISTS "admissionInfo" jsonb DEFAULT \'{}\'::jsonb');
    await pool.query('ALTER TABLE "SchoolPageContent" ADD COLUMN IF NOT EXISTS "donationInfo" jsonb DEFAULT \'{}\'::jsonb');
    await pool.query('ALTER TABLE "SchoolPageContent" ADD COLUMN IF NOT EXISTS "updatedBy" uuid');
    await pool.query('ALTER TABLE "SchoolPageContent" ADD COLUMN IF NOT EXISTS "createdAt" timestamp DEFAULT NOW()');
    await pool.query('ALTER TABLE "SchoolPageContent" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp DEFAULT NOW()');

    ensured = true;
  } catch (err) {
    console.error('Error ensuring SchoolPageContent columns:', err);
  }
}
