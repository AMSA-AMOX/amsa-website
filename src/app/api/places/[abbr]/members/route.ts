import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type RouteContext = { params: Promise<{ abbr: string }> };

const NAME_TO_ABBR: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR",
  california: "CA", colorado: "CO", connecticut: "CT", delaware: "DE",
  "washington d.c.": "DC", "washington dc": "DC", "district of columbia": "DC",
  florida: "FL", georgia: "GA", hawaii: "HI", idaho: "ID",
  illinois: "IL", indiana: "IN", iowa: "IA", kansas: "KS",
  kentucky: "KY", louisiana: "LA", maine: "ME", maryland: "MD",
  massachusetts: "MA", michigan: "MI", minnesota: "MN", mississippi: "MS",
  missouri: "MO", montana: "MT", nebraska: "NE", nevada: "NV",
  "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM",
  "new york": "NY", "north carolina": "NC", "north dakota": "ND",
  ohio: "OH", oklahoma: "OK", oregon: "OR", pennsylvania: "PA",
  "rhode island": "RI", "south carolina": "SC", "south dakota": "SD",
  tennessee: "TN", texas: "TX", utah: "UT", vermont: "VT",
  virginia: "VA", washington: "WA", "west virginia": "WV",
  wisconsin: "WI", wyoming: "WY",
};

const KNOWN_ABBRS = new Set(Object.values(NAME_TO_ABBR));

function normalizeState(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  const upper = s.toUpperCase();
  if (upper.length === 2 && KNOWN_ABBRS.has(upper)) return upper;
  const abbr = NAME_TO_ABBR[s.toLowerCase()];
  return abbr ?? null;
}

const ROLE_ORDER: Record<string, number> = {
  ambassador: 0,
  admin: 1,
  board_member: 2,
  us_member: 3,
};

export async function GET(_request: Request, context: RouteContext) {
  const { abbr: rawAbbr } = await context.params;
  const targetAbbr = rawAbbr?.toUpperCase();

  if (!targetAbbr || !KNOWN_ABBRS.has(targetAbbr)) {
    return NextResponse.json({ message: "Invalid state." }, { status: 400 });
  }

  try {
    const { data: users, error } = await supabase
      .from("Users")
      .select("id, firstName, lastName, profilePic, role, schoolName, graduationYear, city, state")
      .in("role", ["ambassador", "us_member", "board_member", "admin"])
      .not("state", "is", null)
      .neq("state", "");

    if (error) {
      console.error("GET /api/places/[abbr]/members failed:", error);
      return NextResponse.json({ message: "Failed to load members." }, { status: 500 });
    }

    const matched = (users ?? []).filter((u: any) => {
      const normalized = normalizeState(u.state ?? "");
      return normalized === targetAbbr;
    });

    const sorted = matched
      .sort((a: any, b: any) => {
        const ra = ROLE_ORDER[a.role ?? ""] ?? 99;
        const rb = ROLE_ORDER[b.role ?? ""] ?? 99;
        if (ra !== rb) return ra - rb;
        return (a.firstName ?? "").localeCompare(b.firstName ?? "");
      })
      .slice(0, 20)
      .map(({ state: _state, ...rest }: any) => rest);

    return NextResponse.json({ members: sorted }, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
    });
  } catch (e) {
    console.error("GET /api/places/[abbr]/members exception:", e);
    return NextResponse.json({ message: "Failed to load members." }, { status: 500 });
  }
}
