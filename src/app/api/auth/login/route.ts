import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";
import { makeToken, isAmsaAdminEmail } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;
    const normalizedEmail = email?.toLowerCase().trim();

    if (!normalizedEmail || !password) {
      return NextResponse.json(
        { message: "Missing email or password" },
        { status: 400 }
      );
    }

    const { data: user, error } = await supabase
      .from("Users")
      .select("id, email, password, firstName, lastName, role, acceptanceStatus, profilePic, level, bio")
      .eq("email", normalizedEmail)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    let role = user.role ?? "member";

    // Auto-upgrade @amsa.mn emails to admin
    if (isAmsaAdminEmail(normalizedEmail) && role !== "admin") {
      role = "admin";
      await supabase.from("Users").update({ role }).eq("id", user.id);
    }

    const token = makeToken({ id: user.id, role });

    return NextResponse.json({
      message: "Login successful",
      user: {
        id: user.id,
        email: normalizedEmail,
        role,
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        acceptanceStatus: user.acceptanceStatus ?? "pending",
        profilePic: user.profilePic ?? null,
        level: user.level ?? null,
        bio: user.bio ?? null,
      },
      token,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Login failed" }, { status: 500 });
  }
}
