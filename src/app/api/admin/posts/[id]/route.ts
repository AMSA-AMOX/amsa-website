import { NextResponse } from "next/server";
import { assertContentCreator, verifyToken } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

type ReviewBody = {
  reviewStatus?: "approved" | "rejected";
  reviewNote?: string;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let payload;
  try {
    payload = verifyToken(request);
    assertContentCreator(payload);
  } catch (res) {
    return res as NextResponse;
  }

  try {
    const { id } = await params;
    const postId = Number(id);
    if (!Number.isFinite(postId)) {
      return NextResponse.json({ message: "Invalid post id" }, { status: 400 });
    }

    const body = (await request.json()) as ReviewBody;
    const reviewStatus = body.reviewStatus;
    const reviewNote = body.reviewNote?.trim() || null;

    if (!reviewStatus || !["approved", "rejected"].includes(reviewStatus)) {
      return NextResponse.json({ message: "reviewStatus must be approved or rejected" }, { status: 400 });
    }

    const { data: existing, error: existingError } = await supabase
      .from("Posts")
      .select("id, reviewStatus")
      .eq("id", postId)
      .single<{ id: number; reviewStatus: "pending" | "approved" | "rejected" }>();

    if (existingError || !existing) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }
    if (existing.reviewStatus !== "pending") {
      return NextResponse.json({ message: "Only pending posts can be reviewed." }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from("Posts")
      .update({
        reviewStatus,
        reviewedBy: payload.id,
        reviewedAt: new Date().toISOString(),
        reviewNote,
      })
      .eq("id", postId);

    if (updateError) throw updateError;
    return NextResponse.json({ message: "Post review saved." });
  } catch (error) {
    console.error("PATCH /api/admin/posts/[id] failed:", error);
    return NextResponse.json({ message: "Failed to review post" }, { status: 500 });
  }
}
