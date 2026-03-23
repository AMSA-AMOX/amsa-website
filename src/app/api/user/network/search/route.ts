import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { listNetworkMembersForUser } from "@/lib/network-users";

const sanitizeSearch = (value: string) => value.replace(/[%_,]/g, " ").trim();

export async function GET(request: Request) {
  let payload;
  try {
    payload = verifyToken(request);
  } catch (res) {
    return res as NextResponse;
  }

  try {
    const url = new URL(request.url);
    const q = sanitizeSearch(url.searchParams.get("q") ?? "");
    const limit = Number(url.searchParams.get("limit") ?? "30");

    if (!q) {
      return NextResponse.json({ users: [] });
    }

    const users = await listNetworkMembersForUser(payload.id, { query: q, limit });
    return NextResponse.json({ users });
  } catch (e) {
    console.error("Network search endpoint error:", e);
    return NextResponse.json({ users: [] }, { status: 500 });
  }
}
