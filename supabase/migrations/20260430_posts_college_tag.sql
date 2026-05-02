-- Add college tagging to Posts
ALTER TABLE "Posts"
  ADD COLUMN IF NOT EXISTS "tagged_college_id" INTEGER REFERENCES colleges_base(unitid) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS posts_tagged_college_id_idx ON "Posts" ("tagged_college_id");
