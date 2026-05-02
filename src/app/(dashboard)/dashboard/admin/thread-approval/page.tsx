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

function PendingCard({ thread, onApprove, onReject }: {
  thread: HubThread;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
}) {
  const askerName = thread.isAnon ? "Anonymous" : thread.asker
    ? `${thread.asker.firstName} ${thread.asker.lastName}`.trim()
    : "Member";

  return (
    <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4">
        <p className="text-sm text-gray-800 leading-relaxed">{thread.question}</p>
        <div className="flex items-center gap-2 mt-2">
          {thread.isAnon ? (
            <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-[10px] font-bold shrink-0">?</div>
          ) : (
            <Avatar user={thread.asker} size="w-5 h-5" />
          )}
          <span className="text-xs text-gray-400">{askerName} · {formatRelative(thread.createdAt)}</span>
        </div>
      </div>
      <div className="px-5 py-3 border-t border-amber-100 flex items-center gap-2 bg-amber-50/50">
        <span className="flex-1 text-xs text-amber-700 font-medium">Pending review</span>
        <button
          type="button"
          onClick={() => onApprove(thread.id)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#001049] text-white hover:opacity-90 transition"
        >
          Approve
        </button>
        <button
          type="button"
          onClick={() => onReject(thread.id)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition"
        >
          Reject
        </button>
      </div>
    </div>
  );
}

export default function ThreadApprovalPage() {
  const { user, loading, authFetch } = useAuth();
  const router = useRouter();

  const [threads, setThreads] = useState<HubThread[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  const isBoardPlus = user?.role === "board_member" || user?.role === "admin";

  const loadPending = useCallback(async () => {
    setPageLoading(true);
    try {
      const data = await authFetch("/api/hub-threads?view=pending");
      setThreads((data.threads ?? []) as HubThread[]);
    } catch {
      setThreads([]);
    } finally {
      setPageLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/login"); return; }
    if (!isBoardPlus) { router.push("/dashboard/threads"); return; }
    loadPending();
  }, [loading, user, isBoardPlus, router, loadPending]);

  const handleModerate = async (threadId: number, status: "approved" | "rejected") => {
    try {
      await authFetch(`/api/hub-threads/${threadId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setThreads((prev) => prev.filter((t) => t.id !== threadId));
    } catch (e: any) {
      alert(e?.message ?? "Failed to moderate thread.");
    }
  };

  if (!user || !isBoardPlus) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 md:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#001049]">Thread Approval</h1>
          <p className="text-sm text-gray-500 mt-1">
            Review and approve community questions before they appear on the public feed.
          </p>
        </div>

        {pageLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm h-24 animate-pulse" />
            ))}
          </div>
        )}

        {!pageLoading && threads.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <p className="text-sm font-semibold text-gray-500">No pending threads.</p>
            <p className="text-xs text-gray-400 mt-1">All questions have been reviewed.</p>
          </div>
        )}

        {!pageLoading && threads.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 mb-1">{threads.length} thread{threads.length !== 1 ? "s" : ""} awaiting review</p>
            {threads.map((t) => (
              <PendingCard
                key={t.id}
                thread={t}
                onApprove={(id) => handleModerate(id, "approved")}
                onReject={(id) => handleModerate(id, "rejected")}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
