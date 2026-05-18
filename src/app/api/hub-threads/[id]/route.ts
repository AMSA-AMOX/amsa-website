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
  parentId: number | null;
  createdAt: string;
};

type UserRow = {
  id: number;
  firstName: string;
  lastName: string;
  profilePic: string | null;
};

// GET /api/hub-threads/[id] — thread detail with comments (upvotes + nested replies)
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

    // Fetch all comments (top-level + replies)
    const { data: comments } = await supabase
      .from("HubComments")
      .select("id, threadId, authorId, content, isAnon, parentId, createdAt")
      .eq("threadId", threadId)
      .order("createdAt", { ascending: true });

    const commentRows = (comments ?? []) as HubCommentRow[];
    const commentIds = commentRows.map((c) => c.id);

    // Thread upvotes
    const { data: threadUpvotes } = await supabase
      .from("HubThreadUpvotes")
      .select("userId")
      .eq("threadId", threadId);

    const threadUpvoteList = (threadUpvotes ?? []) as { userId: number }[];
    const threadUpvoteCount = threadUpvoteList.length;
    const threadHasUpvoted = threadUpvoteList.some((u) => u.userId === payload.id);

    // Comment upvotes
    const commentUpvoteCounts = new Map<number, number>();
    const commentUserUpvoted = new Set<number>();
    if (commentIds.length > 0) {
      const { data: commentUpvotes } = await supabase
        .from("HubCommentUpvotes")
        .select("commentId, userId")
        .in("commentId", commentIds);
      ((commentUpvotes ?? []) as { commentId: number; userId: number }[]).forEach((u) => {
        commentUpvoteCounts.set(u.commentId, (commentUpvoteCounts.get(u.commentId) ?? 0) + 1);
        if (u.userId === payload.id) commentUserUpvoted.add(u.commentId);
      });
    }

    // Resolve user IDs
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

    // Build comment objects
    const commentMap = new Map<number, any>();
    for (const c of commentRows) {
      commentMap.set(c.id, {
        id: c.id,
        content: c.content,
        isAnon: c.isAnon,
        parentId: c.parentId ?? null,
        author: c.isAnon ? null : (userMap.get(c.authorId) ?? null),
        createdAt: c.createdAt,
        upvoteCount: commentUpvoteCounts.get(c.id) ?? 0,
        hasUpvoted: commentUserUpvoted.has(c.id),
        replies: [],
      });
    }

    // Nest replies under parents
    const topLevel: any[] = [];
    for (const c of commentRows) {
      const obj = commentMap.get(c.id)!;
      if (c.parentId != null && commentMap.has(c.parentId)) {
        commentMap.get(c.parentId).replies.push(obj);
      } else {
        topLevel.push(obj);
      }
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
        upvoteCount: threadUpvoteCount,
        hasUpvoted: threadHasUpvoted,
      },
      comments: topLevel,
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
    await supabase.from("HubCommentUpvotes").delete().in(
      "commentId",
      (await supabase.from("HubComments").select("id").eq("threadId", threadId)).data?.map((c: any) => c.id) ?? []
    );
    await supabase.from("HubThreadUpvotes").delete().eq("threadId", threadId);
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
