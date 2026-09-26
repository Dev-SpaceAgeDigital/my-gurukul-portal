CREATE TABLE IF NOT EXISTS "NewsUpdate" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"category" varchar(100) NOT NULL,
	"publishDate" date,
	"imageUrl" text,
	"imageFileId" varchar(255),
	"schoolId" uuid,
	"isActive" boolean DEFAULT true,
	"createdByRole" varchar(50),
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "NewsUpdate" ADD CONSTRAINT "NewsUpdate_schoolId_School_id_fk" FOREIGN KEY ("schoolId") REFERENCES "public"."School"("id") ON DELETE set null ON UPDATE no action;
