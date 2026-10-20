import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const MAX_NAME_LEN = 100;
const MAX_EMAIL_LEN = 254;

// Public newsletter signup (InfoCTASection). It used to read and insert
// "newsletter" from the browser with the anon key; the table is now closed to it.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const firstName = String(body.firstName ?? "").trim();
    const lastName = String(body.lastName ?? "").trim();
    const email = String(body.email ?? "").trim();

    if (!firstName || !lastName || !email) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }
    if (firstName.length > MAX_NAME_LEN || lastName.length > MAX_NAME_LEN || email.length > MAX_EMAIL_LEN || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ message: "Enter a valid name and email." }, { status: 400 });
    }

    const { data: existing } = await supabaseAdmin
      .from("newsletter")
      .select("email")
      .eq("email", email)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ message: "This email is already subscribed." }, { status: 409 });
    }

    const { error } = await supabaseAdmin
      .from("newsletter")
      .insert([{ first_name: firstName, last_name: lastName, email }]);
    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ message: "This email is already subscribed." }, { status: 409 });
      }
      console.error("Newsletter insert error:", error);
      return NextResponse.json({ message: "Could not subscribe right now. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
