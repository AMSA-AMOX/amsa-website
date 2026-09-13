"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

/**
 * Persistent reminder for board members who have not yet filed the US Member
 * application. Board members are auto-promoted at login (via @amsa.mn email)
 * and would otherwise skip the form entirely.
 */
export default function MembershipReminderBanner() {
  const pathname = usePathname();
  const { user, authFetch } = useAuth();
  const [hasSubmitted, setHasSubmitted] = useState<boolean | null>(null);

  const isBoardMember = user?.role === "board_member";

  useEffect(() => {
    if (!isBoardMember) return;
    authFetch("/api/user/verification")
      .then((res) => setHasSubmitted(Boolean(res.membership)))
      .catch(() => {});
  }, [isBoardMember, authFetch, pathname]);

  if (!isBoardMember || hasSubmitted !== false || pathname === "/verification") return null;

  return (
    <div className="bg-[#FFCA3A]/20 border-b-2 border-[#FFCA3A] px-6 py-2.5 flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm text-[#001049]">
        <span className="font-semibold">Action needed:</span> board members must also complete the US Member application.
      </p>
      <Link
        href="/verification"
        className="text-sm font-semibold text-[#001049] underline underline-offset-2 hover:opacity-80 transition"
      >
        Open application →
      </Link>
    </div>
  );
}
