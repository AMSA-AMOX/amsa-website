"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { extractSchoolEmailDomain, getKnownSchoolDomain, getLookupNameVariants } from "@/lib/logo-lookup";
import PostCard from "@/components/posts/PostCard";
import type { PostItem } from "@/components/posts/types";

type NetworkProfile = {
  id: number;
  firstName: string;
  lastName: string;
  profilePic: string | null;
  bio: string | null;
  schoolName: string | null;
  schoolEmail: string | null;
  major: string | null;
  degreeLevel: string | null;
  schoolYear: string | null;
  graduationYear: string | null;
  linkedin: string | null;
  instagram: string | null;
  facebook: string | null;
  x: string | null;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  role: string;
  roles: string[];
};

type ThreadUser = {
  id: number;
  firstName: string;
  lastName: string;
  profilePic: string | null;
};

type ThreadItem = {
  id: number;
  question: string;
  answer: string | null;
  answeredAt: string | null;
  createdAt: string;
  status: "answered" | "pending";
  isAnonymous: boolean;
  asker: ThreadUser | null;
  recipient: ThreadUser | null;
};

function formatRelativeThread(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  return new Date(iso).toLocaleDateString();
}

function ThreadCard({ thread }: { thread: ThreadItem }) {
  const recipientName = thread.isAnonymous
    ? "Anonymous"
    : thread.recipient
      ? `${thread.recipient.firstName} ${thread.recipient.lastName}`.trim()
      : "Member";
  const recipientInitials = thread.recipient
    ? `${thread.recipient.firstName?.[0] ?? ""}${thread.recipient.lastName?.[0] ?? ""}`.toUpperCase()
    : "M";

  return (
    <article className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 bg-gray-50">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Q</p>
        <p className="text-sm text-gray-800 leading-relaxed">{thread.question}</p>
      </div>
      <div className="px-5 py-4 bg-white border-t border-gray-100">
        <div className="flex items-center gap-2 mb-2.5">
          {thread.isAnonymous ? (
            <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs font-bold shrink-0">?</div>
          ) : (
            <div className="w-7 h-7 rounded-full bg-[#FFCA3A] flex items-center justify-center text-[#001049] text-xs font-bold shrink-0 overflow-hidden">
              {thread.recipient?.profilePic
                ? <img src={thread.recipient.profilePic} alt={recipientName} className="w-full h-full object-cover" />
                : recipientInitials}
            </div>
          )}
          <span className="text-sm font-semibold text-gray-800">{recipientName}</span>
        </div>
        {thread.answer ? (
          <p className="text-sm text-gray-600 leading-relaxed">{thread.answer}</p>
        ) : (
          <p className="text-sm text-gray-400 italic">Awaiting answer…</p>
        )}
      </div>
    </article>
  );
}

type Experience = {
  id: number;
  userId: number;
  jobTitle: string;
  company: string;
  employmentType: string | null;
  startMonth: string;
  startYear: string;
  endMonth: string | null;
  endYear: string | null;
  currentlyWorking: boolean;
  location: string | null;
  description: string | null;
};

type NextProfile = {
  id: number;
  firstName: string;
  lastName: string;
  profilePic: string | null;
  schoolName: string | null;
  graduationYear: string | null;
  followersCount: number;
  followingCount: number;
  mutualCount: number;
  isFollowing: boolean;
  sameSchool: boolean;
  sameYear: boolean;
};

const ROLE_BADGE: Record<string, { label: string; className: string }> = {
  board_member: { label: "Board Member", className: "bg-purple-50 text-purple-600" },
  ambassador:   { label: "Ambassador",   className: "bg-amber-50 text-amber-600" },
  us_member:    { label: "US Member",    className: "bg-blue-50 text-blue-600" },
};

const LOGO_DEV_TOKEN = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN?.trim();
const LOGO_DOMAIN_CACHE = new Map<string, string | null>();
const LOGO_DOMAIN_PENDING = new Map<string, Promise<string | null>>();

const normalizeLookupName = (value: string) => value.trim().toLowerCase();

/**
 * Score how well a Clearbit result name matches the query.
 * Higher = better match. Based on word overlap so "University of Maryland"
 * scores higher than "University of Mary" for the same query.
 */
function nameMatchScore(query: string, resultName: string): number {
  const normalize = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

  const q = normalize(query);
  const r = normalize(resultName);

  // Exact match wins
  if (q === r) return 1000;

  const qWords = q.split(" ").filter(Boolean);
  const rWords = new Set(r.split(" ").filter(Boolean));

  // How many query words appear in the result
  const matchedWords = qWords.filter((w) => rWords.has(w)).length;
  // Penalise extra words in the result not in the query
  const extraWords = [...rWords].filter((w) => !qWords.includes(w)).length;

  return matchedWords * 10 - extraWords;
}

const fetchDomainFromClearbit = async (name: string, preferEdu: boolean): Promise<string | null> => {
  const known = getKnownSchoolDomain(name);
  if (preferEdu && known) return known;

  const variants = getLookupNameVariants(name);
  for (const variant of variants) {
    try {
      const query = encodeURIComponent(variant);
      const res = await fetch(`https://autocomplete.clearbit.com/v1/companies/suggest?query=${query}`);
      if (!res.ok) continue;
      const results = (await res.json()) as Array<{ name?: string; domain?: string }>;
      if (!Array.isArray(results) || results.length === 0) continue;

      const pool = preferEdu
        ? results.filter((r) => r.domain?.toLowerCase().endsWith(".edu"))
        : results.filter((r) => !!r.domain);

      if (pool.length === 0) continue;

      // Pick the result whose name best matches the query rather than just the first
      const best = pool.reduce((a, b) =>
        nameMatchScore(variant, b.name ?? "") > nameMatchScore(variant, a.name ?? "") ? b : a
      );

      if (best.domain) return best.domain;
    } catch {
      continue;
    }
  }
  return null;
};

const resolveLogoDomain = async (name: string, preferEdu: boolean): Promise<string | null> => {
  const key = `${preferEdu ? "edu" : "any"}:${normalizeLookupName(name)}`;
  if (LOGO_DOMAIN_CACHE.has(key)) return LOGO_DOMAIN_CACHE.get(key) ?? null;
  if (LOGO_DOMAIN_PENDING.has(key)) return LOGO_DOMAIN_PENDING.get(key)!;

  const pending = fetchDomainFromClearbit(name, preferEdu).then((domain) => {
    LOGO_DOMAIN_CACHE.set(key, domain);
    LOGO_DOMAIN_PENDING.delete(key);
    return domain;
  });
  LOGO_DOMAIN_PENDING.set(key, pending);
  return pending;
};

const buildLogoUrl = (domain: string) => {
  const base = `https://img.logo.dev/${domain}`;
  if (!LOGO_DEV_TOKEN) return base;
  return `${base}?token=${encodeURIComponent(LOGO_DEV_TOKEN)}`;
};

const useLogoDomain = (name: string | null | undefined, preferEdu: boolean, overrideDomain?: string | null) => {
  const [domain, setDomain] = useState<string | null>(overrideDomain ?? null);

  useEffect(() => {
    let cancelled = false;
    if (overrideDomain) {
      setDomain(overrideDomain);
      return;
    }
    if (!name?.trim()) {
      setDomain(null);
      return;
    }
    resolveLogoDomain(name, preferEdu).then((resolved) => {
      if (!cancelled) setDomain(resolved);
    });
    return () => {
      cancelled = true;
    };
  }, [name, preferEdu, overrideDomain]);

  return domain;
};

function EntityLogo({
  name,
  preferEdu,
  emailDomain,
  size = 10,
  rounded = "rounded-lg",
}: {
  name: string | null | undefined;
  preferEdu: boolean;
  emailDomain?: string | null;
  size?: number;
  rounded?: string;
}) {
  const [err, setErr] = useState(false);
  const domain = useLogoDomain(name, preferEdu, emailDomain);
  const boxSize = { width: `${size * 4}px`, height: `${size * 4}px` };
  const iconSize = `${Math.max(10, size * 2)}px`;

  useEffect(() => {
    setErr(false);
  }, [domain, name]);

  if (!domain || err) {
    return (
      <div
        style={boxSize}
        className={`${rounded} bg-[#001049]/10 flex items-center justify-center text-[#001049] shrink-0`}
      >
        {preferEdu ? (
          /* Graduation cap */
          <svg style={{ width: iconSize, height: iconSize }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 3.741-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
          </svg>
        ) : (
          /* Building */
          <svg style={{ width: iconSize, height: iconSize }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
          </svg>
        )}
      </div>
    );
  }

  return (
    <img
      src={buildLogoUrl(domain)}
      alt={name ?? ""}
      onError={() => setErr(true)}
      style={boxSize}
      className={`${rounded} object-contain shrink-0 bg-white border border-gray-100`}
    />
  );
}

export default function NetworkProfilePage() {
  const { user, loading, authFetch } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const memberId = Number(params.id);

  const [profile, setProfile] = useState<NetworkProfile | null>(null);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [nextProfiles, setNextProfiles] = useState<NextProfile[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState("");
  const [followInFlight, setFollowInFlight] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "posts" | "threads">("profile");
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [postsLoaded, setPostsLoaded] = useState(false);
  const [appreciating, setAppreciating] = useState<Set<number>>(new Set());
  const [profileThreads, setProfileThreads] = useState<ThreadItem[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [threadsLoaded, setThreadsLoaded] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [questionDraft, setQuestionDraft] = useState("");
  const [questionIsPublic, setQuestionIsPublic] = useState(true);
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [questionMessage, setQuestionMessage] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (!Number.isFinite(memberId)) {
      setError("Invalid member");
      setLoadingProfile(false);
      return;
    }

    let active = true;
    setLoadingProfile(true);
    authFetch(`/api/user/network/${memberId}`)
      .then((data) => {
        if (!active) return;
        setProfile(data.user ?? null);
        setExperiences(data.experiences ?? []);
        setNextProfiles(data.nextProfiles ?? []);
        setError("");
      })
      .catch(() => {
        if (!active) return;
        setError("Member profile unavailable");
      })
      .finally(() => {
        if (!active) return;
        setLoadingProfile(false);
      });

    return () => {
      active = false;
    };
  }, [memberId, loading, user, router, authFetch]);

  const loadPosts = useCallback(async () => {
    if (postsLoaded || loadingPosts) return;
    setLoadingPosts(true);
    try {
      const data = await authFetch(`/api/posts?creatorId=${memberId}&limit=20`);
      setPosts((data.posts ?? []) as PostItem[]);
      setPostsLoaded(true);
    } catch {
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  }, [authFetch, memberId, postsLoaded, loadingPosts]);

  const loadProfileThreads = useCallback(async () => {
    if (threadsLoaded || loadingThreads) return;
    setLoadingThreads(true);
    try {
      const data = await authFetch(`/api/threads/profile/${memberId}`);
      setProfileThreads((data.threads ?? []) as ThreadItem[]);
      setThreadsLoaded(true);
    } catch {
      setProfileThreads([]);
    } finally {
      setLoadingThreads(false);
    }
  }, [authFetch, memberId, threadsLoaded, loadingThreads]);

  const handleTabChange = (tab: "profile" | "posts" | "threads") => {
    setActiveTab(tab);
    if (tab === "posts" && !postsLoaded) loadPosts();
    if (tab === "threads" && !threadsLoaded) loadProfileThreads();
  };

  const submitQuestion = async () => {
    if (!profile || submittingQuestion) return;
    const q = questionDraft.trim();
    if (!q) return;
    setSubmittingQuestion(true);
    try {
      await authFetch("/api/threads", {
        method: "POST",
        body: JSON.stringify({ recipientId: profile.id, question: q, isPublic: questionIsPublic }),
      });
      setQuestionDraft("");
      setQuestionIsPublic(true);
      setAskOpen(false);
      setQuestionMessage({ text: "Your question has been sent!", ok: true });
      setTimeout(() => setQuestionMessage(null), 4000);
    } catch (e: any) {
      setQuestionMessage({ text: e?.message ?? "Failed to send question.", ok: false });
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const onAppreciate = async (postId: number) => {
    if (appreciating.has(postId)) return;
    const current = posts.find((p) => p.id === postId);
    if (!current || current.hasAppreciated) return;
    setAppreciating((prev) => new Set(prev).add(postId));
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, hasAppreciated: true, appreciationCount: p.appreciationCount + 1 } : p
      )
    );
    try {
      const data = await authFetch(`/api/posts/${postId}/helpful`, { method: "POST" });
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, hasAppreciated: Boolean(data.hasAppreciated), appreciationCount: Number(data.appreciationCount ?? p.appreciationCount) }
            : p
        )
      );
    } catch {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, hasAppreciated: current.hasAppreciated, appreciationCount: current.appreciationCount }
            : p
        )
      );
    } finally {
      setAppreciating((prev) => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    }
  };

  const toggleFollow = async () => {
    if (!profile || followInFlight || profile.id === user?.id) return;

    const wasFollowing = profile.isFollowing;
    setFollowInFlight(true);
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            isFollowing: !wasFollowing,
            followersCount: Math.max(0, prev.followersCount + (wasFollowing ? -1 : 1)),
          }
        : prev
    );

    try {
      if (wasFollowing) {
        await authFetch(`/api/user/follows/${profile.id}`, { method: "DELETE" });
      } else {
        await authFetch("/api/user/follows", {
          method: "POST",
          body: JSON.stringify({ followingId: profile.id }),
        });
      }
    } catch {
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              isFollowing: wasFollowing,
              followersCount: Math.max(0, prev.followersCount + (wasFollowing ? 1 : -1)),
            }
          : prev
      );
    } finally {
      setFollowInFlight(false);
    }
  };

  const displayName = useMemo(() => {
    if (!profile) return "";
    return `${profile.firstName} ${profile.lastName}`.trim();
  }, [profile]);

  const visibleRoles = (profile?.roles?.length ? profile.roles : [profile?.role ?? ""])
    .filter((r) => r && ROLE_BADGE[r]);

  const canAskQuestion =
    user?.role === "member" &&
    profile !== null &&
    profile.id !== user?.id &&
    (profile.roles?.some((r) => ["ambassador", "us_member", "board_member"].includes(r)) ?? false);

  if (!user) return null;

  return (
    <div className="flex flex-1 min-h-0 bg-gray-50">
      <div className="flex flex-1 min-h-0">

        {/* ── Left sidebar ─────────────────────────────────────────────── */}
        <aside className="w-72 shrink-0 hidden lg:flex flex-col border-r-2 border-gray-300 overflow-y-auto px-6 pt-6">

          {/* Back link */}
          <div className="mb-4">
            <Link
              href="/dashboard/network"
              className="inline-flex items-center gap-1.5 text-sm text-[#001049] hover:underline"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 19.5-7.5-7.5 7.5-7.5" />
              </svg>
              Back to Network
            </Link>
          </div>

          {/* Avatar + name + followers */}
          <div className="flex flex-col items-center pb-5 border-b-2 border-gray-300">
            {loadingProfile ? (
              <div className="w-24 h-24 rounded-full bg-gray-200 animate-pulse" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-[#FFCA3A] flex items-center justify-center text-[#001049] text-3xl font-bold shrink-0 overflow-hidden ring-4 ring-white shadow-md">
                {profile?.profilePic ? (
                  <img src={profile.profilePic} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  `${profile?.firstName?.[0] ?? ""}${profile?.lastName?.[0] ?? ""}`.toUpperCase()
                )}
              </div>
            )}
            {loadingProfile ? (
              <div className="mt-3 h-6 w-36 bg-gray-200 rounded animate-pulse" />
            ) : (
              <h1 className="mt-3 text-xl font-bold text-gray-900 text-center leading-tight">{displayName}</h1>
            )}
            {!loadingProfile && visibleRoles.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1 mt-1.5">
                {visibleRoles.map((r) => (
                  <span key={r} className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${ROLE_BADGE[r].className}`}>
                    {ROLE_BADGE[r].label}
                  </span>
                ))}
              </div>
            )}
            {loadingProfile ? (
              <div className="mt-2 h-4 w-28 bg-gray-200 rounded animate-pulse" />
            ) : (
              <div className="flex items-center gap-3 mt-2 text-sm">
                <span className="text-gray-500">
                  <span className="font-semibold text-gray-900">{profile?.followersCount ?? 0}</span> followers
                </span>
                <span className="text-gray-300">·</span>
                <span className="text-gray-500">
                  <span className="font-semibold text-gray-900">{profile?.followingCount ?? 0}</span> following
                </span>
              </div>
            )}
          </div>

          {/* School info */}
          <div className="py-4 space-y-3 border-b-2 border-gray-300">
            {loadingProfile ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-4 bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
              </div>
            ) : (
              <>
                {profile?.schoolName && (
                  <div className="flex items-center gap-2.5">
                    <EntityLogo name={profile.schoolName} preferEdu={true} emailDomain={extractSchoolEmailDomain(profile.schoolEmail)} size={11} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{profile.schoolName}</p>
                      <p className="text-xs text-gray-500">
                        {[profile.degreeLevel, profile.major].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </div>
                )}
                {(profile?.schoolYear || profile?.graduationYear) && (
                  <p className="text-xs text-gray-400">
                    {[profile.schoolYear, profile.graduationYear ? `Class of ${profile.graduationYear}` : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Follow button */}
          {!loadingProfile && profile && profile.id !== user.id && (
            <div className="py-4 flex gap-2 border-b-2 border-gray-300">
              <button
                type="button"
                onClick={toggleFollow}
                disabled={followInFlight}
                className="flex-1 flex items-center justify-center px-3 py-2 rounded-lg border-2 border-gray-300 text-sm font-medium text-gray-700 hover:border-gray-400 transition disabled:opacity-60"
              >
                {profile.isFollowing ? "Following" : "Follow"}
              </button>
            </div>
          )}

          {/* Links */}
          {!loadingProfile && profile && (profile.linkedin || profile.x || profile.instagram || profile.facebook) && (
            <div className="pt-4 pb-4 space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Links</p>
              <div className="space-y-1.5">
                {profile.x && (
                  <a href={profile.x} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-gray-600 hover:text-black transition truncate">
                    <svg className="w-4 h-4 text-black shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M18.244 2H21l-6.02 6.86L22 22h-5.55l-4.347-5.727L7.078 22H4.32l6.44-7.338L2 2h5.69l3.93 5.182L18.244 2Zm-.967 18.38h1.527L6.86 3.54H5.22L17.277 20.38Z" />
                    </svg>
                    <span className="truncate">X</span>
                  </a>
                )}
                {profile.linkedin && (
                  <a href={profile.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-700 transition truncate">
                    <svg className="w-4 h-4 text-blue-700 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    <span className="truncate">LinkedIn</span>
                  </a>
                )}
                {profile.instagram && (
                  <a href={profile.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-gray-600 hover:text-pink-500 transition truncate">
                    <svg className="w-4 h-4 text-pink-500 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                    <span className="truncate">Instagram</span>
                  </a>
                )}
                {profile.facebook && (
                  <a href={profile.facebook} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition truncate">
                    <svg className="w-4 h-4 text-blue-600 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    <span className="truncate">Facebook</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Ask a question */}
          {!loadingProfile && canAskQuestion && profile && (
            <div className="pt-4 pb-4 border-t-2 border-gray-300">
              <button
                type="button"
                onClick={() => { setAskOpen(true); setQuestionMessage(null); }}
                className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold border-2 border-gray-200 text-gray-700 hover:border-gray-400 transition"
              >
                Ask a Direct Question
              </button>
            </div>
          )}
        </aside>

        {/* ── Center content ─────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 min-h-0 overflow-y-auto border-r-2 border-gray-300">

          {/* Tab nav */}
          <div className="flex gap-8 border-b-2 border-gray-300 px-8">
            {(["profile", "posts", "threads"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => handleTabChange(tab)}
                className={`py-3.5 text-base font-semibold border-b-2 transition-colors capitalize -mb-px ${
                  activeTab === tab
                    ? "border-[#001049] text-[#001049]"
                    : "border-transparent text-gray-400 hover:text-gray-700"
                }`}
              >
                {tab === "posts" ? "Posts" : tab === "threads" ? "Threads" : "Profile"}
              </button>
            ))}
          </div>

          {/* Mobile: compact profile header */}
          <div className="lg:hidden px-6 py-5 border-b border-gray-200">
            <div className="mb-3">
              <Link
                href="/dashboard/network"
                className="inline-flex items-center gap-1.5 text-sm text-[#001049] hover:underline"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 19.5-7.5-7.5 7.5-7.5" />
                </svg>
                Back to Network
              </Link>
            </div>
            {!loadingProfile && profile && (
              <>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#FFCA3A] flex items-center justify-center text-[#001049] text-xl font-bold shrink-0 overflow-hidden">
                    {profile.profilePic ? <img src={profile.profilePic} alt={displayName} className="w-full h-full object-cover" /> : `${profile.firstName?.[0] ?? ""}${profile.lastName?.[0] ?? ""}`.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-lg font-bold text-gray-900">{displayName}</h1>
                    {visibleRoles.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {visibleRoles.map((r) => (
                          <span key={r} className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${ROLE_BADGE[r].className}`}>
                            {ROLE_BADGE[r].label}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span><strong className="text-gray-900">{profile.followersCount}</strong> followers</span>
                      <span>·</span>
                      <span><strong className="text-gray-900">{profile.followingCount}</strong> following</span>
                    </div>
                    {profile.schoolName && <p className="text-sm text-gray-500 mt-1">{profile.schoolName}</p>}
                    {profile.id !== user.id && (
                      <button
                        type="button"
                        onClick={toggleFollow}
                        disabled={followInFlight}
                        className="mt-2 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:border-gray-400 transition"
                      >
                        {profile.isFollowing ? "Following" : "Follow"}
                      </button>
                    )}
                  </div>
                </div>
                {(profile.linkedin || profile.x || profile.instagram || profile.facebook) && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-1.5">
                    {profile.x && (
                      <a href={profile.x} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-gray-600 hover:text-black transition truncate">
                        <svg className="w-4 h-4 text-black shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M18.244 2H21l-6.02 6.86L22 22h-5.55l-4.347-5.727L7.078 22H4.32l6.44-7.338L2 2h5.69l3.93 5.182L18.244 2Zm-.967 18.38h1.527L6.86 3.54H5.22L17.277 20.38Z" />
                        </svg>
                        <span className="truncate">X</span>
                      </a>
                    )}
                    {profile.linkedin && (
                      <a href={profile.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-700 transition truncate">
                        <svg className="w-4 h-4 text-blue-700 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                        <span className="truncate">LinkedIn</span>
                      </a>
                    )}
                    {profile.instagram && (
                      <a href={profile.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-gray-600 hover:text-pink-500 transition truncate">
                        <svg className="w-4 h-4 text-pink-500 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                        <span className="truncate">Instagram</span>
                      </a>
                    )}
                    {profile.facebook && (
                      <a href={profile.facebook} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition truncate">
                        <svg className="w-4 h-4 text-blue-600 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        <span className="truncate">Facebook</span>
                      </a>
                    )}
                  </div>
                )}
                {canAskQuestion && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => { setAskOpen(true); setQuestionMessage(null); }}
                      className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold border-2 border-gray-200 text-gray-700 hover:border-gray-400 transition"
                    >
                      Ask a Direct Question
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Error state */}
          {!loadingProfile && error && (
            <div className="px-8 py-12 text-center">
              <p className="text-base font-semibold text-[#001049]">{error}</p>
            </div>
          )}

          {/* Profile tab */}
          {activeTab === "profile" && (
            <div className="px-8">
              <div className="py-6 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 mb-4">About</h2>
                {loadingProfile ? (
                  <div className="space-y-2 animate-pulse">{[1,2].map(i => <div key={i} className="h-4 bg-gray-100 rounded" />)}</div>
                ) : profile?.bio ? (
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
                ) : (
                  <p className="text-sm text-gray-500">No bio added yet.</p>
                )}
              </div>

              <div className="py-6 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Education</h2>
                {loadingProfile ? (
                  <div className="space-y-2 animate-pulse">{[1,2,3].map(i => <div key={i} className="h-4 bg-gray-100 rounded" />)}</div>
                ) : profile?.schoolName ? (
                  <div className="flex gap-4">
                    <EntityLogo name={profile.schoolName} preferEdu={true} emailDomain={extractSchoolEmailDomain(profile.schoolEmail)} size={12} />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900">
                        {[profile.degreeLevel, profile.major].filter(Boolean).join(", ") || profile.schoolName}
                      </p>
                      <p className="text-sm text-gray-600 mt-0.5">{profile.schoolName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {[profile.schoolYear, profile.graduationYear ? `Class of ${profile.graduationYear}` : null]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No education details added yet.</p>
                )}
              </div>

              <div className="py-6 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Work Experience</h2>
                {loadingProfile ? (
                  <div className="space-y-2 animate-pulse">{[1,2].map(i => <div key={i} className="h-4 bg-gray-100 rounded" />)}</div>
                ) : experiences.length === 0 ? (
                  <p className="text-sm text-gray-500">No experience added yet.</p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {experiences.map((exp) => (
                      <div key={exp.id} className="py-4 first:pt-0 last:pb-0 flex gap-4">
                        <EntityLogo name={exp.company} preferEdu={false} size={12} rounded="rounded-xl" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 leading-snug">{exp.jobTitle}</p>
                          <p className="text-sm text-gray-600 mt-0.5">
                            {exp.company}
                            {exp.employmentType && <span className="text-gray-400"> · {exp.employmentType}</span>}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {exp.startMonth} {exp.startYear}
                            {exp.currentlyWorking
                              ? " - Present"
                              : exp.endMonth && exp.endYear
                                ? ` - ${exp.endMonth} ${exp.endYear}`
                                : ""}
                            {exp.location && ` · ${exp.location}`}
                          </p>
                          {exp.description && <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{exp.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Posts tab */}
          {activeTab === "posts" && (
            <div>
              {loadingPosts && (
                <div className="divide-y-2 divide-gray-300 animate-pulse">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} className="flex items-start gap-4 px-6 py-5 bg-gray-50">
                      <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
                      <div className="flex-1 space-y-2 pt-1">
                        <div className="h-4 bg-gray-200 rounded w-1/3" />
                        <div className="h-3 bg-gray-200 rounded w-full" />
                        <div className="h-3 bg-gray-200 rounded w-4/5" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {!loadingPosts && posts.length === 0 && (
                <div className="py-16 flex flex-col items-center gap-3 text-center">
                  <img src="/assets/empty/leaves.svg" alt="" className="w-56 h-56" />
                  <div>
                    <p className="text-sm font-semibold text-gray-500">No posts yet</p>
                    <p className="text-xs text-gray-400 mt-1">This member hasn't posted anything.</p>
                  </div>
                </div>
              )}
              {!loadingPosts &&
                posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onAppreciate={onAppreciate}
                    appreciating={appreciating.has(post.id)}
                    showAuthor={false}
                  />
                ))}
            </div>
          )}

          {/* Threads tab */}
          {activeTab === "threads" && (
            <div>
              {loadingThreads && (
                <div className="divide-y-2 divide-gray-300 animate-pulse">
                  {Array.from({ length: 2 }).map((_, idx) => (
                    <div key={idx} className="flex items-start gap-4 px-6 py-5 bg-gray-50">
                      <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
                      <div className="flex-1 space-y-2 pt-1">
                        <div className="h-4 bg-gray-200 rounded w-1/3" />
                        <div className="h-3 bg-gray-200 rounded w-full" />
                        <div className="h-3 bg-gray-200 rounded w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {!loadingThreads && profileThreads.length === 0 && (
                <div className="py-16 flex flex-col items-center gap-3 text-center">
                  <img src="/assets/empty/fall_leaves.svg" alt="" className="w-56 h-56" />
                  <div>
                    <p className="text-sm font-semibold text-gray-500">No answered threads yet.</p>
                    <p className="text-xs text-gray-400 mt-1">Answered questions will appear here.</p>
                  </div>
                </div>
              )}
              {!loadingThreads &&
                profileThreads.map((t) => (
                  <ThreadCard key={t.id} thread={t} />
                ))}
            </div>
          )}

        </main>
      </div>

      {/* Ask a Direct Question modal */}
      {askOpen && profile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => { setAskOpen(false); setQuestionDraft(""); setQuestionIsPublic(true); setQuestionMessage(null); }}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[#FFCA3A] text-[#001049] font-bold text-base flex items-center justify-center shrink-0 overflow-hidden">
                  {user?.profilePic
                    ? <img src={user.profilePic} alt="" className="w-full h-full object-cover" />
                    : `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase()
                  }
                </div>
                <div>
                  <p className="text-base font-semibold text-gray-900">Ask {profile.firstName} a question</p>
                  <p className="text-sm text-gray-400">Your question will appear in their Threads tab</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setAskOpen(false); setQuestionDraft(""); setQuestionIsPublic(true); setQuestionMessage(null); }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Textarea */}
            <textarea
              autoFocus
              value={questionDraft}
              onChange={(e) => setQuestionDraft(e.target.value)}
              placeholder={`What would you like to ask ${profile.firstName}?`}
              maxLength={600}
              rows={6}
              className="w-full px-6 py-5 text-lg text-gray-700 placeholder:text-gray-300 bg-transparent focus:outline-none resize-none"
            />

            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!questionIsPublic}
                  onChange={(e) => setQuestionIsPublic(!e.target.checked)}
                  className="rounded border-gray-300 accent-[#001049]"
                />
                <span className="text-sm text-gray-500">Keep private</span>
              </label>
              <div className="flex items-center gap-3">
                {questionMessage && (
                  <span className={`text-sm ${questionMessage.ok ? "text-green-600" : "text-red-500"}`}>
                    {questionMessage.text}
                  </span>
                )}
                <button
                  type="button"
                  disabled={submittingQuestion || questionDraft.trim().length === 0}
                  onClick={submitQuestion}
                  className="px-6 py-2.5 rounded-lg text-base font-semibold bg-[#001049] text-white disabled:opacity-40 hover:opacity-90 transition"
                >
                  {submittingQuestion ? "Sending…" : "Ask"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
