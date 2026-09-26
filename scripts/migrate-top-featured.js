const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_nJkM2R3sTLYZ@ep-divine-violet-a8eijyl3-pooler.eastus2.azure.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    console.log('Adding isTopFeatured column to Blog table if not exists...');
    await pool.query('ALTER TABLE "Blog" ADD COLUMN IF NOT EXISTS "isTopFeatured" boolean DEFAULT false;');
    console.log('Successfully updated Blog table schema with isTopFeatured!');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await pool.end();
  }
}

migrate();
