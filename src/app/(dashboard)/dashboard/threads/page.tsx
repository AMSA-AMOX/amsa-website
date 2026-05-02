"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  commentCount: number;
  approvedAt: string | null;
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

function HubThreadCard({ thread }: { thread: HubThread }) {
  const askerName = thread.isAnon ? "Anonymous" : thread.asker
    ? `${thread.asker.firstName} ${thread.asker.lastName}`.trim()
    : "Member";

  return (
    <Link
      href={`/dashboard/threads/${thread.id}`}
      className="block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition overflow-hidden"
    >
      <div className="px-5 py-4">
        <p className="text-sm text-gray-800 leading-relaxed line-clamp-3">{thread.question}</p>
      </div>
      <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {thread.isAnon ? (
            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs font-bold shrink-0">?</div>
          ) : (
            <Avatar user={thread.asker} size="w-6 h-6" />
          )}
          <span className="text-xs text-gray-500 truncate">{askerName}</span>
          <span className="text-gray-300 shrink-0">·</span>
          <span className="text-xs text-gray-400 shrink-0">{formatRelative(thread.approvedAt ?? thread.createdAt)}</span>
        </div>
        <span className="text-xs text-gray-400 shrink-0 flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
          </svg>
          {thread.commentCount}
        </span>
      </div>
    </Link>
  );
}

export default function ThreadsPage() {
  const { user, loading, authFetch } = useAuth();
  const router = useRouter();

  const [threads, setThreads] = useState<HubThread[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const [askOpen, setAskOpen] = useState(false);
  const [questionDraft, setQuestionDraft] = useState("");
  const [questionIsAnon, setQuestionIsAnon] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
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

  const handleSubmitQuestion = async () => {
    const q = questionDraft.trim();
    if (!q || submitting) return;
    setSubmitting(true);
    try {
      await authFetch("/api/hub-threads", {
        method: "POST",
        body: JSON.stringify({ question: q, isAnon: questionIsAnon }),
      });
      setQuestionDraft("");
      setQuestionIsAnon(false);
      setAskOpen(false);
      setSubmitMsg({ text: "Your question has been submitted for review. It will appear once a board member approves it.", ok: true });
      setTimeout(() => setSubmitMsg(null), 6000);
    } catch (e: any) {
      setSubmitMsg({ text: e?.message ?? "Failed to submit question.", ok: false });
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 md:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-[#001049]">Threads</h1>
            <p className="text-sm text-gray-500 mt-1">
              Ask the AMSA community a question. Approved by board members before going public.
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setAskOpen(true); setSubmitMsg(null); }}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#001049] text-white hover:opacity-90 transition shrink-0"
          >
            Ask the Community
          </button>
        </div>

        {submitMsg && (
          <div className={`mb-4 px-4 py-3 rounded-xl text-sm ${submitMsg.ok ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
            {submitMsg.text}
          </div>
        )}

        {askOpen && (
          <div className="mb-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm font-semibold text-gray-900 mb-1">Ask a question</p>
            <p className="text-xs text-gray-400 mb-3">Your question will be reviewed by a board member before it's visible to everyone.</p>
            <textarea
              value={questionDraft}
              onChange={(e) => setQuestionDraft(e.target.value)}
              placeholder="What's your question? (max 600 chars)"
              maxLength={600}
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#001049]/20"
            />
            <div className="mt-2 flex items-center justify-between gap-3 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={questionIsAnon}
                  onChange={(e) => setQuestionIsAnon(e.target.checked)}
                  className="rounded border-gray-300 accent-[#001049]"
                />
                <span className="text-xs text-gray-500">Post anonymously</span>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={submitting || questionDraft.trim().length === 0}
                  onClick={handleSubmitQuestion}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#001049] text-white disabled:opacity-50 hover:opacity-90 transition"
                >
                  {submitting ? "Submitting…" : "Submit"}
                </button>
                <button
                  type="button"
                  onClick={() => { setAskOpen(false); setQuestionDraft(""); setQuestionIsAnon(false); }}
                  className="px-4 py-2 rounded-xl text-sm text-gray-500 border border-gray-200 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {pageLoading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm h-28 animate-pulse" />
            ))}
          </div>
        )}

        {!pageLoading && threads.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <p className="text-sm font-semibold text-gray-500">No threads yet.</p>
            <p className="text-xs text-gray-400 mt-1">Be the first to ask the community a question.</p>
          </div>
        )}

        {!pageLoading && threads.length > 0 && (
          <div className="space-y-3">
            {threads.map((t) => (
              <HubThreadCard key={t.id} thread={t} />
            ))}
            {nextCursor && (
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-5 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition"
                >
                  {loadingMore ? "Loading…" : "Load more"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
