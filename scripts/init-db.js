const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_ZGcWI3SBP7eg@ep-tiny-cherry-a1tbrbem-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
});

async function initTables() {
  try {
    console.log('Initializing Alumni Interaction tables...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "CareerOpportunity" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "alumniId" UUID REFERENCES "Alumni"(id) ON DELETE CASCADE,
        "schoolId" UUID REFERENCES "School"(id) ON DELETE CASCADE,
        "type" VARCHAR(20) CHECK ("type" IN ('JOB', 'INTERNSHIP')),
        "companyName" VARCHAR(255) NOT NULL,
        "companyLink" TEXT,
        "role" VARCHAR(255) NOT NULL,
        "relation" TEXT,
        "description" TEXT,
        "status" VARCHAR(20) DEFAULT 'PENDING' CHECK ("status" IN ('PENDING', 'APPROVED', 'REJECTED')),
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "MentorshipOffer" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "alumniId" UUID REFERENCES "Alumni"(id) ON DELETE CASCADE,
        "schoolId" UUID REFERENCES "School"(id) ON DELETE CASCADE,
        "title" VARCHAR(255) NOT NULL,
        "description" TEXT NOT NULL,
        "targetStudent" TEXT,
        "availability" TEXT,
        "status" VARCHAR(20) DEFAULT 'PENDING' CHECK ("status" IN ('PENDING', 'APPROVED', 'REJECTED')),
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS "AlumniOfTheYear" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "schoolId" UUID REFERENCES "School"(id) ON DELETE CASCADE,
        "alumniId" UUID REFERENCES "Alumni"(id) ON DELETE CASCADE NOT NULL,
        "year" INTEGER NOT NULL,
        "headline" VARCHAR(255) NOT NULL,
        "reason" TEXT NOT NULL,
        "highlights" TEXT[],
        "totalFinancialAid" DECIMAL(12,2),
        "studentsHelpedCount" INTEGER,
        "jobsPostedCount" INTEGER,
        "mentorshipsCount" INTEGER,
        "mediaUrl" TEXT,
        "awardedByUserId" TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "AlumniContribution" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "alumniId" UUID REFERENCES "Alumni"(id) ON DELETE CASCADE NOT NULL,
        "schoolId" UUID REFERENCES "School"(id) ON DELETE CASCADE,
        "contributionType" VARCHAR(50) NOT NULL,
        "title" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "amount" DECIMAL(12,2),
        "quantity" VARCHAR(100),
        "date" DATE DEFAULT NOW(),
        "proofUrl" TEXT,
        "status" VARCHAR(20) DEFAULT 'APPROVED',
        "isPublic" BOOLEAN DEFAULT TRUE,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('Tables created successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error creating tables:', err);
    process.exit(1);
  }
}

initTables();
