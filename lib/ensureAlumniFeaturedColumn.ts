import pool from '@/lib/db';

let ensured = false;

export async function ensureAlumniFeaturedColumn() {
  if (ensured) return;

  await pool.query('ALTER TABLE "Alumni" ADD COLUMN IF NOT EXISTS "isFeatured" boolean DEFAULT false');
  await pool.query('CREATE INDEX IF NOT EXISTS "Alumni_school_featured_idx" ON "Alumni" ("schoolId", "isFeatured")');
  ensured = true;
}
