import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyToken } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string; commentId: string }> };

// POST /api/hub-threads/[id]/comments/[commentId]/upvote — toggle upvote on a comment
export async function POST(request: Request, context: RouteContext) {
  let payload;
  try {
    payload = verifyToken(request);
  } catch (res) {
    return res as NextResponse;
  }

  const { commentId: commentIdStr } = await context.params;
  const commentId = Number(commentIdStr);
  if (!Number.isFinite(commentId)) {
    return NextResponse.json({ message: "Invalid comment ID." }, { status: 400 });
  }

  try {
    const { data: existing } = await supabase
      .from("HubCommentUpvotes")
      .select("commentId")
      .eq("commentId", commentId)
      .eq("userId", payload.id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("HubCommentUpvotes")
        .delete()
        .eq("commentId", commentId)
        .eq("userId", payload.id);
    } else {
      await supabase
        .from("HubCommentUpvotes")
        .insert({ commentId, userId: payload.id, createdAt: new Date().toISOString() });
    }

    const { count } = await supabase
      .from("HubCommentUpvotes")
      .select("*", { count: "exact", head: true })
      .eq("commentId", commentId);

    return NextResponse.json({ upvoteCount: count ?? 0, hasUpvoted: !existing });
  } catch (e) {
    console.error("POST comments/[commentId]/upvote exception:", e);
    return NextResponse.json({ message: "Failed to toggle upvote." }, { status: 500 });
  }
}
