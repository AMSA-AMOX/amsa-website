"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PostCard from "@/components/posts/PostCard";
import type { PostItem } from "@/components/posts/types";
import { useAuth } from "@/context/AuthContext";

export default function BlogsPage() {
  const router = useRouter();
  const { user, loading, authFetch } = useAuth();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [error, setError] = useState("");
  const [appreciating, setAppreciating] = useState<Set<number>>(new Set());

  const loadOwnPosts = useCallback(async () => {
    if (!user) return;
    setLoadingPosts(true);
    setError("");
    try {
      const data = await authFetch(`/api/posts?creatorId=${user.id}&includeModeration=true&limit=30`);
      setPosts((data.posts ?? []) as PostItem[]);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load your posts.");
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  }, [authFetch, user]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    loadOwnPosts();
  }, [loading, user, router, loadOwnPosts]);

  const onAppreciate = async (postId: number) => {
    if (appreciating.has(postId)) return;
    const current = posts.find((post) => post.id === postId);
    if (!current || current.hasAppreciated) return;

    const nextCount = Math.max(0, current.appreciationCount + 1);

    setAppreciating((prev) => new Set(prev).add(postId));
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? { ...post, hasAppreciated: true, appreciationCount: nextCount }
          : post
      )
    );

    try {
      const data = await authFetch(`/api/posts/${postId}/helpful`, { method: "POST" });
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                hasAppreciated: Boolean(data.hasAppreciated),
                appreciationCount: Number(data.appreciationCount ?? post.appreciationCount),
              }
            : post
        )
      );
    } catch {
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                hasAppreciated: current.hasAppreciated,
                appreciationCount: current.appreciationCount,
              }
            : post
        )
      );
    } finally {
      setAppreciating((prev) => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    }
  };

  if (!user) return null;

  return (
    <div className="py-8 px-4 md:px-8 max-w-4xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-[#001049] mb-1">Creator Dashboard</h1>
        <p className="text-gray-500 text-sm">
          Review your posts and track moderation status. Create new posts from{" "}
          <Link href="/dashboard/feed" className="text-[#001049] font-medium hover:underline">
            Feed
          </Link>
          .
        </p>
      </header>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#001049]">Your posts</h2>
          <p className="text-xs text-gray-500">{posts.length} total</p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {loadingPosts &&
          Array.from({ length: 2 }).map((_, idx) => (
            <div key={idx} className="bg-white rounded-2xl shadow-sm p-5 space-y-3 animate-pulse border border-gray-100">
              <div className="h-5 bg-gray-100 rounded w-2/3" />
              <div className="h-4 bg-gray-100 rounded w-full" />
              <div className="h-44 bg-gray-100 rounded-xl" />
            </div>
          ))}

        {!loadingPosts && posts.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <p className="text-base font-semibold text-[#001049]">No posts yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Your posts will appear here right after publishing.
            </p>
          </div>
        )}

        {!loadingPosts &&
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onAppreciate={onAppreciate}
              appreciating={appreciating.has(post.id)}
              showAuthor={false}
            />
          ))}
      </section>
    </div>
  );
}
