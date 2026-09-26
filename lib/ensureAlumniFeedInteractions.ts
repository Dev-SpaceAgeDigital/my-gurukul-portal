import pool from '@/lib/db';

let ensured = false;

export async function ensureAlumniFeedInteractions() {
  if (ensured) return;

  try {
    // Create AlumniFeedLike table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "AlumniFeedLike" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "alumniId" UUID REFERENCES "Alumni"(id) ON DELETE CASCADE,
        "feedItemId" UUID NOT NULL,
        "itemType" VARCHAR(50) NOT NULL,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        CONSTRAINT "unique_alumni_feed_like" UNIQUE ("alumniId", "feedItemId")
      );
    `);

    // Create AlumniFeedView table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "AlumniFeedView" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "alumniId" UUID REFERENCES "Alumni"(id) ON DELETE CASCADE,
        "feedItemId" UUID NOT NULL,
        "itemType" VARCHAR(50) NOT NULL,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        CONSTRAINT "unique_alumni_feed_view" UNIQUE ("alumniId", "feedItemId")
      );
    `);

    ensured = true;
  } catch (err) {
    console.error('Error ensuring AlumniFeedInteractions tables:', err);
  }
}
