import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { normalizeState } from "@/lib/us-states";
import { jsonCached, ONE_HOUR } from "@/lib/http";

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
      const abbr = normalizeState(row.state);
      if (abbr) counts[abbr] = (counts[abbr] ?? 0) + 1;
    }

    // Public and slow-changing: let the CDN serve it for an hour.
    return jsonCached({ counts }, ONE_HOUR);
  } catch (e) {
    console.error("student-counts:", e);
    return NextResponse.json({ counts: {} });
  }
}
