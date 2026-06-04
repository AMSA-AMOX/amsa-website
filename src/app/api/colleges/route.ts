import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { College, MeritScholarship } from "@/app/(dashboard)/dashboard/research/types";
import { USNEWS_LAC_IDS } from "@/data/usnews-rankings";

// ─── DB row types ─────────────────────────────────────────────────────────────

type CollegesBaseRow = {
  unitid: number;
  name: string;
  city: string | null;
  state: string | null;
  zip: string | null;
  school_url: string | null;
  price_calculator_url: string | null;
  locale: number | null;
  ownership: number | null;
  latitude: number | null;
  longitude: number | null;
  accreditor: string | null;
  accreditor_code: string | null;
  carnegie_basic: number | null;
  carnegie_size_setting: number | null;
  religious_affiliation: number | null;
  ms_hispanic: boolean | null;
  ms_annh: boolean | null;
  ms_tribal: boolean | null;
  ms_aanipi: boolean | null;
  under_investigation: boolean | null;
  ft_faculty_rate: number | null;
  faculty_salary: number | null;
  endowment: number | null;
  open_admissions_policy: number | null;
  degrees_awarded_highest: number | null;
  // Admissions
  adm_rate: number | null;
  test_requirements: number | null;
  sat_avg: number | null;
  sat_read_25: number | null;
  sat_read_75: number | null;
  sat_math_25: number | null;
  sat_math_75: number | null;
  act_25: number | null;
  act_mid: number | null;
  act_75: number | null;
  // Costs
  costt4_a: number | null;
  tuition_in_state: number | null;
  tuition_out_of_state: number | null;
  room_and_board: number | null;
  books_and_supplies: number | null;
  other_expenses: number | null;
  npt4_pub: number | null;
  npt4_priv: number | null;
  avg_net_price_overall: number | null;
  net_price_0_30k: number | null;
  net_price_30k_48k: number | null;
  net_price_48k_75k: number | null;
  net_price_75k_110k: number | null;
  net_price_110k_plus: number | null;
  // Aid
  pell_grant_rate: number | null;
  federal_loan_rate: number | null;
  students_with_any_loan: number | null;
  median_debt_completers: number | null;
  median_debt_monthly: number | null;
  debt_90th: number | null;
  debt_75th: number | null;
  debt_25th: number | null;
  debt_10th: number | null;
  // Students
  ugds: number | null;
  ugds_nra: number | null;
  grad_students: number | null;
  retention_rate: number | null;
  demo_men: number | null;
  demo_women: number | null;
  demo_white: number | null;
  demo_black: number | null;
  demo_hispanic: number | null;
  demo_asian: number | null;
  demo_two_or_more: number | null;
  demo_nonresident_alien: number | null;
  share_first_gen: number | null;
  share_25_older: number | null;
  share_part_time: number | null;
  share_low_income: number | null;
  // Completion & earnings
  c150_4: number | null;
  completion_rate_4yr: number | null;
  consumer_completion_rate: number | null;
  md_earn_wne_p10: number | null;
  earnings_10yr_median: number | null;
  default_rate_3yr: number | null;
  // Programs
  has_stem_programs: boolean;
  major_categories: string[] | null;
  // Ranks / meta
  academic_strength: number | null;
  national_rank: number | null;
  reddit_subs: string[] | null;
  niche_slug: string | null;
  usnews_slug: string | null;
};

type IntlAidRow = {
  scorecard_id: number;
  offers_aid: boolean;
  pct_receiving_aid: number | null;
  avg_aid_package: number | null;
  meets_full_need: boolean;
  no_loan_policy: boolean;
  merit_scholarships: MeritScholarship[] | null;
  aid_renewable: boolean;
  renewal_conditions: string | null;
  countries_represented: number | null;
  recruits_underrepresented: boolean;
  intl_acceptance_rate: number | null;
  cost_of_living_index: number;
  health_insurance: number;
  data_source: "cds_high" | "cds_medium" | "ipeds_fallback" | "no_aid_data" | null;
};

type IpedsFallbackRow = {
  unitid: number;
  intl_enrolled_ipeds: number | null;
  avg_institutional_grant: number | null;
  pct_receiving_institutional_grant: number | null;
  data_year: number | null;
};

type IpedsSfaRow = {
  unitid: number;
  data_year: number | null;
  total_undergrads: number | null;
  ftft_count: number | null;
  ftft_any_aid_pct: number | null;
  ftft_grant_scholarship_pct: number | null;
  ftft_any_grant_avg: number | null;
  ftft_any_grant_pct: number | null;
  ftft_inst_grant_avg: number | null;
  ftft_inst_grant_pct: number | null;
  ftft_inst_grant_n: number | null;
  ftft_pell_pct: number | null;
  ftft_pell_avg: number | null;
  ftft_fed_loan_pct: number | null;
  ftft_fed_loan_avg: number | null;
  ftft_other_loan_pct: number | null;
  ftft_other_loan_avg: number | null;
  ftft_loan_pct: number | null;
  all_grant_avg: number | null;
  all_grant_pct: number | null;
  all_pell_pct: number | null;
  all_fed_loan_pct: number | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computeFinancialScore(
  totalCOA: number,
  estimatedNetCost: number | null,
  offersAid: boolean,
  pctReceivingAid: number | null,
  salary: number | null
): number {
  const aidAvail    = offersAid ? 100 : 0;
  const aidReach    = pctReceivingAid ?? 0;
  const netCost     = estimatedNetCost ?? totalCOA;
  const netCostScore = Math.max(0, Math.min(100, 100 - (netCost / 80000) * 100));
  let debtIncome = 50;
  if (salary && salary > 0) {
    const ratio = (totalCOA * 4) / (salary * 10);
    debtIncome = Math.max(0, Math.min(100, (1 - ratio) * 100));
  }
  return Math.round(aidAvail * 0.25 + aidReach * 0.25 + netCostScore * 0.3 + debtIncome * 0.2);
}

function computeAcademicStrength(base: CollegesBaseRow): number {
  const grad  = Math.max(0, Math.min(1, base.completion_rate_4yr ?? base.c150_4 ?? 0));
  const sel   = base.adm_rate != null ? Math.max(0, Math.min(1, 1 - base.adm_rate)) : 0.35;
  const earn  = Math.max(0, Math.min(150000, base.earnings_10yr_median ?? base.md_earn_wne_p10 ?? 0));
  return grad * 0.45 + (earn / 150000) * 0.35 + sel * 0.2;
}

function deriveLogoUrl(website: string | null): string | null {
  if (!website) return null;
  try {
    const host = new URL(website.startsWith("http") ? website : `https://${website}`).hostname;
    if (!host) return null;
    const rootHost = host.startsWith("www.") ? host.slice(4) : host;
    const token = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN;
    return token ? `https://img.logo.dev/${rootHost}?token=${encodeURIComponent(token)}` : `https://img.logo.dev/${rootHost}`;
  } catch { return null; }
}

// ─── Merge ───────────────────────────────────────────────────────────────────

function merge(
  base: CollegesBaseRow,
  aid: IntlAidRow | undefined,
  ipeds: IpedsFallbackRow | undefined,
  sfa: IpedsSfaRow | undefined,
  rankMap: Map<number, number>
): College {
  const isPublic = base.ownership === 1;

  const tuition =
    isPublic
      ? (base.tuition_out_of_state ?? base.tuition_in_state ?? 0)
      : (base.tuition_in_state ?? base.tuition_out_of_state ?? 0);

  const roomAndBoard     = base.room_and_board    ?? 0;
  const booksAndSupplies = base.books_and_supplies ?? 1000;
  const personalExpenses = base.other_expenses     ?? 2000;
  const healthInsurance  = aid?.health_insurance   ?? 3000;
  const totalCOA = tuition + roomAndBoard + healthInsurance + booksAndSupplies + personalExpenses;

  // Aid amount: prefer manually-curated CDS data, then IPEDS SFA institutional grant,
  // then legacy ipeds_fallback
  const avgAidPackage =
    aid?.avg_aid_package
    ?? sfa?.ftft_inst_grant_avg
    ?? ipeds?.avg_institutional_grant
    ?? null;

  // A school "offers aid" if CDS says so, or if IPEDS SFA shows any institutional
  // grant recipients (ftft_inst_grant_n > 0), or if legacy fallback has data
  const offersAid =
    aid?.offers_aid != null
      ? aid.offers_aid
      : (sfa?.ftft_inst_grant_n ?? 0) > 0
        ? true
        : ipeds?.avg_institutional_grant != null;

  // % receiving aid: prefer CDS, then IPEDS SFA any-grant %, then legacy fallback
  const pctReceivingAid =
    aid?.pct_receiving_aid
    ?? sfa?.ftft_any_grant_pct
    ?? (ipeds?.pct_receiving_institutional_grant != null
        ? Math.min(100, Math.round(ipeds.pct_receiving_institutional_grant))
        : null);

  const estimatedNetCost =
    avgAidPackage != null ? Math.max(0, totalCOA - avgAidPackage) : null;

  const salary = base.earnings_10yr_median ?? base.md_earn_wne_p10 ?? null;

  // Share of non-resident-alien (international) undergrads, 0–1.
  // Scorecard's `share_nonresident_alien` (→ ugds_nra) is almost always
  // suppressed, so fall back to the race/ethnicity NRA share
  // (→ demo_nonresident_alien), which mirrors IPEDS UGDS_NRA and is populated
  // for the large majority of schools.
  const nraShare = base.ugds_nra ?? base.demo_nonresident_alien ?? null;

  const intlStudentsEstimate =
    ipeds?.intl_enrolled_ipeds ??
    (base.ugds != null && nraShare != null
      ? Math.round(base.ugds * nraShare) : null);

  // International percentage, derived from the best available source:
  // 1) NRA share (Scorecard/IPEDS), else 2) IPEDS intl headcount ÷ undergrads.
  const internationalPercent =
    nraShare != null
      ? Math.round(nraShare * 1000) / 10
      : ipeds?.intl_enrolled_ipeds != null && base.ugds
        ? Math.round((ipeds.intl_enrolled_ipeds / base.ugds) * 1000) / 10
        : null;

  const rawSource = aid?.data_source;
  const dataSource: College["dataSource"] =
    rawSource === "cds_high"         ? "cds_high"
    : rawSource === "cds_medium"     ? "cds_medium"
    : rawSource === "ipeds_fallback" ? "ipeds_fallback"
    : sfa                            ? "ipeds_fallback"
    : ipeds                          ? "ipeds_fallback"
    : "no_aid_data";

  return {
    id:   base.unitid,
    name: base.name,
    state:    base.state ?? "",
    zip:      base.zip ?? null,
    type:     USNEWS_LAC_IDS.has(base.unitid) ? "liberal_arts" : isPublic ? "public" : "private",
    location: base.city ? `${base.city}, ${base.state ?? ""}` : (base.state ?? ""),
    locale:   base.locale ?? null,
    website:  base.school_url ?? null,
    logoUrl:  deriveLogoUrl(base.school_url ?? null),
    latitude:  base.latitude  ?? null,
    longitude: base.longitude ?? null,
    priceCalculatorUrl: base.price_calculator_url ?? null,

    accreditor:         base.accreditor ?? null,
    accreditorCode:     base.accreditor_code ?? null,
    carnegieBasic:      base.carnegie_basic ?? null,
    carnegieSizeSetting:base.carnegie_size_setting ?? null,
    religiousAffiliation: base.religious_affiliation ?? null,
    minorityServing: {
      hispanic: base.ms_hispanic ?? false,
      annh:     base.ms_annh     ?? false,
      tribal:   base.ms_tribal   ?? false,
      aanipi:   base.ms_aanipi   ?? false,
    },
    underInvestigation:   base.under_investigation ?? false,
    ftFacultyRate:        base.ft_faculty_rate ?? null,
    facultySalary:        base.faculty_salary  ?? null,
    endowment:            base.endowment       ?? null,
    openAdmissions:       base.open_admissions_policy === 1,
    degreesAwardedHighest:base.degrees_awarded_highest ?? null,

    overallAcceptanceRate:
      base.adm_rate != null ? Math.round(base.adm_rate * 1000) / 10 : null,
    testRequirements:  base.test_requirements ?? null,
    satAvg:            base.sat_avg    ?? null,
    satRead25:         base.sat_read_25 ?? null,
    satRead75:         base.sat_read_75 ?? null,
    satMath25:         base.sat_math_25 ?? null,
    satMath75:         base.sat_math_75 ?? null,
    act25:             base.act_25  ?? null,
    actMid:            base.act_mid ?? null,
    act75:             base.act_75  ?? null,

    tuition,
    roomAndBoard,
    booksAndSupplies,
    personalExpenses,
    totalCostOfAttendance: totalCOA,
    avgNetPriceOverall:    base.avg_net_price_overall ?? null,
    netPrice0_30k:         base.net_price_0_30k   ?? null,
    netPrice30k_48k:       base.net_price_30k_48k ?? null,
    netPrice48k_75k:       base.net_price_48k_75k ?? null,
    netPrice75k_110k:      base.net_price_75k_110k ?? null,
    netPrice110kPlus:      base.net_price_110k_plus ?? null,

    pellGrantRate:        base.pell_grant_rate       ?? null,
    federalLoanRate:      base.federal_loan_rate     ?? null,
    studentsWithAnyLoan:  base.students_with_any_loan ?? null,
    medianDebtCompleters: base.median_debt_completers ?? null,
    medianDebtMonthly:    base.median_debt_monthly    ?? null,
    debt90th:             base.debt_90th ?? null,
    debt75th:             base.debt_75th ?? null,
    debt25th:             base.debt_25th ?? null,
    debt10th:             base.debt_10th ?? null,

    ugds:                  base.ugds           ?? null,
    gradStudents:          base.grad_students  ?? null,
    intlStudentsEstimate,
    internationalPercent,
    retentionRate:         base.retention_rate ?? null,
    shareFirstGen:         base.share_first_gen ?? null,
    share25Older:          base.share_25_older  ?? null,
    sharePartTime:         base.share_part_time ?? null,
    shareLowIncome:        base.share_low_income ?? null,

    demoMen:               base.demo_men   ?? null,
    demoWomen:             base.demo_women ?? null,
    demoWhite:             base.demo_white ?? null,
    demoBlack:             base.demo_black ?? null,
    demoHispanic:          base.demo_hispanic ?? null,
    demoAsian:             base.demo_asian   ?? null,
    demoTwoOrMore:         base.demo_two_or_more ?? null,
    demoNonResidentAlien:  base.demo_nonresident_alien ?? null,

    completionRate4yr:      base.completion_rate_4yr ?? base.c150_4 ?? null,
    consumerCompletionRate: base.consumer_completion_rate ?? null,
    averageStartingSalary:  salary,
    defaultRate3yr:         base.default_rate_3yr ?? null,

    nationalRank: rankMap.get(base.unitid) ?? null,
    majorCategories:
      base.major_categories?.length
        ? base.major_categories
        : base.has_stem_programs ? ["Engineering", "Computer Science"] : [],
    stemOptEligible:  base.has_stem_programs,
    costOfLivingIndex:aid?.cost_of_living_index ?? 50,
    financialAccessibilityScore: computeFinancialScore(
      totalCOA, estimatedNetCost, offersAid, pctReceivingAid, salary
    ),
    estimatedNetCost,

    offersAidToInternationals:       offersAid,
    averageAidPackage:               avgAidPackage,
    percentReceivingAid:             pctReceivingAid,
    meetsFullDemonstratedNeed:       aid?.meets_full_need ?? false,
    noLoanPolicy:                    aid?.no_loan_policy  ?? false,
    meritScholarships:               aid?.merit_scholarships ?? [],
    aidIsRenewable:                  aid?.aid_renewable   ?? false,
    renewalConditions:               aid?.renewal_conditions ?? null,
    healthInsurance,
    countriesRepresented:            aid?.countries_represented ?? null,
    activelyRecruitsUnderrepresented:aid?.recruits_underrepresented ?? false,
    internationalAcceptanceRate:     aid?.intl_acceptance_rate ?? null,
    dataSource,

    redditSubs: base.reddit_subs ?? [],
    nicheSlug:  base.niche_slug  ?? null,
    usNewsSlug: base.usnews_slug ?? null,
  };
}

// ─── Route ───────────────────────────────────────────────────────────────────

export async function GET() {
  const { data: baseRows, error: baseErr } = await supabase
    .from("colleges_base")
    .select("*");

  if (baseErr) {
    console.error("[colleges] colleges_base error:", baseErr.message);
    return NextResponse.json({ error: "Failed to load college list" }, { status: 500 });
  }

  if (!baseRows || baseRows.length === 0) {
    return NextResponse.json(
      { error: "colleges_base is empty — run the Sync Colleges action from the admin panel." },
      { status: 503 }
    );
  }

  const unitIds = (baseRows as CollegesBaseRow[]).map((r) => r.unitid);

  // Use persisted US News national_rank directly (null = unranked, no badge shown)
  const nationalRankMap = new Map<number, number>();
  (baseRows as CollegesBaseRow[]).forEach((s) => {
    if (s.national_rank != null) nationalRankMap.set(s.unitid, s.national_rank);
  });

  // Load all data sources in parallel
  const [aidResult, ipedsResult, sfaResult] = await Promise.all([
    supabase.from("college_intl_aid").select("*").in("scorecard_id", unitIds),
    supabase.from("ipeds_fallback").select("*").in("unitid", unitIds),
    supabase.from("ipeds_sfa").select(
      "unitid,data_year,total_undergrads,ftft_count," +
      "ftft_any_aid_pct,ftft_grant_scholarship_pct," +
      "ftft_any_grant_avg,ftft_any_grant_pct," +
      "ftft_inst_grant_avg,ftft_inst_grant_pct,ftft_inst_grant_n," +
      "ftft_pell_pct,ftft_pell_avg," +
      "ftft_fed_loan_pct,ftft_fed_loan_avg," +
      "ftft_other_loan_pct,ftft_other_loan_avg," +
      "ftft_loan_pct," +
      "all_grant_avg,all_grant_pct,all_pell_pct,all_fed_loan_pct"
    ).in("unitid", unitIds),
  ]);

  if (aidResult.error)   console.error("[colleges] college_intl_aid:", aidResult.error.message);
  if (ipedsResult.error) console.error("[colleges] ipeds_fallback:",   ipedsResult.error.message);
  if (sfaResult.error)   console.error("[colleges] ipeds_sfa:",        sfaResult.error.message);

  const aidMap = new Map<number, IntlAidRow>();
  for (const row of aidResult.data ?? []) aidMap.set(row.scorecard_id, row as IntlAidRow);

  const ipedsMap = new Map<number, IpedsFallbackRow>();
  for (const row of ipedsResult.data ?? []) ipedsMap.set(row.unitid, row as IpedsFallbackRow);

  const sfaMap = new Map<number, IpedsSfaRow>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const row of (sfaResult.data ?? []) as any[]) sfaMap.set(row.unitid, row as IpedsSfaRow);

  const colleges: College[] = (baseRows as CollegesBaseRow[])
    .map((base) => merge(
      base,
      aidMap.get(base.unitid),
      ipedsMap.get(base.unitid),
      sfaMap.get(base.unitid),
      nationalRankMap
    ))
    .sort((a, b) => b.financialAccessibilityScore - a.financialAccessibilityScore);

  return NextResponse.json(
    { colleges },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600" } }
  );
}
