"use client";

import { useMemo } from "react";
import type { PostItem } from "@/components/posts/types";

const formatRelative = (isoDate: string) => {
  const then = new Date(isoDate).getTime();
  const now = Date.now();
  const diffMs = Math.max(0, now - then);
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d`;
  return new Date(isoDate).toLocaleDateString();
};

type PostCardProps = {
  post: PostItem;
  onAppreciate: (postId: number) => void;
  appreciating: boolean;
  showAuthor?: boolean;
  onFollow?: (authorId: number) => void;
  isFollowing?: boolean;
  followingInProgress?: boolean;
};

export default function PostCard({
  post,
  onAppreciate,
  appreciating,
  showAuthor = true,
  onFollow,
  isFollowing,
  followingInProgress,
}: PostCardProps) {
  const initials = useMemo(() => {
    const first = post.author?.firstName?.[0] ?? "";
    const last = post.author?.lastName?.[0] ?? "";
    return `${first}${last}`.toUpperCase() || "U";
  }, [post.author?.firstName, post.author?.lastName]);

  const imageCount = post.images.length;
  const imageGridClass =
    imageCount === 1
      ? "grid grid-cols-1 gap-2"
      : imageCount === 2
      ? "grid grid-cols-2 gap-2"
      : "grid grid-cols-2 md:grid-cols-3 gap-2";

  return (
    <article className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {showAuthor && (
        <header className="px-5 pt-5 pb-3 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-[#FFCA3A] text-[#001049] text-sm font-bold flex items-center justify-center overflow-hidden shrink-0">
            {post.author?.profilePic ? (
              <img
                src={post.author.profilePic}
                alt={`${post.author.firstName} ${post.author.lastName}`}
                className="w-full h-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {post.author
                ? `${post.author.firstName} ${post.author.lastName}`
                : "Unknown user"}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {post.author?.headline || "AMSA Member"} · {formatRelative(post.createdAt)}
            </p>
          </div>
          {onFollow && post.author && (
            <button
              type="button"
              onClick={() => onFollow(post.author!.id)}
              disabled={followingInProgress}
              className={`ml-auto shrink-0 px-3 py-1 rounded-full text-xs font-semibold border transition disabled:opacity-50 ${
                isFollowing
                  ? "border-gray-300 text-gray-500 hover:border-red-300 hover:text-red-500"
                  : "border-[#001049] text-[#001049] hover:bg-[#001049] hover:text-white"
              }`}
            >
              {isFollowing ? "Following" : "Follow"}
            </button>
          )}
        </header>
      )}

      <div className={`${showAuthor ? "px-5 pb-4" : "p-5"}`}>
        {post.reviewStatus !== "approved" && (
          <div className="mb-2">
            <span
              className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                post.reviewStatus === "pending"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {post.reviewStatus === "pending" ? "Pending approval" : "Rejected"}
            </span>
            {post.reviewNote && (
              <p className="mt-1 text-xs text-gray-500">
                Review note: {post.reviewNote}
              </p>
            )}
          </div>
        )}
        <h2 className="text-lg font-bold text-[#001049] leading-snug">{post.title}</h2>
        <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{post.body}</p>

        {post.images.length > 0 && (
          <div className={`mt-4 ${imageGridClass}`}>
            {post.images.map((src, idx) => (
              <img
                key={`${post.id}-image-${idx}`}
                src={src}
                alt={`${post.title} image ${idx + 1}`}
                className="w-full h-56 md:h-64 object-cover rounded-xl border border-gray-100 bg-gray-50"
              />
            ))}
          </div>
        )}
      </div>

      <footer className="px-5 py-3 border-t border-gray-100 flex items-center gap-3">
        {post.reviewStatus === "approved" ? (
          <div className="relative group">
            <button
              type="button"
              onClick={() => onAppreciate(post.id)}
              disabled={appreciating || post.hasAppreciated}
              className={`flex items-center gap-1.5 transition disabled:opacity-50 ${
                post.hasAppreciated
                  ? "text-[#001049]"
                  : "text-gray-400 hover:text-[#001049]"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill={post.hasAppreciated ? "currentColor" : "none"}
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14 9V5a3 3 0 0 0-3-3l-1 4-3 4v9h11.28a2 2 0 0 0 1.98-1.71l1.2-8A2 2 0 0 0 19.48 7H14Z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 10H4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h3" />
              </svg>
              <span className="text-sm font-medium">{post.appreciationCount}</span>
            </button>
            {!post.hasAppreciated && (
              <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                Appreciate
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-gray-400">Available after approval</span>
        )}
      </footer>
    </article>
  );
}
