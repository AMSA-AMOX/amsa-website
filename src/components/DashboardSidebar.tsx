"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
  section: "top" | "social" | "tools";
  allowedRoles?: string[];
  badgeKey?: string;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  {
    label: "Profile",
    href: "/welcome",
    section: "top",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      </svg>
    ),
  },
  {
    label: "Feed",
    href: "/dashboard/feed",
    section: "social",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12.75h-15m15-5.25h-15m15 10.5h-15" />
      </svg>
    ),
  },
  {
    label: "Notifications",
    href: "/dashboard/notifications",
    section: "top",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 1-5.714 0A8.967 8.967 0 0 1 6 16.139V11.25a6 6 0 1 1 12 0v4.889a8.967 8.967 0 0 1-3.143.943ZM9.75 17.75a2.25 2.25 0 0 0 4.5 0" />
      </svg>
    ),
  },
  {
    label: "Research",
    href: "/dashboard/research",
    section: "tools",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 3.741-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
      </svg>
    ),
  },
  {
    label: "Compare",
    href: "/dashboard/research/compare",
    section: "tools",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5.25h6.75V21H3V5.25Zm11.25-2.25H21V21h-6.75V3Z" />
      </svg>
    ),
  },
  {
    label: "Guide",
    href: "/dashboard/guide",
    section: "tools",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 4.5h15v15h-15v-15Zm3.75 3.75h7.5m-7.5 3h7.5m-7.5 3h5.25" />
      </svg>
    ),
  },
  {
    label: "Threads",
    href: "/dashboard/threads",
    section: "social",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
      </svg>
    ),
  },
  {
    label: "Events",
    href: "/dashboard/events",
    section: "social",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
      </svg>
    ),
  },
  {
    label: "Network",
    href: "/dashboard/network",
    section: "social",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
      </svg>
    ),
  },
  {
    label: "Members",
    href: "/dashboard/admin/members",
    section: "tools",
    allowedRoles: ["admin"],
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
      </svg>
    ),
  },
  {
    label: "Verification Queue",
    href: "/dashboard/admin/verification",
    section: "tools",
    allowedRoles: ["admin"],
    badgeKey: "verification",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m6 2.25a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  },
  {
    label: "Post Approval",
    href: "/dashboard/admin/posts",
    section: "tools",
    allowedRoles: ["admin", "board_member"],
    badgeKey: "posts",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-9-5.25h12A2.25 2.25 0 0 1 20.25 9v9.75A2.25 2.25 0 0 1 18 21H6a2.25 2.25 0 0 1-2.25-2.25V9A2.25 2.25 0 0 1 6 6.75Zm0-3h12" />
      </svg>
    ),
  },
  {
    label: "Thread Approval",
    href: "/dashboard/admin/thread-approval",
    section: "tools",
    allowedRoles: ["admin", "board_member"],
    badgeKey: "threads",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
      </svg>
    ),
  },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { user, logout, authFetch } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [cachedNotifs, setCachedNotifs] = useState<Array<{ happenedAt: string }>>([]);
  const [badgeCounts, setBadgeCounts] = useState<Record<string, number>>({});

  // Fetch notifications once when user logs in
  useEffect(() => {
    if (!user) return;
    authFetch("/api/user/notifications")
      .then((res) => setCachedNotifs(res.notifications ?? []))
      .catch(() => {});
  }, [user, authFetch]);

  // Fetch admin badge counts
  useEffect(() => {
    if (!user) return;
    const isAdmin = user.role === "admin";
    const canApprovePosts = user.role === "admin" || user.role === "board_member";
    const updates: Record<string, number> = {};
    const fetches: Promise<void>[] = [];

    if (isAdmin) {
      fetches.push(
        authFetch("/api/admin/verification?status=pending")
          .then((res) => { updates.verification = (res.submissions ?? []).length; })
          .catch(() => {})
      );
    }
    if (canApprovePosts) {
      fetches.push(
        authFetch("/api/posts?reviewStatus=pending&limit=100&includeModeration=true")
          .then((res) => { updates.posts = (res.posts ?? []).length; })
          .catch(() => {})
      );
      fetches.push(
        authFetch("/api/hub-threads?view=pending")
          .then((res) => { updates.threads = (res.threads ?? []).length; })
          .catch(() => {})
      );
    }
    Promise.all(fetches).then(() => setBadgeCounts(updates));
  }, [user, authFetch]);

  // Recalculate unseen count whenever route changes or notifications update
  useEffect(() => {
    const seenAt = localStorage.getItem("amsa_notif_seen");
    const cutoff = seenAt ? new Date(seenAt).getTime() : 0;
    const unseen = cachedNotifs.filter(
      (n) => new Date(n.happenedAt).getTime() > cutoff
    ).length;
    setNotifCount(unseen);
  }, [pathname, cachedNotifs]);
  const visibleNavItems = navItems.filter(
    (item) => !item.allowedRoles || (user?.role ? item.allowedRoles.includes(user.role) : false)
  );
  const topItems = visibleNavItems.filter((item) => item.section === "top");
  const socialItems = visibleNavItems.filter((item) => item.section === "social");
  const toolItems = visibleNavItems.filter((item) => item.section === "tools" && !item.allowedRoles);
  const adminItems = visibleNavItems.filter((item) => item.section === "tools" && !!item.allowedRoles);

  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase();

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5">
        <img src="/assets/logo.png" alt="AMSA" className="h-14 w-auto" />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-6">
        <div className="space-y-0.5">
          {topItems.map((item) => {
            const active = pathname === item.href;
            const badge = item.href === "/dashboard/notifications" && notifCount > 0
              ? notifCount > 9 ? "9+" : String(notifCount)
              : null;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                  active
                    ? "bg-gray-200 text-gray-900"
                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-200"
                }`}
              >
                {item.icon}
                <span className="flex-1">{item.label}</span>
                {badge && (
                  <span className="min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center leading-none">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
        <div className="my-4 border-t border-gray-300" />
        <div className="space-y-0.5">
          {socialItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                  active
                    ? "bg-gray-200 text-gray-900"
                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-200"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="my-4 border-t border-gray-300" />
        <div className="space-y-0.5">
          {toolItems.map((item) => {
            const active = pathname === item.href;
            const count = item.badgeKey ? (badgeCounts[item.badgeKey] ?? 0) : 0;
            const badge = count > 0 ? (count > 9 ? "9+" : String(count)) : null;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                  active
                    ? "bg-gray-200 text-gray-900"
                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-200"
                }`}
              >
                {item.icon}
                <span className="flex-1">{item.label}</span>
                {badge && (
                  <span className="min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center leading-none">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
        {adminItems.length > 0 && (
          <>
            <div className="my-4 border-t border-gray-300" />
            <p className="px-4 mb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin</p>
            <div className="space-y-0.5">
              {adminItems.map((item) => {
                const active = pathname === item.href;
                const count = item.badgeKey ? (badgeCounts[item.badgeKey] ?? 0) : 0;
                const badge = count > 0 ? (count > 9 ? "9+" : String(count)) : null;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                      active
                        ? "bg-gray-200 text-gray-900"
                        : "text-gray-700 hover:text-gray-900 hover:bg-gray-200"
                    }`}
                  >
                    {item.icon}
                    <span className="flex-1">{item.label}</span>
                    {badge && (
                      <span className="min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center leading-none">
                        {badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </nav>

      {/* User footer */}
      <div className="px-4 py-4 border-t border-gray-200">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-[#FFCA3A] flex items-center justify-center text-[#001049] text-xs font-bold shrink-0 overflow-hidden">
            {user?.profilePic ? (
              <img src={user.profilePic} alt={`${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim()} className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="min-w-0">
            <p className="text-gray-800 text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-gray-500 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={() => { logout(); router.push("/"); }}
          className="w-full flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-200 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
          </svg>
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 bg-gray-50 min-h-screen fixed top-0 left-0 z-40 border-r border-gray-200">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-gray-100 flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <Link href="/welcome" className="flex items-center gap-2">
          <img src="/assets/logo.png" alt="AMSA" className="h-12 w-auto" />
        </Link>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-gray-600 p-1">
          {mobileOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-gray-100 border-r border-gray-200 flex flex-col">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}
