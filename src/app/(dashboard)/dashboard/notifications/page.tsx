"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

type NotificationItem = {
  id: string;
  type: "follow" | "event" | "thread_question" | "thread_answered" | "welcome";
  title: string;
  description: string;
  happenedAt: string;
  href?: string;
  avatarUrl?: string | null;
};

const formatTimeAgo = (iso: string) => {
  const date = new Date(iso);
  const deltaSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (deltaSec < 60) return "just now";
  const minutes = Math.floor(deltaSec / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

export default function NotificationsPage() {
  const { user, loading, authFetch } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    setLoadingItems(true);
    localStorage.setItem("amsa_notif_seen", new Date().toISOString());
    authFetch("/api/user/notifications")
      .then((res) => setItems(res.notifications ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoadingItems(false));
  }, [loading, user, router, authFetch]);

  const grouped = useMemo(() => {
    const today: NotificationItem[] = [];
    const earlier: NotificationItem[] = [];
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    for (const item of items) {
      const t = new Date(item.happenedAt).getTime();
      if (t >= startToday) today.push(item);
      else earlier.push(item);
    }
    return { today, earlier };
  }, [items]);

  if (!user) return null;

  return (
    <div className="py-10 px-4 md:px-8">

      {loadingItems && (
        <div className="animate-pulse divide-y-2 divide-gray-300">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-6 px-6 py-6">
              <div className="w-16 h-16 rounded-full bg-gray-200 shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loadingItems && items.length === 0 && (
        <div className="text-center py-20">
          <p className="text-xl font-semibold text-[#001049]">No notifications yet</p>
          <p className="text-base text-gray-500 mt-2">New followers and event updates will show up here.</p>
        </div>
      )}

      {!loadingItems && items.length > 0 && (
        <div className="space-y-8">
          <section>
            <h2 className="text-sm font-semibold tracking-wide uppercase text-gray-400 mb-3">Today</h2>
            {grouped.today.length === 0
              ? <p className="text-base text-gray-400 px-1">No activity today.</p>
              : <div className="divide-y-2 divide-gray-300">
                  {grouped.today.map((item) => <NotificationRow key={item.id} item={item} />)}
                </div>
            }
          </section>

          <section>
            <h2 className="text-sm font-semibold tracking-wide uppercase text-gray-400 mb-3">Earlier</h2>
            {grouped.earlier.length === 0
              ? <p className="text-base text-gray-400 px-1">Nothing earlier.</p>
              : <div className="divide-y-2 divide-gray-300">
                  {grouped.earlier.map((item) => <NotificationRow key={item.id} item={item} />)}
                </div>
            }
          </section>
        </div>
      )}
    </div>
  );
}

function NotificationIcon({ item }: { item: NotificationItem }) {
  if (item.avatarUrl) {
    return <img src={item.avatarUrl} alt={item.title} className="w-full h-full object-cover" />;
  }
  if (item.type === "welcome" || item.type === "event") {
    return <img src="/header-logo.svg" alt="AMSA" className="w-8 h-8 object-contain" />;
  }
  if (item.type === "follow") {
    return (
      <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
      </svg>
    );
  }
  if (item.type === "thread_question" || item.type === "thread_answered") {
    return (
      <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
      </svg>
    );
  }
  return (
    <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
    </svg>
  );
}

function NotificationRow({ item }: { item: NotificationItem }) {
  const timeText = formatTimeAgo(item.happenedAt);
  const hasLogo = !!item.avatarUrl || item.type === "welcome" || item.type === "event";

  const visual = hasLogo ? (
    item.avatarUrl
      ? <img src={item.avatarUrl} alt={item.title} className="w-12 h-12 object-cover rounded-lg shrink-0" />
      : <img src="/header-logo.svg" alt="AMSA" className="w-12 h-12 object-contain shrink-0" />
  ) : (
    <div className="w-12 h-12 rounded-full bg-[#001049]/10 flex items-center justify-center text-[#001049] shrink-0">
      <NotificationIcon item={item} />
    </div>
  );

  const body = (
    <div className="flex-1 min-w-0">
      <p className="text-base font-semibold text-gray-900">{item.title}</p>
      <p className="text-sm text-gray-600 leading-snug mt-0.5">{item.description}</p>
      <p className="text-xs text-gray-400 mt-1">{timeText}</p>
    </div>
  );

  if (!item.href) {
    return (
      <div className="flex items-center gap-4 px-5 py-4 bg-gray-50">
        {visual}{body}
      </div>
    );
  }

  return (
    <Link href={item.href} className="flex items-center gap-4 px-5 py-4 bg-gray-50 hover:bg-gray-100 transition">
      {visual}{body}
    </Link>
  );
}
