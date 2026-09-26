CREATE TYPE "public"."CareerType" AS ENUM('JOB', 'INTERNSHIP');--> statement-breakpoint
CREATE TYPE "public"."Role" AS ENUM('SUPER_ADMIN', 'SUB_ADMIN', 'ALUMNI');--> statement-breakpoint
CREATE TYPE "public"."Status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TABLE "Achievement" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alumniId" uuid,
	"schoolId" uuid,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"date" date,
	"category" varchar(100),
	"mediaUrl" text,
	"mediaType" varchar(50),
	"status" varchar(20) DEFAULT 'PENDING',
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "Alumni" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" text NOT NULL,
	"role" varchar(50) DEFAULT 'ALUMNI' NOT NULL,
	"batchYear" integer,
	"linkedIn" text,
	"schoolId" uuid,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now(),
	CONSTRAINT "Alumni_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "Blog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alumniId" uuid,
	"schoolId" uuid,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"tags" text[],
	"mediaUrl" text,
	"mediaType" varchar(50),
	"status" varchar(20) DEFAULT 'PENDING',
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "CareerOpportunity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alumniId" uuid,
	"schoolId" uuid,
	"type" varchar(20),
	"companyName" varchar(255) NOT NULL,
	"companyLink" text,
	"role" varchar(255) NOT NULL,
	"relation" text,
	"description" text,
	"status" varchar(20) DEFAULT 'PENDING',
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "Expense" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"type" varchar(50) NOT NULL,
	"startDate" date,
	"estimatedCost" numeric(12, 2) DEFAULT '0',
	"mediaUrl" text,
	"mediaType" varchar(50),
	"schoolId" uuid NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "MentorshipOffer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alumniId" uuid,
	"schoolId" uuid,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"targetStudent" text,
	"availability" text,
	"status" varchar(20) DEFAULT 'PENDING',
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "School" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"schoolName" varchar(255) NOT NULL,
	"currentStudentsNo" integer DEFAULT 0,
	"address" text,
	"phoneNo" varchar(20),
	"email" varchar(255),
	"medium" varchar(100),
	"schoolDiseNo" varchar(100),
	"isHaveRTE" boolean DEFAULT false,
	"sscIndexNo" varchar(100),
	"hscIndexNo" varchar(100),
	"establishYear" integer,
	"totalStandards" integer,
	"trustId" uuid,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now(),
	CONSTRAINT "School_schoolDiseNo_unique" UNIQUE("schoolDiseNo")
);
--> statement-breakpoint
CREATE TABLE "Standard" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"standardName" varchar(100) NOT NULL,
	"division" varchar(100),
	"fees" numeric(10, 2) DEFAULT '0',
	"schoolId" uuid NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "Student" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"studentCode" varchar(100),
	"category" varchar(100),
	"userIdRef" varchar(100),
	"admissionDate" date,
	"grSrNo" varchar(100),
	"admissionType" varchar(100),
	"dateOfBirth" date,
	"age" integer,
	"gender" varchar(50),
	"contactNo" varchar(50),
	"aadharNo" varchar(50),
	"panNo" varchar(50),
	"apaarId" varchar(100),
	"address" text,
	"city" varchar(100),
	"state" varchar(100),
	"country" varchar(100),
	"fatherName" varchar(255),
	"fatherNumber" varchar(50),
	"motherName" varchar(255),
	"motherNumber" varchar(50),
	"accountHolderName" varchar(255),
	"accountNumber" varchar(100),
	"bankName" varchar(255),
	"ifscCode" varchar(50),
	"sponsorshipType" varchar(100),
	"isNeedy" boolean DEFAULT false,
	"isUnderRTE" boolean DEFAULT false,
	"currentClass" varchar(100),
	"section" varchar(50),
	"standardId" uuid,
	"schoolId" uuid NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now(),
	"updatedAt" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "Trust" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trustName" varchar(255) NOT NULL,
	"registrationNo" varchar(255) NOT NULL,
	"establishmentYear" integer,
	"presidentName" varchar(255),
	"presidentNo" varchar(20),
	"trusteesName" text[],
	"trusteesNo" text[],
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now(),
	CONSTRAINT "Trust_registrationNo_unique" UNIQUE("registrationNo")
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" text NOT NULL,
	"role" varchar(50) NOT NULL,
	"phoneNo" varchar(20),
	"address" text,
	"schoolId" uuid,
	"relation" varchar(100),
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now(),
	CONSTRAINT "User_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_alumniId_Alumni_id_fk" FOREIGN KEY ("alumniId") REFERENCES "public"."Alumni"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_schoolId_School_id_fk" FOREIGN KEY ("schoolId") REFERENCES "public"."School"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Alumni" ADD CONSTRAINT "Alumni_schoolId_School_id_fk" FOREIGN KEY ("schoolId") REFERENCES "public"."School"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Blog" ADD CONSTRAINT "Blog_alumniId_Alumni_id_fk" FOREIGN KEY ("alumniId") REFERENCES "public"."Alumni"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Blog" ADD CONSTRAINT "Blog_schoolId_School_id_fk" FOREIGN KEY ("schoolId") REFERENCES "public"."School"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "CareerOpportunity" ADD CONSTRAINT "CareerOpportunity_alumniId_Alumni_id_fk" FOREIGN KEY ("alumniId") REFERENCES "public"."Alumni"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "CareerOpportunity" ADD CONSTRAINT "CareerOpportunity_schoolId_School_id_fk" FOREIGN KEY ("schoolId") REFERENCES "public"."School"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_schoolId_School_id_fk" FOREIGN KEY ("schoolId") REFERENCES "public"."School"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "MentorshipOffer" ADD CONSTRAINT "MentorshipOffer_alumniId_Alumni_id_fk" FOREIGN KEY ("alumniId") REFERENCES "public"."Alumni"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "MentorshipOffer" ADD CONSTRAINT "MentorshipOffer_schoolId_School_id_fk" FOREIGN KEY ("schoolId") REFERENCES "public"."School"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "School" ADD CONSTRAINT "School_trustId_Trust_id_fk" FOREIGN KEY ("trustId") REFERENCES "public"."Trust"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Standard" ADD CONSTRAINT "Standard_schoolId_School_id_fk" FOREIGN KEY ("schoolId") REFERENCES "public"."School"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Student" ADD CONSTRAINT "Student_standardId_Standard_id_fk" FOREIGN KEY ("standardId") REFERENCES "public"."Standard"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Student" ADD CONSTRAINT "Student_schoolId_School_id_fk" FOREIGN KEY ("schoolId") REFERENCES "public"."School"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "User" ADD CONSTRAINT "User_schoolId_School_id_fk" FOREIGN KEY ("schoolId") REFERENCES "public"."School"("id") ON DELETE set null ON UPDATE no action;