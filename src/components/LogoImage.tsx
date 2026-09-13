"use client";

import { useEffect, useState } from "react";
import { extractSchoolEmailDomain, getKnownSchoolDomain } from "@/lib/logo-lookup";

const LOGO_DEV_TOKEN = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN?.trim();

export const buildLogoUrl = (domain: string) => {
  const base = `https://img.logo.dev/${domain}`;
  return LOGO_DEV_TOKEN ? `${base}?token=${encodeURIComponent(LOGO_DEV_TOKEN)}` : base;
};

/** "Goldman Sachs" → goldmansachs.com. Wrong guesses just fall back to the icon. */
const guessCompanyDomain = (name: string | null | undefined) => {
  const slug = (name ?? "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]/g, "");
  return slug ? `${slug}.com` : null;
};

/**
 * Resolve a logo domain synchronously — no browser-side lookups. Schools come
 * from the server (`logoDomain`, written when the profile is saved), the .edu
 * email, or the alias table; companies from a domain guess.
 */
export function resolveLogoDomain(input: {
  domain?: string | null;
  name?: string | null;
  email?: string | null;
  kind: "school" | "company";
}): string | null {
  if (input.domain) return input.domain;
  if (input.kind === "school") {
    return extractSchoolEmailDomain(input.email) ?? (input.name ? getKnownSchoolDomain(input.name) : null);
  }
  return guessCompanyDomain(input.name);
}

export default function LogoImage({
  domain,
  name,
  email,
  kind,
  size = 10,
  rounded = "rounded-lg",
  className = "",
}: {
  domain?: string | null;
  name?: string | null;
  email?: string | null;
  kind: "school" | "company";
  /** Tailwind spacing unit: size 10 → 40px box */
  size?: number;
  rounded?: string;
  className?: string;
}) {
  const [err, setErr] = useState(false);
  const resolved = resolveLogoDomain({ domain, name, email, kind });
  const boxSize = { width: `${size * 4}px`, height: `${size * 4}px` };
  const iconSize = `${Math.max(10, size * 2)}px`;

  useEffect(() => {
    setErr(false);
  }, [resolved]);

  if (!resolved || err) {
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
      src={buildLogoUrl(resolved)}
      alt={name ?? ""}
      onError={() => setErr(true)}
      loading="lazy"
      decoding="async"
      style={boxSize}
      className={`${rounded} object-contain shrink-0 bg-white border border-gray-100 ${className}`}
    />
  );
}
