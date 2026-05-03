/**
 * GET /api/colleges/[id]/scorecard
 *
 * Returns rich Scorecard data for a single college, served from the colleges_base
 * DB table (populated by POST /api/admin/sync-colleges).
 * Falls back to the live Scorecard API for admission/test data if the DB row is
 * missing the newer columns (i.e. before the first expanded sync).
 */
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export type ScorecardProfile = {
  // Admissions
  satAvg: number | null;
  sat25Read: number | null;
  sat75Read: number | null;
  sat25Math: number | null;
  sat75Math: number | null;
  act25: number | null;
  actMid: number | null;
  act75: number | null;
  testRequirements: number | null;
  // Enrollment
  enrollment: number | null;
  gradStudents: number | null;
  // Outcomes
  retentionRate: number | null;
  gradRate: number | null;
  consumerCompletionRate: number | null;
  defaultRate3yr: number | null;
  // Demographics
  menShare: number | null;
  womenShare: number | null;
  partTimeShare: number | null;
  shareFirstGen: number | null;
  share25Older: number | null;
  shareLowIncome: number | null;
  // Race/ethnicity
  demoWhite: number | null;
  demoBlack: number | null;
  demoHispanic: number | null;
  demoAsian: number | null;
  demoTwoOrMore: number | null;
  demoNonResidentAlien: number | null;
  // Costs
  avgNetPriceOverall: number | null;
  netPrice0_30k: number | null;
  netPrice30k_48k: number | null;
  netPrice48k_75k: number | null;
  netPrice75k_110k: number | null;
  netPrice110kPlus: number | null;
  // Aid
  pellGrantRate: number | null;
  federalLoanRate: number | null;
  studentsWithAnyLoan: number | null;
  medianDebtCompleters: number | null;
  medianDebtMonthly: number | null;
  debt90th: number | null;
  debt75th: number | null;
  debt25th: number | null;
  debt10th: number | null;
  // Institution
  facultySalary: number | null;
  ftFacultyRate: number | null;
  endowment: number | null;
  carnegieBasic: number | null;
  accreditor: string | null;
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const unitid = parseInt(id, 10);

  if (!Number.isFinite(unitid)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  // Try to serve from DB first
  const { data: rawRow, error: dbErr } = await supabase
    .from("colleges_base")
    .select(
      "sat_avg, sat_read_25, sat_read_75, sat_math_25, sat_math_75," +
      "act_25, act_mid, act_75, test_requirements," +
      "ugds, grad_students, retention_rate, completion_rate_4yr, c150_4," +
      "consumer_completion_rate, default_rate_3yr," +
      "demo_men, demo_women, share_part_time, share_first_gen, share_25_older, share_low_income," +
      "demo_white, demo_black, demo_hispanic, demo_asian, demo_two_or_more, demo_nonresident_alien," +
      "avg_net_price_overall, net_price_0_30k, net_price_30k_48k, net_price_48k_75k, net_price_75k_110k, net_price_110k_plus," +
      "pell_grant_rate, federal_loan_rate, students_with_any_loan," +
      "median_debt_completers, median_debt_monthly, debt_90th, debt_75th, debt_25th, debt_10th," +
      "faculty_salary, ft_faculty_rate, endowment, carnegie_basic, accreditor"
    )
    .eq("unitid", unitid)
    .maybeSingle();

  const row = rawRow as any;

  if (!dbErr && row) {
    // Cast to any: these columns exist in the DB but aren't in the local generated types yet
    const r = row as any;
    const profile: ScorecardProfile = {
      satAvg:               r.sat_avg       ?? null,
      sat25Read:            r.sat_read_25   ?? null,
      sat75Read:            r.sat_read_75   ?? null,
      sat25Math:            r.sat_math_25   ?? null,
      sat75Math:            r.sat_math_75   ?? null,
      act25:                r.act_25  ?? null,
      actMid:               r.act_mid ?? null,
      act75:                r.act_75  ?? null,
      testRequirements:     r.test_requirements ?? null,
      enrollment:           r.ugds       ?? null,
      gradStudents:         r.grad_students ?? null,
      retentionRate:        r.retention_rate ?? null,
      gradRate:             r.completion_rate_4yr ?? r.c150_4 ?? null,
      consumerCompletionRate: r.consumer_completion_rate ?? null,
      defaultRate3yr:       r.default_rate_3yr ?? null,
      menShare:             r.demo_men    ?? null,
      womenShare:           r.demo_women  ?? null,
      partTimeShare:        r.share_part_time ?? null,
      shareFirstGen:        r.share_first_gen ?? null,
      share25Older:         r.share_25_older  ?? null,
      shareLowIncome:       r.share_low_income ?? null,
      demoWhite:            r.demo_white    ?? null,
      demoBlack:            r.demo_black    ?? null,
      demoHispanic:         r.demo_hispanic ?? null,
      demoAsian:            r.demo_asian    ?? null,
      demoTwoOrMore:        r.demo_two_or_more ?? null,
      demoNonResidentAlien: r.demo_nonresident_alien ?? null,
      avgNetPriceOverall:   r.avg_net_price_overall ?? null,
      netPrice0_30k:        r.net_price_0_30k   ?? null,
      netPrice30k_48k:      r.net_price_30k_48k ?? null,
      netPrice48k_75k:      r.net_price_48k_75k ?? null,
      netPrice75k_110k:     r.net_price_75k_110k ?? null,
      netPrice110kPlus:     r.net_price_110k_plus ?? null,
      pellGrantRate:        r.pell_grant_rate       ?? null,
      federalLoanRate:      r.federal_loan_rate     ?? null,
      studentsWithAnyLoan:  r.students_with_any_loan ?? null,
      medianDebtCompleters: r.median_debt_completers ?? null,
      medianDebtMonthly:    r.median_debt_monthly    ?? null,
      debt90th:             r.debt_90th ?? null,
      debt75th:             r.debt_75th ?? null,
      debt25th:             r.debt_25th ?? null,
      debt10th:             r.debt_10th ?? null,
      facultySalary:        r.faculty_salary  ?? null,
      ftFacultyRate:        r.ft_faculty_rate ?? null,
      endowment:            r.endowment       ?? null,
      carnegieBasic:        r.carnegie_basic  ?? null,
      accreditor:           r.accreditor      ?? null,
    };

    return NextResponse.json(profile, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600" },
    });
  }

  // Fallback: live Scorecard API
  const apiKey = process.env.COLLEGE_SCORECARD_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "No data available" }, { status: 404 });
  }

  const FIELDS = [
    "id",
    "latest.admissions.sat_scores.average.overall",
    "latest.admissions.sat_scores.25th_percentile.critical_reading",
    "latest.admissions.sat_scores.75th_percentile.critical_reading",
    "latest.admissions.sat_scores.25th_percentile.math",
    "latest.admissions.sat_scores.75th_percentile.math",
    "latest.admissions.act_scores.25th_percentile.cumulative",
    "latest.admissions.act_scores.midpoint.cumulative",
    "latest.admissions.act_scores.75th_percentile.cumulative",
    "latest.admissions.test_requirements",
    "latest.student.size",
    "latest.student.grad_students",
    "latest.student.retention_rate.four_year.full_time",
    "latest.completion.completion_rate_4yr_150nt",
    "latest.completion.consumer_rate",
    "latest.repayment.3_yr_default_rate",
    "latest.student.demographics.men",
    "latest.student.demographics.women",
    "latest.student.part_time_share",
    "latest.student.share_firstgeneration",
    "latest.student.share_25_older",
    "latest.student.share_lowincome.0_30000",
    "latest.student.demographics.race_ethnicity.white",
    "latest.student.demographics.race_ethnicity.black",
    "latest.student.demographics.race_ethnicity.hispanic",
    "latest.student.demographics.race_ethnicity.asian",
    "latest.student.demographics.race_ethnicity.two_or_more",
    "latest.student.demographics.race_ethnicity.non_resident_alien",
    "latest.cost.avg_net_price.overall",
    "latest.cost.net_price.public.by_income_level.0-30000",
    "latest.cost.net_price.public.by_income_level.30001-48000",
    "latest.cost.net_price.public.by_income_level.48001-75000",
    "latest.cost.net_price.public.by_income_level.75001-110000",
    "latest.cost.net_price.public.by_income_level.110001-plus",
    "latest.cost.net_price.private.by_income_level.0-30000",
    "latest.cost.net_price.private.by_income_level.30001-48000",
    "latest.cost.net_price.private.by_income_level.48001-75000",
    "latest.cost.net_price.private.by_income_level.75001-110000",
    "latest.cost.net_price.private.by_income_level.110001-plus",
    "latest.aid.pell_grant_rate",
    "latest.aid.federal_loan_rate",
    "latest.aid.students_with_any_loan",
    "latest.aid.median_debt.completers.overall",
    "latest.aid.median_debt_suppressed.completers.monthly_payments",
    "latest.aid.cumulative_debt.90th_percentile",
    "latest.aid.cumulative_debt.75th_percentile",
    "latest.aid.cumulative_debt.25th_percentile",
    "latest.aid.cumulative_debt.10th_percentile",
    "school.faculty_salary",
    "school.ft_faculty_rate",
    "school.endowment.end",
    "school.carnegie_basic",
    "school.accreditor",
  ].join(",");

  try {
    const res = await fetch(
      `https://api.data.gov/ed/collegescorecard/v1/schools?id=${unitid}&fields=${FIELDS}&api_key=${apiKey}`,
      { headers: { "User-Agent": "AMSA-Research/1.0" }, next: { revalidate: 86400 } }
    );
    if (!res.ok) throw new Error(`Scorecard HTTP ${res.status}`);
    const body  = (await res.json()) as { results: Record<string, unknown>[] };
    const raw   = body.results?.[0] ?? {};

    const n = (key: string): number | null => {
      const v = raw[key];
      return typeof v === "number" && Number.isFinite(v) ? v : null;
    };
    const np = (bracket: string): number | null =>
      n(`latest.cost.net_price.public.by_income_level.${bracket}`)
      ?? n(`latest.cost.net_price.private.by_income_level.${bracket}`);

    const profile: ScorecardProfile = {
      satAvg:       n("latest.admissions.sat_scores.average.overall"),
      sat25Read:    n("latest.admissions.sat_scores.25th_percentile.critical_reading"),
      sat75Read:    n("latest.admissions.sat_scores.75th_percentile.critical_reading"),
      sat25Math:    n("latest.admissions.sat_scores.25th_percentile.math"),
      sat75Math:    n("latest.admissions.sat_scores.75th_percentile.math"),
      act25:        n("latest.admissions.act_scores.25th_percentile.cumulative"),
      actMid:       n("latest.admissions.act_scores.midpoint.cumulative"),
      act75:        n("latest.admissions.act_scores.75th_percentile.cumulative"),
      testRequirements: n("latest.admissions.test_requirements"),
      enrollment:   n("latest.student.size"),
      gradStudents: n("latest.student.grad_students"),
      retentionRate: n("latest.student.retention_rate.four_year.full_time"),
      gradRate:     n("latest.completion.completion_rate_4yr_150nt"),
      consumerCompletionRate: n("latest.completion.consumer_rate"),
      defaultRate3yr: n("latest.repayment.3_yr_default_rate"),
      menShare:       n("latest.student.demographics.men"),
      womenShare:     n("latest.student.demographics.women"),
      partTimeShare:  n("latest.student.part_time_share"),
      shareFirstGen:  n("latest.student.share_firstgeneration"),
      share25Older:   n("latest.student.share_25_older"),
      shareLowIncome: n("latest.student.share_lowincome.0_30000"),
      demoWhite:      n("latest.student.demographics.race_ethnicity.white"),
      demoBlack:      n("latest.student.demographics.race_ethnicity.black"),
      demoHispanic:   n("latest.student.demographics.race_ethnicity.hispanic"),
      demoAsian:      n("latest.student.demographics.race_ethnicity.asian"),
      demoTwoOrMore:  n("latest.student.demographics.race_ethnicity.two_or_more"),
      demoNonResidentAlien: n("latest.student.demographics.race_ethnicity.non_resident_alien"),
      avgNetPriceOverall: n("latest.cost.avg_net_price.overall"),
      netPrice0_30k:   np("0-30000"),
      netPrice30k_48k: np("30001-48000"),
      netPrice48k_75k: np("48001-75000"),
      netPrice75k_110k:np("75001-110000"),
      netPrice110kPlus:np("110001-plus"),
      pellGrantRate:        n("latest.aid.pell_grant_rate"),
      federalLoanRate:      n("latest.aid.federal_loan_rate"),
      studentsWithAnyLoan:  n("latest.aid.students_with_any_loan"),
      medianDebtCompleters: n("latest.aid.median_debt.completers.overall"),
      medianDebtMonthly:    n("latest.aid.median_debt_suppressed.completers.monthly_payments"),
      debt90th:             n("latest.aid.cumulative_debt.90th_percentile"),
      debt75th:             n("latest.aid.cumulative_debt.75th_percentile"),
      debt25th:             n("latest.aid.cumulative_debt.25th_percentile"),
      debt10th:             n("latest.aid.cumulative_debt.10th_percentile"),
      facultySalary:   n("school.faculty_salary"),
      ftFacultyRate:   n("school.ft_faculty_rate"),
      endowment:       n("school.endowment.end"),
      carnegieBasic:   n("school.carnegie_basic"),
      accreditor:      typeof raw["school.accreditor"] === "string" ? raw["school.accreditor"] : null,
    };

    return NextResponse.json(profile, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600" },
    });
  } catch (err) {
    console.error("[scorecard fallback]", err);
    return NextResponse.json({ error: "Scorecard API unavailable" }, { status: 502 });
  }
}
