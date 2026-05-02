import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyToken } from "@/lib/auth";
import { extractSchoolEmailDomain, getKnownSchoolDomain } from "@/lib/logo-lookup";

function buildLogoUrl(domain: string): string {
  const token = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN;
  return token
    ? `https://img.logo.dev/${domain}?token=${encodeURIComponent(token)}`
    : `https://img.logo.dev/${domain}`;
}

function deriveLogoUrlFromSchoolUrl(website: string | null): string | null {
  if (!website) return null;
  try {
    const host = new URL(website.startsWith("http") ? website : `https://${website}`).hostname;
    if (!host) return null;
    // Strip www. to match the root domain used by img.logo.dev
    const rootHost = host.startsWith("www.") ? host.slice(4) : host;
    return buildLogoUrl(rootHost);
  } catch {
    return null;
  }
}

function extractRootDomain(email: string): string | null {
  const match = email.match(/@([\w.-]+)$/);
  if (!match) return null;
  const parts = match[1].split(".");
  if (parts.length < 2) return null;
  // Return the last two segments (e.g. terpmail.umd.edu → umd.edu)
  return parts.slice(-2).join(".");
}

export async function GET(request: Request) {
  let payload;
  try {
    payload = verifyToken(request);
  } catch (res) {
    return res as NextResponse;
  }

  const { data: userRow, error: userErr } = await supabase
    .from("Users")
    .select("schoolName, schoolEmail")
    .eq("id", payload.id)
    .single();

  if (userErr || !userRow) {
    return NextResponse.json({ college: null });
  }

  const schoolName: string | null = userRow.schoolName ?? null;
  const schoolEmail: string | null = userRow.schoolEmail ?? null;

  // Resolve the logo domain the same way the profile page does:
  // 1. schoolEmail root domain (most reliable, same as extractSchoolEmailDomain in logo-lookup)
  // 2. known alias for schoolName
  // 3. fallback to colleges_base school_url hostname (www. stripped)
  const emailLogoDomain = extractSchoolEmailDomain(schoolEmail);
  const nameLogoDomain = schoolName ? getKnownSchoolDomain(schoolName) : null;

  const resolveLogoUrl = (schoolUrl: string | null): string | null => {
    if (emailLogoDomain) return buildLogoUrl(emailLogoDomain);
    if (nameLogoDomain) return buildLogoUrl(nameLogoDomain);
    return deriveLogoUrlFromSchoolUrl(schoolUrl);
  };

  // Try matching by name: exact first, then starts-with fallback
  if (schoolName) {
    const { data: byName } = await supabase
      .from("colleges_base")
      .select("unitid, name, school_url")
      .ilike("name", schoolName)
      .limit(1)
      .maybeSingle();

    if (byName) {
      return NextResponse.json({
        college: {
          id: byName.unitid,
          name: byName.name,
          logoUrl: resolveLogoUrl(byName.school_url),
        },
      });
    }

    // Partial fallback: user typed "University of Maryland" but DB has "University of Maryland-College Park"
    const { data: byNamePartial } = await supabase
      .from("colleges_base")
      .select("unitid, name, school_url")
      .ilike("name", `${schoolName}%`)
      .limit(1)
      .maybeSingle();

    if (byNamePartial) {
      return NextResponse.json({
        college: {
          id: byNamePartial.unitid,
          name: byNamePartial.name,
          logoUrl: resolveLogoUrl(byNamePartial.school_url),
        },
      });
    }
  }

  // Fallback: match by school email domain against school_url
  if (schoolEmail) {
    const domain = extractRootDomain(schoolEmail);
    if (domain) {
      const { data: byDomain } = await supabase
        .from("colleges_base")
        .select("unitid, name, school_url")
        .ilike("school_url", `%${domain}%`)
        .limit(1)
        .maybeSingle();

      if (byDomain) {
        return NextResponse.json({
          college: {
            id: byDomain.unitid,
            name: byDomain.name,
            logoUrl: resolveLogoUrl(byDomain.school_url),
          },
        });
      }
    }
  }

  return NextResponse.json({ college: null });
}
