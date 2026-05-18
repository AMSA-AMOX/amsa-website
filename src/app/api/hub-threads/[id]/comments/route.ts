import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyToken } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

// POST /api/hub-threads/[id]/comments — post a comment or reply (parentId for replies)
export async function POST(request: Request, context: RouteContext) {
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
    const { data: thread, error: threadError } = await supabase
      .from("HubThreads")
      .select("id, status")
      .eq("id", threadId)
      .single();

    if (threadError || !thread || (thread as any).status !== "approved") {
      return NextResponse.json({ message: "Thread not found or not yet approved." }, { status: 404 });
    }

    const body = await request.json();
    const content = typeof body?.content === "string" ? body.content.trim() : "";
    const isAnon = typeof body?.isAnon === "boolean" ? body.isAnon : false;
    const parentIdRaw = body?.parentId != null ? Number(body.parentId) : null;

    if (!content || content.length > 2000) {
      return NextResponse.json(
        { message: "Comment must be between 1 and 2000 characters." },
        { status: 400 }
      );
    }

    // Validate parentId: must belong to this thread and be a top-level comment
    let parentId: number | null = null;
    if (parentIdRaw != null && Number.isFinite(parentIdRaw)) {
      const { data: parent } = await supabase
        .from("HubComments")
        .select("id, threadId, parentId")
        .eq("id", parentIdRaw)
        .single();

      if (!parent || (parent as any).threadId !== threadId) {
        return NextResponse.json({ message: "Parent comment not found." }, { status: 404 });
      }
      if ((parent as any).parentId != null) {
        return NextResponse.json({ message: "Cannot reply to a reply." }, { status: 400 });
      }
      parentId = parentIdRaw;
    }

    const now = new Date().toISOString();
    const { data: inserted, error: insertError } = await supabase
      .from("HubComments")
      .insert({ threadId, authorId: payload.id, content, isAnon, parentId, createdAt: now })
      .select("id, threadId, authorId, content, isAnon, parentId, createdAt")
      .single();

    if (insertError) {
      console.error("POST /api/hub-threads/[id]/comments failed:", insertError);
      return NextResponse.json({ message: "Failed to submit comment." }, { status: 500 });
    }

    let author = null;
    if (!isAnon) {
      const { data: user } = await supabase
        .from("Users")
        .select("id, firstName, lastName, profilePic")
        .eq("id", payload.id)
        .single();
      author = user ?? null;
    }

    const comment = inserted as any;
    return NextResponse.json({
      comment: {
        id: comment.id,
        content: comment.content,
        isAnon: comment.isAnon,
        parentId: comment.parentId ?? null,
        author,
        createdAt: comment.createdAt,
        upvoteCount: 0,
        hasUpvoted: false,
        replies: [],
      },
    }, { status: 201 });
  } catch (e) {
    console.error("POST /api/hub-threads/[id]/comments exception:", e);
    return NextResponse.json({ message: "Failed to submit comment." }, { status: 500 });
  }
}
