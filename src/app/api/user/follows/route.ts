import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyToken } from "@/lib/auth";

export async function GET(request: Request) {
  let payload;
  try {
    payload = verifyToken(request);
  } catch (res) {
    return res as NextResponse;
  }

  try {
    const [followersRes, followingRes] = await Promise.all([
      supabase.from("Follows").select("id", { count: "exact", head: true }).eq("followingId", payload.id),
      supabase.from("Follows").select("followingId").eq("followerId", payload.id),
    ]);

    const followingIds = (followingRes.data ?? []).map((r) => r.followingId as number);

    return NextResponse.json({
      followersCount: followersRes.count ?? 0,
      followingCount: followingIds.length,
      followingIds,
    });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ followersCount: 0, followingCount: 0, followingIds: [] });
  }
}

export async function POST(request: Request) {
  let payload;
  try {
    payload = verifyToken(request);
  } catch (res) {
    return res as NextResponse;
  }

  try {
    const { followingId } = await request.json();
    if (!followingId || followingId === payload.id) {
      return NextResponse.json({ message: "Invalid followingId" }, { status: 400 });
    }

    const { error } = await supabase
      .from("Follows")
      .insert({ followerId: payload.id, followingId });

    if (error && error.code !== "23505") throw error;
    return NextResponse.json({ message: "Followed" });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ message: "Failed to follow" }, { status: 500 });
  }
}
