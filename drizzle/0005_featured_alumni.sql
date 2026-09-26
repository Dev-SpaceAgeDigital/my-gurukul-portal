ALTER TABLE "Alumni"
ADD COLUMN IF NOT EXISTS "isFeatured" boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS "Alumni_school_featured_idx"
ON "Alumni" ("schoolId", "isFeatured");
