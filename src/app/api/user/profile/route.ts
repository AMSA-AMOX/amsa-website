import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyToken } from "@/lib/auth";
import { emailDomainLabel, verifySchoolEmail } from "@/lib/college-match";
import { resolveUserDenorm } from "@/lib/user-denorm";

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
    // Then refresh the denormalized college/state/logo columns from the result.
    if ("schoolEmail" in updates || "schoolName" in updates || "state" in updates) {
      const { data: current } = await supabase
        .from("Users")
        .select("schoolName, schoolEmail, state")
        .eq("id", payload.id)
        .maybeSingle<{ schoolName: string | null; schoolEmail: string | null; state: string | null }>();

      const schoolEmail = ("schoolEmail" in updates ? updates.schoolEmail : current?.schoolEmail) as string | null;
      let schoolName = ("schoolName" in updates ? updates.schoolName : current?.schoolName) as string | null;
      const state = ("state" in updates ? updates.state : current?.state) as string | null;

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
          schoolName = check.college.name;
          updates.schoolName = schoolName;
        }
      }

      Object.assign(updates, await resolveUserDenorm({ schoolName, schoolEmail, state }));
    }

    const { data: user, error } = await supabase
      .from("Users")
      .update(updates)
      .eq("id", payload.id)
      .select(
        "id, email, firstName, lastName, role, acceptanceStatus, profilePic, level, headline, bio, createdAt, phoneNumber, city, state, schoolName, schoolEmail, logo_domain, college_unitid, major, degreeLevel, graduationYear, schoolYear, personalEmail, x, facebook, instagram, linkedin"
      )
      .single();

    if (error || !user) {
      console.error(error);
      return NextResponse.json({ message: "Update failed" }, { status: 500 });
    }

    // Same shape as /api/auth/me — the profile page swaps its state for this.
    const { logo_domain, college_unitid, ...rest } = user;
    return NextResponse.json({
      user: { ...rest, logoDomain: logo_domain ?? null, collegeId: college_unitid ?? null },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Update failed" }, { status: 500 });
  }
}
