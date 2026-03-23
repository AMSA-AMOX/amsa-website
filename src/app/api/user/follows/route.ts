import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyToken } from "@/lib/auth";
import { FOLLOWS_TABLE_CANDIDATES } from "@/lib/follows-table";

export async function GET(request: Request) {
  let payload;
  try {
    payload = verifyToken(request);
  } catch (res) {
    return res as NextResponse;
  }

  try {
    let lastError: any = null;
    for (const followsTable of FOLLOWS_TABLE_CANDIDATES) {
      const [followersRes, followingRes] = await Promise.all([
        supabase.from(followsTable).select("id", { count: "exact", head: true }).eq("followingId", payload.id),
        supabase.from(followsTable).select("followingId").eq("followerId", payload.id),
      ]);

      if (!followersRes.error && !followingRes.error) {
        const followingIds = (followingRes.data ?? []).map((r) => r.followingId as number);
        return NextResponse.json({
          followersCount: followersRes.count ?? 0,
          followingCount: followingIds.length,
          followingIds,
        });
      }

      const probeError = followersRes.error ?? followingRes.error;
      lastError = probeError;
      if (probeError?.code !== "PGRST205") {
        throw probeError;
      }
    }

    if (lastError?.code === "PGRST205") {
      return NextResponse.json({ followersCount: 0, followingCount: 0, followingIds: [] });
    }

    throw lastError ?? new Error("Failed to resolve follows table");
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

    let lastError: any = null;
    for (const followsTable of FOLLOWS_TABLE_CANDIDATES) {
      const { error } = await supabase
        .from(followsTable)
        .insert({ followerId: payload.id, followingId });

      if (!error || error.code === "23505") {
        return NextResponse.json({ message: "Followed" });
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
    return NextResponse.json({ message: "Failed to follow" }, { status: 500 });
  }
}
