require('dotenv').config({ path: './.env' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  try {
    await pool.query('ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS tagline TEXT;');
    await pool.query('ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS points JSONB DEFAULT \'[]\'::jsonb;');
    await pool.query('ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "featuredImage" TEXT;');
    console.log('Successfully added tagline, points, featuredImage columns to Event table');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await pool.end();
  }
}

migrate();
