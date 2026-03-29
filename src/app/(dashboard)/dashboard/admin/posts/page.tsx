"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

type ModerationPost = {
  id: number;
  title: string;
  body: string;
  images: string[];
  createdAt: string;
  helpfulCount: number;
  reviewStatus: "pending" | "approved" | "rejected";
  reviewedAt: string | null;
  reviewNote: string | null;
  author: {
    id: number;
    firstName: string;
    lastName: string;
    headline: string | null;
    profilePic: string | null;
  } | null;
  reviewer?: {
    id: number;
    firstName: string;
    lastName: string;
    headline: string | null;
    profilePic: string | null;
  } | null;
};

type FilterStatus = "pending" | "approved" | "rejected" | "all";

const tabs: FilterStatus[] = ["pending", "approved", "rejected", "all"];

export default function AdminPostsQueuePage() {
  const router = useRouter();
  const { user, loading, authFetch } = useAuth();
  const [status, setStatus] = useState<FilterStatus>("pending");
  const [posts, setPosts] = useState<ModerationPost[]>([]);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pendingCount = useMemo(
    () => posts.filter((post) => post.reviewStatus === "pending").length,
    [posts]
  );

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.role !== "admin" && user.role !== "board_member") {
      router.push("/welcome");
      return;
    }
    void loadPosts(status);
  }, [loading, user, router, status]);

  const loadPosts = async (nextStatus: FilterStatus) => {
    setLoadingPosts(true);
    setError(null);
    try {
      const data = await authFetch(`/api/admin/posts?status=${nextStatus}`);
      const rows = (data?.posts ?? []) as ModerationPost[];
      setPosts(rows);
      setNotes((prev) => {
        const next = { ...prev };
        for (const post of rows) {
          if (next[post.id] === undefined) {
            next[post.id] = post.reviewNote ?? "";
          }
        }
        return next;
      });
    } catch (e: any) {
      setError(e?.message ?? "Failed to load post queue.");
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  const reviewPost = async (post: ModerationPost, reviewStatus: "approved" | "rejected") => {
    setActionId(post.id);
    setError(null);
    try {
      await authFetch(`/api/admin/posts/${post.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          reviewStatus,
          reviewNote: notes[post.id] ?? "",
        }),
      });
      await loadPosts(status);
    } catch (e: any) {
      setError(e?.message ?? "Failed to review post.");
    } finally {
      setActionId(null);
    }
  };

  if (!user) return null;
  if (user.role !== "admin" && user.role !== "board_member") return null;

  return (
    <div className="py-8 px-4 md:px-8 max-w-6xl mx-auto">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-[#001049]">Post Approval Queue</h1>
        <p className="text-sm text-gray-500 mt-1">
          Review US member posts and approve or reject before publishing to the feed.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatus(tab)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                status === tab ? "bg-[#001049] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {tab === "all" ? "All" : tab[0].toUpperCase() + tab.slice(1)}
              {tab === "pending" ? ` (${pendingCount})` : ""}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loadingPosts ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-28 bg-white rounded-xl border border-gray-100" />
          <div className="h-28 bg-white rounded-xl border border-gray-100" />
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-sm text-gray-500">
          No posts for this status.
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <article key={post.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-[#001049]">{post.title}</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    By {post.author ? `${post.author.firstName} ${post.author.lastName}` : "Unknown user"} ·{" "}
                    {new Date(post.createdAt).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    post.reviewStatus === "approved"
                      ? "bg-green-100 text-green-700"
                      : post.reviewStatus === "rejected"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {post.reviewStatus}
                </span>
              </div>

              <p className="text-sm text-gray-700 mt-3 whitespace-pre-wrap line-clamp-4">{post.body}</p>
              {post.images.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">{post.images.length} image(s) attached</p>
              )}

              <div className="mt-4">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Review note</label>
                <textarea
                  rows={2}
                  value={notes[post.id] ?? ""}
                  onChange={(e) => setNotes((prev) => ({ ...prev, [post.id]: e.target.value }))}
                  disabled={post.reviewStatus !== "pending" || actionId === post.id}
                  className="mt-1 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001049]/20 resize-none"
                />
              </div>

              {post.reviewStatus === "pending" && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => reviewPost(post, "approved")}
                    disabled={actionId === post.id}
                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => reviewPost(post, "rejected")}
                    disabled={actionId === post.id}
                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
