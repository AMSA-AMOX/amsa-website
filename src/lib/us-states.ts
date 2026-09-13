import { STATE_NAMES } from "@/app/(dashboard)/dashboard/research/state-names";

/** Full state name (lower-cased) → abbreviation, plus common DC spellings. */
const NAME_TO_ABBR: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_NAMES).map(([abbr, name]) => [name.toLowerCase(), abbr]),
);
NAME_TO_ABBR["washington d.c."] = "DC";
NAME_TO_ABBR["washington dc"] = "DC";
NAME_TO_ABBR["district of columbia"] = "DC";

const KNOWN_ABBRS = new Set(Object.keys(STATE_NAMES));

/**
 * "Maryland" / "maryland" / "MD" / " md " → "MD"; anything unrecognised → null.
 * Used both for the profile's free-text `state` and for query params.
 */
export function normalizeState(raw: string | null | undefined): string | null {
  const s = (raw ?? "").trim();
  if (!s) return null;
  const upper = s.toUpperCase();
  if (upper.length === 2 && KNOWN_ABBRS.has(upper)) return upper;
  return NAME_TO_ABBR[s.toLowerCase()] ?? null;
}
