-- IPEDS Student Financial Aid (SFA) 2023-24
-- Source: NCES IPEDS SFA component (sfa2324.csv)
-- Run in Supabase Dashboard → SQL Editor
-- After creating, enable public insert:
--   ALTER TABLE ipeds_sfa ENABLE ROW LEVEL SECURITY;
--   CREATE POLICY "allow_public_upsert" ON ipeds_sfa FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS ipeds_sfa (
  unitid                    INTEGER     PRIMARY KEY,
  data_year                 SMALLINT    NOT NULL DEFAULT 2024,

  -- ── Enrollment counts ─────────────────────────────────────────────────────
  total_undergrads          INTEGER,    -- SCUGRAD:  all undergrads
  degree_seeking_undergrads INTEGER,    -- SCUGDGSK: degree-seeking undergrads
  non_degree_undergrads     INTEGER,    -- SCUGNDGS: non-degree-seeking
  ftft_count                INTEGER,    -- SCUGFFN:  full-time first-time UG count
  ftft_pct                  SMALLINT,   -- SCUGFFP:  FTFT as % of total UG

  -- ── Financial aid cohort sizes ────────────────────────────────────────────
  fa_cohort_ug              INTEGER,    -- SCFA2:    UG financial aid cohort
  fa_cohort_ftft            INTEGER,    -- SCFA1N:   FTFT in FA cohort
  fa_cohort_ftft_pct        SMALLINT,   -- SCFA1P:   FTFT % of FA cohort

  -- ── All undergrads: any grant aid ─────────────────────────────────────────
  all_grant_n               INTEGER,    -- UAGRNTN
  all_grant_pct             SMALLINT,   -- UAGRNTP
  all_grant_total           BIGINT,     -- UAGRNTT
  all_grant_avg             INTEGER,    -- UAGRNTA

  -- ── All undergrads: Pell grants ───────────────────────────────────────────
  all_pell_n                INTEGER,    -- UPGRNTN
  all_pell_pct              SMALLINT,   -- UPGRNTP
  all_pell_total            BIGINT,     -- UPGRNTT
  all_pell_avg              INTEGER,    -- UPGRNTA

  -- ── All undergrads: federal loans ─────────────────────────────────────────
  all_fed_loan_n            INTEGER,    -- UFLOANN
  all_fed_loan_pct          SMALLINT,   -- UFLOANP
  all_fed_loan_total        BIGINT,     -- UFLOANT
  all_fed_loan_avg          INTEGER,    -- UFLOANA

  -- ── FTFT: any financial aid ───────────────────────────────────────────────
  ftft_any_aid_n            INTEGER,    -- ANYAIDN
  ftft_any_aid_pct          SMALLINT,   -- ANYAIDP

  -- ── FTFT: any grant or scholarship ───────────────────────────────────────
  ftft_grant_scholarship_n  INTEGER,    -- AIDFSIN
  ftft_grant_scholarship_pct SMALLINT,  -- AIDFSIP

  -- ── FTFT: any grant aid (sum of all grant types) ─────────────────────────
  ftft_any_grant_n          INTEGER,    -- AGRNT_N
  ftft_any_grant_pct        SMALLINT,   -- AGRNT_P
  ftft_any_grant_total      BIGINT,     -- AGRNT_T
  ftft_any_grant_avg        INTEGER,    -- AGRNT_A

  -- ── FTFT: federal grants (all, incl. Pell) ───────────────────────────────
  ftft_fed_grant_n          INTEGER,    -- FGRNT_N
  ftft_fed_grant_pct        SMALLINT,   -- FGRNT_P
  ftft_fed_grant_total      BIGINT,     -- FGRNT_T
  ftft_fed_grant_avg        INTEGER,    -- FGRNT_A

  -- ── FTFT: Pell grant ─────────────────────────────────────────────────────
  ftft_pell_n               INTEGER,    -- PGRNT_N
  ftft_pell_pct             SMALLINT,   -- PGRNT_P
  ftft_pell_total           BIGINT,     -- PGRNT_T
  ftft_pell_avg             INTEGER,    -- PGRNT_A

  -- ── FTFT: other federal grants (SEOG, TEACH, etc.) ───────────────────────
  ftft_other_fed_grant_n    INTEGER,    -- OFGRT_N
  ftft_other_fed_grant_pct  SMALLINT,   -- OFGRT_P
  ftft_other_fed_grant_total BIGINT,    -- OFGRT_T
  ftft_other_fed_grant_avg  INTEGER,    -- OFGRT_A

  -- ── FTFT: state / local grants ───────────────────────────────────────────
  ftft_state_grant_n        INTEGER,    -- SGRNT_N
  ftft_state_grant_pct      SMALLINT,   -- SGRNT_P
  ftft_state_grant_total    BIGINT,     -- SGRNT_T
  ftft_state_grant_avg      INTEGER,    -- SGRNT_A

  -- ── FTFT: institutional grants (most relevant for aid analysis) ───────────
  ftft_inst_grant_n         INTEGER,    -- IGRNT_N
  ftft_inst_grant_pct       SMALLINT,   -- IGRNT_P
  ftft_inst_grant_total     BIGINT,     -- IGRNT_T
  ftft_inst_grant_avg       INTEGER,    -- IGRNT_A  ← key metric

  -- ── FTFT: any student loans ───────────────────────────────────────────────
  ftft_loan_n               INTEGER,    -- LOAN_N
  ftft_loan_pct             SMALLINT,   -- LOAN_P
  ftft_loan_total           BIGINT,     -- LOAN_T
  ftft_loan_avg             INTEGER,    -- LOAN_A

  -- ── FTFT: federal student loans (Stafford / Direct) ──────────────────────
  ftft_fed_loan_n           INTEGER,    -- FLOAN_N
  ftft_fed_loan_pct         SMALLINT,   -- FLOAN_P
  ftft_fed_loan_total       BIGINT,     -- FLOAN_T
  ftft_fed_loan_avg         INTEGER,    -- FLOAN_A

  -- ── FTFT: other loans (private, parent PLUS, etc.) ───────────────────────
  ftft_other_loan_n         INTEGER,    -- OLOAN_N
  ftft_other_loan_pct       SMALLINT,   -- OLOAN_P
  ftft_other_loan_total     BIGINT,     -- OLOAN_T
  ftft_other_loan_avg       INTEGER,    -- OLOAN_A

  updated_at                TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE ipeds_sfa ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_public_read"   ON ipeds_sfa FOR SELECT USING (true);
CREATE POLICY "allow_public_upsert" ON ipeds_sfa FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_public_update" ON ipeds_sfa FOR UPDATE USING (true) WITH CHECK (true);
