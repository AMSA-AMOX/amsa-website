import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyToken } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

// POST /api/hub-threads/[id]/upvote — toggle upvote
export async function POST(request: Request, context: RouteContext) {
  let payload;
  try {
    payload = verifyToken(request);
  } catch (res) {
    return res as NextResponse;
  }

  const { id } = await context.params;
  const threadId = Number(id);
  if (!Number.isFinite(threadId)) {
    return NextResponse.json({ message: "Invalid thread ID." }, { status: 400 });
  }

  try {
    const { data: existing } = await supabase
      .from("HubThreadUpvotes")
      .select("threadId")
      .eq("threadId", threadId)
      .eq("userId", payload.id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("HubThreadUpvotes")
        .delete()
        .eq("threadId", threadId)
        .eq("userId", payload.id);
    } else {
      await supabase
        .from("HubThreadUpvotes")
        .insert({ threadId, userId: payload.id, createdAt: new Date().toISOString() });
    }

    const { count } = await supabase
      .from("HubThreadUpvotes")
      .select("*", { count: "exact", head: true })
      .eq("threadId", threadId);

    return NextResponse.json({ upvoteCount: count ?? 0, hasUpvoted: !existing });
  } catch (e) {
    console.error("POST /api/hub-threads/[id]/upvote exception:", e);
    return NextResponse.json({ message: "Failed to toggle upvote." }, { status: 500 });
  }
}
