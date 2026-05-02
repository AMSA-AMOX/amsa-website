import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type RouteContext = { params: Promise<{ id: string }> };

const ROLE_ORDER: Record<string, number> = {
  ambassador: 0,
  admin: 1,
  board_member: 2,
  us_member: 3,
};

/** Extract root .edu domain from a website URL, e.g. https://www.umd.edu → umd.edu */
function rootDomainFromUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const host = new URL(url.startsWith("http") ? url : `https://${url}`).hostname.toLowerCase();
    const parts = host.split(".");
    if (parts[parts.length - 1] === "edu") return `${parts[parts.length - 2]}.edu`;
    return host;
  } catch {
    return null;
  }
}

/** Extract root .edu domain from a school email, e.g. telmen@terpmail.umd.edu → umd.edu */
function rootDomainFromEmail(email: string | null): string | null {
  if (!email) return null;
  const at = email.indexOf("@");
  if (at === -1) return null;
  const domain = email.slice(at + 1).toLowerCase().trim();
  const parts = domain.split(".");
  if (parts.length < 2) return null;
  if (parts[parts.length - 1] === "edu") return `${parts[parts.length - 2]}.edu`;
  return domain;
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const unitid = Number(id);
  if (!Number.isFinite(unitid)) {
    return NextResponse.json({ message: "Invalid college ID." }, { status: 400 });
  }

  try {
    // Look up the college name and website URL
    const { data: college, error: collegeError } = await supabase
      .from("colleges_base")
      .select("name, school_url")
      .eq("unitid", unitid)
      .single();

    if (collegeError || !college) {
      return NextResponse.json({ message: "College not found." }, { status: 404 });
    }

    const collegeName = (college as { name: string; school_url: string | null }).name;
    const collegeDomain = rootDomainFromUrl(
      (college as { name: string; school_url: string | null }).school_url
    );

    // Fetch all network-eligible users with their schoolEmail for domain matching
    const { data: users, error: usersError } = await supabase
      .from("Users")
      .select("id, firstName, lastName, profilePic, role, schoolName, schoolEmail, major, graduationYear")
      .in("role", ["ambassador", "us_member", "board_member", "admin"])
      .limit(500);

    if (usersError) {
      console.error("GET /api/colleges/[id]/students failed:", usersError);
      return NextResponse.json({ message: "Failed to load students." }, { status: 500 });
    }

    // Match by school name OR matching .edu email domain.
    // Name matching is tolerant of suffix differences (e.g. "University of Maryland"
    // matches "University of Maryland-College Park" in either direction).
    const collegeNameLower = collegeName.toLowerCase();
    const matched = (users ?? []).filter((u: any) => {
      const userSchool = (u.schoolName ?? "").toLowerCase().trim();
      const nameMatch =
        userSchool === collegeNameLower ||
        (userSchool.length > 4 && collegeNameLower.startsWith(userSchool)) ||
        (userSchool.length > 4 && userSchool.startsWith(collegeNameLower));
      const domainMatch =
        !!collegeDomain &&
        rootDomainFromEmail(u.schoolEmail) === collegeDomain;
      return nameMatch || domainMatch;
    });

    const sorted = matched
      .sort((a: any, b: any) => {
        const ra = ROLE_ORDER[a.role ?? ""] ?? 99;
        const rb = ROLE_ORDER[b.role ?? ""] ?? 99;
        if (ra !== rb) return ra - rb;
        return (a.firstName ?? "").localeCompare(b.firstName ?? "");
      })
      .slice(0, 20);

    return NextResponse.json({ students: sorted }, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
    });
  } catch (e) {
    console.error("GET /api/colleges/[id]/students exception:", e);
    return NextResponse.json({ message: "Failed to load students." }, { status: 500 });
  }
}
