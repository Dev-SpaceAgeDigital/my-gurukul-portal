const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_ZGcWI3SBP7eg@ep-tiny-cherry-a1tbrbem-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Initiating database migration for Sub-Admin subsystem...');

    // 1. Standard Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Standard" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "standardName" VARCHAR(100) NOT NULL,
        division VARCHAR(100),
        fees DECIMAL(10, 2) DEFAULT 0,
        "schoolId" UUID NOT NULL REFERENCES "School"(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('--- "Standard" table initialized.');

    // 2. Student Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Student" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        "studentCode" VARCHAR(100),
        category VARCHAR(100),
        "userIdRef" VARCHAR(100),
        "admissionDate" DATE,
        "grSrNo" VARCHAR(100),
        "admissionType" VARCHAR(100),
        "dateOfBirth" DATE,
        age INTEGER,
        gender VARCHAR(50),
        "contactNo" VARCHAR(50),
        "aadharNo" VARCHAR(50),
        "panNo" VARCHAR(50),
        "apaarId" VARCHAR(100),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        country VARCHAR(100),
        "fatherName" VARCHAR(255),
        "fatherNumber" VARCHAR(50),
        "motherName" VARCHAR(255),
        "motherNumber" VARCHAR(50),
        "accountHolderName" VARCHAR(255),
        "accountNumber" VARCHAR(100),
        "bankName" VARCHAR(255),
        "ifscCode" VARCHAR(50),
        "sponsorshipType" VARCHAR(100),
        "isNeedy" BOOLEAN DEFAULT FALSE,
        "isUnderRTE" BOOLEAN DEFAULT FALSE,
        "currentClass" VARCHAR(100),
        section VARCHAR(50),
        
        -- Relational Links
        "standardId" UUID REFERENCES "Standard"(id) ON DELETE SET NULL,
        "schoolId" UUID NOT NULL REFERENCES "School"(id) ON DELETE CASCADE,
        
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('--- "Student" table initialized.');

    console.log('Migration complete.');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
// End of migration.
