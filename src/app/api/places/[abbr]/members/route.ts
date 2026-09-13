import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { normalizeState } from "@/lib/us-states";
import { jsonCached } from "@/lib/http";

type RouteContext = { params: Promise<{ abbr: string }> };

const ROLE_ORDER: Record<string, number> = {
  ambassador: 0,
  admin: 1,
  board_member: 2,
  us_member: 3,
};

/**
 * Members in a state, from the indexed `Users.state_abbr` column that is
 * written whenever a profile is saved (src/lib/user-denorm.ts) — one small
 * query instead of scanning every user and normalizing state names in JS.
 */
export async function GET(_request: Request, context: RouteContext) {
  const { abbr: rawAbbr } = await context.params;
  const targetAbbr = normalizeState(rawAbbr);

  if (!targetAbbr) {
    return NextResponse.json({ message: "Invalid state." }, { status: 400 });
  }

  try {
    const { data: users, error } = await supabase
      .from("Users")
      .select("id, firstName, lastName, profilePic, role, schoolName, graduationYear, city, logo_domain")
      .in("role", ["ambassador", "us_member", "board_member", "admin"])
      .eq("state_abbr", targetAbbr)
      .limit(100);

    if (error) {
      console.error("GET /api/places/[abbr]/members failed:", error);
      return NextResponse.json({ message: "Failed to load members." }, { status: 500 });
    }

    const members = (users ?? [])
      .sort((a, b) => {
        const ra = ROLE_ORDER[a.role ?? ""] ?? 99;
        const rb = ROLE_ORDER[b.role ?? ""] ?? 99;
        if (ra !== rb) return ra - rb;
        return (a.firstName ?? "").localeCompare(b.firstName ?? "");
      })
      .slice(0, 20)
      .map(({ logo_domain, ...rest }) => ({ ...rest, logoDomain: logo_domain }));

    return jsonCached({ members }, 300, 60);
  } catch (e) {
    console.error("GET /api/places/[abbr]/members exception:", e);
    return NextResponse.json({ message: "Failed to load members." }, { status: 500 });
  }
}
