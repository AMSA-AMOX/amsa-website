import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyToken } from "@/lib/auth";
import { extractSchoolEmailDomain, getKnownSchoolDomain } from "@/lib/logo-lookup";
import { resolveUserCollege } from "@/lib/college-match";

function buildLogoUrl(domain: string): string {
  const token = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN;
  return token
    ? `https://img.logo.dev/${domain}?token=${encodeURIComponent(token)}`
    : `https://img.logo.dev/${domain}`;
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

  // The .edu email domain is authoritative; the typed name is the fallback.
  const college = await resolveUserCollege({ schoolName, schoolEmail });
  if (!college) return NextResponse.json({ college: null });

  // Logo domain: same precedence the profile page uses.
  const logoDomain =
    extractSchoolEmailDomain(schoolEmail) ??
    (schoolName ? getKnownSchoolDomain(schoolName) : null) ??
    college.domain;

  return NextResponse.json({
    college: {
      id: college.id,
      name: college.name,
      logoUrl: logoDomain ? buildLogoUrl(logoDomain) : null,
    },
  });
}
