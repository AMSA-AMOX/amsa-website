import "server-only";
import { findCollegeByName, rootDomainFromUrl } from "@/lib/college-match";
import { getKnownEmployerDomain, looksLikeSchool } from "@/lib/logo-lookup";

/**
 * Experiences.logoDomain, computed once when the row is written. A website the
 * member entered is authoritative; otherwise an alias, or the colleges table
 * when the employer reads as a school ("Kent State" → kent.edu). Null leaves
 * the client to guess from the name (see employerDomainCandidates).
 */
export async function resolveExperienceLogoDomain(input: {
  company?: string | null;
  companyUrl?: string | null;
}): Promise<string | null> {
  const fromUrl = rootDomainFromUrl(input.companyUrl?.trim() || null);
  if (fromUrl) return fromUrl;

  const alias = getKnownEmployerDomain(input.company);
  if (alias) return alias;

  if (looksLikeSchool(input.company)) {
    const college = await findCollegeByName(input.company);
    if (college?.domain) return college.domain;
  }
  return null;
}
