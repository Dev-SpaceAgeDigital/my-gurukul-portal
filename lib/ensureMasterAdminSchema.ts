import pool from '@/lib/db';

let isSchemaEnsured = false;

export async function ensureMasterAdminSchema() {
  if (isSchemaEnsured) return;

  try {
    await pool.query(`
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";

      CREATE TABLE IF NOT EXISTS "MasterAdmin" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(255) NOT NULL,
        "email" varchar(255) UNIQUE NOT NULL,
        "password" text NOT NULL,
        "role" varchar(50) DEFAULT 'SUPER_MASTER_ADMIN',
        "twoFactorSecret" text,
        "twoFactorEnabled" boolean DEFAULT false,
        "backupCodes" jsonb,
        "createdAt" timestamp DEFAULT now(),
        "updatedAt" timestamp DEFAULT now()
      );

      ALTER TABLE "MasterAdmin" ADD COLUMN IF NOT EXISTS "twoFactorSecret" text;
      ALTER TABLE "MasterAdmin" ADD COLUMN IF NOT EXISTS "twoFactorEnabled" boolean DEFAULT false;
      ALTER TABLE "MasterAdmin" ADD COLUMN IF NOT EXISTS "backupCodes" jsonb;

      CREATE TABLE IF NOT EXISTS "Trust" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "trustName" varchar(255) NOT NULL,
        "slug" varchar(100),
        "registrationNo" varchar(255),
        "establishmentYear" integer,
        "presidentName" varchar(255),
        "presidentNo" varchar(20),
        "trusteesName" text[],
        "trusteesNo" text[],
        "customDomain" varchar(255),
        "domainPurchaseUrl" text,
        "logoUrl" text,
        "primaryColor" varchar(50) DEFAULT '#0f172a',
        "razorpayKeyId" text,
        "razorpayKeySecret" text,
        "brevoApiKey" text,
        "brevoSenderEmail" varchar(255),
        "brevoSenderName" varchar(255),
        "bankAccountDetails" text,
        "taxExemptionNo" varchar(100),
        "sponsorshipMode" varchar(50) DEFAULT 'ZAKAT_LILLAH',
        "status" varchar(50) DEFAULT 'ACTIVE',
        "plan" varchar(50) DEFAULT 'PRO',
        "maxSchools" integer DEFAULT 10,
        "maxAlumni" integer DEFAULT 10000,
        "createdAt" timestamp DEFAULT now(),
        "updatedAt" timestamp DEFAULT now()
      );

      ALTER TABLE "Trust" ADD COLUMN IF NOT EXISTS "slug" varchar(100);
      ALTER TABLE "Trust" ADD COLUMN IF NOT EXISTS "customDomain" varchar(255);
      ALTER TABLE "Trust" ADD COLUMN IF NOT EXISTS "domainPurchaseUrl" text;
      ALTER TABLE "Trust" ADD COLUMN IF NOT EXISTS "logoUrl" text;
      ALTER TABLE "Trust" ADD COLUMN IF NOT EXISTS "primaryColor" varchar(50) DEFAULT '#0f172a';
      ALTER TABLE "Trust" ADD COLUMN IF NOT EXISTS "razorpayKeyId" text;
      ALTER TABLE "Trust" ADD COLUMN IF NOT EXISTS "razorpayKeySecret" text;
      ALTER TABLE "Trust" ADD COLUMN IF NOT EXISTS "brevoApiKey" text;
      ALTER TABLE "Trust" ADD COLUMN IF NOT EXISTS "brevoSenderEmail" varchar(255);
      ALTER TABLE "Trust" ADD COLUMN IF NOT EXISTS "brevoSenderName" varchar(255);
      ALTER TABLE "Trust" ADD COLUMN IF NOT EXISTS "bankAccountDetails" text;
      ALTER TABLE "Trust" ADD COLUMN IF NOT EXISTS "taxExemptionNo" varchar(100);
      ALTER TABLE "Trust" ADD COLUMN IF NOT EXISTS "sponsorshipMode" varchar(50) DEFAULT 'ZAKAT_LILLAH';
      ALTER TABLE "Trust" ADD COLUMN IF NOT EXISTS "status" varchar(50) DEFAULT 'ACTIVE';
      ALTER TABLE "Trust" ADD COLUMN IF NOT EXISTS "plan" varchar(50) DEFAULT 'PRO';
      ALTER TABLE "Trust" ADD COLUMN IF NOT EXISTS "maxSchools" integer DEFAULT 10;
      ALTER TABLE "Trust" ADD COLUMN IF NOT EXISTS "maxAlumni" integer DEFAULT 10000;

      CREATE TABLE IF NOT EXISTS "School" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "schoolName" varchar(255) NOT NULL,
        "currentStudentsNo" integer DEFAULT 0,
        "address" text,
        "phoneNo" varchar(20),
        "email" varchar(255),
        "medium" varchar(100),
        "schoolDiseNo" varchar(100) UNIQUE,
        "isHaveRTE" boolean DEFAULT false,
        "sscIndexNo" varchar(100),
        "hscIndexNo" varchar(100),
        "establishYear" integer,
        "totalStandards" integer,
        "imageUrls" text[],
        "logoUrl" text,
        "subdomain" varchar(100),
        "customDomain" varchar(255),
        "domainPurchaseUrl" text,
        "domainDescription" text,
        "brevoApiKey" text,
        "brevoSenderEmail" varchar(255),
        "brevoSenderName" varchar(255),
        "razorpayKeyId" text,
        "razorpayKeySecret" text,
        "sponsorshipMode" varchar(50),
        "trustId" uuid,
        "status" varchar(50) DEFAULT 'ACTIVE',
        "createdAt" timestamp DEFAULT now(),
        "updatedAt" timestamp DEFAULT now()
      );

      ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "subdomain" varchar(100);
      ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "customDomain" varchar(255);
      ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "domainPurchaseUrl" text;
      ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "domainDescription" text;
      ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "brevoApiKey" text;
      ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "brevoSenderEmail" varchar(255);
      ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "brevoSenderName" varchar(255);
      ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "razorpayKeyId" text;
      ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "razorpayKeySecret" text;
      ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "sponsorshipMode" varchar(50);
      ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "trustId" uuid;
    `);

    isSchemaEnsured = true;
  } catch (err) {
    console.error('[ensureMasterAdminSchema] Schema initialization error:', err);
  }
}
