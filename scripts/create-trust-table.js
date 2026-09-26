const { Client } = require('pg');
const connectionString = 'postgresql://neondb_owner:npg_ZGcWI3SBP7eg@ep-tiny-cherry-a1tbrbem-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function createTrustTable() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected to database');

    await client.query(`
      CREATE TABLE IF NOT EXISTS "Trust" (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        "trustName" VARCHAR(255) NOT NULL,
        "registrationNo" VARCHAR(255) UNIQUE NOT NULL,
        "establishmentYear" INTEGER,
        "presidentName" VARCHAR(255),
        "presidentNo" VARCHAR(20),
        "trusteesName" TEXT[],
        "trusteesNo" TEXT[],
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Table "Trust" created successfully');

  } catch (err) {
    console.error('Error creating table:', err);
  } finally {
    await client.end();
  }
}

createTrustTable();
