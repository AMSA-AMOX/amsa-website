const SCHOOL_DOMAIN_ALIASES: Record<string, string> = {
  // ── Common abbreviations / aliases ───────────────────────────────────────
  "franklin and marshall college": "fandm.edu",
  "franklin & marshall college": "fandm.edu",
  "f and m": "fandm.edu",
  "f&m": "fandm.edu",
  fandm: "fandm.edu",
  "washington university in st louis": "wustl.edu",
  "washington university in saint louis": "wustl.edu",
  "washington university st louis": "wustl.edu",
  "washington university saint louis": "wustl.edu",
  washu: "wustl.edu",

  // ── Ivies & top privates ─────────────────────────────────────────────────
  "harvard university": "harvard.edu",
  "massachusetts institute of technology": "mit.edu",
  mit: "mit.edu",
  "stanford university": "stanford.edu",
  "yale university": "yale.edu",
  "princeton university": "princeton.edu",
  "columbia university": "columbia.edu",
  "university of pennsylvania": "upenn.edu",
  upenn: "upenn.edu",
  "dartmouth college": "dartmouth.edu",
  "brown university": "brown.edu",
  "cornell university": "cornell.edu",
  "duke university": "duke.edu",
  "vanderbilt university": "vanderbilt.edu",
  "johns hopkins university": "jhu.edu",
  "johns hopkins": "jhu.edu",
  "northwestern university": "northwestern.edu",
  "university of chicago": "uchicago.edu",
  "carnegie mellon university": "cmu.edu",
  "carnegie mellon": "cmu.edu",
  cmu: "cmu.edu",
  "emory university": "emory.edu",
  "georgetown university": "georgetown.edu",
  "notre dame": "nd.edu",
  "university of notre dame": "nd.edu",
  "tufts university": "tufts.edu",
  "boston university": "bu.edu",
  "boston college": "bc.edu",
  "northeastern university": "northeastern.edu",
  "new york university": "nyu.edu",
  nyu: "nyu.edu",

  // ── Liberal arts ─────────────────────────────────────────────────────────
  "amherst college": "amherst.edu",
  "williams college": "williams.edu",
  "wellesley college": "wellesley.edu",
  "swarthmore college": "swarthmore.edu",
  "pomona college": "pomona.edu",
  "middlebury college": "middlebury.edu",
  "bowdoin college": "bowdoin.edu",
  "colby college": "colby.edu",
  "bates college": "bates.edu",
  "colgate university": "colgate.edu",
  "vassar college": "vassar.edu",
  "oberlin college": "oberlin.edu",
  "grinnell college": "grinnell.edu",
  "macalester college": "macalester.edu",
  "carleton college": "carleton.edu",
  "hamilton college": "hamilton.edu",
  "haverford college": "haverford.edu",
  "bryn mawr college": "brynmawr.edu",

  // ── Large public flagships ────────────────────────────────────────────────
  "university of maryland": "umd.edu",
  "university of maryland college park": "umd.edu",
  "university of maryland  college park": "umd.edu",
  "umd": "umd.edu",
  "university of michigan": "umich.edu",
  "university of michigan ann arbor": "umich.edu",
  "university of california los angeles": "ucla.edu",
  ucla: "ucla.edu",
  "uc los angeles": "ucla.edu",
  "university of california berkeley": "berkeley.edu",
  "uc berkeley": "berkeley.edu",
  "university of california san diego": "ucsd.edu",
  "uc san diego": "ucsd.edu",
  ucsd: "ucsd.edu",
  "university of california santa barbara": "ucsb.edu",
  "uc santa barbara": "ucsb.edu",
  ucsb: "ucsb.edu",
  "university of california davis": "ucdavis.edu",
  "uc davis": "ucdavis.edu",
  "university of california irvine": "uci.edu",
  "uc irvine": "uci.edu",
  "university of texas at austin": "utexas.edu",
  "ut austin": "utexas.edu",
  "university of illinois urbana-champaign": "illinois.edu",
  "university of illinois at urbana-champaign": "illinois.edu",
  uiuc: "illinois.edu",
  "university of washington": "uw.edu",
  "uw seattle": "uw.edu",
  "university of wisconsin madison": "wisc.edu",
  "university of wisconsin-madison": "wisc.edu",
  "ohio state university": "osu.edu",
  osu: "osu.edu",
  "penn state": "psu.edu",
  "pennsylvania state university": "psu.edu",
  "purdue university": "purdue.edu",
  "georgia institute of technology": "gatech.edu",
  "georgia tech": "gatech.edu",
  "university of minnesota": "umn.edu",
  "university of minnesota twin cities": "umn.edu",
  "university of florida": "ufl.edu",
  "university of north carolina": "unc.edu",
  "unc chapel hill": "unc.edu",
  "university of virginia": "virginia.edu",
  uva: "virginia.edu",
  "virginia tech": "vt.edu",
  "university of southern california": "usc.edu",
  usc: "usc.edu",
  "university of rochester": "rochester.edu",
  "case western reserve university": "case.edu",
  "case western": "case.edu",
  "tulane university": "tulane.edu",
  "rice university": "rice.edu",
  "wake forest university": "wfu.edu",
  "lehigh university": "lehigh.edu",
  "rensselaer polytechnic institute": "rpi.edu",
  rpi: "rpi.edu",
};

const normalizeEntityName = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Extract the root logo domain from a school email address.
 * Strips subdomains from .edu addresses so that:
 *   terpmail.umd.edu  → umd.edu
 *   mail.gatech.edu   → gatech.edu
 *   cs.cmu.edu        → cmu.edu
 *   umd.edu           → umd.edu  (already root)
 */
export function extractSchoolEmailDomain(email: string | null | undefined): string | null {
  if (!email) return null;
  const at = email.indexOf("@");
  if (at === -1) return null;
  const domain = email.slice(at + 1).toLowerCase().trim();
  const parts = domain.split(".");
  if (parts.length < 2) return null;
  // For .edu, always collapse to <institution>.edu
  if (parts[parts.length - 1] === "edu") {
    return `${parts[parts.length - 2]}.edu`;
  }
  return domain;
}

export const getKnownSchoolDomain = (name: string | null | undefined): string | null => {
  if (!name?.trim()) return null;
  const normalized = normalizeEntityName(name);

  // Exact match first
  if (SCHOOL_DOMAIN_ALIASES[normalized]) return SCHOOL_DOMAIN_ALIASES[normalized];

  // Prefix match: "University of Maryland - College Park" → starts with "university of maryland"
  for (const [key, domain] of Object.entries(SCHOOL_DOMAIN_ALIASES)) {
    if (normalized.startsWith(key) || key.startsWith(normalized)) return domain;
  }

  return null;
};

// ─── Employers ───────────────────────────────────────────────────────────────

const COMPANY_DOMAIN_ALIASES: Record<string, string> = {
  "association of mongolian students in america": "amsa.mn",
  amsa: "amsa.mn",
};

/** Legal suffixes that never appear in the domain: "Mobicom Corporation" → "Mobicom". */
const CORPORATE_SUFFIX = /\s+(llc|l l c|inc|incorporated|corp|corporation|co|company|ltd|limited|llp|plc|gmbh)$/;

const SCHOOL_WORD = /\b(university|college|institute|school|academy|polytechnic|state)\b/;

const MONGOLIA = /mongolia|ulaanbaatar|улаанбаатар|монгол/i;

/** Does an employer name read as a school, so the colleges table may know it? */
export const looksLikeSchool = (name: string | null | undefined) =>
  SCHOOL_WORD.test(normalizeEntityName(name ?? ""));

/**
 * Alias lookup for employer names, matching whole words only so a company
 * whose name merely begins with an alias doesn't get a school's logo
 * ("WashU Student Technician Services" → wustl.edu, "Mitsubishi" ↛ mit.edu).
 */
export const getKnownEmployerDomain = (name: string | null | undefined): string | null => {
  const normalized = normalizeEntityName(name ?? "");
  if (!normalized) return null;
  if (COMPANY_DOMAIN_ALIASES[normalized]) return COMPANY_DOMAIN_ALIASES[normalized];
  if (SCHOOL_DOMAIN_ALIASES[normalized]) return SCHOOL_DOMAIN_ALIASES[normalized];
  for (const [key, domain] of Object.entries(SCHOOL_DOMAIN_ALIASES)) {
    if (normalized.startsWith(`${key} `)) return domain;
  }
  return null;
};

/**
 * Domains worth trying for an employer typed as free text, best first. The
 * name alone can't say which is right, so the caller tries them in order until
 * one has a logo. "FoundationBio | CURB" → foundationbio.com; "Mobicom
 * Corporation" in Mongolia → mobicom.mn, mobicom.com.
 */
export function employerDomainCandidates(
  name: string | null | undefined,
  location?: string | null,
): string[] {
  const out: string[] = [];
  const push = (d: string | null) => { if (d && !out.includes(d)) out.push(d); };

  // Keep the part before a separator: "FoundationBio | CURB", "Acme (Intern)"
  const head = (name ?? "").split(/\s+[|/\u2013\u2014-]\s+|\s*\(/)[0];
  push(getKnownEmployerDomain(head));

  let core = normalizeEntityName(head);
  for (let prev = ""; prev !== core; ) { prev = core; core = core.replace(CORPORATE_SUFFIX, ""); }
  const slug = core.replace(/\s/g, "");
  if (!slug) return out;

  if (SCHOOL_WORD.test(core)) push(`${slug}.edu`);
  const tlds = MONGOLIA.test(location ?? "") ? ["mn", "com"] : ["com", "mn"];
  for (const tld of tlds) push(`${slug}.${tld}`);
  return out;
}
