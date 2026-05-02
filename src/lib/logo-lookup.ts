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

export const getLookupNameVariants = (name: string): string[] => {
  const base = name.trim();
  if (!base) return [];

  const variants = [
    base,
    base.replace(/\s*&\s*/g, " and "),
    base.replace(/\s+and\s+/gi, " & "),
    base.replace(/[^\w\s&]/g, " ").replace(/\s+/g, " ").trim(),
  ];

  return Array.from(new Set(variants.filter(Boolean)));
};
