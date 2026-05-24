"use client";

import { usePathname } from "next/navigation";

const TITLE_MAP: Record<string, string> = {
  "/welcome": "Profile",
  "/dashboard/feed": "Feed",
  "/dashboard/notifications": "Notifications",
  "/dashboard/research": "Colleges",
  "/dashboard/research/compare": "Compare",
  "/dashboard/guide": "Guide",
  "/dashboard/threads": "Threads",
  "/dashboard/events": "Events",
  "/dashboard/network": "Network",
  "/dashboard/places": "Places",
  "/dashboard/inbox": "Inbox",
  "/dashboard/blogs": "Blogs",
  "/dashboard/admin/members": "Members",
  "/dashboard/admin/verification": "Verification Queue",
  "/dashboard/admin/posts": "Post Approval",
  "/dashboard/admin/thread-approval": "Thread Approval",
  "/verification": "Membership Form",
};

function resolveTitle(pathname: string): string {
  if (TITLE_MAP[pathname]) return TITLE_MAP[pathname];
  // Dynamic segments
  if (pathname.startsWith("/dashboard/research/state/")) return "Colleges";
  if (pathname.startsWith("/dashboard/research/college/")) return "Colleges";
  if (pathname.startsWith("/dashboard/places/")) return "Places";
  return "";
}

export default function DashboardTopBar() {
  const pathname = usePathname();
  const title = resolveTitle(pathname);

  return (
    <div className="bg-gray-50 border-b-2 border-gray-300 px-6 py-4">
      <h1 className="text-lg font-bold text-gray-900">{title}</h1>
    </div>
  );
}
