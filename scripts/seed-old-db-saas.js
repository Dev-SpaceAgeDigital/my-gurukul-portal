const { Client } = require('pg');

const connectionString = "postgresql://neondb_owner:npg_ZGcWI3SBP7eg@ep-tiny-cherry-a1tbrbem-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function main() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log("Connected to OLD Neon database via pg...");

    // 1. Create MasterAdmin table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS "MasterAdmin" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" VARCHAR(255) NOT NULL,
        "email" VARCHAR(255) UNIQUE NOT NULL,
        "password" TEXT NOT NULL,
        "role" VARCHAR(50) DEFAULT 'SUPER_MASTER_ADMIN',
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("Created/Verified MasterAdmin table.");

    // 2. Create Trust table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Trust" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "trustName" VARCHAR(255) NOT NULL,
        "registrationNo" VARCHAR(255),
        "establishmentYear" INTEGER,
        "presidentName" VARCHAR(255),
        "presidentNo" VARCHAR(20),
        "trusteesName" TEXT[],
        "trusteesNo" TEXT[],
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );
    `);

    // 3. Add SaaS columns to Trust table if not exist
    await client.query(`
      ALTER TABLE "Trust" 
      ADD COLUMN IF NOT EXISTS "slug" VARCHAR(100),
      ADD COLUMN IF NOT EXISTS "customDomain" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "logoUrl" TEXT,
      ADD COLUMN IF NOT EXISTS "primaryColor" VARCHAR(50) DEFAULT '#0f172a',
      ADD COLUMN IF NOT EXISTS "razorpayKeyId" TEXT,
      ADD COLUMN IF NOT EXISTS "razorpayKeySecret" TEXT,
      ADD COLUMN IF NOT EXISTS "bankAccountDetails" TEXT,
      ADD COLUMN IF NOT EXISTS "taxExemptionNo" VARCHAR(100),
      ADD COLUMN IF NOT EXISTS "status" VARCHAR(50) DEFAULT 'ACTIVE',
      ADD COLUMN IF NOT EXISTS "plan" VARCHAR(50) DEFAULT 'PRO',
      ADD COLUMN IF NOT EXISTS "maxSchools" INTEGER DEFAULT 10,
      ADD COLUMN IF NOT EXISTS "maxAlumni" INTEGER DEFAULT 10000;
    `);
    console.log("Added SaaS columns to Trust table.");

    // 4. Insert or update MasterAdmin account (admin@madnieducation.org / AQwIKwVowlls1Lrs)
    await client.query(`
      INSERT INTO "MasterAdmin" ("name", "email", "password", "role")
      VALUES ('Platform Master Admin', 'admin@madnieducation.org', 'AQwIKwVowlls1Lrs', 'SUPER_MASTER_ADMIN')
      ON CONFLICT ("email") 
      DO UPDATE SET "password" = 'AQwIKwVowlls1Lrs', "updatedAt" = NOW();
    `);
    console.log("Seeded MasterAdmin account (admin@madnieducation.org).");

    // 5. Ensure default Madni Education Trust exists
    let res = await client.query(`SELECT * FROM "Trust" LIMIT 1;`);
    let trustId;
    if (res.rows.length === 0) {
      let newTrust = await client.query(`
        INSERT INTO "Trust" ("trustName", "slug", "registrationNo", "establishmentYear", "status", "plan")
        VALUES ('Madni Education Trust', 'madni', 'REG-MADNI-001', 1998, 'ACTIVE', 'ENTERPRISE')
        RETURNING "id";
      `);
      trustId = newTrust.rows[0].id;
      console.log('Created default Madni Education Trust with ID:', trustId);
    } else {
      trustId = res.rows[0].id;
      await client.query(`
        UPDATE "Trust" 
        SET "slug" = COALESCE("slug", 'madni'), "status" = COALESCE("status", 'ACTIVE'), "plan" = COALESCE("plan", 'ENTERPRISE')
        WHERE "id" = $1;
      `, [trustId]);
      console.log('Using existing Trust with ID:', trustId);
    }

    // 6. Update existing Schools to point to default trustId if null
    try {
      await client.query(`
        UPDATE "School" SET "trustId" = $1 WHERE "trustId" IS NULL;
      `, [trustId]);
      console.log("Associated all schools with default Trust ID.");
    } catch (e) {
      console.log("School table update skipped or already assigned.");
    }

    console.log("🎉 OLD Database SaaS Seeding Completed Successfully!");
  } catch (err) {
    console.error("Error seeding OLD SaaS database:", err);
  } finally {
    await client.end();
  }
}

main();
