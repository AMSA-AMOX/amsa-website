"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

type ThreadUser = {
  id: number;
  firstName: string;
  lastName: string;
  profilePic: string | null;
};

type ThreadItem = {
  id: number;
  question: string;
  answer: string | null;
  answeredAt: string | null;
  createdAt: string;
  status: "answered" | "pending";
  isAnonymous: boolean;
  asker: ThreadUser | null;
  recipient: ThreadUser | null;
};

function Avatar({
  user,
  size = "w-7 h-7",
}: {
  user: ThreadUser | null;
  size?: string;
}) {
  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "?";
  return (
    <div
      className={`${size} rounded-full bg-[#001049]/10 flex items-center justify-center text-[#001049] text-xs font-bold shrink-0 overflow-hidden`}
    >
      {user?.profilePic ? (
        <img
          src={user.profilePic}
          alt={`${user.firstName} ${user.lastName}`}
          className="w-full h-full object-cover"
        />
      ) : (
        initials
      )}
    </div>
  );
}

function ThreadCard({ thread }: { thread: ThreadItem }) {
  const recipientName = thread.isAnonymous
    ? "Anonymous"
    : thread.recipient
      ? `${thread.recipient.firstName} ${thread.recipient.lastName}`.trim()
      : "Member";

  return (
    <article className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 bg-gray-50">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Q</p>
        <p className="text-sm text-gray-800 leading-relaxed">{thread.question}</p>
      </div>
      <div className="px-5 py-4 bg-white border-t border-gray-100">
        <div className="flex items-center gap-2 mb-2.5">
          {thread.isAnonymous ? (
            <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs font-bold shrink-0">
              ?
            </div>
          ) : (
            <Avatar user={thread.recipient} size="w-7 h-7" />
          )}
          <span className="text-sm font-semibold text-gray-800">{recipientName}</span>
        </div>
        {thread.answer ? (
          <p className="text-sm text-gray-600 leading-relaxed">{thread.answer}</p>
        ) : (
          <p className="text-sm text-gray-400 italic">Awaiting answer…</p>
        )}
      </div>
    </article>
  );
}

export default function ThreadsPage() {
  const { user, loading, authFetch } = useAuth();
  const router = useRouter();
  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    let active = true;
    setPageLoading(true);
    authFetch("/api/threads?limit=25")
      .then((data) => {
        if (!active) return;
        setThreads((data.threads ?? []) as ThreadItem[]);
        setNextCursor(data.nextCursor ?? null);
      })
      .catch(() => {
        if (!active) return;
        setThreads([]);
      })
      .finally(() => {
        if (!active) return;
        setPageLoading(false);
      });
    return () => {
      active = false;
    };
  }, [loading, user, router, authFetch]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await authFetch(
        `/api/threads?limit=25&cursor=${encodeURIComponent(nextCursor)}`
      );
      setThreads((prev) => [...prev, ...((data.threads ?? []) as ThreadItem[])]);
      setNextCursor(data.nextCursor ?? null);
    } catch {
      // silently fail
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, loadingMore, authFetch]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 md:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#001049]">Threads</h1>
          <p className="text-sm text-gray-500 mt-1">
            Answered questions from members across the network.
          </p>
        </div>

        {pageLoading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm h-32 animate-pulse"
              />
            ))}
          </div>
        )}

        {!pageLoading && threads.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <p className="text-sm font-semibold text-gray-500">No answered threads yet.</p>
            <p className="text-xs text-gray-400 mt-1">
              Check back once US members start answering questions.
            </p>
          </div>
        )}

        {!pageLoading && threads.length > 0 && (
          <div className="space-y-3">
            {threads.map((t) => (
              <ThreadCard key={t.id} thread={t} />
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
