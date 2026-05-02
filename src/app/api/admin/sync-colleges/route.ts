/**
 * POST /api/admin/sync-colleges
 *
 * Fetches the full College Scorecard dataset and upserts into colleges_base.
 * Admin-only. No service role key needed.
 *
 * Filters: bachelor's-degree-granting, operating, min 500 undergrads,
 *          selective admissions (0.01–0.85 accept rate)
 * Sort:    admission rate ascending ≈ US-News selectivity order
 */

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyToken, assertRole } from "@/lib/auth";

const API_KEY  = process.env.COLLEGE_SCORECARD_API_KEY;
const BASE_URL = "https://api.data.gov/ed/collegescorecard/v1/schools";

// ─── Fields to fetch ─────────────────────────────────────────────────────────

const FIELDS = [
  "id",
  // Identity & location
  "school.name",
  "school.city",
  "school.state",
  "school.zip",
  "school.school_url",
  "school.price_calculator_url",
  "school.locale",
  "school.latitude",
  "school.longitude",
  "school.ownership",
  // Institution metadata
  "school.accreditor",
  "school.accreditor_code",
  "school.carnegie_basic",
  "school.carnegie_size_setting",
  "school.religious_affiliation",
  "school.minority_serving.hispanic",
  "school.minority_serving.annh",
  "school.minority_serving.tribal",
  "school.minority_serving.aanipi",
  "school.under_investigation",
  "school.ft_faculty_rate",
  "school.faculty_salary",
  "school.endowment.end",
  "school.open_admissions_policy",
  "school.degrees_awarded.highest",
  // Admissions
  "latest.admissions.admission_rate.overall",
  "latest.admissions.test_requirements",
  "latest.admissions.sat_scores.average.overall",
  "latest.admissions.sat_scores.25th_percentile.critical_reading",
  "latest.admissions.sat_scores.75th_percentile.critical_reading",
  "latest.admissions.sat_scores.25th_percentile.math",
  "latest.admissions.sat_scores.75th_percentile.math",
  "latest.admissions.act_scores.25th_percentile.cumulative",
  "latest.admissions.act_scores.midpoint.cumulative",
  "latest.admissions.act_scores.75th_percentile.cumulative",
  // Costs
  "latest.cost.attendance.academic_year",
  "latest.cost.tuition.in_state",
  "latest.cost.tuition.out_of_state",
  "latest.cost.roomboard.oncampus",
  "latest.cost.booksupply",
  "latest.cost.otherexpense.oncampus",
  "latest.cost.avg_net_price.public",
  "latest.cost.avg_net_price.private",
  "latest.cost.avg_net_price.overall",
  // Net price by income bracket (public)
  "latest.cost.net_price.public.by_income_level.0-30000",
  "latest.cost.net_price.public.by_income_level.30001-48000",
  "latest.cost.net_price.public.by_income_level.48001-75000",
  "latest.cost.net_price.public.by_income_level.75001-110000",
  "latest.cost.net_price.public.by_income_level.110001-plus",
  // Net price by income bracket (private)
  "latest.cost.net_price.private.by_income_level.0-30000",
  "latest.cost.net_price.private.by_income_level.30001-48000",
  "latest.cost.net_price.private.by_income_level.48001-75000",
  "latest.cost.net_price.private.by_income_level.75001-110000",
  "latest.cost.net_price.private.by_income_level.110001-plus",
  // Aid
  "latest.aid.pell_grant_rate",
  "latest.aid.federal_loan_rate",
  "latest.aid.students_with_any_loan",
  "latest.aid.median_debt.completers.overall",
  "latest.aid.median_debt_suppressed.completers.monthly_payments",
  "latest.aid.cumulative_debt.90th_percentile",
  "latest.aid.cumulative_debt.75th_percentile",
  "latest.aid.cumulative_debt.25th_percentile",
  "latest.aid.cumulative_debt.10th_percentile",
  // Students
  "latest.student.size",
  "latest.student.demographics.share_nonresident_alien",
  "latest.student.grad_students",
  "latest.student.retention_rate.four_year.full_time",
  "latest.student.demographics.men",
  "latest.student.demographics.women",
  "latest.student.demographics.race_ethnicity.white",
  "latest.student.demographics.race_ethnicity.black",
  "latest.student.demographics.race_ethnicity.hispanic",
  "latest.student.demographics.race_ethnicity.asian",
  "latest.student.demographics.race_ethnicity.two_or_more",
  "latest.student.demographics.race_ethnicity.non_resident_alien",
  "latest.student.share_firstgeneration",
  "latest.student.share_25_older",
  "latest.student.part_time_share",
  "latest.student.share_lowincome.0_30000",
  // Completion & earnings
  "latest.completion.completion_rate_4yr_150nt",
  "latest.completion.rate_suppressed.overall",
  "latest.completion.consumer_rate",
  "latest.earnings.10_yrs_after_entry.median",
  // Repayment
  "latest.repayment.3_yr_default_rate",
  // CIP (2-digit binary flags for program detection)
  "latest.academics.cip_2_digit.cip_11",
  "latest.academics.cip_2_digit.cip_14",
  "latest.academics.cip_2_digit.cip_15",
  "latest.academics.cip_2_digit.cip_26",
  "latest.academics.cip_2_digit.cip_27",
  "latest.academics.cip_2_digit.cip_40",
  "latest.academics.cip_2_digit.cip_41",
  "latest.academics.cip_2_digit.cip_51",
  "latest.academics.cip_2_digit.cip_01",
  "latest.academics.cip_2_digit.cip_03",
  "latest.academics.cip_2_digit.cip_04",
  "latest.academics.cip_2_digit.cip_05",
  "latest.academics.cip_2_digit.cip_09",
  "latest.academics.cip_2_digit.cip_13",
  "latest.academics.cip_2_digit.cip_22",
  "latest.academics.cip_2_digit.cip_23",
  "latest.academics.cip_2_digit.cip_24",
  "latest.academics.cip_2_digit.cip_30",
  "latest.academics.cip_2_digit.cip_38",
  "latest.academics.cip_2_digit.cip_42",
  "latest.academics.cip_2_digit.cip_43",
  "latest.academics.cip_2_digit.cip_44",
  "latest.academics.cip_2_digit.cip_45",
  "latest.academics.cip_2_digit.cip_50",
  "latest.academics.cip_2_digit.cip_52",
  "latest.academics.cip_2_digit.cip_54",
].join(",");

// ─── CIP helpers ─────────────────────────────────────────────────────────────

const STEM_CIPS = new Set(["11", "14", "15", "26", "27", "40", "41", "51"]);

const CIP_LABEL: Record<string, string> = {
  "01": "Agriculture",         "03": "Natural Resources",
  "04": "Architecture",        "05": "Area Studies",
  "09": "Communications",      "11": "Computer Science",
  "13": "Education",           "14": "Engineering",
  "15": "Engineering Tech",    "22": "Legal Studies",
  "23": "English",             "24": "Liberal Arts",
  "26": "Biology",             "27": "Math & Statistics",
  "30": "Interdisciplinary",   "38": "Philosophy",
  "40": "Physical Sciences",   "41": "Science Tech",
  "42": "Psychology",          "43": "Security Studies",
  "44": "Public Administration","45": "Social Sciences",
  "50": "Arts & Design",       "51": "Health Sciences",
  "52": "Business",            "54": "History",
};

type Row = Record<string, unknown>;

function num(r: Row, key: string): number | null {
  const v = r[key];
  if (v === null || v === undefined || v === "NULL" || v === "PrivacySuppressed") return null;
  const n = parseFloat(String(v));
  return isNaN(n) ? null : n;
}

function str(r: Row, key: string): string | null {
  const v = r[key];
  if (!v) return null;
  return String(v).trim() || null;
}

function bool(r: Row, key: string): boolean {
  return num(r, key) === 1;
}

function cipHas(r: Row, code: string): boolean {
  return num(r, `latest.academics.cip_2_digit.cip_${code}`) === 1;
}

function hasStem(r: Row): boolean {
  return Array.from(STEM_CIPS).some((c) => cipHas(r, c));
}

function majorCats(r: Row): string[] {
  return Object.keys(CIP_LABEL)
    .filter((c) => cipHas(r, c))
    .map((c) => CIP_LABEL[c])
    .sort();
}

/** Pick net price bracket from whichever institution type has data (public or private) */
function netPrice(r: Row, bracket: string): number | null {
  const pub  = num(r, `latest.cost.net_price.public.by_income_level.${bracket}`);
  const priv = num(r, `latest.cost.net_price.private.by_income_level.${bracket}`);
  return pub ?? priv;
}

function academicStrength(r: Row): number {
  const grad = Math.max(0, Math.min(1,
    num(r, "latest.completion.completion_rate_4yr_150nt")
    ?? num(r, "latest.completion.rate_suppressed.overall") ?? 0));
  const adm  = num(r, "latest.admissions.admission_rate.overall");
  const sel  = adm != null ? Math.max(0, Math.min(1, 1 - adm)) : 0.35;
  const earn = Math.max(0, Math.min(150000, num(r, "latest.earnings.10_yrs_after_entry.median") ?? 0));
  return Math.round((grad * 0.45 + (earn / 150000) * 0.35 + sel * 0.2) * 1000) / 1000;
}

// ─── API fetch ───────────────────────────────────────────────────────────────

async function fetchPage(
  page: number,
  perPage = 100
): Promise<{ results: Row[]; total: number }> {
  const params = new URLSearchParams({
    api_key:  API_KEY!,
    fields:   FIELDS,
    "school.degrees_awarded.highest__range": "3..",  // grants at least a bachelor's
    "school.operating":                      "1",    // currently operating
    "latest.student.size__range":            "500..",
    "latest.admissions.admission_rate.overall__range": "0.01..0.85",
    per_page: String(perPage),
    page:     String(page),
    sort:     "latest.admissions.admission_rate.overall:asc",
  });

  const res = await fetch(`${BASE_URL}?${params}`, {
    headers: { "User-Agent": "AMSA-Admin/1.0" },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Scorecard API ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  return { results: data.results ?? [], total: data.metadata?.total ?? 0 };
}

// ─── Route handler ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let payload;
  try { payload = verifyToken(req); }
  catch (res) { return res as NextResponse; }
  try { assertRole(payload, "admin"); }
  catch (res) { return res as NextResponse; }

  if (!API_KEY) {
    return NextResponse.json(
      { error: "COLLEGE_SCORECARD_API_KEY is not set." },
      { status: 500 }
    );
  }

  try {
    // 1. Fetch all pages
    const perPage = 100;
    const all: Row[] = [];

    const first = await fetchPage(0, perPage);
    all.push(...first.results);
    const totalPages = Math.ceil(first.total / perPage);

    for (let p = 1; p < totalPages; p++) {
      const { results } = await fetchPage(p, perPage);
      all.push(...results);
      await new Promise((r) => setTimeout(r, 300));
    }

    // 2. Build DB rows
    const now = new Date().toISOString();
    const rows = all
      .filter((r) => r["id"] && r["school.name"])
      .filter((r) => {
        // Post-filter: ≥1% international students (null = suppressed → keep)
        const nra = num(r, "latest.student.demographics.share_nonresident_alien");
        return nra === null || nra >= 0.01;
      })
      .map((r) => {
        const isPublic = num(r, "school.ownership") === 1;
        const tuitionIn  = num(r, "latest.cost.tuition.in_state");
        const tuitionOut = num(r, "latest.cost.tuition.out_of_state");

        return {
          unitid:                 Number(r["id"]),
          name:                   str(r, "school.name") ?? "Unknown",
          city:                   str(r, "school.city"),
          state:                  str(r, "school.state"),
          zip:                    str(r, "school.zip"),
          school_url:             str(r, "school.school_url"),
          price_calculator_url:   str(r, "school.price_calculator_url"),
          locale:                 num(r, "school.locale"),
          latitude:               num(r, "school.latitude"),
          longitude:              num(r, "school.longitude"),
          ownership:              num(r, "school.ownership"),
          accreditor:             str(r, "school.accreditor"),
          accreditor_code:        str(r, "school.accreditor_code"),
          carnegie_basic:         num(r, "school.carnegie_basic"),
          carnegie_size_setting:  num(r, "school.carnegie_size_setting"),
          religious_affiliation:  num(r, "school.religious_affiliation"),
          ms_hispanic:            bool(r, "school.minority_serving.hispanic"),
          ms_annh:                bool(r, "school.minority_serving.annh"),
          ms_tribal:              bool(r, "school.minority_serving.tribal"),
          ms_aanipi:              bool(r, "school.minority_serving.aanipi"),
          under_investigation:    bool(r, "school.under_investigation"),
          ft_faculty_rate:        num(r, "school.ft_faculty_rate"),
          faculty_salary:         num(r, "school.faculty_salary"),
          endowment:              num(r, "school.endowment.end"),
          open_admissions_policy: num(r, "school.open_admissions_policy"),
          degrees_awarded_highest:num(r, "school.degrees_awarded.highest"),
          // Admissions
          adm_rate:               num(r, "latest.admissions.admission_rate.overall"),
          test_requirements:      num(r, "latest.admissions.test_requirements"),
          sat_avg:                num(r, "latest.admissions.sat_scores.average.overall"),
          sat_read_25:            num(r, "latest.admissions.sat_scores.25th_percentile.critical_reading"),
          sat_read_75:            num(r, "latest.admissions.sat_scores.75th_percentile.critical_reading"),
          sat_math_25:            num(r, "latest.admissions.sat_scores.25th_percentile.math"),
          sat_math_75:            num(r, "latest.admissions.sat_scores.75th_percentile.math"),
          act_25:                 num(r, "latest.admissions.act_scores.25th_percentile.cumulative"),
          act_mid:                num(r, "latest.admissions.act_scores.midpoint.cumulative"),
          act_75:                 num(r, "latest.admissions.act_scores.75th_percentile.cumulative"),
          // Costs
          costt4_a:               num(r, "latest.cost.attendance.academic_year"),
          tuition_in_state:       tuitionIn,
          tuition_out_of_state:   tuitionOut,
          room_and_board:         num(r, "latest.cost.roomboard.oncampus"),
          books_and_supplies:     num(r, "latest.cost.booksupply"),
          other_expenses:         num(r, "latest.cost.otherexpense.oncampus"),
          npt4_pub:               isPublic  ? num(r, "latest.cost.avg_net_price.public")  : null,
          npt4_priv:              !isPublic ? num(r, "latest.cost.avg_net_price.private") : null,
          avg_net_price_overall:  num(r, "latest.cost.avg_net_price.overall"),
          net_price_0_30k:        netPrice(r, "0-30000"),
          net_price_30k_48k:      netPrice(r, "30001-48000"),
          net_price_48k_75k:      netPrice(r, "48001-75000"),
          net_price_75k_110k:     netPrice(r, "75001-110000"),
          net_price_110k_plus:    netPrice(r, "110001-plus"),
          // Aid
          pell_grant_rate:        num(r, "latest.aid.pell_grant_rate"),
          federal_loan_rate:      num(r, "latest.aid.federal_loan_rate"),
          students_with_any_loan: num(r, "latest.aid.students_with_any_loan"),
          median_debt_completers: num(r, "latest.aid.median_debt.completers.overall"),
          median_debt_monthly:    num(r, "latest.aid.median_debt_suppressed.completers.monthly_payments"),
          debt_90th:              num(r, "latest.aid.cumulative_debt.90th_percentile"),
          debt_75th:              num(r, "latest.aid.cumulative_debt.75th_percentile"),
          debt_25th:              num(r, "latest.aid.cumulative_debt.25th_percentile"),
          debt_10th:              num(r, "latest.aid.cumulative_debt.10th_percentile"),
          // Students
          ugds:                   num(r, "latest.student.size"),
          ugds_nra:               num(r, "latest.student.demographics.share_nonresident_alien"),
          grad_students:          num(r, "latest.student.grad_students"),
          retention_rate:         num(r, "latest.student.retention_rate.four_year.full_time"),
          demo_men:               num(r, "latest.student.demographics.men"),
          demo_women:             num(r, "latest.student.demographics.women"),
          demo_white:             num(r, "latest.student.demographics.race_ethnicity.white"),
          demo_black:             num(r, "latest.student.demographics.race_ethnicity.black"),
          demo_hispanic:          num(r, "latest.student.demographics.race_ethnicity.hispanic"),
          demo_asian:             num(r, "latest.student.demographics.race_ethnicity.asian"),
          demo_two_or_more:       num(r, "latest.student.demographics.race_ethnicity.two_or_more"),
          demo_nonresident_alien: num(r, "latest.student.demographics.race_ethnicity.non_resident_alien"),
          share_first_gen:        num(r, "latest.student.share_firstgeneration"),
          share_25_older:         num(r, "latest.student.share_25_older"),
          share_part_time:        num(r, "latest.student.part_time_share"),
          share_low_income:       num(r, "latest.student.share_lowincome.0_30000"),
          // Completion & earnings
          c150_4:                 num(r, "latest.completion.completion_rate_4yr_150nt")
                                    ?? num(r, "latest.completion.rate_suppressed.overall"),
          completion_rate_4yr:    num(r, "latest.completion.completion_rate_4yr_150nt")
                                    ?? num(r, "latest.completion.rate_suppressed.overall"),
          consumer_completion_rate: num(r, "latest.completion.consumer_rate"),
          md_earn_wne_p10:        num(r, "latest.earnings.10_yrs_after_entry.median"),
          earnings_10yr_median:   num(r, "latest.earnings.10_yrs_after_entry.median"),
          // Repayment
          default_rate_3yr:       num(r, "latest.repayment.3_yr_default_rate"),
          // Programs
          has_stem_programs:      hasStem(r),
          major_categories:       majorCats(r),
          // Computed
          academic_strength:      academicStrength(r),
          national_rank:          null as number | null,
          updated_at:             now,
        };
      });

    // 3. Assign national ranks by academic_strength (highest = rank 1)
    const sorted = [...rows].sort((a, b) => b.academic_strength - a.academic_strength);
    sorted.forEach((row, idx) => { row.national_rank = idx + 1; });

    // 4. Upsert in batches of 100
    const BATCH = 100;
    let upserted = 0;
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);
      const { error } = await supabase
        .from("colleges_base")
        .upsert(batch, { onConflict: "unitid" });
      if (error) throw new Error(`Supabase upsert failed: ${error.message}`);
      upserted += batch.length;
    }

    return NextResponse.json({ ok: true, synced: upserted, total: all.length });
  } catch (e: any) {
    console.error("[sync-colleges]", e);
    return NextResponse.json({ error: e.message ?? "Unknown error" }, { status: 500 });
  }
}
