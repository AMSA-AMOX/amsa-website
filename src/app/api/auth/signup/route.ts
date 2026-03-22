import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";
import { makeToken, isAmsaAdminEmail } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName } = body;

    const eduEmail = email?.toLowerCase().trim();

    if (!eduEmail || !password) {
      return NextResponse.json(
        { message: "Missing email or password" },
        { status: 400 }
      );
    }

    // Check for existing user
    const { data: existing } = await supabase
      .from("Users")
      .select("id")
      .eq("email", eduEmail)
      .single();

    if (existing) {
      return NextResponse.json(
        { message: "Email already in use" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const isBoardMember = isAmsaAdminEmail(eduEmail);
    const role = isBoardMember ? "board_member" : "member";
    const acceptanceStatus = isBoardMember ? "approved" : "pending";
    const emailVerified = isBoardMember;

    const { data: user, error: userError } = await supabase
      .from("Users")
      .insert({
        email: eduEmail,
        password: hashedPassword,
        firstName,
        lastName,
        role,
        acceptanceStatus,
        emailVerified,
      })
      .select("id, email, firstName, lastName, role, acceptanceStatus")
      .single();

    if (userError || !user) {
      console.error(userError);
      return NextResponse.json({ message: "Signup failed" }, { status: 500 });
    }

    const token = makeToken({ id: user.id, role });

    return NextResponse.json(
      {
        message: "Signup successful",
        user: {
          id: user.id,
          email: eduEmail,
          role,
          firstName,
          lastName,
          acceptanceStatus,
          profilePic: null,
          level: null,
          bio: null,
        },
        token,
      },
      { status: 201 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Signup failed" }, { status: 500 });
  }
}
