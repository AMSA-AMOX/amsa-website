import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * GET /api/health        → function is up (no DB)
 * GET /api/health?db=1   → also times one trivial DB query and reports it as a
 *                          Server-Timing header, so `curl -sI …?db=1` shows the
 *                          per-round-trip cost from this region at any time.
 */
export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("db") !== "1") {
    return Response.json({ ok: true });
  }

  const started = performance.now();
  const { error } = await supabaseAdmin.from("Users").select("id").limit(1);
  const dbMs = Math.round(performance.now() - started);

  return Response.json(
    { ok: !error, dbMs },
    {
      status: error ? 503 : 200,
      headers: {
        "Server-Timing": `db;dur=${dbMs}`,
        "Cache-Control": "no-store",
      },
    },
  );
}
