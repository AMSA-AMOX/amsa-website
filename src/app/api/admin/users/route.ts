import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { ROLES, verifyToken } from "@/lib/auth";

// GET /api/admin/users?search=...&limit=50
export async function GET(request: Request) {
  let payload;
  try {
    payload = verifyToken(request);
  } catch (res) {
    return res as NextResponse;
  }

  if (payload.role !== ROLES.ADMIN) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const search = url.searchParams.get("search")?.trim() ?? "";
  const limitRaw = Number(url.searchParams.get("limit") ?? "100");
  const limit = Math.min(200, Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 100));

  try {
    let query = supabase
      .from("Users")
      .select("id, firstName, lastName, email, role, profilePic, createdAt")
      .order("createdAt", { ascending: false })
      .limit(limit);

    if (search) {
      query = query.or(
        `firstName.ilike.%${search}%,lastName.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    const { data, error } = await query;
    if (error) {
      console.error("GET /api/admin/users failed:", error);
      return NextResponse.json({ message: "Failed to load users." }, { status: 500 });
    }

    return NextResponse.json({ users: data ?? [] });
  } catch (e) {
    console.error("GET /api/admin/users exception:", e);
    return NextResponse.json({ message: "Failed to load users." }, { status: 500 });
  }
}
