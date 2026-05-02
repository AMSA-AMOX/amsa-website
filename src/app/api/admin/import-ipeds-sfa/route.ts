/**
 * POST /api/admin/import-ipeds-sfa
 *
 * Accepts a multipart/form-data upload of the IPEDS SFA CSV (e.g. sfa2324.csv)
 * and upserts into the ipeds_sfa table. Admin-only.
 *
 * Download CSV from: https://nces.ed.gov/ipeds/datacenter/DataFiles.aspx
 * → Student Financial Aid (SFA) → most recent year → Data file (.zip)
 */

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyToken, assertRole } from "@/lib/auth";

// Parse a CSV string into array of objects
function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const vals = line.split(",");
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h.trim()] = (vals[i] ?? "").trim(); });
    return obj;
  });
}

function int(v: string | undefined): number | null {
  if (!v || v === "" || v === "." || v === "R" || v === "A") return null;
  const n = parseInt(v, 10);
  return isNaN(n) ? null : n;
}

function bigint(v: string | undefined): number | null {
  if (!v || v === "" || v === "." || v === "R" || v === "A") return null;
  const n = parseFloat(v);
  return isNaN(n) ? null : Math.round(n);
}

function toRow(r: Record<string, string>) {
  const unitid = int(r["UNITID"]);
  if (!unitid) return null;
  return {
    unitid,
    data_year: 2024,
    // Enrollment
    total_undergrads:           int(r["SCUGRAD"]),
    degree_seeking_undergrads:  int(r["SCUGDGSK"]),
    non_degree_undergrads:      int(r["SCUGNDGS"]),
    ftft_count:                 int(r["SCUGFFN"]),
    ftft_pct:                   int(r["SCUGFFP"]),
    // FA cohort
    fa_cohort_ug:               int(r["SCFA2"]),
    fa_cohort_ftft:             int(r["SCFA1N"]),
    fa_cohort_ftft_pct:         int(r["SCFA1P"]),
    // All UG: grant
    all_grant_n:                int(r["UAGRNTN"]),
    all_grant_pct:              int(r["UAGRNTP"]),
    all_grant_total:            bigint(r["UAGRNTT"]),
    all_grant_avg:              int(r["UAGRNTA"]),
    // All UG: Pell
    all_pell_n:                 int(r["UPGRNTN"]),
    all_pell_pct:               int(r["UPGRNTP"]),
    all_pell_total:             bigint(r["UPGRNTT"]),
    all_pell_avg:               int(r["UPGRNTA"]),
    // All UG: federal loans
    all_fed_loan_n:             int(r["UFLOANN"]),
    all_fed_loan_pct:           int(r["UFLOANP"]),
    all_fed_loan_total:         bigint(r["UFLOANT"]),
    all_fed_loan_avg:           int(r["UFLOANA"]),
    // FTFT: any aid
    ftft_any_aid_n:             int(r["ANYAIDN"]),
    ftft_any_aid_pct:           int(r["ANYAIDP"]),
    // FTFT: grant+scholarship
    ftft_grant_scholarship_n:   int(r["AIDFSIN"]),
    ftft_grant_scholarship_pct: int(r["AIDFSIP"]),
    // FTFT: any grant
    ftft_any_grant_n:           int(r["AGRNT_N"]),
    ftft_any_grant_pct:         int(r["AGRNT_P"]),
    ftft_any_grant_total:       bigint(r["AGRNT_T"]),
    ftft_any_grant_avg:         int(r["AGRNT_A"]),
    // FTFT: federal grants
    ftft_fed_grant_n:           int(r["FGRNT_N"]),
    ftft_fed_grant_pct:         int(r["FGRNT_P"]),
    ftft_fed_grant_total:       bigint(r["FGRNT_T"]),
    ftft_fed_grant_avg:         int(r["FGRNT_A"]),
    // FTFT: Pell
    ftft_pell_n:                int(r["PGRNT_N"]),
    ftft_pell_pct:              int(r["PGRNT_P"]),
    ftft_pell_total:            bigint(r["PGRNT_T"]),
    ftft_pell_avg:              int(r["PGRNT_A"]),
    // FTFT: other federal grants
    ftft_other_fed_grant_n:     int(r["OFGRT_N"]),
    ftft_other_fed_grant_pct:   int(r["OFGRT_P"]),
    ftft_other_fed_grant_total: bigint(r["OFGRT_T"]),
    ftft_other_fed_grant_avg:   int(r["OFGRT_A"]),
    // FTFT: state grants
    ftft_state_grant_n:         int(r["SGRNT_N"]),
    ftft_state_grant_pct:       int(r["SGRNT_P"]),
    ftft_state_grant_total:     bigint(r["SGRNT_T"]),
    ftft_state_grant_avg:       int(r["SGRNT_A"]),
    // FTFT: institutional grants ← key for financial aid analysis
    ftft_inst_grant_n:          int(r["IGRNT_N"]),
    ftft_inst_grant_pct:        int(r["IGRNT_P"]),
    ftft_inst_grant_total:      bigint(r["IGRNT_T"]),
    ftft_inst_grant_avg:        int(r["IGRNT_A"]),
    // FTFT: any loans
    ftft_loan_n:                int(r["LOAN_N"]),
    ftft_loan_pct:              int(r["LOAN_P"]),
    ftft_loan_total:            bigint(r["LOAN_T"]),
    ftft_loan_avg:              int(r["LOAN_A"]),
    // FTFT: federal loans
    ftft_fed_loan_n:            int(r["FLOAN_N"]),
    ftft_fed_loan_pct:          int(r["FLOAN_P"]),
    ftft_fed_loan_total:        bigint(r["FLOAN_T"]),
    ftft_fed_loan_avg:          int(r["FLOAN_A"]),
    // FTFT: other loans (private / parent PLUS)
    ftft_other_loan_n:          int(r["OLOAN_N"]),
    ftft_other_loan_pct:        int(r["OLOAN_P"]),
    ftft_other_loan_total:      bigint(r["OLOAN_T"]),
    ftft_other_loan_avg:        int(r["OLOAN_A"]),
    updated_at: new Date().toISOString(),
  };
}

export async function POST(req: NextRequest) {
  let payload;
  try { payload = verifyToken(req); }
  catch (res) { return res as NextResponse; }
  try { assertRole(payload, "admin"); }
  catch (res) { return res as NextResponse; }

  let csvText: string;
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided. Send as multipart/form-data field 'file'." }, { status: 400 });
    }
    csvText = await file.text();
  } catch {
    return NextResponse.json({ error: "Failed to read uploaded file." }, { status: 400 });
  }

  const rawRows = parseCSV(csvText);
  if (rawRows.length === 0) {
    return NextResponse.json({ error: "CSV appears empty or malformed." }, { status: 400 });
  }

  const rows = rawRows.map(toRow).filter((r): r is NonNullable<typeof r> => r !== null);

  // Upsert in batches of 200
  const BATCH = 200;
  let upserted = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await supabase
      .from("ipeds_sfa")
      .upsert(batch, { onConflict: "unitid" });
    if (error) {
      return NextResponse.json(
        { error: `Upsert failed at row ${i}: ${error.message}` },
        { status: 500 }
      );
    }
    upserted += batch.length;
  }

  return NextResponse.json({ ok: true, parsed: rawRows.length, upserted });
}
