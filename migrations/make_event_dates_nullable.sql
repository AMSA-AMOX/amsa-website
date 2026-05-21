-- Run this in the Supabase SQL editor.
-- Makes startAt, endAt, and timezone nullable on the Events table
-- so events can be created with just a title, description, link, and image.

ALTER TABLE "Events" ALTER COLUMN "startAt"  DROP NOT NULL;
ALTER TABLE "Events" ALTER COLUMN "endAt"    DROP NOT NULL;
ALTER TABLE "Events" ALTER COLUMN "timezone" DROP NOT NULL;
