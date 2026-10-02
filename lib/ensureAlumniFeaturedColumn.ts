import pool from '@/lib/db';

let ensured = false;

export async function ensureAlumniFeaturedColumn() {
  if (ensured) return;

  try {
    await pool.query('ALTER TABLE "Alumni" ADD COLUMN IF NOT EXISTS "isFeatured" boolean DEFAULT false');
    await pool.query('ALTER TABLE "Alumni" ADD COLUMN IF NOT EXISTS "phone" varchar(50)');
    await pool.query('ALTER TABLE "Alumni" ADD COLUMN IF NOT EXISTS "countryCode" varchar(10)');
    await pool.query('ALTER TABLE "Alumni" ADD COLUMN IF NOT EXISTS "mobileNumber" varchar(50)');
    await pool.query('CREATE INDEX IF NOT EXISTS "Alumni_school_featured_idx" ON "Alumni" ("schoolId", "isFeatured")');
    ensured = true;
  } catch (err) {
    console.error('ensureAlumniFeaturedColumn error:', err);
  }
}
