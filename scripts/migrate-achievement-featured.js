const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_nJkM2R3sTLYZ@ep-divine-violet-a8eijyl3-pooler.eastus2.azure.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    console.log('Adding isFeatured column to Achievement table...');
    await pool.query(`
      ALTER TABLE "Achievement"
      ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN DEFAULT false;
    `);
    console.log('Successfully added isFeatured column to Achievement table!');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await pool.end();
  }
}

migrate();
