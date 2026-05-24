import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Maps full state names → abbreviation (derived from STATE_DATA keys)
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

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("Users")
      .select("state")
      .not("state", "is", null)
      .neq("state", "");

    if (error) {
      console.error("student-counts:", error);
      return NextResponse.json({ counts: {} });
    }

    const counts: Record<string, number> = {};
    for (const row of data ?? []) {
      const abbr = normalizeState(row.state ?? "");
      if (abbr) counts[abbr] = (counts[abbr] ?? 0) + 1;
    }

    return NextResponse.json({ counts });
  } catch (e) {
    console.error("student-counts:", e);
    return NextResponse.json({ counts: {} });
  }
}
