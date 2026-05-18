import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyToken } from "@/lib/auth";

type HubThreadRow = {
  id: number;
  askerId: number;
  title: string;
  question: string;
  category: string;
  categoryDomain: string | null;
  images: string[];
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

async function enrichThreads(
  rows: HubThreadRow[],
  commentCounts: Map<number, number>,
  upvoteCounts: Map<number, number>,
  userUpvotedIds: Set<number>,
) {
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
    title: r.title ?? "",
    body: r.question,
    category: r.category ?? "general",
    categoryDomain: r.categoryDomain ?? null,
    images: r.images ?? [],
    status: r.status,
    isAnon: r.isAnon,
    asker: r.isAnon ? null : (userMap.get(r.askerId) ?? null),
    commentCount: commentCounts.get(r.id) ?? 0,
    upvoteCount: upvoteCounts.get(r.id) ?? 0,
    hasUpvoted: userUpvotedIds.has(r.id),
    approvedAt: r.approvedAt,
    createdAt: r.createdAt,
  }));
}

// GET /api/hub-threads — approved feed (cursor-paginated)
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

  const SELECT = "id, askerId, title, question, category, categoryDomain, images, status, isAnon, approvedBy, approvedAt, createdAt, updatedAt";

  try {
    const isBoardPlus = ["board_member", "admin"].includes(payload.role);

    if (view === "pending") {
      if (!isBoardPlus) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

      const { data, error } = await supabase
        .from("HubThreads")
        .select(SELECT)
        .eq("status", "pending")
        .order("createdAt", { ascending: true })
        .limit(limit);

      if (error) {
        console.error("GET /api/hub-threads?view=pending failed:", error);
        return NextResponse.json({ message: "Failed to load pending threads" }, { status: 500 });
      }

      const rows = (data ?? []) as HubThreadRow[];
      const threads = await enrichThreads(rows, new Map(), new Map(), new Set());
      return NextResponse.json({ threads });
    }

    let query = supabase
      .from("HubThreads")
      .select(SELECT)
      .eq("status", "approved")
      .order("approvedAt", { ascending: false })
      .limit(limit);

    if (cursor) query = query.lt("approvedAt", cursor);

    const { data, error } = await query;
    if (error) {
      console.error("GET /api/hub-threads failed:", error);
      return NextResponse.json({ message: "Failed to load threads" }, { status: 500 });
    }

    const rows = (data ?? []) as HubThreadRow[];

    const commentCounts = new Map<number, number>();
    const upvoteCounts = new Map<number, number>();
    const userUpvotedIds = new Set<number>();
    const threadIds = rows.map((r) => r.id);
    if (threadIds.length > 0) {
      const [{ data: commentRows }, { data: upvoteRows }] = await Promise.all([
        supabase.from("HubComments").select("threadId").in("threadId", threadIds),
        supabase.from("HubThreadUpvotes").select("threadId, userId").in("threadId", threadIds),
      ]);
      ((commentRows ?? []) as { threadId: number }[]).forEach((row) => {
        commentCounts.set(row.threadId, (commentCounts.get(row.threadId) ?? 0) + 1);
      });
      ((upvoteRows ?? []) as { threadId: number; userId: number }[]).forEach((row) => {
        upvoteCounts.set(row.threadId, (upvoteCounts.get(row.threadId) ?? 0) + 1);
        if (row.userId === payload.id) userUpvotedIds.add(row.threadId);
      });
    }

    const threads = await enrichThreads(rows, commentCounts, upvoteCounts, userUpvotedIds);
    const nextCursor = rows.length === limit ? (rows[rows.length - 1].approvedAt ?? null) : null;

    return NextResponse.json({ threads, nextCursor });
  } catch (e) {
    console.error("GET /api/hub-threads exception:", e);
    return NextResponse.json({ message: "Failed to load threads" }, { status: 500 });
  }
}

// POST /api/hub-threads — any authenticated user submits a thread
export async function POST(request: Request) {
  let payload;
  try {
    payload = verifyToken(request);
  } catch (res) {
    return res as NextResponse;
  }

  try {
    const body = await request.json();
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const question = typeof body?.body === "string" ? body.body.trim() : "";
    const category = typeof body?.category === "string" ? body.category.trim() : "general";
    const categoryDomain = typeof body?.categoryDomain === "string" ? body.categoryDomain.trim() : null;
    const isAnon = typeof body?.isAnon === "boolean" ? body.isAnon : false;
    const images: string[] = Array.isArray(body?.images)
      ? body.images.filter((u: unknown) => typeof u === "string").slice(0, 1)
      : [];

    if (!title || title.length > 150) {
      return NextResponse.json({ message: "Title must be between 1 and 150 characters." }, { status: 400 });
    }
    if (question.length > 2000) {
      return NextResponse.json({ message: "Body must be at most 2000 characters." }, { status: 400 });
    }

    const now = new Date().toISOString();
    const { data: inserted, error } = await supabase
      .from("HubThreads")
      .insert({ askerId: payload.id, title, question, category, categoryDomain, images, isAnon, status: "pending", createdAt: now, updatedAt: now })
      .select("id")
      .single();

    if (error) {
      console.error("POST /api/hub-threads insert failed:", error);
      return NextResponse.json({ message: "Failed to submit post." }, { status: 500 });
    }

    return NextResponse.json({ thread: inserted }, { status: 201 });
  } catch (e) {
    console.error("POST /api/hub-threads exception:", e);
    return NextResponse.json({ message: "Failed to submit post." }, { status: 500 });
  }
}
