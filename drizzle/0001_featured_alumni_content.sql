ALTER TABLE "Blog" ADD COLUMN IF NOT EXISTS "isFeatured" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "Achievement" ADD COLUMN IF NOT EXISTS "isFeatured" boolean DEFAULT false;
