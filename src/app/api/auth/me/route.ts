import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { findCollegeByEmail } from "@/lib/college-match";

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
        "id, email, firstName, lastName, role, acceptanceStatus, profilePic, level, headline, bio, createdAt, phoneNumber, city, state, schoolName, schoolEmail, major, degreeLevel, graduationYear, schoolYear, personalEmail, x, facebook, instagram, linkedin"
      )
      .eq("id", payload.id)
      .single();

    if (error || !user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const role = user.role ?? "member";
    const roles = role === "admin" ? ["admin", "us_member"] : [role];

    // Users approved before the profile sync may have no schoolName; the
    // persistent fix is `scripts/backfill-school-names.ts` (run once). Here we
    // only fill it in the response so the profile renders — no write on a read.
    if (!user.schoolName && user.schoolEmail) {
      const college = await findCollegeByEmail(user.schoolEmail);
      if (college) user.schoolName = college.name;
    }

    return NextResponse.json({ user: { ...user, roles } });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { message: "Failed to load user" },
      { status: 500 }
    );
  }
}
