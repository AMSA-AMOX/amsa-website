import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { listNetworkMembersForUser } from "@/lib/network-users";

export async function GET(request: Request) {
  let payload;
  try {
    payload = verifyToken(request);
  } catch (res) {
    return res as NextResponse;
  }

  try {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? "24");
    const users = await listNetworkMembersForUser(payload.id, { limit });
    return NextResponse.json({ users });
  } catch (e) {
    console.error("Network endpoint error:", e);
    return NextResponse.json({ users: [] }, { status: 500 });
  }
}
