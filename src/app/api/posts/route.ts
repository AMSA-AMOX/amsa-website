import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { ROLES, verifyToken } from "@/lib/auth";

type RawPostRow = {
  id: number;
  userId: number | string | null;
  title: string;
  body: string;
  images: string[] | null;
  helpfulCount: number | null;
  createdAt: string;
  reviewStatus: "pending" | "approved" | "rejected";
  reviewedAt: string | null;
  reviewNote: string | null;
};

type RawUserRow = {
  id: number;
  firstName: string;
  lastName: string;
  headline: string | null;
  profilePic: string | null;
};

const normalizeImages = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
};

const parseLimit = (value: string | null) => {
  const parsed = Number(value ?? "25");
  if (!Number.isFinite(parsed)) return 25;
  return Math.min(100, Math.max(1, Math.floor(parsed)));
};

const normalizeId = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const canModerate = (role: string | null | undefined) =>
  role === ROLES.ADMIN || role === ROLES.BOARD_MEMBER;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = parseLimit(url.searchParams.get("limit"));
  const creatorIdParam = url.searchParams.get("creatorId");
  const creatorId = creatorIdParam ? Number(creatorIdParam) : null;
  const includeModeration = url.searchParams.get("includeModeration") === "true";
  const reviewStatusParam = url.searchParams.get("reviewStatus");

  let viewerId: number | null = null;
  let viewerRole: string | null = null;
  try {
    const payload = verifyToken(request);
    viewerId = payload.id;
    viewerRole = payload.role;
  } catch {
    viewerId = null;
    viewerRole = null;
  }

  try {
    let query = supabase
      .from("Posts")
      .select("id, userId, title, body, images, helpfulCount, createdAt, reviewStatus, reviewedAt, reviewNote")
      .order("createdAt", { ascending: false })
      .limit(limit);

    if (creatorId && Number.isFinite(creatorId)) {
      query = query.eq("userId", creatorId);
    }
    if (reviewStatusParam && ["pending", "approved", "rejected"].includes(reviewStatusParam)) {
      query = query.eq("reviewStatus", reviewStatusParam);
    }

    const canViewModeration =
      includeModeration &&
      !!viewerId &&
      (canModerate(viewerRole) || (creatorId !== null && creatorId === viewerId));

    if (!canViewModeration) {
      query = query.eq("reviewStatus", "approved");
    }

    const { data: posts, error } = await query;
    if (error) {
      console.error("List posts failed:", error);
      return NextResponse.json({ message: "Failed to load posts" }, { status: 500 });
    }

    const safePosts = (posts ?? []) as RawPostRow[];
    if (safePosts.length === 0) return NextResponse.json({ posts: [] });

    const userIds = Array.from(
      new Set(
        safePosts
          .map((post) => normalizeId(post.userId))
          .filter((id): id is number => id !== null)
      )
    );

    let usersById = new Map<number, RawUserRow>();
    if (userIds.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from("Users")
        .select("id, firstName, lastName, headline, profilePic")
        .in("id", userIds);

      if (usersError) {
        console.error("List post users failed:", usersError);
        return NextResponse.json({ message: "Failed to load posts" }, { status: 500 });
      }

      usersById = new Map<number, RawUserRow>(
        ((users ?? []) as RawUserRow[]).map((user) => [user.id, user])
      );
    }

    let appreciationRows: Array<{ postId: number }> = [];
    if (viewerId) {
      const { data: helpfulData, error: helpfulError } = await supabase
        .from("PostHelpfuls")
        .select("postId")
        .eq("userId", viewerId)
        .in(
          "postId",
          safePosts.map((post) => post.id)
        );

      if (!helpfulError) {
        appreciationRows = (helpfulData ?? []) as Array<{ postId: number }>;
      }
    }

    const appreciationSet = new Set(appreciationRows.map((row) => row.postId));

    return NextResponse.json({
      posts: safePosts.map((post) => ({
        id: post.id,
        title: post.title,
        body: post.body,
        images: normalizeImages(post.images),
        createdAt: post.createdAt,
        appreciationCount: post.helpfulCount ?? 0,
        hasAppreciated: appreciationSet.has(post.id),
        reviewStatus: post.reviewStatus,
        reviewedAt: post.reviewedAt,
        reviewNote: post.reviewNote,
        author: (() => {
          const normalizedUserId = normalizeId(post.userId);
          return normalizedUserId !== null ? usersById.get(normalizedUserId) ?? null : null;
        })(),
      })),
    });
  } catch (e) {
    console.error("List posts exception:", e);
    return NextResponse.json({ message: "Failed to load posts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let payload;
  try {
    payload = verifyToken(request);
  } catch (res) {
    return res as NextResponse;
  }

  try {
    if (
      payload.role !== ROLES.US_MEMBER &&
      payload.role !== ROLES.ADMIN &&
      payload.role !== ROLES.BOARD_MEMBER
    ) {
      return NextResponse.json(
        { message: "Only US members, board members, and admins can post." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const text = typeof body?.body === "string" ? body.body.trim() : "";
    const images = normalizeImages(body?.images).slice(0, 6);
    const reviewStatus = payload.role === ROLES.US_MEMBER ? "pending" : "approved";
    const nowIso = new Date().toISOString();
    const startOfUtcDay = new Date();
    startOfUtcDay.setUTCHours(0, 0, 0, 0);

    const { count: todayCount, error: countError } = await supabase
      .from("Posts")
      .select("*", { count: "exact", head: true })
      .eq("userId", payload.id)
      .gte("createdAt", startOfUtcDay.toISOString());

    if (countError) {
      console.error("Daily post count failed:", countError);
      return NextResponse.json({ message: "Failed to create post" }, { status: 500 });
    }
    if ((todayCount ?? 0) >= 2) {
      return NextResponse.json(
        { message: "You can submit up to 2 post requests per day." },
        { status: 429 }
      );
    }

    if (!title || !text) {
      return NextResponse.json(
        { message: "Title and body are required." },
        { status: 400 }
      );
    }
    if (title.length > 180 || text.length > 4000) {
      return NextResponse.json(
        { message: "Title or body exceeds allowed length." },
        { status: 400 }
      );
    }

    const { data: insertedPost, error } = await supabase
      .from("Posts")
      .insert({
        userId: payload.id,
        title,
        body: text,
        images,
        reviewStatus,
        createdAt: nowIso,
        updatedAt: nowIso,
      })
      .select("id, userId, title, body, images, helpfulCount, createdAt, reviewStatus, reviewedAt, reviewNote")
      .single();

    if (error || !insertedPost) {
      console.error("Create post failed:", error);
      return NextResponse.json({ message: "Failed to create post" }, { status: 500 });
    }

    const { data: author } = await supabase
      .from("Users")
      .select("id, firstName, lastName, headline, profilePic")
      .eq("id", payload.id)
      .single();

    return NextResponse.json({
      post: {
        id: insertedPost.id,
        title: insertedPost.title,
        body: insertedPost.body,
        images: normalizeImages(insertedPost.images),
        createdAt: insertedPost.createdAt,
        appreciationCount: insertedPost.helpfulCount ?? 0,
        hasAppreciated: false,
        reviewStatus: insertedPost.reviewStatus,
        reviewedAt: insertedPost.reviewedAt,
        reviewNote: insertedPost.reviewNote,
        author: author ?? null,
      },
      requiresApproval: reviewStatus === "pending",
    });
  } catch (e) {
    console.error("Create post exception:", e);
    return NextResponse.json({ message: "Failed to create post" }, { status: 500 });
  }
}
