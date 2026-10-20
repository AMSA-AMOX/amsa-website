import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyToken } from "@/lib/auth";

export async function GET(request: Request) {
  let payload;
  try {
    payload = verifyToken(request);
  } catch (res) {
    return res as NextResponse;
  }

  try {
    const { data: users } = await supabaseAdmin
      .from("Users")
      .select("id, firstName, lastName, profilePic, schoolName, graduationYear, major, schoolYear")
      .eq("acceptanceStatus", "approved")
      .neq("id", payload.id)
      .limit(5);

    return NextResponse.json({ users: users ?? [] });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ users: [] });
  }
}
