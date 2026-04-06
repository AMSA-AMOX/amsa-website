"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

type Member = {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: string;
  profilePic: string | null;
  createdAt: string;
};

const ROLES = [
  { value: "admin", label: "Admin" },
  { value: "board_member", label: "Board Member" },
  { value: "us_member", label: "US Member" },
  { value: "member", label: "Member" },
];

const ROLE_STYLES: Record<string, string> = {
  admin: "bg-red-50 text-red-600",
  board_member: "bg-purple-50 text-purple-600",
  us_member: "bg-blue-50 text-blue-600",
  member: "bg-gray-100 text-gray-500",
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  board_member: "Board Member",
  us_member: "US Member",
  member: "Member",
};

function Avatar({ member }: { member: Member }) {
  const initials = `${member.firstName?.[0] ?? ""}${member.lastName?.[0] ?? ""}`.toUpperCase() || "?";
  return (
    <div className="w-9 h-9 rounded-full bg-[#FFCA3A] flex items-center justify-center text-[#001049] text-xs font-bold shrink-0 overflow-hidden">
      {member.profilePic ? (
        <img src={member.profilePic} alt="" className="w-full h-full object-cover" />
      ) : (
        initials
      )}
    </div>
  );
}

export default function AdminMembersPage() {
  const { user, loading, authFetch } = useAuth();
  const router = useRouter();

  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [pageLoading, setPageLoading] = useState(true);
  const [promoting, setPromoting] = useState<Set<number>>(new Set());
  const [errors, setErrors] = useState<Record<number, string>>({});

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/login"); return; }
    if (user.role !== "admin") { router.push("/welcome"); return; }
  }, [loading, user, router]);

  const fetchMembers = useCallback(async (q: string) => {
    setPageLoading(true);
    try {
      const params = q ? `?search=${encodeURIComponent(q)}` : "";
      const data = await authFetch(`/api/admin/users${params}`);
      setMembers((data.users ?? []) as Member[]);
    } catch {
      setMembers([]);
    } finally {
      setPageLoading(false);
    }
  }, [authFetch]);

  // Initial load
  useEffect(() => {
    if (!user || user.role !== "admin") return;
    fetchMembers("");
  }, [user, fetchMembers]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => fetchMembers(query), 300);
    return () => clearTimeout(t);
  }, [query, fetchMembers]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setQuery(val);
  };

  const handleRoleChange = async (memberId: number, newRole: string) => {
    setPromoting((prev) => new Set(prev).add(memberId));
    setErrors((prev) => { const n = { ...prev }; delete n[memberId]; return n; });
    try {
      const data = await authFetch(`/api/admin/users/${memberId}`, {
        method: "PATCH",
        body: JSON.stringify({ role: newRole }),
      });
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: data.user.role } : m))
      );
    } catch (e: any) {
      setErrors((prev) => ({ ...prev, [memberId]: e?.message ?? "Failed to update" }));
    } finally {
      setPromoting((prev) => { const n = new Set(prev); n.delete(memberId); return n; });
    }
  };

  if (!user || user.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#001049]">Members</h1>
          <p className="text-sm text-gray-500 mt-1">Search and manage member roles.</p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0Z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#001049]/20"
          />
        </div>

        {/* List */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {pageLoading ? (
            <div className="divide-y divide-gray-50">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                  <div className="w-9 h-9 rounded-full bg-gray-100 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-gray-100 rounded w-40" />
                    <div className="h-3 bg-gray-100 rounded w-56" />
                  </div>
                  <div className="h-8 w-32 bg-gray-100 rounded-lg" />
                </div>
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm font-semibold text-gray-500">No members found.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-4 px-5 py-3.5">
                  <Link href={`/dashboard/network/${m.id}`} className="shrink-0">
                    <Avatar member={m} />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/dashboard/network/${m.id}`}
                      className="text-sm font-semibold text-gray-900 hover:text-[#001049] transition-colors"
                    >
                      {m.firstName ?? ""} {m.lastName ?? ""}
                    </Link>
                    <p className="text-xs text-gray-400 truncate">{m.email}</p>
                    {errors[m.id] && (
                      <p className="text-xs text-red-500 mt-0.5">{errors[m.id]}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_STYLES[m.role] ?? "bg-gray-100 text-gray-500"}`}>
                      {ROLE_LABELS[m.role] ?? m.role}
                    </span>
                    <select
                      value={m.role}
                      disabled={promoting.has(m.id)}
                      onChange={(e) => handleRoleChange(m.id, e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#001049]/20 disabled:opacity-50 cursor-pointer"
                    >
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                    {promoting.has(m.id) && (
                      <span className="text-xs text-gray-400">Saving…</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400 mt-3 text-center">
          {!pageLoading && `${members.length} member${members.length === 1 ? "" : "s"}`}
          {!pageLoading && " · Role changes take effect on next login"}
        </p>
      </div>
    </div>
  );
}
