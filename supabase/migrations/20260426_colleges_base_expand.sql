-- Expand colleges_base to store the full College Scorecard dataset.
-- Run this in Supabase Dashboard → SQL Editor.
-- All columns use IF NOT EXISTS so it is safe to re-run.

ALTER TABLE colleges_base

  -- ── School metadata ────────────────────────────────────────────────────────
  ADD COLUMN IF NOT EXISTS zip                       TEXT,
  ADD COLUMN IF NOT EXISTS locale                    INTEGER,   -- 11=city-large … 43=rural-remote
  ADD COLUMN IF NOT EXISTS accreditor                TEXT,
  ADD COLUMN IF NOT EXISTS accreditor_code           TEXT,
  ADD COLUMN IF NOT EXISTS carnegie_basic            INTEGER,   -- 15=R1, 16=R2, 18=M1 …
  ADD COLUMN IF NOT EXISTS carnegie_size_setting     INTEGER,
  ADD COLUMN IF NOT EXISTS religious_affiliation     INTEGER,
  ADD COLUMN IF NOT EXISTS ms_hispanic               BOOLEAN    DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ms_annh                   BOOLEAN    DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ms_tribal                 BOOLEAN    DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ms_aanipi                 BOOLEAN    DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS under_investigation       BOOLEAN    DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ft_faculty_rate           FLOAT,     -- 0-1
  ADD COLUMN IF NOT EXISTS faculty_salary            INTEGER,   -- USD/month
  ADD COLUMN IF NOT EXISTS endowment                 BIGINT,    -- USD
  ADD COLUMN IF NOT EXISTS open_admissions_policy    INTEGER,   -- 1=yes, 2=no
  ADD COLUMN IF NOT EXISTS price_calculator_url      TEXT,
  ADD COLUMN IF NOT EXISTS degrees_awarded_highest   INTEGER,   -- 3=bachelor, 4=graduate

  -- ── Admissions ─────────────────────────────────────────────────────────────
  ADD COLUMN IF NOT EXISTS test_requirements         INTEGER,   -- 1=req, 2=rec, 3=neither, 5=considered
  ADD COLUMN IF NOT EXISTS sat_avg                   INTEGER,
  ADD COLUMN IF NOT EXISTS sat_read_25               INTEGER,
  ADD COLUMN IF NOT EXISTS sat_read_75               INTEGER,
  ADD COLUMN IF NOT EXISTS sat_math_25               INTEGER,
  ADD COLUMN IF NOT EXISTS sat_math_75               INTEGER,
  ADD COLUMN IF NOT EXISTS act_25                    INTEGER,
  ADD COLUMN IF NOT EXISTS act_mid                   INTEGER,
  ADD COLUMN IF NOT EXISTS act_75                    INTEGER,

  -- ── Net price by income bracket ────────────────────────────────────────────
  ADD COLUMN IF NOT EXISTS net_price_0_30k           INTEGER,   -- USD/yr avg net price for <$30k income
  ADD COLUMN IF NOT EXISTS net_price_30k_48k         INTEGER,
  ADD COLUMN IF NOT EXISTS net_price_48k_75k         INTEGER,
  ADD COLUMN IF NOT EXISTS net_price_75k_110k        INTEGER,
  ADD COLUMN IF NOT EXISTS net_price_110k_plus       INTEGER,
  ADD COLUMN IF NOT EXISTS avg_net_price_overall     INTEGER,   -- institutional avg net price

  -- ── Aid ────────────────────────────────────────────────────────────────────
  ADD COLUMN IF NOT EXISTS pell_grant_rate           FLOAT,     -- share of undergrads with Pell
  ADD COLUMN IF NOT EXISTS federal_loan_rate         FLOAT,     -- share taking federal loans
  ADD COLUMN IF NOT EXISTS students_with_any_loan    FLOAT,     -- share with any loan
  ADD COLUMN IF NOT EXISTS median_debt_completers    INTEGER,   -- USD
  ADD COLUMN IF NOT EXISTS median_debt_monthly       FLOAT,     -- USD/month
  ADD COLUMN IF NOT EXISTS debt_90th                 INTEGER,   -- USD cumulative debt 90th pct
  ADD COLUMN IF NOT EXISTS debt_75th                 INTEGER,
  ADD COLUMN IF NOT EXISTS debt_25th                 INTEGER,
  ADD COLUMN IF NOT EXISTS debt_10th                 INTEGER,

  -- ── Students ───────────────────────────────────────────────────────────────
  ADD COLUMN IF NOT EXISTS grad_students             INTEGER,
  ADD COLUMN IF NOT EXISTS retention_rate            FLOAT,     -- 0-1 full-time 4yr
  ADD COLUMN IF NOT EXISTS share_first_gen           FLOAT,     -- 0-1
  ADD COLUMN IF NOT EXISTS share_25_older            FLOAT,     -- 0-1
  ADD COLUMN IF NOT EXISTS share_part_time           FLOAT,     -- 0-1
  ADD COLUMN IF NOT EXISTS share_low_income          FLOAT,     -- 0-1 (0-30k)

  -- ── Demographics ───────────────────────────────────────────────────────────
  ADD COLUMN IF NOT EXISTS demo_men                  FLOAT,     -- 0-1
  ADD COLUMN IF NOT EXISTS demo_women                FLOAT,
  ADD COLUMN IF NOT EXISTS demo_white                FLOAT,
  ADD COLUMN IF NOT EXISTS demo_black                FLOAT,
  ADD COLUMN IF NOT EXISTS demo_hispanic             FLOAT,
  ADD COLUMN IF NOT EXISTS demo_asian                FLOAT,
  ADD COLUMN IF NOT EXISTS demo_two_or_more          FLOAT,
  ADD COLUMN IF NOT EXISTS demo_nonresident_alien    FLOAT,

  -- ── Completion ─────────────────────────────────────────────────────────────
  ADD COLUMN IF NOT EXISTS completion_rate_4yr       FLOAT,     -- 150% normal time, 4yr schools
  ADD COLUMN IF NOT EXISTS consumer_completion_rate  FLOAT,

  -- ── Earnings alias ─────────────────────────────────────────────────────────
  ADD COLUMN IF NOT EXISTS earnings_10yr_median      INTEGER,  -- 10-yr median earnings (alias for md_earn_wne_p10)

  -- ── Repayment ──────────────────────────────────────────────────────────────
  ADD COLUMN IF NOT EXISTS default_rate_3yr          FLOAT;    -- 3-year cohort default rate
