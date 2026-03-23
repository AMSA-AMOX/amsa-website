"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

type NotificationItem = {
  id: string;
  type: "follow" | "event";
  title: string;
  description: string;
  happenedAt: string;
  href: string;
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
    <div className="py-8 px-4 md:px-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#001049] mb-1">Notifications</h1>
        <p className="text-sm text-gray-500">Your recent activity across network and events.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6">
        {loadingItems && (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-gray-100" />
            ))}
          </div>
        )}

        {!loadingItems && items.length === 0 && (
          <div className="text-center py-14">
            <p className="text-base font-semibold text-[#001049]">No notifications yet</p>
            <p className="text-sm text-gray-500 mt-1">New followers and event updates will show up here.</p>
          </div>
        )}

        {!loadingItems && items.length > 0 && (
          <div className="space-y-6">
            <section>
              <h2 className="text-xs font-semibold tracking-wide uppercase text-gray-400 mb-2">Today</h2>
              <div className="space-y-2">
                {grouped.today.length === 0 && <p className="text-sm text-gray-400">No activity today.</p>}
                {grouped.today.map((item) => (
                  <NotificationRow key={item.id} item={item} />
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-xs font-semibold tracking-wide uppercase text-gray-400 mb-2">Earlier</h2>
              <div className="space-y-2">
                {grouped.earlier.length === 0 && <p className="text-sm text-gray-400">Nothing earlier.</p>}
                {grouped.earlier.map((item) => (
                  <NotificationRow key={item.id} item={item} />
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

function NotificationRow({ item }: { item: NotificationItem }) {
  const timeText = formatTimeAgo(item.happenedAt);

  return (
    <Link href={item.href} className="block rounded-xl border border-gray-100 hover:bg-gray-50 transition p-3 md:p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-[#001049]/10 flex items-center justify-center text-[#001049] font-semibold shrink-0 overflow-hidden">
          {item.avatarUrl ? (
            <img src={item.avatarUrl} alt={item.title} className="w-full h-full object-cover" />
          ) : item.type === "follow" ? (
            "F"
          ) : (
            "E"
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{item.title}</p>
          <p className="text-sm text-gray-600 leading-snug">{item.description}</p>
          <p className="text-xs text-gray-400 mt-1">{timeText}</p>
        </div>
      </div>
    </Link>
  );
}
