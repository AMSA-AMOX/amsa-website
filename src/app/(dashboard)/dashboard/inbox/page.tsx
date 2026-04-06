"use client";

import { useEffect, useState } from "react";
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

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  return new Date(iso).toLocaleDateString();
}

function Avatar({ user, size = "w-9 h-9" }: { user: ThreadUser | null; size?: string }) {
  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "?";
  return (
    <div
      className={`${size} rounded-full bg-[#FFCA3A] flex items-center justify-center text-[#001049] text-sm font-bold shrink-0 overflow-hidden`}
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

// Card shown to the recipient (US member+) — can answer pending questions
function ReceivedThreadCard({
  thread,
  answerDraft,
  isAnonDraft,
  onDraftChange,
  onAnonDraftChange,
  onSubmit,
  onToggleAnon,
  onDelete,
  submitting,
  toggling,
  deleting,
}: {
  thread: ThreadItem;
  answerDraft: string;
  isAnonDraft: boolean;
  onDraftChange: (val: string) => void;
  onAnonDraftChange: (val: boolean) => void;
  onSubmit: () => void;
  onToggleAnon: () => void;
  onDelete: () => void;
  submitting: boolean;
  toggling: boolean;
  deleting: boolean;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const askerName = thread.asker
    ? `${thread.asker.firstName} ${thread.asker.lastName}`.trim()
    : "Member";
  const timeText = formatRelative(thread.createdAt);

  return (
    <article className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100">
        <Avatar user={thread.asker} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{askerName}</p>
          <p className="text-xs text-gray-400">{timeText}</p>
        </div>
        {thread.status === "answered" ? (
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-50 text-green-600">
            Answered
          </span>
        ) : (
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
            Pending
          </span>
        )}
      </div>

      <div className="divide-y divide-gray-100">
        <div className="px-5 py-4 bg-gray-50">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Q</p>
          <p className="text-sm text-gray-800 leading-relaxed">{thread.question}</p>
        </div>
        <div className="px-5 py-4 bg-white">
          <div className="flex items-center gap-2 mb-2.5">
            <Avatar user={thread.recipient} />
            <span className="text-sm font-semibold text-gray-800">
              {thread.recipient ? `${thread.recipient.firstName} ${thread.recipient.lastName}`.trim() : "You"}
            </span>
          </div>
          {thread.status === "answered" ? (
            <>
              <p className="text-sm text-gray-600 leading-relaxed">{thread.answer}</p>
              {/* Actions for answered threads */}
              <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={onToggleAnon}
                  disabled={toggling || deleting}
                  className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-[#001049] disabled:opacity-50 transition"
                >
                  {toggling ? (
                    "Updating…"
                  ) : thread.isAnonymous ? (
                    <>
                      <span className="w-4 h-4 inline-flex items-center justify-center rounded-full bg-gray-200 text-gray-500">
                        &#128065;
                      </span>
                      Make public
                    </>
                  ) : (
                    <>
                      <span className="w-4 h-4 inline-flex items-center justify-center rounded-full bg-gray-200 text-gray-500">
                        &#128100;
                      </span>
                      Go anonymous
                    </>
                  )}
                </button>
                {thread.isAnonymous && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 font-medium">
                    Anonymous
                  </span>
                )}
                <div className="flex-1" />
                {confirmDelete ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Delete this thread?</span>
                    <button
                      type="button"
                      onClick={() => { setConfirmDelete(false); onDelete(); }}
                      disabled={deleting}
                      className="text-xs font-semibold text-red-500 hover:text-red-700 disabled:opacity-50 transition"
                    >
                      {deleting ? "Deleting…" : "Yes, delete"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="text-xs text-gray-400 hover:text-gray-600 transition"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    disabled={deleting || toggling}
                    className="text-xs font-medium text-red-400 hover:text-red-600 disabled:opacity-50 transition"
                  >
                    Delete
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <textarea
                value={answerDraft}
                onChange={(e) => onDraftChange(e.target.value)}
                placeholder="Write your answer… (max 2000 chars)"
                maxLength={2000}
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#001049]/20 text-gray-800"
              />
              <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isAnonDraft}
                    onChange={(e) => onAnonDraftChange(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-[#001049] focus:ring-[#001049]/20"
                  />
                  <span className="text-xs text-gray-500">Post anonymously</span>
                </label>
                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={submitting || answerDraft.trim().length === 0}
                  className="px-4 py-1.5 rounded-xl text-sm font-semibold bg-[#001049] text-white disabled:opacity-50 hover:opacity-90 transition"
                >
                  {submitting ? "Saving…" : "Submit answer"}
                </button>
              </div>
              {isAnonDraft && (
                <p className="text-xs text-gray-400">
                  Your name won't appear on your profile or the public feed for this answer.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

// Card shown to the asker (member) — their sent questions + status
function SentThreadCard({ thread }: { thread: ThreadItem }) {
  const recipientName = thread.recipient
    ? `${thread.recipient.firstName} ${thread.recipient.lastName}`.trim()
    : "Someone";
  const timeText = formatRelative(thread.createdAt);

  return (
    <article className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100">
        <Avatar user={thread.recipient} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{recipientName}</p>
          <p className="text-xs text-gray-400">{timeText}</p>
        </div>
        {thread.status === "answered" ? (
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-50 text-green-600">
            Answered
          </span>
        ) : (
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
            Pending
          </span>
        )}
      </div>

      <div className="divide-y divide-gray-100">
        <div className="px-5 py-4 bg-gray-50">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Q</p>
          <p className="text-sm text-gray-800 leading-relaxed">{thread.question}</p>
        </div>
        <div className="px-5 py-4 bg-white">
          <div className="flex items-center gap-2 mb-2.5">
            <Avatar user={thread.recipient} />
            <span className="text-sm font-semibold text-gray-800">
              {thread.recipient
                ? `${thread.recipient.firstName} ${thread.recipient.lastName}`.trim()
                : "Member"}
            </span>
          </div>
          {thread.answer ? (
            <p className="text-sm text-gray-600 leading-relaxed">{thread.answer}</p>
          ) : (
            <p className="text-sm text-gray-400 italic">Awaiting answer…</p>
          )}
        </div>
      </div>
    </article>
  );
}

export default function InboxPage() {
  const { user, loading, authFetch } = useAuth();
  const router = useRouter();

  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [answerDraft, setAnswerDraft] = useState<Record<number, string>>({});
  const [anonDraft, setAnonDraft] = useState<Record<number, boolean>>({});
  const [submitting, setSubmitting] = useState<Set<number>>(new Set());
  const [toggling, setToggling] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState<Set<number>>(new Set());
  const [errors, setErrors] = useState<Record<number, string>>({});

  const isRecipient =
    user?.role === "us_member" ||
    user?.role === "board_member" ||
    user?.role === "admin";

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    let active = true;
    setPageLoading(true);
    authFetch("/api/threads?view=inbox")
      .then((data) => {
        if (!active) return;
        setThreads((data.threads ?? []) as ThreadItem[]);
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

  const handleAnswer = async (threadId: number) => {
    const answer = (answerDraft[threadId] ?? "").trim();
    if (!answer || submitting.has(threadId)) return;

    setSubmitting((prev) => new Set(prev).add(threadId));
    setErrors((prev) => ({ ...prev, [threadId]: "" }));

    try {
      const isAnonymous = anonDraft[threadId] ?? false;
      const data = await authFetch(`/api/threads/${threadId}`, {
        method: "PATCH",
        body: JSON.stringify({ answer, isAnonymous }),
      });
      setThreads((prev) =>
        prev.map((t) => (t.id === threadId ? (data.thread as ThreadItem) : t))
      );
      setAnswerDraft((prev) => {
        const next = { ...prev };
        delete next[threadId];
        return next;
      });
      setAnonDraft((prev) => {
        const next = { ...prev };
        delete next[threadId];
        return next;
      });
    } catch (e: any) {
      setErrors((prev) => ({
        ...prev,
        [threadId]: e?.message ?? "Failed to save answer.",
      }));
    } finally {
      setSubmitting((prev) => {
        const next = new Set(prev);
        next.delete(threadId);
        return next;
      });
    }
  };

  const handleToggleAnon = async (threadId: number) => {
    if (toggling.has(threadId)) return;
    const thread = threads.find((t) => t.id === threadId);
    if (!thread) return;

    setToggling((prev) => new Set(prev).add(threadId));
    try {
      await authFetch(`/api/threads/${threadId}`, {
        method: "PATCH",
        body: JSON.stringify({ isAnonymous: !thread.isAnonymous }),
      });
      setThreads((prev) =>
        prev.map((t) =>
          t.id === threadId ? { ...t, isAnonymous: !t.isAnonymous } : t
        )
      );
    } catch (e: any) {
      setErrors((prev) => ({
        ...prev,
        [threadId]: e?.message ?? "Failed to update anonymity.",
      }));
    } finally {
      setToggling((prev) => {
        const next = new Set(prev);
        next.delete(threadId);
        return next;
      });
    }
  };

  const handleDelete = async (threadId: number) => {
    if (deleting.has(threadId)) return;
    setDeleting((prev) => new Set(prev).add(threadId));
    try {
      await authFetch(`/api/threads/${threadId}`, { method: "DELETE" });
      setThreads((prev) => prev.filter((t) => t.id !== threadId));
    } catch (e: any) {
      setErrors((prev) => ({
        ...prev,
        [threadId]: e?.message ?? "Failed to delete thread.",
      }));
    } finally {
      setDeleting((prev) => {
        const next = new Set(prev);
        next.delete(threadId);
        return next;
      });
    }
  };

  if (!user) return null;

  const pending = threads.filter((t) => t.status === "pending");
  const answered = threads.filter((t) => t.status === "answered");

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 md:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#001049]">Inbox</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isRecipient
              ? "Questions asked directly to you."
              : "Questions you've sent to members."}
          </p>
        </div>

        {pageLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm h-36 animate-pulse"
              />
            ))}
          </div>
        )}

        {!pageLoading && threads.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <p className="text-sm font-semibold text-gray-500">
              {isRecipient ? "No questions yet." : "You haven't asked any questions yet."}
            </p>
            {!isRecipient && (
              <p className="text-xs text-gray-400 mt-1">
                Visit a US member's profile and click "Ask a Direct Question".
              </p>
            )}
          </div>
        )}

        {!pageLoading && isRecipient && (
          <div className="space-y-6">
            {pending.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Pending ({pending.length})
                </h2>
                <div className="space-y-3">
                  {pending.map((t) => (
                    <div key={t.id}>
                      <ReceivedThreadCard
                        thread={t}
                        answerDraft={answerDraft[t.id] ?? ""}
                        isAnonDraft={anonDraft[t.id] ?? false}
                        onDraftChange={(val) =>
                          setAnswerDraft((prev) => ({ ...prev, [t.id]: val }))
                        }
                        onAnonDraftChange={(val) =>
                          setAnonDraft((prev) => ({ ...prev, [t.id]: val }))
                        }
                        onSubmit={() => handleAnswer(t.id)}
                        onToggleAnon={() => handleToggleAnon(t.id)}
                        onDelete={() => handleDelete(t.id)}
                        submitting={submitting.has(t.id)}
                        toggling={toggling.has(t.id)}
                        deleting={deleting.has(t.id)}
                      />
                      {errors[t.id] && (
                        <p className="text-xs text-red-500 mt-1 px-1">{errors[t.id]}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
            {answered.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Answered ({answered.length})
                </h2>
                <div className="space-y-3">
                  {answered.map((t) => (
                    <div key={t.id}>
                      <ReceivedThreadCard
                        thread={t}
                        answerDraft=""
                        isAnonDraft={false}
                        onDraftChange={() => {}}
                        onAnonDraftChange={() => {}}
                        onSubmit={() => {}}
                        onToggleAnon={() => handleToggleAnon(t.id)}
                        onDelete={() => handleDelete(t.id)}
                        submitting={false}
                        toggling={toggling.has(t.id)}
                        deleting={deleting.has(t.id)}
                      />
                      {errors[t.id] && (
                        <p className="text-xs text-red-500 mt-1 px-1">{errors[t.id]}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {!pageLoading && !isRecipient && threads.length > 0 && (
          <div className="space-y-3">
            {threads.map((t) => (
              <SentThreadCard key={t.id} thread={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
