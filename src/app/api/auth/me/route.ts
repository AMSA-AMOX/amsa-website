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
      .select(
        "id, email, firstName, lastName, role, acceptanceStatus, profilePic, level, bio, createdAt, phoneNumber, city, state, schoolName, major, degreeLevel, graduationYear, schoolYear, personalEmail, x, facebook, instagram, linkedin"
      )
      .eq("id", payload.id)
      .single();

    if (error || !user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { message: "Failed to load user" },
      { status: 500 }
    );
  }
}
