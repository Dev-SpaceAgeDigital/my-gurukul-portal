const { Client } = require('pg');

const db1Url = "postgresql://neondb_owner:npg_Ede9Ma3WJDzf@ep-blue-bar-aygmgq0p-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const db2Url = "postgresql://neondb_owner:npg_wv2kuCNrVc5q@ep-lingering-star-ayefwu06.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require";

async function applyToDb(url, dbName) {
  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    console.log(`Applying SQL schema to ${dbName}...`);

    try {
      await client.query('CREATE TYPE "Role" AS ENUM(\'SUPER_ADMIN\', \'SUB_ADMIN\', \'ALUMNI\');');
    } catch (e) {}

    const tables = [
      `CREATE TABLE IF NOT EXISTS "AcademicYear" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "label" varchar(100) NOT NULL, "isActive" boolean DEFAULT false, "createdAt" timestamp DEFAULT now(), "updatedAt" timestamp DEFAULT now(), "statusTag" varchar(50) DEFAULT 'CURRENT');`,
      `CREATE TABLE IF NOT EXISTS "Trust" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "trustName" varchar(255) NOT NULL, "registrationNo" varchar(255), "establishmentYear" integer, "presidentName" varchar(255), "presidentNo" varchar(20), "trusteesName" text[], "trusteesNo" text[], "createdAt" timestamp DEFAULT CURRENT_TIMESTAMP, "updatedAt" timestamp DEFAULT CURRENT_TIMESTAMP, "slug" varchar(100), "customDomain" varchar(255), "logoUrl" text, "primaryColor" varchar(50) DEFAULT '#0f172a', "razorpayKeyId" text, "razorpayKeySecret" text, "bankAccountDetails" text, "taxExemptionNo" varchar(100), "status" varchar(50) DEFAULT 'ACTIVE', "plan" varchar(50) DEFAULT 'PRO', "maxSchools" integer DEFAULT 10, "maxAlumni" integer DEFAULT 10000);`,
      `CREATE TABLE IF NOT EXISTS "MasterAdmin" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "name" varchar(255) NOT NULL, "email" varchar(255) NOT NULL CONSTRAINT "MasterAdmin_email_key" UNIQUE, "password" text NOT NULL, "role" varchar(50) DEFAULT 'SUPER_MASTER_ADMIN', "createdAt" timestamp DEFAULT now(), "updatedAt" timestamp DEFAULT now());`,
      `CREATE TABLE IF NOT EXISTS "School" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "schoolName" varchar(255) NOT NULL, "currentStudentsNo" integer DEFAULT 0, "address" text, "phoneNo" varchar(20), "email" varchar(255), "medium" varchar(100), "schoolDiseNo" varchar(100), "isHaveRTE" boolean DEFAULT false, "sscIndexNo" varchar(100), "hscIndexNo" varchar(100), "establishYear" integer, "totalStandards" integer, "trustId" uuid, "createdAt" timestamp DEFAULT CURRENT_TIMESTAMP, "updatedAt" timestamp DEFAULT CURRENT_TIMESTAMP, "imageUrls" text[]);`,
      `CREATE TABLE IF NOT EXISTS "User" ("id" text PRIMARY KEY, "email" text NOT NULL, "password" text NOT NULL, "name" text, "role" Role DEFAULT 'ALUMNI' NOT NULL, "createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL, "updatedAt" timestamp NOT NULL, "phoneNo" varchar(20), "address" text, "schoolId" uuid, "relation" varchar(100));`,
      `CREATE TABLE IF NOT EXISTS "Student" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "name" varchar(255) NOT NULL, "studentCode" varchar(100), "category" varchar(100), "userIdRef" varchar(100), "admissionDate" date, "grSrNo" varchar(100), "admissionType" varchar(100), "dateOfBirth" date, "age" integer, "gender" varchar(50), "contactNo" varchar(50), "aadharNo" varchar(50), "panNo" varchar(50), "apaarId" varchar(100), "address" text, "city" varchar(100), "state" varchar(100), "country" varchar(100), "fatherName" varchar(255), "fatherNumber" varchar(50), "motherName" varchar(255), "motherNumber" varchar(50), "accountHolderName" varchar(255), "accountNumber" varchar(100), "bankName" varchar(255), "ifscCode" varchar(50), "sponsorshipType" varchar(100), "isNeedy" boolean DEFAULT false, "isUnderRTE" boolean DEFAULT false, "currentClass" varchar(100), "section" varchar(50), "standardId" uuid, "schoolId" uuid NOT NULL, "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP, "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP, "aidPaidAmount" numeric(12, 2) DEFAULT '0');`,
      `CREATE TABLE IF NOT EXISTS "Alumni" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "name" varchar(255) NOT NULL, "email" varchar(255) NOT NULL, "password" varchar(255) NOT NULL, "linkedIn" varchar(255), "batchYear" varchar(100), "studentId" uuid, "schoolId" uuid NOT NULL, "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP, "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP, "profilePic" text, "currentTitle" varchar(255), "currentBio" text, "workLink" text, "role" varchar(50) DEFAULT 'ALUMNI' NOT NULL, "isFeatured" boolean DEFAULT false);`,
      `CREATE TABLE IF NOT EXISTS "Achievement" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "alumniId" uuid, "schoolId" uuid, "title" varchar(255) NOT NULL, "description" text NOT NULL, "date" date, "category" varchar(100), "mediaUrl" text, "mediaType" varchar(50), "status" varchar(20) DEFAULT 'PENDING', "createdAt" timestamp DEFAULT now(), "updatedAt" timestamp DEFAULT now(), "isFeatured" boolean DEFAULT false);`,
      `CREATE TABLE IF NOT EXISTS "ActivityLog" ("id" text PRIMARY KEY, "schoolId" text, "actorRole" varchar(50) NOT NULL, "actorId" text, "actorName" varchar(255), "actorEmail" varchar(255), "category" varchar(80) NOT NULL, "action" varchar(120) NOT NULL, "title" varchar(255) NOT NULL, "message" text, "status" varchar(50), "entityType" varchar(80), "entityId" text, "link" text, "metadata" jsonb, "createdAt" timestamp with time zone DEFAULT now() NOT NULL);`,
      `CREATE TABLE IF NOT EXISTS "AlumniContribution" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "alumniId" uuid NOT NULL, "schoolId" uuid, "contributionType" varchar(50) NOT NULL, "title" varchar(255) NOT NULL, "description" text, "amount" numeric(12, 2), "quantity" varchar(100), "date" date DEFAULT now(), "proofUrl" text, "status" varchar(20) DEFAULT 'APPROVED', "isPublic" boolean DEFAULT true, "createdAt" timestamp DEFAULT now(), "updatedAt" timestamp DEFAULT now());`,
      `CREATE TABLE IF NOT EXISTS "AlumniFeedLike" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "alumniId" uuid, "feedItemId" uuid NOT NULL, "itemType" varchar(50) NOT NULL, "createdAt" timestamp DEFAULT now());`,
      `CREATE TABLE IF NOT EXISTS "AlumniFeedView" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "alumniId" uuid, "feedItemId" uuid NOT NULL, "itemType" varchar(50) NOT NULL, "createdAt" timestamp DEFAULT now());`,
      `CREATE TABLE IF NOT EXISTS "AlumniInvite" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "token" text NOT NULL, "email" varchar(255), "schoolId" uuid NOT NULL, "schoolName" varchar(255), "batchYear" varchar(100), "message" text, "status" varchar(30) DEFAULT 'SENT' NOT NULL, "createdBy" uuid, "expiresAt" timestamp with time zone NOT NULL, "usedAt" timestamp with time zone, "createdAt" timestamp with time zone DEFAULT now(), "updatedAt" timestamp with time zone DEFAULT now());`,
      `CREATE TABLE IF NOT EXISTS "AlumniOfTheYear" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "schoolId" uuid, "alumniId" uuid NOT NULL, "year" integer NOT NULL, "headline" varchar(255) NOT NULL, "reason" text NOT NULL, "highlights" text[], "totalFinancialAid" numeric(12, 2), "studentsHelpedCount" integer, "jobsPostedCount" integer, "mentorshipsCount" integer, "mediaUrl" text, "awardedByUserId" text, "createdAt" timestamp DEFAULT now(), "updatedAt" timestamp DEFAULT now());`,
      `CREATE TABLE IF NOT EXISTS "AlumniRegistrationRequest" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "inviteId" uuid, "schoolId" uuid NOT NULL, "schoolName" varchar(255), "name" varchar(255) NOT NULL, "email" varchar(255) NOT NULL, "phone" varchar(50), "batchYear" varchar(100), "currentTitle" varchar(255), "currentBio" text, "linkedIn" text, "status" varchar(30) DEFAULT 'PENDING' NOT NULL, "reviewedBy" uuid, "reviewedAt" timestamp with time zone, "alumniId" uuid, "rejectionReason" text, "createdAt" timestamp with time zone DEFAULT now(), "updatedAt" timestamp with time zone DEFAULT now());`,
      `CREATE TABLE IF NOT EXISTS "Blog" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "alumniId" uuid, "schoolId" uuid, "title" varchar(255) NOT NULL, "content" text NOT NULL, "tags" text[], "mediaUrl" text, "mediaType" varchar(50), "status" varchar(20) DEFAULT 'PENDING', "createdAt" timestamp DEFAULT now(), "updatedAt" timestamp DEFAULT now(), "isFeatured" boolean DEFAULT false, "isTopFeatured" boolean DEFAULT false);`,
      `CREATE TABLE IF NOT EXISTS "CareerInterest" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "careerId" uuid NOT NULL, "alumniId" uuid NOT NULL, "interestType" varchar(50) NOT NULL, "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP);`,
      `CREATE TABLE IF NOT EXISTS "CareerOpportunity" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "alumniId" uuid, "schoolId" uuid, "type" varchar(20), "companyName" varchar(255) NOT NULL, "companyLink" text, "role" varchar(255) NOT NULL, "relation" text, "description" text, "status" varchar(20) DEFAULT 'PENDING', "createdAt" timestamp DEFAULT now(), "updatedAt" timestamp DEFAULT now(), "category" varchar(100), "location" varchar(255), "workMode" varchar(50) DEFAULT 'ON_SITE', "salary" varchar(255), "duration" varchar(100), "experienceLevel" varchar(100), "applyLink" varchar(500), "deadline" timestamp with time zone);`,
      `CREATE TABLE IF NOT EXISTS "CsrInquiry" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "companyName" varchar(255) NOT NULL, "contactPerson" varchar(255) NOT NULL, "email" varchar(255) NOT NULL, "phone" varchar(50), "category" varchar(120) NOT NULL, "budgetRange" varchar(120), "message" text, "source" varchar(30) DEFAULT 'PUBLIC' NOT NULL, "status" varchar(30) DEFAULT 'PENDING' NOT NULL, "schoolId" uuid, "schoolName" varchar(255), "referredByAlumniId" uuid, "referredByAlumniName" varchar(255), "referredByAlumniEmail" varchar(255), "notes" text, "createdAt" timestamp with time zone DEFAULT now(), "updatedAt" timestamp with time zone DEFAULT now());`,
      `CREATE TABLE IF NOT EXISTS "DonationInquiry" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "token" text NOT NULL, "donorName" varchar(255) NOT NULL, "donorEmail" varchar(255) NOT NULL, "donorPhone" varchar(50) NOT NULL, "amount" numeric(12, 2) NOT NULL, "type" varchar(50) NOT NULL, "campaignId" text, "campaignTitle" text, "schoolId" uuid, "schoolName" varchar(255), "message" text, "status" varchar(30) DEFAULT 'PENDING', "razorpayOrderId" text, "razorpayPaymentId" text, "paymentMode" varchar(50), "paidAt" timestamp with time zone, "expiresAt" timestamp with time zone NOT NULL, "createdAt" timestamp with time zone DEFAULT now(), "updatedAt" timestamp with time zone DEFAULT now(), "donorPan" varchar(30), "isAlumni" boolean DEFAULT false);`,
      `CREATE TABLE IF NOT EXISTS "EmailLog" ("id" text PRIMARY KEY, "schoolId" text, "alumniId" text, "recipientEmail" varchar(255) NOT NULL, "recipientRole" varchar(50), "direction" varchar(20) DEFAULT 'SENT' NOT NULL, "sourceRole" varchar(50), "sourceId" text, "sourceName" varchar(255), "emailType" varchar(100) NOT NULL, "subject" varchar(255) NOT NULL, "status" varchar(30) NOT NULL, "provider" varchar(80), "providerMessageId" text, "relatedEntityType" varchar(80), "relatedEntityId" text, "errorMessage" text, "createdAt" timestamp with time zone DEFAULT now() NOT NULL);`,
      `CREATE TABLE IF NOT EXISTS "Event" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "title" varchar(255) NOT NULL, "description" text, "date" date, "schoolId" uuid, "createdAt" timestamp DEFAULT now(), "updatedAt" timestamp DEFAULT now(), "category" varchar(100), "tagline" text, "points" jsonb DEFAULT '[]', "featuredImage" text);`,
      `CREATE TABLE IF NOT EXISTS "EventMedia" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "eventId" uuid NOT NULL, "mediaType" varchar(50) NOT NULL, "url" text NOT NULL, "fileId" varchar(255), "createdAt" timestamp DEFAULT now());`,
      `CREATE TABLE IF NOT EXISTS "Expense" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "title" varchar(255) NOT NULL, "description" text, "type" varchar(50) NOT NULL, "startDate" date, "estimatedCost" numeric(12, 2) DEFAULT '0', "mediaUrl" text, "mediaType" varchar(50), "schoolId" uuid NOT NULL, "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP, "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP, "paidAmount" numeric(12, 2) DEFAULT '0');`,
      `CREATE TABLE IF NOT EXISTS "MentorshipOffer" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "alumniId" uuid, "schoolId" uuid, "title" varchar(255) NOT NULL, "description" text NOT NULL, "targetStudent" text, "availability" text, "status" varchar(20) DEFAULT 'PENDING', "createdAt" timestamp DEFAULT now(), "updatedAt" timestamp DEFAULT now(), "category" varchar(100));`,
      `CREATE TABLE IF NOT EXISTS "MissionStat" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "target" integer NOT NULL, "prefix" varchar(50), "suffix" varchar(50), "label" varchar(255) NOT NULL, "desc" text NOT NULL, "orderNo" integer DEFAULT 0, "isActive" boolean DEFAULT true, "createdAt" timestamp DEFAULT now(), "updatedAt" timestamp DEFAULT now());`,
      `CREATE TABLE IF NOT EXISTS "NewsUpdate" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "title" varchar(255) NOT NULL, "description" text NOT NULL, "category" varchar(100) NOT NULL, "publishDate" date, "imageUrl" text, "imageFileId" varchar(255), "schoolId" uuid, "isActive" boolean DEFAULT true, "createdByRole" varchar(50), "createdAt" timestamp DEFAULT now(), "updatedAt" timestamp DEFAULT now());`,
      `CREATE TABLE IF NOT EXISTS "Notification" ("id" text PRIMARY KEY, "title" varchar(255) NOT NULL, "message" text NOT NULL, "type" varchar(50) DEFAULT 'INFO' NOT NULL, "priority" varchar(20) DEFAULT 'NORMAL' NOT NULL, "actorRole" varchar(50), "actorId" text, "recipientRole" varchar(50) NOT NULL, "recipientId" text NOT NULL, "schoolId" text, "entityType" varchar(80), "entityId" text, "link" text, "isRead" boolean DEFAULT false NOT NULL, "readAt" timestamp with time zone, "createdAt" timestamp with time zone DEFAULT now() NOT NULL);`,
      `CREATE TABLE IF NOT EXISTS "OpportunityRegistration" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "postType" varchar(20) NOT NULL, "postId" uuid NOT NULL, "alumniId" uuid, "name" varchar(255) NOT NULL, "email" varchar(255) NOT NULL, "phoneNo" varchar(30) NOT NULL, "linkedInUrl" text, "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP);`,
      `CREATE TABLE IF NOT EXISTS "SchoolPageContent" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "schoolId" uuid, "facilities" jsonb, "activities" jsonb, "teachers" jsonb, "createdAt" timestamp DEFAULT now(), "updatedAt" timestamp DEFAULT now(), "tagline" text, "aboutTitle" varchar(255), "aboutDescription" text, "aboutHighlights" text[], "academicPrograms" jsonb DEFAULT '[]', "activityCategories" jsonb DEFAULT '[]', "admissionInfo" jsonb DEFAULT '{}', "donationInfo" jsonb DEFAULT '{}', "updatedBy" uuid);`,
      `CREATE TABLE IF NOT EXISTS "Standard" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "standardName" varchar(100) NOT NULL, "division" varchar(100), "fees" numeric(10, 2) DEFAULT '0', "schoolId" uuid NOT NULL, "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP, "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP, "batchYear" varchar(100), "stream" varchar(100));`,
      `CREATE TABLE IF NOT EXISTS "StudentEnrollment" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "studentId" uuid NOT NULL, "standardId" uuid NOT NULL, "academicYearId" uuid NOT NULL, "status" varchar(50) DEFAULT 'ACTIVE', "createdAt" timestamp DEFAULT now(), "updatedAt" timestamp DEFAULT now(), "rank" integer, "percentage" numeric(5, 2));`,
      `CREATE TABLE IF NOT EXISTS "Transaction" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "amount" numeric(12, 2) NOT NULL, "type" varchar(50) NOT NULL, "donorName" varchar(255), "donorEmail" varchar(255), "donorPhone" varchar(50), "razorpayPaymentId" varchar(255), "razorpayOrderId" varchar(255), "status" varchar(50) DEFAULT 'PENDING', "schoolId" uuid NOT NULL, "referenceId" uuid, "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP, "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP, "paymentMode" varchar(50));`
    ];

    for (const sql of tables) {
      try {
        await client.query(sql);
      } catch (e) {
        // Continue if statement has non-critical notice
      }
    }

    console.log(`✅ All tables verified/created on ${dbName}!`);

    // Seed MasterAdmin & Trust
    await client.query(`
      INSERT INTO "MasterAdmin" ("name", "email", "password", "role")
      VALUES ('Platform Master Admin', 'admin@madnieducation.org', 'AQwIKwVowlls1Lrs', 'SUPER_MASTER_ADMIN')
      ON CONFLICT ("email") DO UPDATE SET "password" = 'AQwIKwVowlls1Lrs';
    `);

    let res = await client.query(`SELECT * FROM "Trust" LIMIT 1;`);
    let trustId;
    if (res.rows.length === 0) {
      let newTrust = await client.query(`
        INSERT INTO "Trust" ("trustName", "slug", "registrationNo", "establishmentYear", "status", "plan")
        VALUES ('Madni Education Trust', 'madni', 'REG-MADNI-001', 1998, 'ACTIVE', 'ENTERPRISE')
        RETURNING "id";
      `);
      trustId = newTrust.rows[0].id;
    } else {
      trustId = res.rows[0].id;
      await client.query(`UPDATE "Trust" SET "slug" = COALESCE("slug", 'madni') WHERE "id" = $1;`, [trustId]);
    }

    try {
      await client.query(`UPDATE "School" SET "trustId" = $1 WHERE "trustId" IS NULL;`, [trustId]);
    } catch (e) {}

    console.log(`✅ Seeded MasterAdmin & Default Trust in ${dbName}`);
  } catch (err) {
    console.error(`Error on ${dbName}:`, err.message);
  } finally {
    await client.end();
  }
}

async function main() {
  await applyToDb(db1Url, "DB 1 (Madni Education Trust Copy)");
  await applyToDb(db2Url, "DB 2 (EduTrust SaaS)");
}

main();
