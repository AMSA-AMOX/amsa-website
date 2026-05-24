"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getKnownSchoolDomain, getLookupNameVariants } from "@/lib/logo-lookup";

const LOGO_DEV_TOKEN = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN?.trim();
const LOGO_DOMAIN_CACHE = new Map<string, string | null>();
const LOGO_DOMAIN_PENDING = new Map<string, Promise<string | null>>();

type NetworkMember = {
  id: number;
  firstName: string;
  lastName: string;
  profilePic: string | null;
  schoolName: string | null;
  role: string;
  followersCount: number;
  followingCount: number;
  mutualCount: number;
  isFollowing: boolean;
};

const normalizeLookupName = (value: string) => value.trim().toLowerCase();

const fetchDomainFromClearbit = async (name: string): Promise<string | null> => {
  const known = getKnownSchoolDomain(name);
  if (known) return known;

  const variants = getLookupNameVariants(name);
  for (const variant of variants) {
    try {
      const query = encodeURIComponent(variant);
      const res = await fetch(`https://autocomplete.clearbit.com/v1/companies/suggest?query=${query}`);
      if (!res.ok) continue;
      const results = (await res.json()) as Array<{ domain?: string }>;
      if (!Array.isArray(results) || results.length === 0) continue;
      const eduMatch = results.find((r) => r.domain?.toLowerCase().endsWith(".edu"));
      if (eduMatch?.domain) return eduMatch.domain;
      const anyMatch = results.find((r) => !!r.domain)?.domain;
      if (anyMatch) return anyMatch;
    } catch {
      continue;
    }
  }
  return null;
};

const buildLogoUrl = (domain: string) => {
  const base = `https://img.logo.dev/${domain}`;
  if (!LOGO_DEV_TOKEN) return base;
  return `${base}?token=${encodeURIComponent(LOGO_DEV_TOKEN)}`;
};

const resolveSchoolLogoDomain = async (name: string): Promise<string | null> => {
  const key = normalizeLookupName(name);
  if (LOGO_DOMAIN_CACHE.has(key)) return LOGO_DOMAIN_CACHE.get(key) ?? null;
  if (LOGO_DOMAIN_PENDING.has(key)) return LOGO_DOMAIN_PENDING.get(key)!;

  const pending = fetchDomainFromClearbit(name).then((domain) => {
    LOGO_DOMAIN_CACHE.set(key, domain);
    LOGO_DOMAIN_PENDING.delete(key);
    return domain;
  });
  LOGO_DOMAIN_PENDING.set(key, pending);
  return pending;
};

const useSchoolLogoDomain = (schoolName: string | null | undefined) => {
  const [domain, setDomain] = useState<string | null>(schoolName ? getKnownSchoolDomain(schoolName) : null);

  useEffect(() => {
    let cancelled = false;
    if (!schoolName?.trim()) {
      setDomain(null);
      return;
    }

    const known = getKnownSchoolDomain(schoolName);
    if (known) {
      setDomain(known);
      return;
    }

    resolveSchoolLogoDomain(schoolName).then((resolved) => {
      if (!cancelled) setDomain(resolved);
    });

    return () => {
      cancelled = true;
    };
  }, [schoolName]);

  return domain;
};

function SchoolLogo({ schoolName }: { schoolName: string | null | undefined }) {
  const [err, setErr] = useState(false);
  const domain = useSchoolLogoDomain(schoolName);
  const initial = schoolName?.trim()[0]?.toUpperCase() ?? "U";

  useEffect(() => {
    setErr(false);
  }, [domain, schoolName]);

  if (!domain || err) {
    return (
      <div className="w-7 h-7 rounded-md bg-[#001049]/10 flex items-center justify-center text-[#001049] font-bold text-xs shrink-0">
        {initial}
      </div>
    );
  }

  return (
    <img
      src={buildLogoUrl(domain)}
      alt={schoolName ?? ""}
      onError={() => setErr(true)}
      className="w-7 h-7 rounded-md object-contain shrink-0 bg-white border border-gray-100"
    />
  );
}

const ROLE_BADGE: Record<string, { label: string; className: string }> = {
  board_member: { label: "Board Member", className: "bg-purple-50 text-purple-600" },
  ambassador:   { label: "Ambassador",   className: "bg-amber-50 text-amber-600" },
  us_member:    { label: "US Member",    className: "bg-blue-50 text-blue-600" },
  alum:         { label: "Alum",         className: "bg-emerald-50 text-emerald-600" },
};

export default function NetworkPage() {
  const { user, loading, authFetch } = useAuth();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [members, setMembers] = useState<NetworkMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [inFlightFollow, setInFlightFollow] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);

  const PAGE_SIZE = 8;

  const loadDiscovery = useCallback(async () => {
    setLoadingMembers(true);
    try {
      const data = await authFetch("/api/user/network?limit=80");
      setMembers(data.users ?? []);
      setPage(1);
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
        params.set("limit", "80");
        const data = await authFetch(`/api/user/network/search?${params.toString()}`);
        setMembers(data.users ?? []);
        setPage(1);
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

  const totalPages = Math.max(1, Math.ceil(members.length / PAGE_SIZE));
  const displayedMembers = members.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resultCountLabel = useMemo(() => {
    if (loadingMembers) return "Searching...";
    if (members.length === 0) return "0 results";
    return `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, members.length)} of ${members.length}`;
  }, [loadingMembers, members.length, page, PAGE_SIZE]);

  if (!user) return null;

  return (
    <div className="py-7 px-4 md:px-7 lg:px-9 max-w-[1500px] mx-auto">

      <div className="mb-5 flex items-center gap-4">
        <label htmlFor="network-search" className="sr-only">Search members</label>
        <div className="relative flex-1 max-w-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35m0 0A7.5 7.5 0 1 0 6.05 6.05a7.5 7.5 0 0 0 10.6 10.6Z" />
          </svg>
          <input
            id="network-search"
            type="text"
            placeholder="Search by name or school..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-300 rounded-lg text-lg bg-gray-50 focus:border-gray-500 focus:bg-white focus:outline-none transition"
          />
        </div>
        <p className="text-xs text-gray-400 shrink-0">{resultCountLabel}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {loadingMembers && (
          <div className="contents animate-pulse">
            {Array.from({ length: PAGE_SIZE }).map((_, index) => (
              <div key={index} className="h-56 rounded-lg bg-white border-2 border-gray-200" />
            ))}
          </div>
        )}

        {!loadingMembers && members.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center md:col-span-2 xl:col-span-4">
            <p className="text-base font-semibold text-[#001049]">No members found</p>
            <p className="text-sm text-gray-500 mt-1">Try a different name or school keyword.</p>
          </div>
        )}

        {!loadingMembers &&
          displayedMembers.map((member) => {
            const initials = `${member.firstName?.[0] ?? ""}${member.lastName?.[0] ?? ""}`.toUpperCase();

            return (
              <Link
                key={member.id}
                href={`/dashboard/network/${member.id}`}
                className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-5 hover:shadow-lg transition block"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-30 h-30 rounded-full bg-[#FFCA3A] text-[#001049] font-bold text-2xl flex items-center justify-center shrink-0 overflow-hidden">
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

                  {(ROLE_BADGE[member.role] ?? (member.role === "admin" ? ROLE_BADGE["us_member"] : null)) && (
                    <span className={`mt-1.5 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${(ROLE_BADGE[member.role] ?? ROLE_BADGE["us_member"]).className}`}>
                      {(ROLE_BADGE[member.role] ?? ROLE_BADGE["us_member"]).label}
                    </span>
                  )}

                  <div className="mt-2 min-h-10 flex items-center justify-center gap-2 max-w-full">
                    <SchoolLogo schoolName={member.schoolName} />
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {member.schoolName || "School not added yet"}
                    </p>
                  </div>

                  <div className="mt-0.5 min-h-5 flex items-center justify-center">
                    {member.mutualCount > 0 && (
                      <p className="text-xs text-[#001049]/70 font-medium">
                        {member.mutualCount} mutual connection{member.mutualCount === 1 ? "" : "s"}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 w-full">
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); toggleFollow(member.id); }}
                      disabled={inFlightFollow.has(member.id)}
                      className="w-full py-2.5 rounded-xl text-md font-semibold border-2 border-gray-200 text-gray-700 hover:border-gray-400 transition disabled:opacity-60"
                    >
                      {member.isFollowing ? "Following" : "Follow"}
                    </button>
                  </div>
                </div>
              </Link>
            );
          })}
      </div>

      {!loadingMembers && totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg border-2 border-gray-200 text-sm font-medium text-gray-700 hover:border-gray-400 transition disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page <span className="font-semibold text-gray-900">{page}</span> of <span className="font-semibold text-gray-900">{totalPages}</span>
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-lg border-2 border-gray-200 text-sm font-medium text-gray-700 hover:border-gray-400 transition disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
