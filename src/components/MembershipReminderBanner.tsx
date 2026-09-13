"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useShell } from "@/hooks/useShell";

/**
 * Persistent reminder for board members who have not yet filed the US Member
 * application. Board members are auto-promoted at login (via @amsa.mn email)
 * and would otherwise skip the form entirely.
 *
 * Reads the shared /api/me/shell payload — no request of its own.
 */
export default function MembershipReminderBanner() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { shell } = useShell();

  const isBoardMember = user?.role === "board_member";
  const hasSubmitted = shell ? shell.membershipStatus !== null : null;

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
