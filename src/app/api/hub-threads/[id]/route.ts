import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyToken } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

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
};

type HubCommentRow = {
  id: number;
  threadId: number;
  authorId: number;
  content: string;
  isAnon: boolean;
  createdAt: string;
};

type UserRow = {
  id: number;
  firstName: string;
  lastName: string;
  profilePic: string | null;
};

// GET /api/hub-threads/[id] — thread detail with comments
export async function GET(request: Request, context: RouteContext) {
  let payload;
  try {
    payload = verifyToken(request);
  } catch (res) {
    return res as NextResponse;
  }

  const { id } = await context.params;
  const threadId = Number(id);
  if (!Number.isFinite(threadId)) {
    return NextResponse.json({ message: "Invalid thread ID." }, { status: 400 });
  }

  try {
    const { data: thread, error } = await supabase
      .from("HubThreads")
      .select("id, askerId, title, question, category, categoryDomain, images, status, isAnon, approvedBy, approvedAt, createdAt")
      .eq("id", threadId)
      .single();

    if (error || !thread) {
      return NextResponse.json({ message: "Thread not found." }, { status: 404 });
    }

    const t = thread as HubThreadRow;
    const isBoardPlus = ["board_member", "admin"].includes(payload.role);

    if (t.status !== "approved" && !isBoardPlus) {
      return NextResponse.json({ message: "Thread not found." }, { status: 404 });
    }

    const { data: comments } = await supabase
      .from("HubComments")
      .select("id, threadId, authorId, content, isAnon, createdAt")
      .eq("threadId", threadId)
      .order("createdAt", { ascending: true });

    const commentRows = (comments ?? []) as HubCommentRow[];

    const userIds = Array.from(new Set([
      ...(t.isAnon ? [] : [t.askerId]),
      ...commentRows.filter((c) => !c.isAnon).map((c) => c.authorId),
    ]));

    const userMap = new Map<number, UserRow>();
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from("Users")
        .select("id, firstName, lastName, profilePic")
        .in("id", userIds);
      ((users ?? []) as UserRow[]).forEach((u) => userMap.set(u.id, u));
    }

    return NextResponse.json({
      thread: {
        id: t.id,
        title: t.title ?? "",
        body: t.question,
        category: t.category ?? "general",
        categoryDomain: t.categoryDomain ?? null,
        images: t.images ?? [],
        status: t.status,
        isAnon: t.isAnon,
        asker: t.isAnon ? null : (userMap.get(t.askerId) ?? null),
        approvedAt: t.approvedAt,
        createdAt: t.createdAt,
      },
      comments: commentRows.map((c) => ({
        id: c.id,
        content: c.content,
        isAnon: c.isAnon,
        author: c.isAnon ? null : (userMap.get(c.authorId) ?? null),
        createdAt: c.createdAt,
      })),
    });
  } catch (e) {
    console.error("GET /api/hub-threads/[id] exception:", e);
    return NextResponse.json({ message: "Failed to load thread." }, { status: 500 });
  }
}

// PATCH /api/hub-threads/[id] — board member+ approves or rejects
export async function PATCH(request: Request, context: RouteContext) {
  let payload;
  try {
    payload = verifyToken(request);
  } catch (res) {
    return res as NextResponse;
  }

  if (!["board_member", "admin"].includes(payload.role)) {
    return NextResponse.json({ message: "Only board members and admins can moderate threads." }, { status: 403 });
  }

  const { id } = await context.params;
  const threadId = Number(id);
  if (!Number.isFinite(threadId)) {
    return NextResponse.json({ message: "Invalid thread ID." }, { status: 400 });
  }

  try {
    const body = await request.json();
    const status = body?.status;
    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json({ message: "status must be 'approved' or 'rejected'." }, { status: 400 });
    }

    const now = new Date().toISOString();
    const { data: updated, error } = await supabase
      .from("HubThreads")
      .update({ status, approvedBy: payload.id, approvedAt: status === "approved" ? now : null, updatedAt: now })
      .eq("id", threadId)
      .select("id, status, approvedAt")
      .single();

    if (error || !updated) {
      console.error("PATCH /api/hub-threads/[id] failed:", error);
      return NextResponse.json({ message: "Failed to update thread." }, { status: 500 });
    }

    return NextResponse.json({ thread: updated });
  } catch (e) {
    console.error("PATCH /api/hub-threads/[id] exception:", e);
    return NextResponse.json({ message: "Failed to update thread." }, { status: 500 });
  }
}

// DELETE /api/hub-threads/[id] — admin only
export async function DELETE(request: Request, context: RouteContext) {
  let payload;
  try {
    payload = verifyToken(request);
  } catch (res) {
    return res as NextResponse;
  }

  if (payload.role !== "admin") {
    return NextResponse.json({ message: "Only admins can delete threads." }, { status: 403 });
  }

  const { id } = await context.params;
  const threadId = Number(id);
  if (!Number.isFinite(threadId)) {
    return NextResponse.json({ message: "Invalid thread ID." }, { status: 400 });
  }

  try {
    await supabase.from("HubComments").delete().eq("threadId", threadId);
    const { error } = await supabase.from("HubThreads").delete().eq("id", threadId);
    if (error) {
      console.error("DELETE /api/hub-threads/[id] failed:", error);
      return NextResponse.json({ message: "Failed to delete thread." }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE /api/hub-threads/[id] exception:", e);
    return NextResponse.json({ message: "Failed to delete thread." }, { status: 500 });
  }
}
