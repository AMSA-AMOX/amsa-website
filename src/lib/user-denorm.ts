import "server-only";
import { resolveUserCollege, rootDomainFromUrl } from "@/lib/college-match";
import { extractSchoolEmailDomain, getKnownSchoolDomain } from "@/lib/logo-lookup";
import { normalizeState } from "@/lib/us-states";

export type UserDenorm = {
  college_unitid: number | null;
  state_abbr: string | null;
  logo_domain: string | null;
};

/**
 * Columns derived from a user's free-text school/state fields, computed once
 * when the profile is written (see the migration adding them to "Users").
 * Reads then become single indexed queries — no per-request name matching,
 * no browser-side Clearbit lookups for logos.
 */
export async function resolveUserDenorm(input: {
  schoolName?: string | null;
  schoolEmail?: string | null;
  state?: string | null;
}): Promise<UserDenorm> {
  const college = await resolveUserCollege({
    schoolName: input.schoolName,
    schoolEmail: input.schoolEmail,
  });

  const logo_domain =
    extractSchoolEmailDomain(input.schoolEmail) ??
    (input.schoolName ? getKnownSchoolDomain(input.schoolName) : null) ??
    rootDomainFromUrl(college?.schoolUrl) ??
    null;

  return {
    college_unitid: college?.id ?? null,
    state_abbr: normalizeState(input.state),
    logo_domain,
  };
}
