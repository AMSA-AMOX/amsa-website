CREATE TABLE IF NOT EXISTS match_profiles (
  id           BIGSERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL UNIQUE,
  gpa          NUMERIC(5,2),
  gpa_scale    NUMERIC(4,1) NOT NULL DEFAULT 4.0,
  sat_score    INT,
  act_score    INT,
  ap_ib_count  INT NOT NULL DEFAULT 0,
  activities   JSONB NOT NULL DEFAULT '[]',
  awards       TEXT,
  essay_themes TEXT,
  major        TEXT,
  budget_max   INT,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row-level security
-- Auth is enforced at the API route level (custom JWT via verifyToken).
-- The anon key is used for all DB calls, so policies grant anon
-- the minimum needed operations; the route itself scopes to the
-- authenticated user's row.
ALTER TABLE match_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "match_profiles_select"
  ON match_profiles FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "match_profiles_insert"
  ON match_profiles FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "match_profiles_update"
  ON match_profiles FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "match_profiles_delete"
  ON match_profiles FOR DELETE
  TO anon
  USING (true);
