const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_nJkM2R3sTLYZ@ep-divine-violet-a8eijyl3-pooler.eastus2.azure.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    console.log('Creating NewsUpdate table if not exists...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "NewsUpdate" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "title" VARCHAR(255) NOT NULL,
        "description" TEXT NOT NULL,
        "category" VARCHAR(100) NOT NULL,
        "publishDate" DATE,
        "imageUrl" TEXT,
        "imageFileId" VARCHAR(255),
        "schoolId" UUID REFERENCES "School"("id") ON DELETE SET NULL,
        "isActive" BOOLEAN DEFAULT true,
        "createdByRole" VARCHAR(50),
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Successfully created NewsUpdate table!');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await pool.end();
  }
}

migrate();
