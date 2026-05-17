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
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
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

  const filteredPosts = selectedTopic
    ? posts.filter((p) =>
        p.topic?.split(",").map((t) => t.trim()).includes(selectedTopic)
      )
    : posts;

  if (!user) return null;

  return (
    <div className="py-8 px-4 md:px-8 max-w-4xl mx-auto">
      <p className="text-gray-500 text-sm mb-6">
        Community posts from AMSA members. Appreciate posts to send Tokens of Appreciation.
      </p>

      {canSeeTopActions && (
        <div className="mb-6">
          <button
            type="button"
            onClick={() => setPostOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3 bg-white rounded-2xl border border-gray-200 text-sm text-gray-400 hover:bg-gray-50 transition"
          >
            <div className="w-10 h-10 rounded-full bg-[#FFCA3A] text-[#001049] text-sm font-bold flex items-center justify-center overflow-hidden shrink-0">
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

      {/* Topic filter — single toggle button */}
      <div className="mb-5">
        <button
          type="button"
          onClick={() => setFilterOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold border border-gray-200 bg-white text-gray-600 hover:border-gray-300 transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25" />
          </svg>
          Filter
          {selectedTopic && (
            <span className="text-[#001049]">· {selectedTopic}</span>
          )}
          <svg xmlns="http://www.w3.org/2000/svg" className={`w-3.5 h-3.5 text-gray-400 transition-transform ${filterOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {filterOpen && (
          <div className="mt-2.5 flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => { setSelectedTopic(null); setFilterOpen(false); }}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-semibold border transition ${
                selectedTopic === null
                  ? "bg-[#001049] text-white border-[#001049]"
                  : "border-gray-200 text-gray-600 hover:border-[#001049] hover:text-[#001049]"
              }`}
            >
              All
            </button>
            {POST_TOPICS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setSelectedTopic(selectedTopic === t ? null : t); setFilterOpen(false); }}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-semibold border transition ${
                  selectedTopic === t
                    ? "bg-[#001049] text-white border-[#001049]"
                    : "border-gray-200 text-gray-600 hover:border-[#001049] hover:text-[#001049]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

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

      <div className="space-y-4">
        {loadingPosts &&
          Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="bg-white rounded-2xl shadow-sm p-5 space-y-3 animate-pulse border border-gray-100">
              <div className="h-4 bg-gray-100 rounded w-2/5" />
              <div className="h-5 bg-gray-100 rounded w-3/4" />
              <div className="h-4 bg-gray-100 rounded w-full" />
              <div className="h-4 bg-gray-100 rounded w-4/5" />
              <div className="h-52 bg-gray-100 rounded-xl" />
            </div>
          ))}

        {!loadingPosts && filteredPosts.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16">
            {selectedTopic ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z" />
              </svg>
            )}
            <p className="text-sm font-medium text-gray-400">
              {selectedTopic ? `No posts tagged "${selectedTopic}"` : "No posts yet"}
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
