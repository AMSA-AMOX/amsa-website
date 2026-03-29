import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  let payload;
  try {
    payload = verifyToken(request);
  } catch (res) {
    return res as NextResponse;
  }

  try {
    const { data: user, error } = await supabase
      .from("Users")
      .select("id, appreciationTokens")
      .eq("id", payload.id)
      .single<{ id: number; appreciationTokens: number | null }>();

    if (error || !user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ tokens: user.appreciationTokens ?? 0 });
  } catch (error) {
    console.error("GET /api/user/tokens failed:", error);
    return NextResponse.json({ message: "Failed to load token balance" }, { status: 500 });
  }
}
