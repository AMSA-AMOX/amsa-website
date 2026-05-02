-- ============================================================
-- Migration: ambassador role + Threads updates + HubThreads + HubComments
-- ============================================================
-- HOW TO RUN:
--   Supabase Dashboard → SQL Editor → New query → paste & Run
--   All statements are idempotent (safe to re-run).
-- ============================================================

-- ─── 1. Ambassador role — Users table ───────────────────────────────────────
-- If the Users.role column has a CHECK constraint that lists allowed values,
-- drop and recreate it to include 'ambassador'.
-- If no such constraint exists the DO block is a silent no-op.
DO $$
DECLARE
  v_constraint TEXT;
BEGIN
  SELECT conname
    INTO v_constraint
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
   WHERE t.relname = 'Users'
     AND c.contype = 'c'
     AND pg_get_constraintdef(c.oid) ILIKE '%role%';

  IF v_constraint IS NOT NULL THEN
    EXECUTE format('ALTER TABLE "Users" DROP CONSTRAINT %I', v_constraint);
  END IF;

  -- Re-add with ambassador included.
  -- NOT VALID skips scanning existing rows (which may have NULL or legacy values)
  -- and enforces the constraint only on future inserts / updates.
  ALTER TABLE "Users"
    ADD CONSTRAINT users_role_check
    CHECK (role IN ('admin', 'board_member', 'ambassador', 'us_member', 'member'))
    NOT VALID;
EXCEPTION WHEN duplicate_object THEN
  -- constraint already exists with the right definition — skip
  NULL;
END $$;


-- ─── 2. Users table — school email for verified logo lookup ─────────────────
-- Stores the user's .edu address; domain is used directly for school logo.
ALTER TABLE "Users"
  ADD COLUMN IF NOT EXISTS "schoolEmail" TEXT;


-- ─── 4. Threads table — add missing columns ─────────────────────────────────
-- isAnonymous: whether the recipient answered anonymously (shown on public feed)
ALTER TABLE "Threads"
  ADD COLUMN IF NOT EXISTS "isAnonymous" BOOLEAN NOT NULL DEFAULT false;

-- isPublic: sent by the asker to opt-in/out of public visibility
ALTER TABLE "Threads"
  ADD COLUMN IF NOT EXISTS "isPublic" BOOLEAN NOT NULL DEFAULT true;

-- updatedAt: last modification timestamp
ALTER TABLE "Threads"
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ;

-- Partial unique index: at most one open (unanswered) question per asker→recipient pair.
-- The API relies on a 23505 violation to surface a friendly duplicate message.
CREATE UNIQUE INDEX IF NOT EXISTS threads_open_unique
  ON "Threads" ("askerId", "recipientId")
  WHERE answer IS NULL;


-- ─── 5. HubThreads — community Q&A with moderation queue ────────────────────
CREATE TABLE IF NOT EXISTS "HubThreads" (
  id            BIGSERIAL    PRIMARY KEY,
  "askerId"     INTEGER      NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
  question      TEXT         NOT NULL CHECK (char_length(question) BETWEEN 1 AND 600),
  status        TEXT         NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending', 'approved', 'rejected')),
  "isAnon"      BOOLEAN      NOT NULL DEFAULT false,
  "approvedBy"  INTEGER      REFERENCES "Users"(id) ON DELETE SET NULL,
  "approvedAt"  TIMESTAMPTZ,
  "createdAt"   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Feed query: approved threads ordered by approvedAt DESC (cursor-paginated)
CREATE INDEX IF NOT EXISTS hub_threads_feed_idx
  ON "HubThreads" (status, "approvedAt" DESC NULLS LAST);

-- Moderation queue: pending threads ordered by createdAt ASC
CREATE INDEX IF NOT EXISTS hub_threads_pending_idx
  ON "HubThreads" ("createdAt" ASC)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS hub_threads_asker_idx
  ON "HubThreads" ("askerId");


-- ─── 6. HubComments — answers on approved hub threads ───────────────────────
CREATE TABLE IF NOT EXISTS "HubComments" (
  id           BIGSERIAL    PRIMARY KEY,
  "threadId"   INTEGER      NOT NULL REFERENCES "HubThreads"(id) ON DELETE CASCADE,
  "authorId"   INTEGER      NOT NULL REFERENCES "Users"(id) ON DELETE CASCADE,
  content      TEXT         NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  "isAnon"     BOOLEAN      NOT NULL DEFAULT false,
  "createdAt"  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS hub_comments_thread_idx
  ON "HubComments" ("threadId", "createdAt" ASC);

CREATE INDEX IF NOT EXISTS hub_comments_author_idx
  ON "HubComments" ("authorId");


-- ─── 7. Row Level Security ───────────────────────────────────────────────────
-- This app uses a custom JWT (not Supabase Auth) and always calls Supabase
-- from server-side Next.js API routes using the anon key.
-- Authorization is fully enforced at the route layer (verifyToken / assertRole).
-- RLS policies here grant the anon role the access those routes need.

-- ── Threads ──────────────────────────────────────────────────────────────────
ALTER TABLE "Threads" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "threads_anon_select" ON "Threads";
CREATE POLICY "threads_anon_select" ON "Threads"
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "threads_anon_insert" ON "Threads";
CREATE POLICY "threads_anon_insert" ON "Threads"
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "threads_anon_update" ON "Threads";
CREATE POLICY "threads_anon_update" ON "Threads"
  FOR UPDATE TO anon USING (true);

DROP POLICY IF EXISTS "threads_anon_delete" ON "Threads";
CREATE POLICY "threads_anon_delete" ON "Threads"
  FOR DELETE TO anon USING (true);

-- ── HubThreads ────────────────────────────────────────────────────────────────
ALTER TABLE "HubThreads" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hub_threads_anon_select" ON "HubThreads";
CREATE POLICY "hub_threads_anon_select" ON "HubThreads"
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "hub_threads_anon_insert" ON "HubThreads";
CREATE POLICY "hub_threads_anon_insert" ON "HubThreads"
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "hub_threads_anon_update" ON "HubThreads";
CREATE POLICY "hub_threads_anon_update" ON "HubThreads"
  FOR UPDATE TO anon USING (true);

-- ── HubComments ───────────────────────────────────────────────────────────────
ALTER TABLE "HubComments" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hub_comments_anon_select" ON "HubComments";
CREATE POLICY "hub_comments_anon_select" ON "HubComments"
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "hub_comments_anon_insert" ON "HubComments";
CREATE POLICY "hub_comments_anon_insert" ON "HubComments"
  FOR INSERT TO anon WITH CHECK (true);
