"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
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

function renderBody(text: string) {
  return text.split(/(#\w+)/g).map((part, i) =>
    /^#\w+$/.test(part)
      ? <strong key={i} className="font-semibold">{part}</strong>
      : part
  );
}

type PostCardProps = {
  post: PostItem;
  onAppreciate: (postId: number) => void;
  appreciating: boolean;
  showAuthor?: boolean;
  onFollow?: (authorId: number) => void;
  isFollowing?: boolean;
  followingInProgress?: boolean;
  onDelete?: (postId: number) => void;
  deleting?: boolean;
  onReport?: (postId: number) => void;
};

export default function PostCard({
  post,
  onAppreciate,
  appreciating,
  showAuthor = true,
  onFollow,
  isFollowing,
  followingInProgress,
  onDelete,
  deleting,
  onReport,
}: PostCardProps) {
  const initials = useMemo(() => {
    const first = post.author?.firstName?.[0] ?? "";
    const last = post.author?.lastName?.[0] ?? "";
    return `${first}${last}`.toUpperCase() || "U";
  }, [post.author?.firstName, post.author?.lastName]);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const showMenu = !!(onDelete || onReport);

  const imageCount = post.images.length;
  const imageGridClass =
    imageCount === 1
      ? "grid grid-cols-1 gap-2"
      : imageCount === 2
      ? "grid grid-cols-2 gap-2"
      : "grid grid-cols-2 md:grid-cols-3 gap-2";

  const AvatarBadge = () => (
    <div className="relative shrink-0">
      <div className="w-11 h-11 rounded-full bg-[#FFCA3A] text-[#001049] text-sm font-bold flex items-center justify-center overflow-hidden">
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
      {post.college && (
        <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full border-2 border-white bg-white overflow-hidden flex items-center justify-center">
          {post.college.logoUrl ? (
            <img
              src={post.college.logoUrl}
              alt={post.college.name}
              className="w-full h-full object-contain"
              onError={(e) => {
                const el = e.currentTarget as HTMLImageElement;
                el.style.display = "none";
                const parent = el.parentElement;
                if (parent) {
                  parent.classList.add("bg-[#001049]");
                  parent.textContent = post.college!.name[0].toUpperCase();
                  parent.classList.add("text-white", "text-[8px]", "font-bold");
                }
              }}
            />
          ) : (
            <span className="text-[8px] font-bold text-white bg-[#001049] w-full h-full flex items-center justify-center">
              {post.college.name[0].toUpperCase()}
            </span>
          )}
        </div>
      )}
    </div>
  );

  return (
    <article className="py-5 border-b border-gray-200">
      {showAuthor && (
        <header className="flex items-start gap-3 mb-3">
          {post.author ? (
            <Link href={`/dashboard/network/${post.author.id}`} className="shrink-0">
              <AvatarBadge />
            </Link>
          ) : (
            <AvatarBadge />
          )}

          <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
            <div className="min-w-0">
              {post.author ? (
                <Link href={`/dashboard/network/${post.author.id}`} className="hover:underline">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {post.author.firstName} {post.author.lastName}
                  </p>
                </Link>
              ) : (
                <p className="text-sm font-semibold text-gray-900">Unknown user</p>
              )}
              <p className="text-xs text-gray-500 truncate">
                {post.author?.headline || "AMSA Member"}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-gray-400">{formatRelative(post.createdAt)}</span>

              {onFollow && post.author && (
                <button
                  type="button"
                  onClick={() => onFollow(post.author!.id)}
                  disabled={followingInProgress}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition disabled:opacity-50 ${
                    isFollowing
                      ? "border-gray-300 text-gray-500 hover:border-red-300 hover:text-red-500"
                      : "border-[#001049] text-[#001049] hover:bg-[#001049] hover:text-white"
                  }`}
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>
              )}

              {showMenu && (
                <div ref={menuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setMenuOpen((v) => !v)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition rounded"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm6 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm4 2a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
                    </svg>
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 top-7 z-30 w-36 bg-white border border-gray-200 rounded-xl shadow-lg p-1">
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => { setMenuOpen(false); onDelete(post.id); }}
                          disabled={deleting}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 transition text-left disabled:opacity-50"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>
                          {deleting ? "Deleting…" : "Delete"}
                        </button>
                      )}
                      {onReport && (
                        <button
                          type="button"
                          onClick={() => { setMenuOpen(false); onReport(post.id); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition text-left"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
                          </svg>
                          Report
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>
      )}

      <div className={showAuthor ? "pl-14" : ""}>
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
              <p className="mt-1 text-xs text-gray-500">Review note: {post.reviewNote}</p>
            )}
          </div>
        )}
        <p className="text-lg font-medium text-gray-800 whitespace-pre-wrap leading-relaxed">
          {renderBody(post.body)}
        </p>

        {post.images.length > 0 && (
          <div className={`mt-4 ${imageGridClass}`}>
            {post.images.map((src, idx) => (
              <div key={`${post.id}-image-${idx}`} className="rounded-2xl overflow-hidden">
                <img
                  src={src}
                  alt={`Post image ${idx + 1}`}
                  className="w-full h-auto block"
                />
              </div>
            ))}
          </div>
        )}

        <footer className="mt-5 flex items-center gap-3">
          {post.reviewStatus === "approved" ? (
            <div className="relative group">
              <button
                type="button"
                onClick={() => onAppreciate(post.id)}
                disabled={appreciating || post.hasAppreciated}
                className={`flex items-center gap-2 transition disabled:opacity-50 ${
                  post.hasAppreciated
                    ? "text-red-500"
                    : "text-gray-400 hover:text-red-500"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6"
                  fill={post.hasAppreciated ? "currentColor" : "none"}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
                  />
                </svg>
                <span className="text-sm font-medium">{post.appreciationCount}</span>
              </button>
              {!post.hasAppreciated && (
                <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  Like
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-gray-400">Available after approval</span>
          )}
        </footer>
      </div>
    </article>
  );
}
