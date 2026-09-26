import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function main() {
  const { db } = await import('../lib/db');
  const { sql } = await import('drizzle-orm');

  console.log("Creating MissionStat table if not exists...");
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "MissionStat" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "target" integer NOT NULL,
      "prefix" varchar(50),
      "suffix" varchar(50),
      "label" varchar(255) NOT NULL,
      "desc" text NOT NULL,
      "orderNo" integer DEFAULT 0,
      "isActive" boolean DEFAULT true,
      "createdAt" timestamp DEFAULT now(),
      "updatedAt" timestamp DEFAULT now()
    );
  `);
  console.log("MissionStat table created successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
