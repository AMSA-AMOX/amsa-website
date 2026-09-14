-- Experiences: an optional company website entered with the experience, and
-- the logo domain resolved from it (or from the colleges table when the
-- "company" is a school) when the row is written — see
-- src/lib/experience-denorm.ts. get_network_profile emits rows with to_jsonb,
-- so the new columns reach the client without an RPC change.
-- Backfill existing rows with scripts/backfill-experience-logos.ts.

alter table "Experiences" add column if not exists "companyUrl" text;
alter table "Experiences" add column if not exists "logoDomain" text;
