import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyToken } from "@/lib/auth";
import { FOLLOWS_TABLE_CANDIDATES } from "@/lib/follows-table";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let payload;
  try {
    payload = verifyToken(request);
  } catch (res) {
    return res as NextResponse;
  }

  try {
    const { id: followingId } = await params;

    let lastError: any = null;
    for (const followsTable of FOLLOWS_TABLE_CANDIDATES) {
      const { error } = await supabase
        .from(followsTable)
        .delete()
        .eq("followerId", payload.id)
        .eq("followingId", followingId);

      if (!error) {
        return NextResponse.json({ message: "Unfollowed" });
      }

      lastError = error;
      if (error.code !== "PGRST205") {
        throw error;
      }
    }

    if (lastError?.code === "PGRST205") {
      return NextResponse.json(
        { message: "Follow system is not configured yet. Please apply the follow-table migration." },
        { status: 503 }
      );
    }

    throw lastError ?? new Error("Failed to resolve follows table");
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ message: "Failed to unfollow" }, { status: 500 });
  }
}
