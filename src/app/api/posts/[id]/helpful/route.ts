import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { rpc } from "@/lib/rpc";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type AppreciateResult =
  | { status: "ok" | "already"; appreciationCount: number }
  | { status: "not_found" | "not_approved" };

/**
 * One atomic SQL call (appreciate_post): checks the post, inserts the
 * appreciation, recounts, and bumps the author's tokens inside a single
 * transaction — replacing 8 sequential queries and a read-modify-write race.
 */
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
    const result = await rpc<AppreciateResult>("appreciate_post", { p_post_id: postId, p_user_id: payload.id });

    switch (result.status) {
      case "not_found":
        return NextResponse.json({ message: "Post not found" }, { status: 404 });
      case "not_approved":
        return NextResponse.json({ message: "Helpful is available for approved posts only." }, { status: 400 });
      case "already":
        return NextResponse.json({ message: "You already appreciated this post." }, { status: 409 });
      default:
        return NextResponse.json({ hasAppreciated: true, appreciationCount: result.appreciationCount });
    }
  } catch (e) {
    console.error("Toggle helpful exception:", e);
    return NextResponse.json({ message: "Failed to update helpful" }, { status: 500 });
  }
}
