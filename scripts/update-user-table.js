const { Client } = require('pg');
const connectionString = 'postgresql://neondb_owner:npg_ZGcWI3SBP7eg@ep-tiny-cherry-a1tbrbem-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function updateUserTable() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Connected to database');

    await client.query(`
      ALTER TABLE "User" 
      ADD COLUMN IF NOT EXISTS "phoneNo" VARCHAR(20),
      ADD COLUMN IF NOT EXISTS "address" TEXT,
      ADD COLUMN IF NOT EXISTS "schoolId" UUID REFERENCES "School"(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS "relation" VARCHAR(100);
    `);
    console.log('Table "User" updated successfully with Subadmin fields');

  } catch (err) {
    console.error('Error updating table:', err);
  } finally {
    await client.end();
  }
}

updateUserTable();
