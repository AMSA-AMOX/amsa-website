import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyToken } from "@/lib/auth";

type RouteContext = { params: Promise<{ userId: string }> };

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

// GET /api/threads/profile/[userId] — answered threads for a profile's Threads tab
export async function GET(request: Request, context: RouteContext) {
  try {
    verifyToken(request);
  } catch (res) {
    return res as NextResponse;
  }

  const { userId } = await context.params;
  const targetId = Number(userId);
  if (!Number.isFinite(targetId)) {
    return NextResponse.json({ message: "Invalid user ID." }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from("Threads")
      .select("id, askerId, recipientId, question, answer, answeredAt, createdAt")
      .eq("recipientId", targetId)
      .not("answer", "is", null)
      .order("answeredAt", { ascending: false })
      .limit(30);

    if (error) {
      console.error("GET /api/threads/profile/[userId] failed:", error);
      return NextResponse.json({ message: "Failed to load threads." }, { status: 500 });
    }

    const rows = (data ?? []) as ThreadRow[];
    if (rows.length === 0) return NextResponse.json({ threads: [] });

    const userIds = Array.from(
      new Set([...rows.map((r) => r.askerId), ...rows.map((r) => r.recipientId)])
    );
    const { data: users } = await supabase
      .from("Users")
      .select("id, firstName, lastName, profilePic")
      .in("id", userIds);

    const byId = new Map<number, UserRow>(
      ((users ?? []) as UserRow[]).map((u) => [u.id, u])
    );

    const threads = rows.map((r) => ({
      id: r.id,
      question: r.question,
      answer: r.answer,
      answeredAt: r.answeredAt,
      createdAt: r.createdAt,
      status: "answered" as const,
      asker: byId.get(r.askerId) ?? null,
      recipient: byId.get(r.recipientId) ?? null,
    }));

    return NextResponse.json({ threads });
  } catch (e) {
    console.error("GET /api/threads/profile/[userId] exception:", e);
    return NextResponse.json({ message: "Failed to load threads." }, { status: 500 });
  }
}
