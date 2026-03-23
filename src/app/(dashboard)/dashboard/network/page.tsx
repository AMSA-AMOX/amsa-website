"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";

const VERIFICATION_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSd7SUihiYdumMKDuHoDngMhFuid04Qecakd4b8-pf6uUt8hvA/formResponse";

type NetworkMember = {
  id: number;
  firstName: string;
  lastName: string;
  profilePic: string | null;
  schoolName: string | null;
  followersCount: number;
  followingCount: number;
  mutualCount: number;
  isFollowing: boolean;
};

export default function NetworkPage() {
  const { user, loading, authFetch } = useAuth();
  const router = useRouter();
  const isApproved = user?.acceptanceStatus?.toLowerCase() === "approved";

  const [query, setQuery] = useState("");
  const [members, setMembers] = useState<NetworkMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [inFlightFollow, setInFlightFollow] = useState<Set<number>>(new Set());

  const loadDiscovery = useCallback(async () => {
    setLoadingMembers(true);
    try {
      const data = await authFetch("/api/user/network?limit=36");
      setMembers(data.users ?? []);
    } catch {
      setMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  }, [authFetch]);

  const runSearch = useCallback(
    async (searchText: string) => {
      setLoadingMembers(true);
      try {
        const params = new URLSearchParams();
        params.set("q", searchText.trim());
        params.set("limit", "72");
        const data = await authFetch(`/api/user/network/search?${params.toString()}`);
        setMembers(data.users ?? []);
      } catch {
        setMembers([]);
      } finally {
        setLoadingMembers(false);
      }
    },
    [authFetch]
  );

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    const timeout = setTimeout(() => {
      if (query.trim()) {
        runSearch(query);
      } else {
        loadDiscovery();
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [user, loading, query, loadDiscovery, runSearch, router]);

  const toggleFollow = async (memberId: number) => {
    if (inFlightFollow.has(memberId)) return;

    const target = members.find((m) => m.id === memberId);
    if (!target) return;

    const wasFollowing = target.isFollowing;
    setInFlightFollow((prev) => new Set(prev).add(memberId));
    setMembers((prev) =>
      prev.map((member) =>
        member.id === memberId
          ? {
              ...member,
              isFollowing: !wasFollowing,
              followersCount: Math.max(0, member.followersCount + (wasFollowing ? -1 : 1)),
            }
          : member
      )
    );

    try {
      if (wasFollowing) {
        await authFetch(`/api/user/follows/${memberId}`, { method: "DELETE" });
      } else {
        await authFetch("/api/user/follows", {
          method: "POST",
          body: JSON.stringify({ followingId: memberId }),
        });
      }
    } catch {
      setMembers((prev) =>
        prev.map((member) =>
          member.id === memberId
            ? {
                ...member,
                isFollowing: wasFollowing,
                followersCount: Math.max(0, member.followersCount + (wasFollowing ? 1 : -1)),
              }
            : member
        )
      );
    } finally {
      setInFlightFollow((prev) => {
        const next = new Set(prev);
        next.delete(memberId);
        return next;
      });
    }
  };

  const resultCountLabel = useMemo(() => {
    if (loadingMembers) return "Searching members...";
    if (members.length === 1) return "1 result";
    return `${members.length} results`;
  }, [loadingMembers, members.length]);

  if (!user) return null;

  if (!isApproved) {
    return (
      <div className="py-10 px-4 md:px-8 max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <h1 className="text-xl font-bold text-[#001049]">Network is available after verification</h1>
          <p className="text-sm text-gray-500 mt-2">
            Complete the verification form to unlock member networking and profile connections.
          </p>
          <a
            href={VERIFICATION_FORM_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center mt-5 px-4 py-2.5 rounded-xl bg-[#001049] text-white text-sm font-semibold hover:bg-[#073D97] transition"
          >
            Open Verification Form
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="py-7 px-4 md:px-7 lg:px-9 max-w-[1500px] mx-auto">
      <div className="mb-5 flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#001049] mb-1">Network</h1>
          <p className="text-gray-500 text-sm">
            Discover members, view profiles, and build your AMSA connections.
          </p>
        </div>
        <p className="text-xs text-gray-400">{resultCountLabel}</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 md:p-5 mb-5">
        <label htmlFor="network-search" className="sr-only">
          Search members
        </label>
        <div className="relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-4.35-4.35m0 0A7.5 7.5 0 1 0 6.05 6.05a7.5 7.5 0 0 0 10.6 10.6Z"
            />
          </svg>
          <input
            id="network-search"
            type="text"
            placeholder="Search by name or school..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#001049]/20 focus:border-[#001049]"
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Smart search ranks members by name relevance, school matches, and mutual-network strength.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loadingMembers && (
          <div className="contents animate-pulse">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-56 rounded-2xl bg-white border border-gray-100" />
            ))}
          </div>
        )}

        {!loadingMembers && members.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center md:col-span-2 xl:col-span-3">
            <p className="text-base font-semibold text-[#001049]">No members found</p>
            <p className="text-sm text-gray-500 mt-1">Try a different name or school keyword.</p>
          </div>
        )}

        {!loadingMembers &&
          members.map((member) => {
            const initials = `${member.firstName?.[0] ?? ""}${member.lastName?.[0] ?? ""}`.toUpperCase();

            return (
              <div
                key={member.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-full bg-[#FFCA3A] text-[#001049] font-bold text-2xl flex items-center justify-center shrink-0 overflow-hidden">
                    {member.profilePic ? (
                      <img
                        src={member.profilePic}
                        alt={`${member.firstName} ${member.lastName}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      initials
                    )}
                  </div>

                  <h2 className="text-xl font-bold text-gray-900 leading-tight mt-3 line-clamp-1">
                    {member.firstName} {member.lastName}
                  </h2>

                  <div className="mt-1 text-sm text-gray-500 flex items-center justify-center gap-2 flex-wrap">
                    <span>
                      <strong className="text-gray-900">{member.followersCount}</strong> followers
                    </span>
                    <span className="text-gray-300">·</span>
                    <span>
                      <strong className="text-gray-900">{member.followingCount}</strong> following
                    </span>
                  </div>

                  <p className="mt-1.5 text-sm text-gray-500 h-10 line-clamp-2">
                    {member.schoolName || "School not added yet"}
                  </p>

                  {member.mutualCount > 0 && (
                    <p className="mt-0.5 text-xs text-[#001049]/70 font-medium">
                      {member.mutualCount} mutual connection{member.mutualCount === 1 ? "" : "s"}
                    </p>
                  )}

                  <div className="mt-4 w-full flex items-center justify-center gap-2">
                    <Link
                      href={`/dashboard/network/${member.id}`}
                      className="inline-flex items-center justify-center px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                    >
                      View Profile
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggleFollow(member.id)}
                      disabled={inFlightFollow.has(member.id)}
                      className={`inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold border transition disabled:opacity-60 ${
                        member.isFollowing
                          ? "border-gray-200 text-gray-600 hover:border-red-200 hover:text-red-500 hover:bg-red-50"
                          : "border-[#001049] text-[#001049] hover:bg-[#001049]/5"
                      }`}
                    >
                      {member.isFollowing ? "Following" : "Follow"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
