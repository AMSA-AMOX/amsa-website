import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";
import { decodeResetTokenId, verifyResetToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json({ message: "Missing reset token" }, { status: 400 });
    }

    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const userId = decodeResetTokenId(token);
    if (userId === null) {
      return NextResponse.json(
        { message: "This reset link is invalid or has expired." },
        { status: 400 }
      );
    }

    const { data: user } = await supabase
      .from("Users")
      .select("id, password")
      .eq("id", userId)
      .single();

    // Verify against the current password hash so used/expired links fail.
    if (!user?.password || !verifyResetToken(token, user.password)) {
      return NextResponse.json(
        { message: "This reset link is invalid or has expired." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const { error: updateError } = await supabase
      .from("Users")
      .update({ password: hashedPassword })
      .eq("id", user.id);

    if (updateError) {
      console.error(updateError);
      return NextResponse.json({ message: "Failed to reset password" }, { status: 500 });
    }

    return NextResponse.json({ message: "Password reset successful" });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Failed to reset password" }, { status: 500 });
  }
}
