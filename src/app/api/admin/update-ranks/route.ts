/**
 * POST /api/admin/update-ranks
 *
 * Applies the static US News 2026 rankings to every row in colleges_base
 * without re-fetching College Scorecard data. Fast: clear all → set ranked.
 */

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyToken, assertRole } from "@/lib/auth";
import { USNEWS_RANKS } from "@/data/usnews-rankings";

export async function POST(req: NextRequest) {
  let payload;
  try { payload = verifyToken(req); }
  catch (res) { return res as NextResponse; }
  try { assertRole(payload, "admin"); }
  catch (res) { return res as NextResponse; }

  try {
    // 1. Clear all ranks in one shot
    const { error: clearErr } = await supabase
      .from("colleges_base")
      .update({ national_rank: null })
      .gt("unitid", 0);
    if (clearErr) throw new Error(clearErr.message);

    // 2. Group ranked schools by rank value and update each group
    const byRank = new Map<number, number[]>();
    for (const [unitid, rank] of Object.entries(USNEWS_RANKS)) {
      const group = byRank.get(rank) ?? [];
      group.push(Number(unitid));
      byRank.set(rank, group);
    }

    let ranked = 0;
    for (const [rank, unitids] of byRank) {
      const { error } = await supabase
        .from("colleges_base")
        .update({ national_rank: rank })
        .in("unitid", unitids);
      if (error) throw new Error(error.message);
      ranked += unitids.length;
    }

    return NextResponse.json({ ok: true, ranked });
  } catch (e: any) {
    console.error("[update-ranks]", e);
    return NextResponse.json({ error: e.message ?? "Unknown error" }, { status: 500 });
  }
}
