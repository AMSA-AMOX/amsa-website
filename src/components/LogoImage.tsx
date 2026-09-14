"use client";

import { useState } from "react";
import { employerDomainCandidates, extractSchoolEmailDomain, getKnownSchoolDomain } from "@/lib/logo-lookup";

const LOGO_DEV_TOKEN = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN?.trim();

/**
 * logo.dev answers an unknown domain with a generated monogram (HTTP 200), which
 * would hide a wrong guess behind a fake logo; ask for a 404 instead so the
 * <img> errors and the caller can try the next candidate or show the icon.
 */
export const buildLogoUrl = (domain: string) => {
  const params = new URLSearchParams({ fallback: "404" });
  if (LOGO_DEV_TOKEN) params.set("token", LOGO_DEV_TOKEN);
  return `https://img.logo.dev/${domain}?${params}`;
};

/**
 * Domains to try for a logo, best first — no browser-side lookups. Schools come
 * from the server (`logoDomain`, written when the profile is saved), the .edu
 * email, or the alias table. Employers get the server-resolved domain when the
 * row has one, else guesses from the name (see employerDomainCandidates).
 */
export function logoDomainCandidates(input: {
  domain?: string | null;
  name?: string | null;
  email?: string | null;
  location?: string | null;
  kind: "school" | "company";
}): string[] {
  if (input.domain) return [input.domain];
  if (input.kind === "school") {
    const d = extractSchoolEmailDomain(input.email) ?? (input.name ? getKnownSchoolDomain(input.name) : null);
    return d ? [d] : [];
  }
  return employerDomainCandidates(input.name, input.location);
}

export default function LogoImage({
  domain,
  name,
  email,
  location,
  kind,
  size = 10,
  rounded = "rounded-lg",
  className = "",
}: {
  domain?: string | null;
  name?: string | null;
  email?: string | null;
  /** Employer location; "Mongolia" makes .mn the first guess */
  location?: string | null;
  kind: "school" | "company";
  /** Tailwind spacing unit: size 10 → 40px box */
  size?: number;
  rounded?: string;
  className?: string;
}) {
  const candidates = logoDomainCandidates({ domain, name, email, location, kind });
  // Which candidate is showing; starts over when the candidate list changes.
  const key = candidates.join("|");
  const [state, setState] = useState({ key, attempt: 0 });
  const attempt = state.key === key ? state.attempt : 0;
  const resolved = candidates[attempt];
  const boxSize = { width: `${size * 4}px`, height: `${size * 4}px` };
  const iconSize = `${Math.max(10, size * 2)}px`;

  if (!resolved) {
    return (
      <div
        style={boxSize}
        className={`${rounded} bg-[#001049]/10 flex items-center justify-center text-[#001049] shrink-0 ${className}`}
      >
        {kind === "school" ? (
          <svg style={{ width: iconSize, height: iconSize }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 3.741-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
          </svg>
        ) : (
          <svg style={{ width: iconSize, height: iconSize }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
          </svg>
        )}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- third-party logo CDN, already sized
    <img
      key={resolved}
      src={buildLogoUrl(resolved)}
      alt={name ?? ""}
      onError={() => setState({ key, attempt: attempt + 1 })}
      loading="lazy"
      decoding="async"
      style={boxSize}
      className={`${rounded} object-contain shrink-0 bg-white border border-gray-100 ${className}`}
    />
  );
}
