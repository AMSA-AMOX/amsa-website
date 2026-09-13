import "server-only";
import { supabase } from "@/lib/supabase";
import { getKnownSchoolDomain } from "@/lib/logo-lookup";

export type MatchedCollege = {
  id: number;
  name: string;
  schoolUrl: string | null;
  /** Root .edu domain derived from school_url, e.g. "umd.edu". */
  domain: string | null;
};

type CollegeRow = { unitid: number; name: string; school_url: string | null };

const COLLEGE_COLUMNS = "unitid, name, school_url";

const toCollege = (row: CollegeRow): MatchedCollege => ({
  id: row.unitid,
  name: row.name,
  schoolUrl: row.school_url,
  domain: rootDomainFromUrl(row.school_url),
});

/** "www.umd.edu/" → "umd.edu", "web.mit.edu/" → "mit.edu", "https://washu.edu/" → "washu.edu" */
export function rootDomainFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const host = new URL(url.startsWith("http") ? url : `https://${url}`).hostname.toLowerCase();
    const parts = host.split(".");
    if (parts.length < 2) return null;
    if (parts[parts.length - 1] === "edu") return `${parts[parts.length - 2]}.edu`;
    return host.startsWith("www.") ? host.slice(4) : host;
  } catch {
    return null;
  }
}

/** "someone@terpmail.umd.edu" → "umd.edu" */
export function rootDomainFromEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const at = email.indexOf("@");
  if (at === -1) return null;
  const domain = email.slice(at + 1).toLowerCase().trim();
  const parts = domain.split(".");
  if (parts.length < 2) return null;
  if (parts[parts.length - 1] === "edu") return `${parts[parts.length - 2]}.edu`;
  return domain;
}

/**
 * Loose, punctuation-insensitive form used to compare what a person typed
 * against the IPEDS name: "University of Maryland, College Park" and
 * "University of Maryland-College Park" both become "university of maryland college park".
 */
export function normalizeCollegeName(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^the /, "")
    .trim();
}

const NAME_STOPWORDS = new Set(["university", "college", "of", "the", "at", "in", "and", "campus", "main"]);

const significantTokens = (value: string) =>
  normalizeCollegeName(value).split(" ").filter((t) => t && !NAME_STOPWORDS.has(t));

/** Does the name a person typed plausibly refer to this college? */
export function collegeNameMatches(typed: string | null | undefined, college: MatchedCollege): boolean {
  const a = normalizeCollegeName(typed);
  if (!a) return false;
  const b = normalizeCollegeName(college.name);
  if (a === b) return true;
  if (a.length > 4 && (b.startsWith(a) || a.startsWith(b))) return true;

  // Alias table ("UC Berkeley", "MIT", "WashU") resolves to a domain — compare it
  // against the college's domain, and against the alias of the official name
  // (the alias table may use a different domain than IPEDS, e.g. wustl vs washu).
  const aliasDomain = getKnownSchoolDomain(typed);
  if (aliasDomain) {
    if (college.domain && aliasDomain === college.domain) return true;
    if (aliasDomain === getKnownSchoolDomain(college.name)) return true;
  }

  // Abbreviations: "uconn" ≙ uconn.edu, "gmu" ≙ George Mason University,
  // "umcp" ≙ University of Maryland-College Park.
  const compact = a.replace(/\s/g, "");
  if (compact.length >= 2 && compact.length <= 8) {
    const domainRoot = college.domain?.split(".")[0];
    if (domainRoot && compact === domainRoot) return true;
    const initials = b
      .split(" ")
      .filter((w) => w && !["of", "the", "at", "in", "and"].includes(w))
      .map((w) => w[0])
      .join("");
    if (compact === initials) return true;
  }

  // Every meaningful word the person typed appears in the official name
  // ("Boise State" ⊂ "Boise State University").
  const typedTokens = significantTokens(typed ?? "");
  if (typedTokens.length === 0) return false;
  const official = new Set(significantTokens(college.name));
  return typedTokens.every((t) => official.has(t));
}

/**
 * Among several campuses sharing a domain (osu.edu, cuny.edu), prefer an exact
 * name the person typed, then a looser name match, then the main campus.
 */
function pickBest(rows: MatchedCollege[], preferName?: string | null): MatchedCollege | null {
  if (rows.length === 0) return null;
  if (rows.length === 1) return rows[0];
  const typed = normalizeCollegeName(preferName);
  const score = (c: MatchedCollege) => {
    let s = 0;
    if (typed && normalizeCollegeName(c.name) === typed) s += 100;
    else if (typed && collegeNameMatches(preferName, c)) s += 10;
    if (/main campus/i.test(c.name)) s += 5;
    if (!c.name.includes("-")) s += 1;
    return s;
  };
  return [...rows].sort((a, b) => score(b) - score(a))[0];
}

/** Find the college whose website root domain matches the email's root domain. */
export async function findCollegeByEmail(
  email: string | null | undefined,
  preferName?: string | null,
): Promise<MatchedCollege | null> {
  const root = rootDomainFromEmail(email);
  if (!root) return null;
  return findCollegeByDomain(root, preferName);
}

export async function findCollegeByDomain(
  root: string,
  preferName?: string | null,
): Promise<MatchedCollege | null> {
  const { data, error } = await supabase
    .from("colleges_base")
    .select(COLLEGE_COLUMNS)
    .ilike("school_url", `%${root}%`)
    .limit(25)
    .returns<CollegeRow[]>();
  if (error || !data) return null;

  // ilike '%uci.edu%' also hits csuci.edu — keep only exact root-domain matches.
  const exact = data.map(toCollege).filter((c) => c.domain === root);
  return pickBest(exact, preferName);
}

/** Resolve a free-text school name to a college: exact, alias domain, then fuzzy. */
export async function findCollegeByName(name: string | null | undefined): Promise<MatchedCollege | null> {
  const trimmed = name?.trim();
  if (!trimmed) return null;

  const { data: exact } = await supabase
    .from("colleges_base")
    .select(COLLEGE_COLUMNS)
    .ilike("name", trimmed)
    .limit(1)
    .maybeSingle<CollegeRow>();
  if (exact) return toCollege(exact);

  const aliasDomain = getKnownSchoolDomain(trimmed);
  if (aliasDomain) {
    const byAlias = await findCollegeByDomain(aliasDomain, trimmed);
    if (byAlias) return byAlias;
  }

  // Fuzzy: search on the first meaningful word, then score candidates.
  const tokens = significantTokens(trimmed);
  const seed = tokens[0] ?? normalizeCollegeName(trimmed).split(" ")[0];
  if (!seed) return null;
  const { data: candidates } = await supabase
    .from("colleges_base")
    .select(COLLEGE_COLUMNS)
    .ilike("name", `%${seed}%`)
    .limit(50)
    .returns<CollegeRow[]>();
  const matches = (candidates ?? []).map(toCollege).filter((c) => collegeNameMatches(trimmed, c));
  return pickBest(matches, trimmed);
}

/** Email domain is authoritative; fall back to the typed name. */
export async function resolveUserCollege(input: {
  schoolName?: string | null;
  schoolEmail?: string | null;
}): Promise<MatchedCollege | null> {
  const byEmail = await findCollegeByEmail(input.schoolEmail, input.schoolName);
  if (byEmail) return byEmail;
  return findCollegeByName(input.schoolName);
}

export type SchoolEmailVerification =
  | { status: "match"; college: MatchedCollege }
  | { status: "mismatch"; college: MatchedCollege }
  | { status: "unknown"; college: null };

/**
 * Check that a .edu email actually belongs to the university the person named.
 * "unknown" means the domain isn't in our colleges table, so we can't tell.
 */
export async function verifySchoolEmail(
  email: string | null | undefined,
  schoolName: string | null | undefined,
): Promise<SchoolEmailVerification> {
  const college = await findCollegeByEmail(email, schoolName);
  if (!college) return { status: "unknown", college: null };
  if (!schoolName?.trim() || collegeNameMatches(schoolName, college)) {
    return { status: "match", college };
  }
  return { status: "mismatch", college };
}

export const emailDomainLabel = (email: string) => `@${email.slice(email.indexOf("@") + 1)}`;
