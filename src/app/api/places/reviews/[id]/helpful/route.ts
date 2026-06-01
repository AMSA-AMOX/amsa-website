import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyToken } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  let payload;
  try {
    payload = verifyToken(request);
  } catch (res) {
    return res as NextResponse;
  }

  const { id: reviewId } = await context.params;

  try {
    const { data: review, error: fetchError } = await supabase
      .from("place_reviews")
      .select("id, helpful_user_ids")
      .eq("id", reviewId)
      .maybeSingle();

    if (fetchError || !review) {
      return NextResponse.json({ message: "Review not found." }, { status: 404 });
    }

    const current = (review.helpful_user_ids as number[] | null) ?? [];
    const alreadyHelpful = current.includes(payload.id);
    const next = alreadyHelpful
      ? current.filter((id) => id !== payload.id)
      : [...current, payload.id];

    const { error: updateError } = await supabase
      .from("place_reviews")
      .update({ helpful_user_ids: next })
      .eq("id", reviewId);

    if (updateError) {
      console.error("POST helpful failed:", updateError);
      return NextResponse.json({ message: "Failed to update helpful." }, { status: 500 });
    }

    return NextResponse.json({ hasHelpful: !alreadyHelpful, helpfulCount: next.length });
  } catch (e) {
    console.error("POST helpful exception:", e);
    return NextResponse.json({ message: "Failed to mark helpful." }, { status: 500 });
  }
}
