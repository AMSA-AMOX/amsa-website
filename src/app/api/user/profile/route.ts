import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyToken } from "@/lib/auth";

const ALLOWED_FIELDS = new Set([
  "firstName",
  "lastName",
  "bio",
  "profilePic",
  "phoneNumber",
  "personalEmail",
  "city",
  "state",
  "schoolName",
  "degreeLevel",
  "major",
  "schoolYear",
  "graduationYear",
  "x",
  "facebook",
  "instagram",
  "linkedin",
]);

export async function PATCH(request: Request) {
  let payload;
  try {
    payload = verifyToken(request);
  } catch (res) {
    return res as NextResponse;
  }

  try {
    const body = await request.json();

    // Only allow whitelisted fields — never let callers change role, email, password, etc.
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body)) {
      if (ALLOWED_FIELDS.has(key)) {
        updates[key] = value === "" ? null : value;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ message: "No valid fields to update" }, { status: 400 });
    }

    const { data: user, error } = await supabase
      .from("Users")
      .update(updates)
      .eq("id", payload.id)
      .select(
        "id, email, firstName, lastName, role, acceptanceStatus, profilePic, level, bio, createdAt, phoneNumber, city, state, schoolName, major, degreeLevel, graduationYear, schoolYear, personalEmail, x, facebook, instagram, linkedin"
      )
      .single();

    if (error || !user) {
      console.error(error);
      return NextResponse.json({ message: "Update failed" }, { status: 500 });
    }

    return NextResponse.json({ user });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Update failed" }, { status: 500 });
  }
}
