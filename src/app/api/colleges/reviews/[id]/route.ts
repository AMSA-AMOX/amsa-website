import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyToken } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

// DELETE /api/colleges/reviews/[id]
export async function DELETE(request: Request, context: RouteContext) {
  let payload;
  try {
    payload = verifyToken(request);
  } catch (res) {
    return res as NextResponse;
  }

  const { id } = await context.params;

  try {
    const { data: review, error: fetchError } = await supabase
      .from("college_reviews")
      .select("id, user_id")
      .eq("id", id)
      .single();

    if (fetchError || !review) {
      return NextResponse.json({ message: "Review not found." }, { status: 404 });
    }

    const isOwner = (review as any).user_id === payload.id;
    const isAdmin = payload.role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    }

    const { error: deleteError } = await supabase
      .from("college_reviews")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("DELETE /api/colleges/reviews/[id] failed:", deleteError);
      return NextResponse.json({ message: "Failed to delete review." }, { status: 500 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (e) {
    console.error("DELETE /api/colleges/reviews/[id] exception:", e);
    return NextResponse.json({ message: "Failed to delete review." }, { status: 500 });
  }
}
