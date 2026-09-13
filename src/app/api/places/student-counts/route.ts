import { NextResponse } from "next/server";
import { rpc } from "@/lib/rpc";
import { jsonCached, ONE_HOUR } from "@/lib/http";

/**
 * {"MD": 12, "CA": 30, …} — a single GROUP BY over the indexed
 * `Users.state_abbr` column (get_state_student_counts), CDN-cached for an hour.
 */
export async function GET() {
  try {
    const counts = await rpc<Record<string, number>>("get_state_student_counts");
    return jsonCached({ counts: counts ?? {} }, ONE_HOUR);
  } catch (e) {
    console.error("student-counts:", e);
    return NextResponse.json({ counts: {} });
  }
}
