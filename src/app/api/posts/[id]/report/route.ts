import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyToken } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  let payload;
  try {
    payload = verifyToken(request);
  } catch (res) {
    return res as NextResponse;
  }

  const params = await context.params;
  const postId = Number(params.id);
  if (!Number.isFinite(postId)) {
    return NextResponse.json({ message: "Invalid post id" }, { status: 400 });
  }

  const { data: post } = await supabase
    .from("Posts")
    .select("id, userId")
    .eq("id", postId)
    .single();

  if (!post) {
    return NextResponse.json({ message: "Post not found" }, { status: 404 });
  }
  if (post.userId === payload.id) {
    return NextResponse.json({ message: "You cannot report your own post." }, { status: 400 });
  }

  const { error } = await supabase.from("PostReports").insert({
    postId,
    reporterId: payload.id,
  });

  if (error) {
    // unique constraint = already reported
    if (error.code === "23505") {
      return NextResponse.json({ message: "You already reported this post." }, { status: 409 });
    }
    console.error("Post report insert failed:", error);
    return NextResponse.json({ message: "Failed to submit report." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
