import pool from '@/lib/db';

export async function ensureCareerTables() {
  try {
    // 1. Add missing columns to CareerOpportunity table if they don't exist
    await pool.query(`
      ALTER TABLE "CareerOpportunity" ADD COLUMN IF NOT EXISTS "location" VARCHAR(255);
      ALTER TABLE "CareerOpportunity" ADD COLUMN IF NOT EXISTS "workMode" VARCHAR(50) DEFAULT 'ON_SITE';
      ALTER TABLE "CareerOpportunity" ADD COLUMN IF NOT EXISTS "salary" VARCHAR(255);
      ALTER TABLE "CareerOpportunity" ADD COLUMN IF NOT EXISTS "duration" VARCHAR(100);
      ALTER TABLE "CareerOpportunity" ADD COLUMN IF NOT EXISTS "experienceLevel" VARCHAR(100);
      ALTER TABLE "CareerOpportunity" ADD COLUMN IF NOT EXISTS "applyLink" VARCHAR(500);
      ALTER TABLE "CareerOpportunity" ADD COLUMN IF NOT EXISTS "deadline" TIMESTAMP WITH TIME ZONE;
    `);

    // 2. Create CareerInterest table for 'INTERESTED' and 'REFERRAL_CONTACT' actions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "CareerInterest" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "careerId" UUID NOT NULL,
        "alumniId" UUID NOT NULL,
        "interestType" VARCHAR(50) NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "unique_career_alumni_interest" UNIQUE ("careerId", "alumniId", "interestType")
      );
    `);

    // 3. Create public opportunity registrations table used by career and mentorship posts
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "OpportunityRegistration" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "postType" VARCHAR(20) NOT NULL,
        "postId" UUID NOT NULL,
        "alumniId" UUID,
        "name" VARCHAR(255) NOT NULL,
        "email" VARCHAR(255) NOT NULL,
        "phoneNo" VARCHAR(30) NOT NULL,
        "linkedInUrl" TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (error) {
    console.error('Error ensuring career tables & columns:', error);
  }
}
