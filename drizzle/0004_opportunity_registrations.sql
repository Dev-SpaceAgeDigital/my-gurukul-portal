CREATE TABLE IF NOT EXISTS "OpportunityRegistration" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "postType" varchar(20) NOT NULL,
  "postId" uuid NOT NULL,
  "alumniId" uuid REFERENCES "Alumni"("id") ON DELETE CASCADE,
  "name" varchar(255) NOT NULL,
  "email" varchar(255) NOT NULL,
  "phoneNo" varchar(30) NOT NULL,
  "linkedInUrl" text,
  "createdAt" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "OpportunityRegistration_post_idx"
  ON "OpportunityRegistration" ("postType", "postId");

CREATE INDEX IF NOT EXISTS "OpportunityRegistration_alumni_idx"
  ON "OpportunityRegistration" ("alumniId", "createdAt");
