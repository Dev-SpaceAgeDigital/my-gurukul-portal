const { Client } = require('pg');
const connectionString = 'postgresql://neondb_owner:npg_ZGcWI3SBP7eg@ep-tiny-cherry-a1tbrbem-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function createSchoolTable() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected to database');

    await client.query(`
      CREATE TABLE IF NOT EXISTS "School" (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        "schoolName" VARCHAR(255) NOT NULL,
        "currentStudentsNo" INTEGER DEFAULT 0,
        "address" TEXT,
        "phoneNo" VARCHAR(20),
        "email" VARCHAR(255),
        "medium" VARCHAR(100),
        "schoolDiseNo" VARCHAR(100) UNIQUE,
        "isHaveRTE" BOOLEAN DEFAULT FALSE,
        "sscIndexNo" VARCHAR(100),
        "hscIndexNo" VARCHAR(100),
        "establishYear" INTEGER,
        "totalStandards" INTEGER,
        "trustId" UUID REFERENCES "Trust"(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Table "School" created successfully');

  } catch (err) {
    console.error('Error creating table:', err);
  } finally {
    await client.end();
  }
}

createSchoolTable();
