const { Client } = require('pg');

const db1Url = "postgresql://neondb_owner:npg_Ede9Ma3WJDzf@ep-blue-bar-aygmgq0p-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const db2Url = "postgresql://neondb_owner:npg_wv2kuCNrVc5q@ep-lingering-star-ayefwu06.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require";

const superAdminPassword = "AQwIKwVowlls1Lrs";

async function seedSuperAdmin(url, dbName) {
  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    console.log(`Seeding SuperAdmin in ${dbName}...`);

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

    // 2. Create User table if not exists
    try {
      await client.query('CREATE TYPE "Role" AS ENUM(\'SUPER_ADMIN\', \'SUB_ADMIN\', \'ALUMNI\');');
    } catch (e) {}

    await client.query(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" TEXT UNIQUE NOT NULL,
        "password" TEXT NOT NULL,
        "name" TEXT,
        "role" Role DEFAULT 'SUPER_ADMIN' NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "phoneNo" VARCHAR(20),
        "address" TEXT,
        "schoolId" UUID,
        "relation" VARCHAR(100)
      );
    `);

    // 3. Seed MasterAdmin Table
    await client.query(`
      INSERT INTO "MasterAdmin" ("name", "email", "password", "role")
      VALUES ('Platform Master Admin', 'admin@madnieducation.org', $1, 'SUPER_MASTER_ADMIN')
      ON CONFLICT ("email")
      DO UPDATE SET "password" = $1, "updatedAt" = NOW();
    `, [superAdminPassword]);
    console.log(`✅ MasterAdmin seeded in ${dbName}`);

    // 4. Seed User Table (Role: SUPER_ADMIN)
    await client.query(`
      INSERT INTO "User" ("name", "email", "password", "role", "updatedAt")
      VALUES ('Madni Education Trust SuperAdmin', 'admin@madnieducation.org', $1, 'SUPER_ADMIN', NOW())
      ON CONFLICT ("email")
      DO UPDATE SET "password" = $1, "role" = 'SUPER_ADMIN', "updatedAt" = NOW();
    `, [superAdminPassword]);

    console.log(`✅ User (SUPER_ADMIN: admin@madnieducation.org) seeded in ${dbName}`);
  } catch (err) {
    console.error(`Error seeding SuperAdmin in ${dbName}:`, err.message);
  } finally {
    await client.end();
  }
}

async function main() {
  await seedSuperAdmin(db1Url, "DB 1 (Madni Copy)");
  await seedSuperAdmin(db2Url, "DB 2 (EduTrust SaaS)");
}

main();
