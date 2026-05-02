export interface MeritScholarship {
  name: string;
  amount: number | null;
}

export interface College {
  id: number; // College Scorecard UNITID

  // ── Identity ───────────────────────────────────────────────────────────────
  name: string;
  state: string;
  zip: string | null;
  type: "private" | "public" | "liberal_arts";
  location: string;         // "City, ST"
  locale: number | null;    // 11=city-large … 43=rural-remote
  website: string | null;
  logoUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  priceCalculatorUrl: string | null;

  // ── Institution profile ────────────────────────────────────────────────────
  accreditor: string | null;
  accreditorCode: string | null;
  carnegieBasic: number | null;       // 15=R1, 16=R2, 18=Masters-L …
  carnegieSizeSetting: number | null;
  religiousAffiliation: number | null;
  minorityServing: {
    hispanic: boolean;
    annh: boolean;    // Alaska Native / Native Hawaiian
    tribal: boolean;
    aanipi: boolean;  // Asian/Pacific Islander
  };
  underInvestigation: boolean;
  ftFacultyRate: number | null;       // 0-1
  facultySalary: number | null;       // USD/month
  endowment: number | null;           // USD
  openAdmissions: boolean;
  degreesAwardedHighest: number | null; // 3=bachelor, 4=graduate

  // ── Admissions ─────────────────────────────────────────────────────────────
  overallAcceptanceRate: number | null; // 0-100
  testRequirements: number | null;      // 1=req, 2=rec, 3=neither, 5=considered
  satAvg: number | null;
  satRead25: number | null;
  satRead75: number | null;
  satMath25: number | null;
  satMath75: number | null;
  act25: number | null;
  actMid: number | null;
  act75: number | null;

  // ── Costs ──────────────────────────────────────────────────────────────────
  tuition: number;             // OOS for public, in-state for private (international relevant)
  roomAndBoard: number;
  booksAndSupplies: number;
  personalExpenses: number;
  totalCostOfAttendance: number;
  avgNetPriceOverall: number | null;  // institution-wide avg net price
  netPrice0_30k: number | null;
  netPrice30k_48k: number | null;
  netPrice48k_75k: number | null;
  netPrice75k_110k: number | null;
  netPrice110kPlus: number | null;

  // ── Aid ────────────────────────────────────────────────────────────────────
  pellGrantRate: number | null;        // 0-1 share of undergrads with Pell
  federalLoanRate: number | null;      // 0-1
  studentsWithAnyLoan: number | null;  // 0-1
  medianDebtCompleters: number | null; // USD
  medianDebtMonthly: number | null;    // USD/month
  debt90th: number | null;
  debt75th: number | null;
  debt25th: number | null;
  debt10th: number | null;

  // ── Students ───────────────────────────────────────────────────────────────
  ugds: number | null;                  // undergrad enrollment
  gradStudents: number | null;
  intlStudentsEstimate: number | null;
  internationalPercent: number | null;  // 0-100, null when IPEDS data absent
  retentionRate: number | null;         // 0-1
  shareFirstGen: number | null;         // 0-1
  share25Older: number | null;          // 0-1
  sharePartTime: number | null;         // 0-1
  shareLowIncome: number | null;        // 0-1 (household <$30k)

  // ── Demographics ───────────────────────────────────────────────────────────
  demoMen: number | null;               // 0-1
  demoWomen: number | null;
  demoWhite: number | null;
  demoBlack: number | null;
  demoHispanic: number | null;
  demoAsian: number | null;
  demoTwoOrMore: number | null;
  demoNonResidentAlien: number | null;

  // ── Completion & earnings ──────────────────────────────────────────────────
  completionRate4yr: number | null;     // 0-1 150% time
  consumerCompletionRate: number | null;
  averageStartingSalary: number | null; // USD/yr  10-yr median earnings

  // ── Repayment ──────────────────────────────────────────────────────────────
  defaultRate3yr: number | null;        // 0-1

  // ── Computed / scoring ─────────────────────────────────────────────────────
  nationalRank: number | null;
  majorCategories: string[];
  stemOptEligible: boolean;
  costOfLivingIndex: number;            // 1–100 (from college_intl_aid)
  financialAccessibilityScore: number;  // 0–100
  estimatedNetCost: number | null;

  // ── International aid (from college_intl_aid — manually curated CDS) ───────
  offersAidToInternationals: boolean;
  averageAidPackage: number | null;
  percentReceivingAid: number | null;
  meetsFullDemonstratedNeed: boolean;
  noLoanPolicy: boolean;
  meritScholarships: MeritScholarship[];
  aidIsRenewable: boolean;
  renewalConditions: string | null;
  healthInsurance: number;
  countriesRepresented: number | null;
  activelyRecruitsUnderrepresented: boolean;
  internationalAcceptanceRate: number | null;
  dataSource: "cds_high" | "cds_medium" | "ipeds_fallback" | "no_aid_data";

  // ── External links ─────────────────────────────────────────────────────────
  redditSubs: string[];
  nicheSlug: string | null;
  usNewsSlug: string | null;
}

export interface Filters {
  offersAidOnly: boolean;
  minAidPercent: number;       // 0–100
  maxTotalCOA: number;         // max slider 100000
  maxNetCost: number;
  meetsFullNeedOnly: boolean;
  meritScholarshipsOnly: boolean;
  minInternationalPercent: number; // 0–30
  stemOptOnly: boolean;
  selectedField: string;
  sortBy: "affordability" | "ranking";
  searchQuery: string;
}

export const DEFAULT_FILTERS: Filters = {
  offersAidOnly: false,
  minAidPercent: 0,
  maxTotalCOA: 200000,
  maxNetCost: 200000,
  meetsFullNeedOnly: false,
  meritScholarshipsOnly: false,
  minInternationalPercent: 0,
  stemOptOnly: false,
  selectedField: "Any",
  sortBy: "ranking",
  searchQuery: "",
};
