"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

type ThreadUser = {
  id: number;
  firstName: string;
  lastName: string;
  profilePic: string | null;
};

type HubThread = {
  id: number;
  question: string;
  status: string;
  isAnon: boolean;
  asker: ThreadUser | null;
  approvedAt: string | null;
  createdAt: string;
};

type HubComment = {
  id: number;
  content: string;
  isAnon: boolean;
  author: ThreadUser | null;
  createdAt: string;
};

function Avatar({ user, size = "w-8 h-8" }: { user: ThreadUser | null; size?: string }) {
  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "?";
  return (
    <div className={`${size} rounded-full bg-[#FFCA3A] flex items-center justify-center text-[#001049] text-xs font-bold shrink-0 overflow-hidden`}>
      {user?.profilePic ? (
        <img src={user.profilePic} alt={`${user.firstName} ${user.lastName}`} className="w-full h-full object-cover" />
      ) : (
        initials
      )}
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

export default function ThreadDetailPage() {
  const { user, loading, authFetch } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const threadId = Number(params.id);

  const [thread, setThread] = useState<HubThread | null>(null);
  const [comments, setComments] = useState<HubComment[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");

  const [commentDraft, setCommentDraft] = useState("");
  const [commentIsAnon, setCommentIsAnon] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/login"); return; }
    if (!Number.isFinite(threadId)) { setError("Invalid thread"); setPageLoading(false); return; }

    let active = true;
    setPageLoading(true);
    authFetch(`/api/hub-threads/${threadId}`)
      .then((data) => {
        if (!active) return;
        setThread(data.thread ?? null);
        setComments((data.comments ?? []) as HubComment[]);
      })
      .catch(() => { if (!active) return; setError("Thread not found or not yet approved."); })
      .finally(() => { if (!active) return; setPageLoading(false); });

    return () => { active = false; };
  }, [threadId, loading, user, router, authFetch]);

  const handleSubmitComment = async () => {
    const c = commentDraft.trim();
    if (!c || submitting) return;
    setSubmitting(true);
    try {
      const data = await authFetch(`/api/hub-threads/${threadId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: c, isAnon: commentIsAnon }),
      });
      setComments((prev) => [...prev, data.comment as HubComment]);
      setCommentDraft("");
      setCommentIsAnon(false);
      setSubmitMsg(null);
    } catch (e: any) {
      setSubmitMsg({ text: e?.message ?? "Failed to submit comment.", ok: false });
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-6 px-4 md:px-8">
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="h-32 bg-white rounded-2xl border border-gray-100 animate-pulse" />
          <div className="h-20 bg-white rounded-2xl border border-gray-100 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !thread) {
    return (
      <div className="min-h-screen bg-gray-50 py-6 px-4 md:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <p className="text-sm font-semibold text-gray-500">{error || "Thread not found."}</p>
            <Link href="/dashboard/threads" className="mt-3 inline-block text-sm text-[#001049] hover:underline">Back to Threads</Link>
          </div>
        </div>
      </div>
    );
  }

  const askerName = thread.isAnon ? "Anonymous" : thread.asker
    ? `${thread.asker.firstName} ${thread.asker.lastName}`.trim()
    : "Member";

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 md:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-4">
          <Link
            href="/dashboard/threads"
            className="inline-flex items-center gap-1.5 text-sm text-[#001049] hover:underline"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 19.5-7.5-7.5 7.5-7.5" />
            </svg>
            Back to Threads
          </Link>
        </div>

        {/* Question */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
          <div className="px-6 py-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Question</p>
            <p className="text-base text-gray-800 leading-relaxed">{thread.question}</p>
          </div>
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center gap-2">
            {thread.isAnon ? (
              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-[10px] font-bold shrink-0">?</div>
            ) : (
              <Avatar user={thread.asker} size="w-6 h-6" />
            )}
            <span className="text-xs text-gray-500">{askerName}</span>
            <span className="text-gray-300">·</span>
            <span className="text-xs text-gray-400">{formatRelative(thread.approvedAt ?? thread.createdAt)}</span>
          </div>
        </div>

        {/* Comments */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            {comments.length} {comments.length === 1 ? "Answer" : "Answers"}
          </p>
          {comments.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
              <p className="text-sm text-gray-400">No answers yet. Be the first to respond!</p>
            </div>
          )}
          <div className="space-y-3">
            {comments.map((c) => {
              const authorName = c.isAnon ? "Anonymous" : c.author
                ? `${c.author.firstName} ${c.author.lastName}`.trim()
                : "Member";
              return (
                <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
                  <div className="flex items-center gap-2 mb-2">
                    {c.isAnon ? (
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-[10px] font-bold shrink-0">?</div>
                    ) : (
                      <Avatar user={c.author} size="w-6 h-6" />
                    )}
                    <span className="text-xs font-semibold text-gray-700">{authorName}</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs text-gray-400">{formatRelative(c.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{c.content}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Add comment */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm font-semibold text-gray-900 mb-3">Leave an answer</p>
          {submitMsg && (
            <p className={`text-xs mb-2 ${submitMsg.ok ? "text-green-600" : "text-red-500"}`}>{submitMsg.text}</p>
          )}
          <textarea
            value={commentDraft}
            onChange={(e) => setCommentDraft(e.target.value)}
            placeholder="Share your answer or perspective… (max 2000 chars)"
            maxLength={2000}
            rows={4}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#001049]/20"
          />
          <div className="mt-2 flex items-center justify-between gap-3 flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={commentIsAnon}
                onChange={(e) => setCommentIsAnon(e.target.checked)}
                className="rounded border-gray-300 accent-[#001049]"
              />
              <span className="text-xs text-gray-500">Post anonymously</span>
            </label>
            <button
              type="button"
              disabled={submitting || commentDraft.trim().length === 0}
              onClick={handleSubmitComment}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#001049] text-white disabled:opacity-50 hover:opacity-90 transition"
            >
              {submitting ? "Posting…" : "Post Answer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
