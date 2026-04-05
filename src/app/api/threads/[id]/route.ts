import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { ROLES, verifyToken } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

type ThreadRow = {
  id: number;
  askerId: number;
  recipientId: number;
  question: string;
  answer: string | null;
  answeredAt: string | null;
  createdAt: string;
};

type UserRow = {
  id: number;
  firstName: string;
  lastName: string;
  profilePic: string | null;
};

// PATCH /api/threads/[id] — answer a thread (recipient only)
export async function PATCH(request: Request, context: RouteContext) {
  let payload;
  try {
    payload = verifyToken(request);
  } catch (res) {
    return res as NextResponse;
  }

  if (
    payload.role !== ROLES.US_MEMBER &&
    payload.role !== ROLES.ADMIN &&
    payload.role !== ROLES.BOARD_MEMBER
  ) {
    return NextResponse.json(
      { message: "Only US members, board members, and admins can answer questions." },
      { status: 403 }
    );
  }

  const { id } = await context.params;
  const threadId = Number(id);
  if (!Number.isFinite(threadId)) {
    return NextResponse.json({ message: "Invalid thread ID." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const answer = typeof body?.answer === "string" ? body.answer.trim() : "";

    if (!answer || answer.length > 2000) {
      return NextResponse.json(
        { message: "Answer must be between 1 and 2000 characters." },
        { status: 400 }
      );
    }

    const { data: thread, error: fetchError } = await supabase
      .from("Threads")
      .select("id, askerId, recipientId, question, answer, answeredAt, createdAt")
      .eq("id", threadId)
      .single();

    if (fetchError || !thread) {
      return NextResponse.json({ message: "Thread not found." }, { status: 404 });
    }

    const t = thread as ThreadRow;
    if (t.recipientId !== payload.id) {
      return NextResponse.json(
        { message: "You can only answer questions addressed to you." },
        { status: 403 }
      );
    }
    if (t.answer !== null) {
      return NextResponse.json(
        { message: "This question has already been answered." },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("Threads")
      .update({ answer, answeredAt: now, updatedAt: now })
      .eq("id", threadId);

    if (updateError) {
      console.error("PATCH /api/threads/[id] update failed:", updateError);
      return NextResponse.json({ message: "Failed to save answer." }, { status: 500 });
    }

    // Fetch enriched thread to return
    const userIds = Array.from(new Set([t.askerId, t.recipientId]));
    const { data: users } = await supabase
      .from("Users")
      .select("id, firstName, lastName, profilePic")
      .in("id", userIds);

    const byId = new Map<number, UserRow>(
      ((users ?? []) as UserRow[]).map((u) => [u.id, u])
    );

    return NextResponse.json({
      thread: {
        id: t.id,
        question: t.question,
        answer,
        answeredAt: now,
        createdAt: t.createdAt,
        status: "answered" as const,
        asker: byId.get(t.askerId) ?? null,
        recipient: byId.get(t.recipientId) ?? null,
      },
    });
  } catch (e) {
    console.error("PATCH /api/threads/[id] exception:", e);
    return NextResponse.json({ message: "Failed to save answer." }, { status: 500 });
  }
}
