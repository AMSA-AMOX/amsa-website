"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PostCard from "@/components/posts/PostCard";
import PostComposer from "@/components/posts/PostComposer";
import type { PostItem } from "@/components/posts/types";
import { POST_TOPICS } from "@/components/posts/types";
import { useAuth } from "@/context/AuthContext";

export default function FeedPage() {
  const router = useRouter();
  const { user, loading, authFetch } = useAuth();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [error, setError] = useState("");
  const [postingMessage, setPostingMessage] = useState("");
  const [appreciating, setAppreciating] = useState<Set<number>>(new Set());
  const [policyOpen, setPolicyOpen] = useState(false);
  const [postOpen, setPostOpen] = useState(false);
  const [followingIds, setFollowingIds] = useState<Set<number>>(new Set());
  const [followingInProgress, setFollowingInProgress] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState<Set<number>>(new Set());
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());
  const [filterOpen, setFilterOpen] = useState(false);
  const canPost =
    user?.role === "us_member" || user?.role === "admin" || user?.role === "board_member";
  const canSeeTopActions = user?.role !== "member";

  const loadPosts = useCallback(async () => {
    setLoadingPosts(true);
    setError("");
    try {
      const data = await authFetch("/api/posts?limit=40");
      setPosts((data.posts ?? []) as PostItem[]);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load posts.");
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  }, [authFetch]);

  const loadFollowing = useCallback(async () => {
    try {
      const data = await authFetch("/api/user/follows");
      setFollowingIds(new Set((data.followingIds ?? []) as number[]));
    } catch {
      setFollowingIds(new Set());
    }
  }, [authFetch]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    loadPosts();
    loadFollowing();
  }, [user, loading, router, loadPosts, loadFollowing]);

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

  const onFollow = async (authorId: number) => {
    if (followingInProgress.has(authorId)) return;
    const isFollowing = followingIds.has(authorId);
    setFollowingInProgress((prev) => new Set(prev).add(authorId));
    setFollowingIds((prev) => {
      const next = new Set(prev);
      isFollowing ? next.delete(authorId) : next.add(authorId);
      return next;
    });
    try {
      if (isFollowing) {
        await authFetch(`/api/user/follows/${authorId}`, { method: "DELETE" });
      } else {
        await authFetch("/api/user/follows", {
          method: "POST",
          body: JSON.stringify({ followingId: authorId }),
        });
      }
    } catch {
      setFollowingIds((prev) => {
        const next = new Set(prev);
        isFollowing ? next.add(authorId) : next.delete(authorId);
        return next;
      });
    } finally {
      setFollowingInProgress((prev) => {
        const next = new Set(prev);
        next.delete(authorId);
        return next;
      });
    }
  };

  const onDelete = async (postId: number) => {
    setDeleting((prev) => new Set(prev).add(postId));
    try {
      await authFetch(`/api/posts/${postId}`, { method: "DELETE" });
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch {
      // leave post in list on failure
    } finally {
      setDeleting((prev) => { const next = new Set(prev); next.delete(postId); return next; });
    }
  };

  const [reportedIds, setReportedIds] = useState<Set<number>>(new Set());

  const onReport = async (postId: number) => {
    if (reportedIds.has(postId)) return;
    setReportedIds((prev) => new Set(prev).add(postId));
    try {
      await authFetch(`/api/posts/${postId}/report`, { method: "POST" });
      setPostingMessage("Post reported. Thank you for keeping AMSA safe.");
    } catch {
      setReportedIds((prev) => { const next = new Set(prev); next.delete(postId); return next; });
      setPostingMessage("Failed to submit report. Please try again.");
    }
    setTimeout(() => setPostingMessage(""), 4000);
  };

  const onCreated = (post: PostItem) => {
    if (post.reviewStatus === "approved") {
      setPosts((prev) => [post, ...prev]);
      setPostingMessage("Post published.");
      setPostOpen(false);
      return;
    }
    setPostingMessage("Post submitted for approval. It will appear on feed once approved.");
    setPostOpen(false);
  };

  const filteredPosts = selectedTopics.size === 0
    ? posts
    : posts.filter((p) =>
        p.topic?.split(",").map((t) => t.trim()).some((t) => selectedTopics.has(t))
      );

  if (!user) return null;

  return (
    <div className="py-8 px-4 md:px-8 max-w-4xl mx-auto">
      

      {/* Topic filter — single toggle button */}
      <div className="mb-5">
        <button
          type="button"
          onClick={() => setFilterOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold border-2 border-gray-300 bg-white text-gray-600 hover:border-gray-400 transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
          </svg>
          
          {selectedTopics.size > 0 && (
            <span className="text-gray-700">· {selectedTopics.size}</span>
          )}
        </button>

        {filterOpen && (
          <div className="mt-2.5 flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setSelectedTopics(new Set())}
              className={`shrink-0 px-3.5 py-1.5 rounded-lg text-sm font-semibold border-2 transition ${
                selectedTopics.size === 0
                    ? "bg-gray-200 text-black border-gray-500"
                  : "border-gray-300 text-gray-600 bg-white hover:border-gray-400"
              }`}
            >
              All
            </button>
            {POST_TOPICS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setSelectedTopics((prev) => {
                    const next = new Set(prev);
                    next.has(t) ? next.delete(t) : next.add(t);
                    return next;
                  });
                }}
                className={`shrink-0 px-3.5 py-1.5 rounded-lg text-sm font-semibold border-2 transition ${
                  selectedTopics.has(t)
                    ? "bg-gray-200 text-black border-gray-500"
                    : "border-gray-300 text-gray-600 bg-white hover:border-gray-400"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {canSeeTopActions && (
        <div className="mb-6">
          <button
            type="button"
            onClick={() => setPostOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3 bg-white rounded-xl border-2 border-gray-300 text-lg text-gray-400 hover:bg-gray-50 transition"
          >
            <div className="w-12 h-12 rounded-full bg-[#FFCA3A] text-[#001049] text-lg font-bold flex items-center justify-center overflow-hidden shrink-0">
              {user.profilePic ? (
                <img src={user.profilePic} alt={user.firstName} className="w-full h-full object-cover" />
              ) : (
                `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
              )}
            </div>
            Share something with the community...
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}
      {postingMessage && (
        <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          {postingMessage}
        </div>
      )}

      <div>
        {loadingPosts &&
          Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="py-5 border-b border-gray-200 space-y-3 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gray-100 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-gray-100 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
              </div>
              <div className="pl-14 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-full" />
                <div className="h-4 bg-gray-100 rounded w-4/5" />
                <div className="h-52 bg-gray-100 rounded-xl" />
              </div>
            </div>
          ))}

        {!loadingPosts && filteredPosts.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16">
            <img src="/assets/empty/leaves.svg" alt="" className="w-56 h-56" />
            <p className="text-lg font-medium text-gray-400">
              {selectedTopics.size > 0 ? `No posts match the selected filters` : "No posts yet"}
            </p>
          </div>
        )}

        {!loadingPosts &&
          filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onAppreciate={onAppreciate}
              appreciating={appreciating.has(post.id)}
              showAuthor
              onFollow={post.author?.id !== user.id ? onFollow : undefined}
              isFollowing={post.author ? followingIds.has(post.author.id) : false}
              followingInProgress={post.author ? followingInProgress.has(post.author.id) : false}
              onDelete={
                post.author?.id === user.id || user.role === "admin" || user.role === "board_member"
                  ? onDelete
                  : undefined
              }
              deleting={deleting.has(post.id)}
              onReport={post.author?.id !== user.id ? onReport : undefined}
            />
          ))}
      </div>

      {policyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setPolicyOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-[#001049]">Posting Policy</h2>
              <button onClick={() => setPolicyOpen(false)} className="text-gray-400 hover:text-gray-600">
                x
              </button>
            </div>
            <ul className="text-sm text-gray-700 space-y-2 list-disc pl-5">
              <li>Only US Members, Board Members, and Admins can submit posts.</li>
              <li>US Member posts require Admin/Board approval before they appear on feed.</li>
              <li>Each user can submit up to 2 post requests per day.</li>
              <li>Keep content professional and relevant to AMSA community values.</li>
            </ul>
          </div>
        </div>
      )}

      {postOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setPostOpen(false)} />
          <div className="relative w-full max-w-2xl">
            <PostComposer
              onCreated={onCreated}
              canPost={Boolean(canPost)}
              cannotPostMessage="Only US members, board members, and admins can post."
              onClose={() => setPostOpen(false)}
            />
          </div>
        </div>
      )}

    </div>
  );
}
