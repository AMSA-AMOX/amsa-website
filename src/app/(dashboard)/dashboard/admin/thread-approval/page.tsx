"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import SchoolBadge from "@/components/threads/SchoolBadge";

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
  approvedAt: string | null;
  createdAt: string;
};

function Avatar({ user }: { user: ThreadUser | null }) {
  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "?";
  return (
    <div className="w-5 h-5 rounded-full bg-[#FFCA3A] flex items-center justify-center text-[#001049] text-[9px] font-bold shrink-0 overflow-hidden">
      {user?.profilePic ? <img src={user.profilePic} alt="" className="w-full h-full object-cover" /> : initials}
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
  const askerName = thread.isAnon ? "Anonymous"
    : thread.asker ? `${thread.asker.firstName} ${thread.asker.lastName}`.trim() : "Member";

  return (
    <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4">
        {/* Meta */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <SchoolBadge category={thread.category} categoryDomain={thread.categoryDomain} />
          {thread.isAnon
            ? <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-[8px] font-bold shrink-0">?</div>
            : <Avatar user={thread.asker} />}
          <span className="text-xs text-gray-400">{askerName} · {formatRelative(thread.createdAt)}</span>
        </div>

        {/* Title */}
        <p className="font-semibold text-gray-900 leading-snug">{thread.title}</p>

        {/* Body snippet */}
        {thread.body && (
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{thread.body}</p>
        )}

        {/* Image thumbnails */}
        {thread.images?.length > 0 && (
          <div className="mt-2 flex gap-1.5">
            {thread.images.slice(0, 3).map((url, i) => (
              <div key={i} className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                <img src={url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
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
          <p className="text-sm text-gray-500 mt-1">
            Review and approve community posts before they appear on the public feed.
          </p>
        </div>

        {pageLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm h-28 animate-pulse" />
            ))}
          </div>
        )}

        {!pageLoading && threads.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <p className="text-sm font-semibold text-gray-500">No pending posts.</p>
            <p className="text-xs text-gray-400 mt-1">All posts have been reviewed.</p>
          </div>
        )}

        {!pageLoading && threads.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 mb-1">{threads.length} post{threads.length !== 1 ? "s" : ""} awaiting review</p>
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
