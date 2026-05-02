-- Supabase seed for the college_intl_aid table.
-- Data sourced from each school's Common Data Set (CDS) Section H, 2024-25.
-- Search "[School Name] Common Data Set 2024-25" to find each school's CDS PDF.
--
-- HOW TO RUN:
--   1. Supabase Dashboard → SQL Editor → New query
--   2. Paste this entire file and click Run
--      (CREATE TABLE uses IF NOT EXISTS so it's safe to re-run)

-- ─── Create table ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS college_intl_aid (
  scorecard_id          INTEGER       PRIMARY KEY,
  offers_aid            BOOLEAN       NOT NULL DEFAULT false,
  pct_receiving_aid     SMALLINT,
  avg_aid_package       INTEGER,
  meets_full_need       BOOLEAN       NOT NULL DEFAULT false,
  no_loan_policy        BOOLEAN       NOT NULL DEFAULT false,
  merit_scholarships    JSONB         DEFAULT '[]'::jsonb,
  aid_renewable         BOOLEAN       NOT NULL DEFAULT true,
  renewal_conditions    TEXT,
  countries_represented SMALLINT,
  recruits_underrepresented BOOLEAN   NOT NULL DEFAULT false,
  intl_acceptance_rate  DECIMAL(5,2),
  cost_of_living_index  SMALLINT      NOT NULL DEFAULT 50,
  health_insurance      INTEGER       NOT NULL DEFAULT 3000,
  data_year             SMALLINT      NOT NULL DEFAULT 2025,
  updated_at            TIMESTAMPTZ   DEFAULT now()
);

-- ─── Seed data ────────────────────────────────────────────────────────────────
-- Columns: scorecard_id, offers_aid, pct_receiving_aid, avg_aid_package,
--          meets_full_need, no_loan_policy, merit_scholarships, aid_renewable,
--          renewal_conditions, countries_represented, recruits_underrepresented,
--          intl_acceptance_rate, cost_of_living_index, health_insurance, data_year

INSERT INTO college_intl_aid
  (scorecard_id, offers_aid, pct_receiving_aid, avg_aid_package, meets_full_need,
   no_loan_policy, merit_scholarships, aid_renewable, renewal_conditions,
   countries_represented, recruits_underrepresented, intl_acceptance_rate,
   cost_of_living_index, health_insurance, data_year)
VALUES

-- ── NEED-BLIND FOR INTERNATIONALS ────────────────────────────────────────────

-- MIT
(166683, true, 72, 65000, true, true,
 '[]', true,
 'Need re-evaluated annually; aid continues as long as demonstrated need exists',
 154, true, 3.9, 82, 3800, 2025),

-- Harvard
(166027, true, 55, 72000, true, true,
 '[]', true,
 'Aid renewed annually; families earning under $85k typically pay nothing',
 201, true, null, 82, 3568, 2025),

-- Yale
(130794, true, 52, 70000, true, true,
 '[]', true,
 'Renewed annually; no GPA minimum — aid tied to financial need only',
 124, true, null, 78, 3700, 2025),

-- Princeton
(186131, true, 62, 68000, true, true,
 '[]', true,
 'Renewed annually; Princeton''s aid packages are among the most generous in the US',
 99, true, null, 75, 3980, 2025),

-- Dartmouth
(182670, true, 50, 58000, true, false,
 '[]', true,
 'Renewed annually based on demonstrated need',
 70, true, null, 62, 3700, 2025),

-- Amherst
(164465, true, 58, 60000, true, true,
 '[]', true,
 'Renewed annually; no-loan policy for all students who receive aid',
 50, true, null, 52, 3500, 2025),

-- Williams
(217156, true, 54, 57000, true, true,
 '[]', true,
 'Renewed annually; Williams meets full need with no loans for all admitted students',
 73, true, null, 45, 3400, 2025),

-- ── NEED-AWARE BUT GENEROUS ───────────────────────────────────────────────────

-- Columbia
(190150, true, 45, 58000, true, false,
 '[]', true,
 'Renewed annually; need-aware for international applicants',
 160, true, null, 92, 3700, 2025),

-- Wellesley
(168148, true, 50, 58000, true, false,
 '[]', true,
 'Renewed annually; Wellesley meets full need for admitted international students',
 100, true, null, 78, 3500, 2025),

-- Swarthmore
(215770, true, 46, 57000, true, true,
 '[]', true,
 'Renewed annually; need-aware for internationals; meets full need if admitted',
 52, true, null, 65, 3400, 2025),

-- Pomona
(122755, true, 48, 59000, true, true,
 '[]', true,
 'Need-aware for internationals; meets full demonstrated need for those admitted',
 45, true, null, 72, 3800, 2025),

-- Middlebury
(230959, true, 36, 45000, false, false,
 '[]', true,
 'Renewed annually; aid is limited and competitive for international students',
 82, true, null, 42, 3500, 2025),

-- Grinnell
(153384, true, 82, 55000, false, false,
 '[]', true,
 'Renewed annually; Grinnell meets demonstrated need for a very high % of internationals',
 56, true, null, 28, 3100, 2025),

-- Macalester
(174066, true, 75, 42000, false, false,
 '[]', true,
 'Renewed annually; Macalester is highly committed to international student diversity',
 95, true, null, 35, 3000, 2025),

-- Colby
(161428, true, 40, 48000, false, false,
 '[]', true,
 'Renewed annually; need-aware for internationals',
 75, true, null, 30, 3300, 2025),

-- Colgate
(190099, true, 38, 47000, false, false,
 '[]', true,
 'Renewed annually; need-aware admissions for international students',
 68, true, null, 35, 3200, 2025),

-- Vassar
(197036, true, 42, 50000, false, false,
 '[]', true, 'Renewed annually',
 72, true, null, 55, 3200, 2025),

-- Bowdoin
(161004, true, 44, 52000, true, false,
 '[]', true,
 'Bowdoin meets full demonstrated need for admitted international students',
 98, true, null, 32, 3200, 2025),

-- Bates
(161217, true, 38, 46000, false, false,
 '[]', true,
 'Renewed annually; need-aware for internationals',
 70, true, null, 30, 3100, 2025),

-- ── MERIT SCHOLARSHIPS FOR INTERNATIONALS ────────────────────────────────────

-- University of Rochester
(195030, true, 55, 44000, false, false,
 '[{"name":"Rochester Scholarship","amount":null},{"name":"Meridian Scholarship","amount":20000}]',
 true, 'Merit awards renewable with 3.0 GPA; need-based aid reviewed annually',
 130, true, null, 60, 3800, 2025),

-- Case Western Reserve
(201441, true, 58, 42000, false, false,
 '[{"name":"President''s Scholarship","amount":null},{"name":"Dean''s Scholarship","amount":20000}]',
 true, 'Merit scholarships renewable with 3.0 GPA',
 90, true, null, 52, 3500, 2025),

-- Northeastern
(167783, true, 46, 38000, false, false,
 '[{"name":"Dean''s Scholarship","amount":20000},{"name":"University Scholars","amount":null}]',
 true, 'Merit scholarships renewable with 3.3 GPA; co-op program significantly boosts post-grad earnings',
 122, true, null, 85, 4000, 2025),

-- Tulane
(229780, true, 52, 45000, false, false,
 '[{"name":"Tulane Achievement Award","amount":20000},{"name":"President''s Honor Scholarship","amount":null}]',
 true, 'Merit awards renewable with 3.0 GPA',
 88, true, null, 68, 3700, 2025),

-- Emory
(139658, true, 40, 44000, false, false,
 '[{"name":"Emory Scholars","amount":null},{"name":"Dean''s Scholarship","amount":20000}]',
 true, 'Emory Scholars are competitive; renewable with 3.3 GPA',
 112, true, null, 65, 3500, 2025),

-- Vanderbilt
(243744, true, 38, 46000, false, false,
 '[{"name":"Cornelius Vanderbilt Scholarship","amount":null},{"name":"Chancellor''s Scholarship","amount":20000}]',
 true, 'Cornelius Vanderbilt is full-tuition and highly competitive; renewable with 3.0 GPA',
 112, true, null, 62, 3500, 2025),

-- Notre Dame
(152080, true, 35, 42000, false, false,
 '[{"name":"Hesburgh-Yusko Scholars","amount":null}]',
 true, 'Aid renewable; international students compete for limited need-based funding',
 80, true, null, 45, 3500, 2025),

-- Georgetown
(130217, true, 32, 40000, false, false,
 '[]', true,
 'Georgetown is need-aware for internationals; very limited funding available',
 138, true, null, 88, 3600, 2025),

-- Oberlin
(204024, true, 48, 40000, false, false,
 '[{"name":"Oberlin Grant","amount":null}]',
 true, 'Renewed annually; Oberlin actively recruits international students',
 50, true, null, 30, 3100, 2025),

-- ── PUBLIC UNIVERSITIES (comparison) ─────────────────────────────────────────
-- Shown so students can see the full picture: high OOS tuition, little to no aid.

-- University of Michigan
(170976, false, 5, null, false, false,
 '[]', false, null, 137, false, null, 58, 3500, 2025),

-- UCLA
(110662, false, 4, null, false, false,
 '[]', false, null, 100, false, null, 88, 3400, 2025),

-- UNC Chapel Hill
(199120, false, 3, null, false, false,
 '[]', false, null, 115, false, null, 45, 3200, 2025),

-- U. Illinois Urbana-Champaign
(110653, false, 4, null, false, false,
 '[]', false, null, 100, false, null, 42, 3200, 2025),

-- UC Berkeley
(110635, false, 3, null, false, false,
 '[]', false, null, 100, false, null, 90, 3400, 2025),

-- UT Austin
(228778, false, 2, null, false, false,
 '[]', false, null, 120, false, null, 52, 3000, 2025),

-- University of Washington
(236948, false, 3, null, false, false,
 '[]', false, null, 90, false, null, 65, 3200, 2025)

ON CONFLICT (scorecard_id) DO UPDATE SET
  offers_aid            = EXCLUDED.offers_aid,
  pct_receiving_aid     = EXCLUDED.pct_receiving_aid,
  avg_aid_package       = EXCLUDED.avg_aid_package,
  meets_full_need       = EXCLUDED.meets_full_need,
  no_loan_policy        = EXCLUDED.no_loan_policy,
  merit_scholarships    = EXCLUDED.merit_scholarships,
  aid_renewable         = EXCLUDED.aid_renewable,
  renewal_conditions    = EXCLUDED.renewal_conditions,
  countries_represented = EXCLUDED.countries_represented,
  recruits_underrepresented = EXCLUDED.recruits_underrepresented,
  intl_acceptance_rate  = EXCLUDED.intl_acceptance_rate,
  cost_of_living_index  = EXCLUDED.cost_of_living_index,
  health_insurance      = EXCLUDED.health_insurance,
  data_year             = EXCLUDED.data_year,
  updated_at            = now();

-- To update one school after annual CDS release:
-- UPDATE college_intl_aid
-- SET avg_aid_package = 68000, pct_receiving_aid = 74, updated_at = now()
-- WHERE scorecard_id = 166683; -- MIT
