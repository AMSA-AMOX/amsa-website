import { NextResponse } from "next/server";
import { assertContentCreator, verifyToken } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

type RawPostRow = {
  id: number;
  userId: number | string | null;
  title: string;
  body: string;
  images: string[] | null;
  createdAt: string;
  helpfulCount: number | null;
  reviewStatus: "pending" | "approved" | "rejected";
  reviewedAt: string | null;
  reviewedBy: number | null;
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

const normalizeId = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

export async function GET(request: Request) {
  let payload;
  try {
    payload = verifyToken(request);
    assertContentCreator(payload);
  } catch (res) {
    return res as NextResponse;
  }

  try {
    const url = new URL(request.url);
    const status = (url.searchParams.get("status") || "pending").toLowerCase();
    if (!["pending", "approved", "rejected", "all"].includes(status)) {
      return NextResponse.json({ message: "Invalid status filter" }, { status: 400 });
    }

    let query = supabase
      .from("Posts")
      .select("id, userId, title, body, images, createdAt, helpfulCount, reviewStatus, reviewedAt, reviewedBy, reviewNote")
      .order("createdAt", { ascending: false })
      .limit(100);

    if (status !== "all") {
      query = query.eq("reviewStatus", status);
    }

    const { data: posts, error } = await query.returns<RawPostRow[]>();
    if (error) throw error;

    const safePosts = posts ?? [];
    if (safePosts.length === 0) return NextResponse.json({ posts: [] });

    const userIds = Array.from(
      new Set(
        safePosts
          .map((post) => normalizeId(post.userId))
          .filter((value): value is number => value !== null)
      )
    );
    const reviewerIds = Array.from(
      new Set(
        safePosts
          .map((post) => post.reviewedBy)
          .filter((value): value is number => typeof value === "number")
      )
    );
    const lookupIds = Array.from(new Set([...userIds, ...reviewerIds]));

    let usersById = new Map<number, RawUserRow>();
    if (lookupIds.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from("Users")
        .select("id, firstName, lastName, headline, profilePic")
        .in("id", lookupIds)
        .returns<RawUserRow[]>();

      if (usersError) throw usersError;
      usersById = new Map((users ?? []).map((user) => [user.id, user]));
    }

    return NextResponse.json({
      posts: safePosts.map((post) => ({
        id: post.id,
        title: post.title,
        body: post.body,
        images: normalizeImages(post.images),
        createdAt: post.createdAt,
        helpfulCount: post.helpfulCount ?? 0,
        reviewStatus: post.reviewStatus,
        reviewedAt: post.reviewedAt,
        reviewNote: post.reviewNote,
        author: (() => {
          const normalizedUserId = normalizeId(post.userId);
          return normalizedUserId !== null ? usersById.get(normalizedUserId) ?? null : null;
        })(),
        reviewer: post.reviewedBy ? usersById.get(post.reviewedBy) ?? null : null,
      })),
    });
  } catch (error) {
    console.error("GET /api/admin/posts failed:", error);
    return NextResponse.json({ message: "Failed to load post queue" }, { status: 500 });
  }
}
