import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { jsonCached } from "@/lib/http";

type RouteContext = { params: Promise<{ id: string }> };

const ROLE_ORDER: Record<string, number> = {
  ambassador: 0,
  admin: 1,
  board_member: 2,
  us_member: 3,
};

/**
 * Students at a college, from the indexed `Users.college_unitid` column that
 * is resolved (email domain → college) whenever a profile or application is
 * saved. Previously: fetch 500 users and string-match names in JS per request.
 */
export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const unitid = Number(id);
  if (!Number.isFinite(unitid)) {
    return NextResponse.json({ message: "Invalid college ID." }, { status: 400 });
  }

  try {
    const { data: users, error } = await supabase
      .from("Users")
      .select("id, firstName, lastName, profilePic, role, schoolName, schoolEmail, major, graduationYear")
      .in("role", ["ambassador", "us_member", "board_member", "admin"])
      .eq("college_unitid", unitid)
      .limit(100);

    if (error) {
      console.error("GET /api/colleges/[id]/students failed:", error);
      return NextResponse.json({ message: "Failed to load students." }, { status: 500 });
    }

    const students = (users ?? [])
      .sort((a, b) => {
        const ra = ROLE_ORDER[a.role ?? ""] ?? 99;
        const rb = ROLE_ORDER[b.role ?? ""] ?? 99;
        if (ra !== rb) return ra - rb;
        return (a.firstName ?? "").localeCompare(b.firstName ?? "");
      })
      .slice(0, 20);

    return jsonCached({ students }, 300, 60);
  } catch (e) {
    console.error("GET /api/colleges/[id]/students exception:", e);
    return NextResponse.json({ message: "Failed to load students." }, { status: 500 });
  }
}
