import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { makeResetToken } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email/resend";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const normalizedEmail = body.email?.toLowerCase().trim();

    if (!normalizedEmail) {
      return NextResponse.json({ message: "Missing email" }, { status: 400 });
    }

    const { data: user } = await supabase
      .from("Users")
      .select("id, email, password, firstName")
      .eq("email", normalizedEmail)
      .single();

    // Only send if the account exists, but always return the same response so
    // we never reveal whether an email is registered.
    if (user?.password) {
      const token = makeResetToken({ id: user.id, passwordHash: user.password });
      const origin =
        request.headers.get("origin") ??
        new URL(request.url).origin;
      const resetUrl = `${origin}/reset-password?token=${encodeURIComponent(token)}`;

      try {
        await sendPasswordResetEmail({
          userEmail: user.email,
          firstName: user.firstName ?? undefined,
          resetUrl,
        });
      } catch (emailError) {
        console.error("Password reset email failed:", emailError);
      }
    }

    return NextResponse.json({
      message: "If an account exists for that email, a reset link has been sent.",
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Request failed" }, { status: 500 });
  }
}
