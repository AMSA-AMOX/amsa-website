import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { sendFeedbackEmail } from "@/lib/email/resend";

const FEEDBACK_CATEGORIES = ["Bug", "Idea", "Question", "Other"] as const;
type Category = (typeof FEEDBACK_CATEGORIES)[number];

const MIN_LEN = 10;
const MAX_LEN = 2000;
const COOLDOWN_MS = 60_000;

// Best-effort per-instance throttle (one submission per user per minute).
// Nothing is stored server-side; the email is the record.
const lastSentAt = new Map<number, number>();

export async function POST(request: Request) {
  let payload;
  try {
    payload = verifyToken(request);
  } catch (res) {
    return res as NextResponse;
  }

  try {
    const body = await request.json().catch(() => ({}));
    const category = String(body.category ?? "").trim() as Category;
    const message = String(body.message ?? "").trim();
    const page = typeof body.page === "string" ? body.page.slice(0, 200) : null;

    if (!FEEDBACK_CATEGORIES.includes(category)) {
      return NextResponse.json({ message: "Pick a category." }, { status: 400 });
    }
    if (message.length < MIN_LEN) {
      return NextResponse.json({ message: `Tell us a bit more (at least ${MIN_LEN} characters).` }, { status: 400 });
    }
    if (message.length > MAX_LEN) {
      return NextResponse.json({ message: `Please keep it under ${MAX_LEN} characters.` }, { status: 400 });
    }

    const last = lastSentAt.get(payload.id) ?? 0;
    if (Date.now() - last < COOLDOWN_MS) {
      return NextResponse.json({ message: "Please wait a minute before sending more feedback." }, { status: 429 });
    }

    const { data: user } = await supabase
      .from("Users")
      .select("id, email, firstName, lastName, role")
      .eq("id", payload.id)
      .maybeSingle();
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    await sendFeedbackEmail({
      category,
      message,
      page,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        role: user.role ?? "member",
      },
    });
    lastSentAt.set(payload.id, Date.now());

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/feedback failed:", e);
    return NextResponse.json({ message: "We couldn't send your feedback right now. Please try again later." }, { status: 502 });
  }
}
