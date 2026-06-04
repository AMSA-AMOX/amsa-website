"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import SchoolBadge from "@/components/threads/SchoolBadge";
import ThreadComposer from "@/components/threads/ThreadComposer";

// ─── Logo.dev ─────────────────────────────────────────────────────────────────

const LOGO_DEV_TOKEN = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN?.trim();

function buildLogoUrl(domain: string): string {
  const base = `https://img.logo.dev/${domain}`;
  return LOGO_DEV_TOKEN ? `${base}?token=${encodeURIComponent(LOGO_DEV_TOKEN)}` : base;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ThreadUser = {
  id: number;
  firstName: string;
  lastName: string;
  profilePic: string | null;
};

type HubThread = {
  id: number;
  title: string;
  body: string;
  category: string;
  categoryDomain: string | null;
  images: string[];
  status: string;
  isAnon: boolean;
  asker: ThreadUser | null;
  commentCount: number;
  upvoteCount: number;
  hasUpvoted: boolean;
  approvedAt: string | null;
  createdAt: string;
};

type HubComment = {
  id: number;
  content: string;
  isAnon: boolean;
  parentId: number | null;
  author: ThreadUser | null;
  createdAt: string;
  upvoteCount: number;
  hasUpvoted: boolean;
  replies: HubComment[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Avatar({ user, size = "w-8 h-8" }: { user: ThreadUser | null; size?: string }) {
  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "?";
  return (
    <div className={`${size} rounded-full bg-[#FFCA3A] flex items-center justify-center text-[#001049] text-xs font-bold shrink-0 overflow-hidden`}>
      {user?.profilePic ? (
        <img src={user.profilePic} alt="" className="w-full h-full object-cover" />
      ) : initials}
    </div>
  );
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

// ─── Upvote icon ──────────────────────────────────────────────────────────────

function UpvoteIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className ?? "w-6 h-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 L4.5 11 H9 V21 H15 V11 H19.5 Z" />
    </svg>
  );
}

// ─── Thread card — expandable with inline comments ────────────────────────────

function ThreadCard({ thread, isAdmin, onDeleted }: { thread: HubThread; isAdmin: boolean; onDeleted: (id: number) => void }) {
  const { authFetch, user: currentUser } = useAuth();

  // Thread upvote
  const [upvoteCount, setUpvoteCount] = useState(thread.upvoteCount ?? 0);
  const [hasUpvoted, setHasUpvoted] = useState(thread.hasUpvoted ?? false);
  const [upvoting, setUpvoting] = useState(false);

  // Comments
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [comments, setComments] = useState<HubComment[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [replyCount, setReplyCount] = useState(thread.commentCount);

  // Reply to comment
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const handleUpvote = async () => {
    if (upvoting) return;
    setUpvoting(true);
    const prev = { upvoteCount, hasUpvoted };
    setHasUpvoted(!hasUpvoted);
    setUpvoteCount((n) => hasUpvoted ? n - 1 : n + 1);
    try {
      const data = await authFetch(`/api/hub-threads/${thread.id}/upvote`, { method: "POST" });
      setUpvoteCount(data.upvoteCount);
      setHasUpvoted(data.hasUpvoted);
    } catch {
      setUpvoteCount(prev.upvoteCount);
      setHasUpvoted(prev.hasUpvoted);
    } finally {
      setUpvoting(false);
    }
  };

  const handleExpand = async () => {
    const next = !expanded;
    setExpanded(next);
    if (next && !commentsLoaded) {
      setCommentsLoading(true);
      try {
        const data = await authFetch(`/api/hub-threads/${thread.id}`);
        setComments((data.comments ?? []) as HubComment[]);
        setCommentsLoaded(true);
      } catch { /* silently fail */ }
      finally { setCommentsLoading(false); }
    }
  };

  const handleComment = async () => {
    const c = commentDraft.trim();
    if (!c || submitting) return;
    setSubmitting(true);
    try {
      const data = await authFetch(`/api/hub-threads/${thread.id}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: c, isAnon: false }),
      });
      setComments((prev) => [...prev, data.comment as HubComment]);
      setCommentDraft("");
      setReplyCount((n) => n + 1);
      setSubmitMsg(null);
      if (!expanded) setExpanded(true);
    } catch (e: any) {
      setSubmitMsg({ text: e?.message ?? "Failed to post comment.", ok: false });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (parentId: number) => {
    const c = replyDraft.trim();
    if (!c || replySubmitting) return;
    setReplySubmitting(true);
    try {
      const data = await authFetch(`/api/hub-threads/${thread.id}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: c, isAnon: false, parentId }),
      });
      setComments((prev) => prev.map((cm) =>
        cm.id === parentId ? { ...cm, replies: [...(cm.replies ?? []), data.comment as HubComment] } : cm
      ));
      setReplyDraft("");
      setReplyingToId(null);
      setReplyCount((n) => n + 1);
    } catch (e: any) {
      setSubmitMsg({ text: e?.message ?? "Failed to post reply.", ok: false });
    } finally {
      setReplySubmitting(false);
    }
  };

  const handleCommentUpvote = async (commentId: number) => {
    const toggle = (c: HubComment): HubComment => {
      if (c.id === commentId) {
        return { ...c, hasUpvoted: !c.hasUpvoted, upvoteCount: c.hasUpvoted ? c.upvoteCount - 1 : c.upvoteCount + 1 };
      }
      return { ...c, replies: (c.replies ?? []).map(toggle) };
    };
    setComments((prev) => prev.map(toggle));
    try {
      const data = await authFetch(`/api/hub-threads/${thread.id}/comments/${commentId}/upvote`, { method: "POST" });
      const update = (c: HubComment): HubComment => {
        if (c.id === commentId) return { ...c, hasUpvoted: data.hasUpvoted, upvoteCount: data.upvoteCount };
        return { ...c, replies: (c.replies ?? []).map(update) };
      };
      setComments((prev) => prev.map(update));
    } catch {
      setComments((prev) => prev.map(toggle)); // revert
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this thread and all its replies?")) return;
    setDeleting(true);
    try {
      await authFetch(`/api/hub-threads/${thread.id}`, { method: "DELETE" });
      onDeleted(thread.id);
    } catch { /* silently fail */ }
    finally { setDeleting(false); }
  };

  const askerName = thread.isAnon ? "Anonymous"
    : thread.asker ? `${thread.asker.firstName} ${thread.asker.lastName}`.trim() : "Member";

  const imageCount = thread.images.length;
  const imageGridClass = imageCount === 1
    ? "grid grid-cols-1 gap-2"
    : imageCount === 2
    ? "grid grid-cols-2 gap-2"
    : "grid grid-cols-2 md:grid-cols-3 gap-2";

  return (
    <article className="py-5 border-b border-gray-200">
      {/* Header */}
      <header className="flex items-start gap-3 mb-3">
        {thread.isAnon
          ? <div className="w-11 h-11 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-sm font-bold shrink-0">?</div>
          : <Avatar user={thread.asker} size="w-11 h-11" />}

        <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{askerName}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <SchoolBadge category={thread.category} categoryDomain={thread.categoryDomain} />
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-gray-400">{formatRelative(thread.approvedAt ?? thread.createdAt)}</span>

            {isAdmin && (
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
                    <button
                      type="button"
                      onClick={(e) => { setMenuOpen(false); handleDelete(e); }}
                      disabled={deleting}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 transition text-left disabled:opacity-50"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                      {deleting ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="pl-14">
        <p className="text-lg font-medium text-gray-800 leading-snug mb-1">{thread.title}</p>
        {thread.body && (
          <p className="text-base font-light text-gray-500 leading-relaxed whitespace-pre-wrap">{thread.body}</p>
        )}

        {imageCount > 0 && (
          <div className={`mt-4 ${imageGridClass}`}>
            {thread.images.map((url, i) => (
              <div key={i}>
                <img src={url} alt={`Image ${i + 1}`} className="max-h-150 max-w-full w-auto h-auto block rounded-2xl" />
              </div>
            ))}
          </div>
        )}

        {/* Footer — upvote + comments */}
        <footer className="mt-5 flex items-center gap-4">
          <button
            type="button"
            onClick={handleUpvote}
            disabled={upvoting}
            className={`flex items-center gap-1.5 transition disabled:opacity-50 ${hasUpvoted ? "text-[#001049]" : "text-gray-400 hover:text-[#001049]"}`}
          >
            <UpvoteIcon className="w-6 h-6" />
            <span className="text-sm font-medium">{upvoteCount}</span>
          </button>

          <button
            type="button"
            onClick={handleExpand}
            className={`flex items-center gap-1.5 transition ${expanded ? "text-[#001049]" : "text-gray-400 hover:text-gray-600"}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z" />
            </svg>
            <span className="text-sm font-medium">{replyCount}</span>
          </button>
        </footer>

        {/* Comments — shown when expanded */}
        {expanded && (
          <div className="mt-4 space-y-5">
            {commentsLoading && (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse shrink-0" />
                    <div className="flex-1 h-14 bg-gray-100 rounded-xl animate-pulse" />
                  </div>
                ))}
              </div>
            )}
            {!commentsLoading && commentsLoaded && comments.length === 0 && (
              <p className="text-sm text-gray-400">No replies yet. Be the first!</p>
            )}
            {!commentsLoading && comments.length > 0 && (
              <div className="space-y-5">
                {comments.map((c) => {
                  const authorName = c.isAnon ? "Anonymous"
                    : c.author ? `${c.author.firstName} ${c.author.lastName}`.trim() : "Member";
                  return (
                    <div key={c.id}>
                      {/* Top-level comment */}
                      <div className="flex gap-3">
                        {c.isAnon
                          ? <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs font-bold shrink-0">?</div>
                          : <Avatar user={c.author} />}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-semibold text-gray-800">{authorName}</span>
                            <span className="text-xs text-gray-400">{formatRelative(c.createdAt)}</span>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">{c.content}</p>
                          <div className="mt-1.5 flex items-center gap-4">
                            <button
                              type="button"
                              onClick={() => handleCommentUpvote(c.id)}
                              className={`flex items-center gap-1 text-xs transition ${c.hasUpvoted ? "text-[#001049] font-semibold" : "text-gray-400 hover:text-[#001049]"}`}
                            >
                              <UpvoteIcon className="w-4 h-4" />
                              {c.upvoteCount > 0 && <span>{c.upvoteCount}</span>}
                            </button>
                            <button
                              type="button"
                              onClick={() => { setReplyingToId(replyingToId === c.id ? null : c.id); setReplyDraft(""); }}
                              className="text-xs text-gray-400 hover:text-gray-600 font-medium transition"
                            >
                              Reply
                            </button>
                          </div>

                          {/* Inline reply input */}
                          {replyingToId === c.id && (
                            <div className="mt-2 relative">
                              <input
                                type="text"
                                value={replyDraft}
                                onChange={(e) => setReplyDraft(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleReply(c.id); } }}
                                placeholder={`Reply to ${authorName}...`}
                                maxLength={2000}
                                autoFocus
                                className="w-full border border-gray-200 rounded-full pl-4 pr-12 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#001049]/20 bg-white"
                              />
                              {replyDraft.trim().length > 0 && (
                                <button
                                  type="button"
                                  disabled={replySubmitting}
                                  onClick={() => handleReply(c.id)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#001049] disabled:opacity-50 hover:opacity-70 transition"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Replies */}
                      {(c.replies ?? []).length > 0 && (
                        <div className="ml-11 mt-3 space-y-3 border-l-2 border-gray-300 pl-4">
                          {(c.replies ?? []).map((r) => {
                            const replyAuthorName = r.isAnon ? "Anonymous"
                              : r.author ? `${r.author.firstName} ${r.author.lastName}`.trim() : "Member";
                            return (
                              <div key={r.id} className="flex gap-3">
                                {r.isAnon
                                  ? <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs font-bold shrink-0">?</div>
                                  : <Avatar user={r.author} size="w-7 h-7" />}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-sm font-semibold text-gray-800">{replyAuthorName}</span>
                                    <span className="text-xs text-gray-400">{formatRelative(r.createdAt)}</span>
                                  </div>
                                  <p className="text-sm text-gray-700 leading-relaxed">{r.content}</p>
                                  <button
                                    type="button"
                                    onClick={() => handleCommentUpvote(r.id)}
                                    className={`mt-1.5 flex items-center gap-1 text-xs transition ${r.hasUpvoted ? "text-[#001049] font-semibold" : "text-gray-400 hover:text-[#001049]"}`}
                                  >
                                    <UpvoteIcon className="w-4 h-4" />
                                    {r.upvoteCount > 0 && <span>{r.upvoteCount}</span>}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Comment form — always visible, avatar aligned with header */}
      <div className="mt-4 flex items-start gap-3">
        <div className="w-11 h-11 rounded-full bg-[#FFCA3A] text-[#001049] text-sm font-bold flex items-center justify-center overflow-hidden shrink-0">
          {currentUser?.profilePic
            ? <img src={currentUser.profilePic} alt="" className="w-full h-full object-cover" />
            : `${currentUser?.firstName?.[0] ?? ""}${currentUser?.lastName?.[0] ?? ""}`.toUpperCase() || "?"}
        </div>
        <div className="flex-1 min-w-0">
          {submitMsg && (
            <p className={`text-sm mb-1.5 ${submitMsg.ok ? "text-green-600" : "text-red-500"}`}>{submitMsg.text}</p>
          )}
          <p className="text-lg font-semibold text-gray-800 mb-2">Comment</p>
          <div className="relative">
            <input
              type="text"
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleComment(); } }}
              placeholder="Add a comment..."
              maxLength={2000}
              className="w-full border border-gray-200 rounded-full pl-4 pr-12 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#001049]/20 bg-white"
            />
            {commentDraft.trim().length > 0 && (
              <button
                type="button"
                disabled={submitting}
                onClick={handleComment}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#001049] disabled:opacity-50 hover:opacity-70 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ThreadsPage() {
  const { user, loading, authFetch } = useAuth();
  const router = useRouter();

  const [threads, setThreads] = useState<HubThread[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const [postOpen, setPostOpen] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Feed filter
  const [activeCategory, setActiveCategory] = useState<string>("all");

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/login"); return; }
    let active = true;
    setPageLoading(true);
    authFetch("/api/hub-threads?limit=20")
      .then((data) => {
        if (!active) return;
        setThreads((data.threads ?? []) as HubThread[]);
        setNextCursor(data.nextCursor ?? null);
      })
      .catch(() => { if (!active) return; setThreads([]); })
      .finally(() => { if (!active) return; setPageLoading(false); });
    return () => { active = false; };
  }, [loading, user, router, authFetch]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await authFetch(`/api/hub-threads?limit=20&cursor=${encodeURIComponent(nextCursor)}`);
      setThreads((prev) => [...prev, ...((data.threads ?? []) as HubThread[])]);
      setNextCursor(data.nextCursor ?? null);
    } catch { /* silently fail */ }
    finally { setLoadingMore(false); }
  }, [nextCursor, loadingMore, authFetch]);

  const categoryTabs = useMemo(() => {
    const seen = new Map<string, string | null>();
    for (const t of threads) {
      if (!seen.has(t.category)) seen.set(t.category, t.categoryDomain);
    }
    return Array.from(seen.entries()).map(([cat, domain]) => ({ cat, domain }));
  }, [threads]);

  const visibleThreads = activeCategory === "all"
    ? threads
    : threads.filter((t) => t.category === activeCategory);

  if (!user) return null;

  return (
    <div className="py-8 px-4 md:px-8 max-w-3xl mx-auto">

        {/* Trigger bar */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => { setPostOpen(true); setSubmitMsg(null); }}
            className="w-full flex items-center gap-3 px-4 py-3 bg-white rounded-xl border-2 border-gray-300 text-lg text-gray-400 hover:bg-gray-50 transition"
          >
            <div className="w-12 h-12 rounded-full bg-[#FFCA3A] text-[#001049] text-lg font-bold flex items-center justify-center overflow-hidden shrink-0">
              {user.profilePic ? (
                <img src={user.profilePic} alt={user.firstName} className="w-full h-full object-cover" />
              ) : (
                `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
              )}
            </div>
            Ask something from the community...
          </button>
        </div>

        {submitMsg && (
          <div className={`mb-4 px-4 py-3 rounded-xl text-sm ${submitMsg.ok ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
            {submitMsg.text}
          </div>
        )}

        {/* ThreadComposer modal */}
        {postOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setPostOpen(false)} />
            <div className="relative w-full max-w-2xl">
              <ThreadComposer
                onCreated={() => {
                  setPostOpen(false);
                  setSubmitMsg({ text: "Your post has been submitted for review. It will appear once a board member approves it.", ok: true });
                  setTimeout(() => setSubmitMsg(null), 6000);
                }}
                onClose={() => setPostOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Category filter tabs */}
        {!pageLoading && categoryTabs.length > 1 && (
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setActiveCategory("all")}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition shrink-0 ${activeCategory === "all" ? "bg-[#001049] text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"}`}
            >
              All
            </button>
            {categoryTabs.map(({ cat, domain }) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition shrink-0 ${activeCategory === cat ? "bg-[#001049] text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"}`}
              >
                {cat !== "general" && domain && activeCategory !== cat && (
                  <img src={buildLogoUrl(domain)} alt="" className="w-4 h-4 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                )}
                {cat === "general" ? "General" : cat}
              </button>
            ))}
          </div>
        )}

        {/* Feed */}
        {pageLoading &&
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="py-5 border-b border-gray-200 space-y-3 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gray-100 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-gray-100 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
              </div>
              <div className="pl-14 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-4 bg-gray-100 rounded w-full" />
                <div className="h-4 bg-gray-100 rounded w-4/5" />
              </div>
            </div>
          ))}

        {!pageLoading && visibleThreads.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16">
            <img src="/assets/empty/fall_leaves.svg" alt="" className="w-56 h-56" />
            <p className="text-lg font-medium text-gray-400">No threads yet...</p>
          </div>
        )}

        {!pageLoading && visibleThreads.length > 0 && (
          <div className="space-y-3">
            {visibleThreads.map((t) => (
              <ThreadCard
                key={t.id}
                thread={t}
                isAdmin={user.role === "admin"}
                onDeleted={(id) => setThreads((prev) => prev.filter((x) => x.id !== id))}
              />
            ))}
            {nextCursor && activeCategory === "all" && (
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition"
                >
                  {loadingMore ? "Loading…" : "Load more"}
                </button>
              </div>
            )}
          </div>
        )}
    </div>
  );
}
