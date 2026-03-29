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

  try {
    const { data: post } = await supabase
      .from("Posts")
      .select("id, reviewStatus")
      .eq("id", postId)
      .single();

    if (!post) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }
    if (post.reviewStatus !== "approved") {
      return NextResponse.json({ message: "Helpful is available for approved posts only." }, { status: 400 });
    }

    const { data: existingHelpful, error: existingError } = await supabase
      .from("PostHelpfuls")
      .select("id")
      .eq("postId", postId)
      .eq("userId", payload.id)
      .maybeSingle();

    if (existingError) {
      console.error("Check helpful state failed:", existingError);
      return NextResponse.json(
        { message: "Failed to update helpful" },
        { status: 500 }
      );
    }

    if (existingHelpful) {
      return NextResponse.json(
        { message: "You already appreciated this post." },
        { status: 409 }
      );
    }

    const { error: insertError } = await supabase
      .from("PostHelpfuls")
      .insert({ postId, userId: payload.id });

    if (insertError) {
      console.error("Create appreciation failed:", insertError);
      return NextResponse.json(
        { message: "Failed to appreciate post" },
        { status: 500 }
      );
    }

    const { count, error: countError } = await supabase
      .from("PostHelpfuls")
      .select("*", { count: "exact", head: true })
      .eq("postId", postId);

    if (countError) {
      console.error("Count helpful failed:", countError);
      return NextResponse.json(
        { message: "Failed to update helpful" },
        { status: 500 }
      );
    }

    const appreciationCount = count ?? 0;
    const { error: postUpdateError } = await supabase
      .from("Posts")
      .update({ helpfulCount: appreciationCount })
      .eq("id", postId);

    if (postUpdateError) {
      console.error("Persist helpful count failed:", postUpdateError);
      return NextResponse.json(
        { message: "Failed to update helpful" },
        { status: 500 }
      );
    }

    const { data: postAuthor, error: authorError } = await supabase
      .from("Posts")
      .select("userId")
      .eq("id", postId)
      .single<{ userId: number }>();

    if (!authorError && postAuthor?.userId) {
      const { data: author } = await supabase
        .from("Users")
        .select("id, appreciationTokens")
        .eq("id", postAuthor.userId)
        .single<{ id: number; appreciationTokens: number | null }>();

      if (author) {
        await supabase
          .from("Users")
          .update({ appreciationTokens: (author.appreciationTokens ?? 0) + 1 })
          .eq("id", author.id);
      }
    }

    return NextResponse.json({ hasAppreciated: true, appreciationCount });
  } catch (e) {
    console.error("Toggle helpful exception:", e);
    return NextResponse.json({ message: "Failed to update helpful" }, { status: 500 });
  }
}
