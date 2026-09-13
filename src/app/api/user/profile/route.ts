import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyToken } from "@/lib/auth";
import { emailDomainLabel, verifySchoolEmail } from "@/lib/college-match";

const ALLOWED_FIELDS = new Set([
  "firstName",
  "lastName",
  "headline",
  "bio",
  "profilePic",
  "phoneNumber",
  "personalEmail",
  "city",
  "state",
  "schoolName",
  "schoolEmail",
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

    // Keep the school email and school name consistent: the .edu domain must
    // belong to the named college, and when it does we store the official name.
    if ("schoolEmail" in updates || "schoolName" in updates) {
      const { data: current } = await supabase
        .from("Users")
        .select("schoolName, schoolEmail")
        .eq("id", payload.id)
        .maybeSingle<{ schoolName: string | null; schoolEmail: string | null }>();

      const schoolEmail = ("schoolEmail" in updates ? updates.schoolEmail : current?.schoolEmail) as string | null;
      const schoolName = ("schoolName" in updates ? updates.schoolName : current?.schoolName) as string | null;

      if (schoolEmail) {
        const check = await verifySchoolEmail(schoolEmail, schoolName);
        if (check.status === "mismatch") {
          return NextResponse.json(
            {
              message: `Your school email (${emailDomainLabel(schoolEmail)}) belongs to ${check.college.name}, but the school is set to "${schoolName}". Please make them match.`,
            },
            { status: 400 },
          );
        }
        if (check.status === "match" && check.college.name !== schoolName) {
          updates.schoolName = check.college.name;
        }
      }
    }

    const { data: user, error } = await supabase
      .from("Users")
      .update(updates)
      .eq("id", payload.id)
      .select(
        "id, email, firstName, lastName, role, acceptanceStatus, profilePic, level, headline, bio, createdAt, phoneNumber, city, state, schoolName, schoolEmail, major, degreeLevel, graduationYear, schoolYear, personalEmail, x, facebook, instagram, linkedin"
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
