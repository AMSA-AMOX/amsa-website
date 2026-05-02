/**
 * POST /api/admin/refresh-pipeline
 *
 * Lightweight endpoint that resets stale cds_sources rows to 'pending' so the
 * next CLI pipeline run re-scrapes them.  It does NOT run the pipeline inline
 * (that would time out) — the actual work is done via:
 *   npx tsx scripts/pipeline/run-pipeline.ts
 *
 * Protected by x-pipeline-secret header (must match PIPELINE_SECRET env var).
 *
 * Request body (JSON):
 *   { "step": "all" | "scorecard" | "cds" | "ipeds" }
 *
 * Responses:
 *   202 — reset complete, pipeline must be run manually
 *   400 — invalid body
 *   401 — missing or wrong secret
 *   500 — Supabase error
 */

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Step = "all" | "scorecard" | "cds" | "ipeds";

function authorized(req: NextRequest): boolean {
  const secret = process.env.PIPELINE_SECRET;
  if (!secret) {
    // If no secret is configured, endpoint is disabled
    return false;
  }
  return req.headers.get("x-pipeline-secret") === secret;
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let step: Step;
  try {
    const body = await req.json();
    step = body.step as Step;
    if (!["all", "scorecard", "cds", "ipeds"].includes(step)) {
      return NextResponse.json(
        { error: 'Invalid step. Must be "all", "scorecard", "cds", or "ipeds"' },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const currentYear = new Date().getFullYear();
  const staleYear   = currentYear - 1; // CDS data is stale if older than last year

  const actions: string[] = [];

  // Reset stale CDS sources back to 'pending' so the scraper re-processes them
  if (step === "all" || step === "cds") {
    const { data: resetRows, error } = await supabase
      .from("cds_sources")
      .update({ scrape_status: "pending" })
      .or(`year.lt.${staleYear},year.is.null`)
      .select("unitid");

    if (error) {
      return NextResponse.json(
        { error: `Failed to reset cds_sources: ${error.message}` },
        { status: 500 }
      );
    }
    actions.push(`Reset ${resetRows?.length ?? 0} stale CDS rows to 'pending'`);
  }

  // For scorecard / ipeds, we just note that the CLI step needs to be run —
  // there's no meaningful DB state to reset without re-running the full import.
  if (step === "all" || step === "scorecard") {
    actions.push("colleges_base will be refreshed on next pipeline run (step 1)");
  }
  if (step === "all" || step === "ipeds") {
    actions.push("ipeds_fallback will be refreshed on next pipeline run (step 4)");
  }

  return NextResponse.json(
    {
      message: "Pipeline state reset. Run the CLI to apply changes.",
      actions,
      next_step: "npx tsx scripts/pipeline/run-pipeline.ts",
    },
    { status: 202 }
  );
}
