import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyToken } from "@/lib/auth";

type HubThreadRow = {
  id: number;
  askerId: number;
  question: string;
  status: string;
  isAnon: boolean;
  approvedBy: number | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type UserRow = {
  id: number;
  firstName: string;
  lastName: string;
  profilePic: string | null;
};

async function enrichThreads(rows: HubThreadRow[], commentCounts: Map<number, number>) {
  if (rows.length === 0) return [];

  const askerIds = Array.from(new Set(rows.filter((r) => !r.isAnon).map((r) => r.askerId)));
  const userMap = new Map<number, UserRow>();

  if (askerIds.length > 0) {
    const { data: users } = await supabase
      .from("Users")
      .select("id, firstName, lastName, profilePic")
      .in("id", askerIds);
    ((users ?? []) as UserRow[]).forEach((u) => userMap.set(u.id, u));
  }

  return rows.map((r) => ({
    id: r.id,
    question: r.question,
    status: r.status,
    isAnon: r.isAnon,
    asker: r.isAnon ? null : (userMap.get(r.askerId) ?? null),
    commentCount: commentCounts.get(r.id) ?? 0,
    approvedAt: r.approvedAt,
    createdAt: r.createdAt,
  }));
}

// GET /api/hub-threads — approved threads feed (cursor-paginated)
// GET /api/hub-threads?view=pending — board member+ pending queue
export async function GET(request: Request) {
  let payload;
  try {
    payload = verifyToken(request);
  } catch (res) {
    return res as NextResponse;
  }

  const url = new URL(request.url);
  const view = url.searchParams.get("view");
  const cursor = url.searchParams.get("cursor");
  const limitRaw = Number(url.searchParams.get("limit") ?? "20");
  const limit = Math.min(50, Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 20));

  try {
    const isBoardPlus = ["board_member", "admin"].includes(payload.role);

    if (view === "pending") {
      if (!isBoardPlus) {
        return NextResponse.json({ message: "Forbidden" }, { status: 403 });
      }
      const { data, error } = await supabase
        .from("HubThreads")
        .select("id, askerId, question, status, isAnon, approvedBy, approvedAt, createdAt, updatedAt")
        .eq("status", "pending")
        .order("createdAt", { ascending: true })
        .limit(limit);

      if (error) {
        console.error("GET /api/hub-threads?view=pending failed:", error);
        return NextResponse.json({ message: "Failed to load pending threads" }, { status: 500 });
      }

      const rows = (data ?? []) as HubThreadRow[];
      const counts = new Map<number, number>();
      const threads = await enrichThreads(rows, counts);
      return NextResponse.json({ threads });
    }

    // Default: approved threads feed
    let query = supabase
      .from("HubThreads")
      .select("id, askerId, question, status, isAnon, approvedBy, approvedAt, createdAt, updatedAt")
      .eq("status", "approved")
      .order("approvedAt", { ascending: false })
      .limit(limit);

    if (cursor) {
      query = query.lt("approvedAt", cursor);
    }

    const { data, error } = await query;
    if (error) {
      console.error("GET /api/hub-threads failed:", error);
      return NextResponse.json({ message: "Failed to load threads" }, { status: 500 });
    }

    const rows = (data ?? []) as HubThreadRow[];

    // Fetch comment counts
    const threadIds = rows.map((r) => r.id);
    const commentCounts = new Map<number, number>();
    if (threadIds.length > 0) {
      const { data: commentRows } = await supabase
        .from("HubComments")
        .select("threadId")
        .in("threadId", threadIds);
      ((commentRows ?? []) as { threadId: number }[]).forEach((row) => {
        commentCounts.set(row.threadId, (commentCounts.get(row.threadId) ?? 0) + 1);
      });
    }

    const threads = await enrichThreads(rows, commentCounts);
    const nextCursor =
      rows.length === limit ? (rows[rows.length - 1].approvedAt ?? null) : null;

    return NextResponse.json({ threads, nextCursor });
  } catch (e) {
    console.error("GET /api/hub-threads exception:", e);
    return NextResponse.json({ message: "Failed to load threads" }, { status: 500 });
  }
}

// POST /api/hub-threads — any authenticated user submits a question
export async function POST(request: Request) {
  let payload;
  try {
    payload = verifyToken(request);
  } catch (res) {
    return res as NextResponse;
  }

  try {
    const body = await request.json();
    const question = typeof body?.question === "string" ? body.question.trim() : "";
    const isAnon = typeof body?.isAnon === "boolean" ? body.isAnon : false;

    if (!question || question.length > 600) {
      return NextResponse.json(
        { message: "Question must be between 1 and 600 characters." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const { data: inserted, error: insertError } = await supabase
      .from("HubThreads")
      .insert({ askerId: payload.id, question, isAnon, status: "pending", createdAt: now, updatedAt: now })
      .select("id, askerId, question, status, isAnon, approvedBy, approvedAt, createdAt, updatedAt")
      .single();

    if (insertError) {
      console.error("POST /api/hub-threads insert failed:", insertError);
      return NextResponse.json({ message: "Failed to submit question." }, { status: 500 });
    }

    return NextResponse.json({ thread: inserted }, { status: 201 });
  } catch (e) {
    console.error("POST /api/hub-threads exception:", e);
    return NextResponse.json({ message: "Failed to submit question." }, { status: 500 });
  }
}
