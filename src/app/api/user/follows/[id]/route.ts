import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyToken } from "@/lib/auth";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let payload;
  try {
    payload = verifyToken(request);
  } catch (res) {
    return res as NextResponse;
  }

  try {
    const { id: followingId } = await params;
    await supabase
      .from("Follows")
      .delete()
      .eq("followerId", payload.id)
      .eq("followingId", followingId);

    return NextResponse.json({ message: "Unfollowed" });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ message: "Failed to unfollow" }, { status: 500 });
  }
}
