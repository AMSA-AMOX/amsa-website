import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { ROLES, verifyToken } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(request: Request, context: RouteContext) {
  let payload;
  try {
    payload = verifyToken(request);
  } catch (res) {
    return res as NextResponse;
  }

  const params = await context.params;
  const postId = Number(params.id);
  if (!Number.isFinite(postId)) {
    return NextResponse.json({ message: "Invalid post ID." }, { status: 400 });
  }

  const isAdmin = payload.role === ROLES.ADMIN || payload.role === ROLES.BOARD_MEMBER;

  try {
    const { data: post, error: fetchError } = await supabase
      .from("Posts")
      .select("id, userId")
      .eq("id", postId)
      .single<{ id: number; userId: number }>();

    if (fetchError || !post) {
      return NextResponse.json({ message: "Post not found." }, { status: 404 });
    }

    if (!isAdmin && post.userId !== payload.id) {
      return NextResponse.json({ message: "Not authorized." }, { status: 403 });
    }

    const { error: deleteError } = await supabase
      .from("Posts")
      .delete()
      .eq("id", postId);

    if (deleteError) {
      console.error("Delete post failed:", deleteError);
      return NextResponse.json({ message: "Failed to delete post." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Delete post exception:", e);
    return NextResponse.json({ message: "Failed to delete post." }, { status: 500 });
  }
}
