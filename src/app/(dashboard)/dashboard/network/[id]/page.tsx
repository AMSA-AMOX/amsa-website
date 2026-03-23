"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getKnownSchoolDomain, getLookupNameVariants } from "@/lib/logo-lookup";

const VERIFICATION_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSd7SUihiYdumMKDuHoDngMhFuid04Qecakd4b8-pf6uUt8hvA/formResponse";

type NetworkProfile = {
  id: number;
  firstName: string;
  lastName: string;
  profilePic: string | null;
  bio: string | null;
  schoolName: string | null;
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
};

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

const LOGO_DEV_TOKEN = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN?.trim();
const LOGO_DOMAIN_CACHE = new Map<string, string | null>();
const LOGO_DOMAIN_PENDING = new Map<string, Promise<string | null>>();

const normalizeLookupName = (value: string) => value.trim().toLowerCase();

const fetchDomainFromClearbit = async (name: string, preferEdu: boolean): Promise<string | null> => {
  const known = getKnownSchoolDomain(name);
  if (preferEdu && known) return known;

  const variants = getLookupNameVariants(name);
  for (const variant of variants) {
    try {
      const query = encodeURIComponent(variant);
      const res = await fetch(`https://autocomplete.clearbit.com/v1/companies/suggest?query=${query}`);
      if (!res.ok) continue;
      const results = (await res.json()) as Array<{ domain?: string }>;
      if (!Array.isArray(results) || results.length === 0) continue;

      if (preferEdu) {
        const eduMatch = results.find((r) => r.domain?.toLowerCase().endsWith(".edu"));
        if (eduMatch?.domain) return eduMatch.domain;
      }

      const anyMatch = results.find((r) => !!r.domain)?.domain;
      if (anyMatch) return anyMatch;
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

const useLogoDomain = (name: string | null | undefined, preferEdu: boolean) => {
  const [domain, setDomain] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
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
  }, [name, preferEdu]);

  return domain;
};

function EntityLogo({
  name,
  preferEdu,
  size = 10,
  rounded = "rounded-lg",
}: {
  name: string | null | undefined;
  preferEdu: boolean;
  size?: number;
  rounded?: string;
}) {
  const [err, setErr] = useState(false);
  const domain = useLogoDomain(name, preferEdu);
  const initial = name?.trim()[0]?.toUpperCase() ?? (preferEdu ? "U" : "?");
  const boxSize = { width: `${size * 4}px`, height: `${size * 4}px` };

  useEffect(() => {
    setErr(false);
  }, [domain, name]);

  if (!domain || err) {
    return (
      <div
        style={boxSize}
        className={`${rounded} bg-[#001049]/10 flex items-center justify-center text-[#001049] font-bold text-sm shrink-0`}
      >
        {initial}
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
  const isApproved = user?.acceptanceStatus?.toLowerCase() === "approved";
  const params = useParams<{ id: string }>();
  const memberId = Number(params.id);

  const [profile, setProfile] = useState<NetworkProfile | null>(null);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [nextProfiles, setNextProfiles] = useState<NextProfile[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState("");
  const [followInFlight, setFollowInFlight] = useState(false);

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

  if (!user) return null;

  if (!isApproved) {
    return (
      <div className="py-10 px-4 md:px-8 max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <h1 className="text-xl font-bold text-[#001049]">Network is available after verification</h1>
          <p className="text-sm text-gray-500 mt-2">
            Complete the verification form first to view member network profiles.
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
    <div className="min-h-screen bg-gray-50 py-4 px-3 md:px-5">
      <div className="max-w-[1500px] mx-auto">
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

        {loadingProfile && (
          <div className="flex gap-4 items-start">
            <div className="w-80 hidden lg:block bg-white rounded-2xl shadow-sm h-80 animate-pulse" />
            <div className="flex-1 bg-white rounded-2xl shadow-sm h-96 animate-pulse" />
            <div className="w-72 hidden xl:block bg-white rounded-2xl shadow-sm h-96 animate-pulse" />
          </div>
        )}

        {!loadingProfile && error && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <p className="text-base font-semibold text-[#001049]">{error}</p>
          </div>
        )}

        {!loadingProfile && !error && profile && (
          <div className="flex gap-4 items-start">
            <aside className="w-80 shrink-0 space-y-4 sticky top-4 self-start hidden lg:block">
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="flex flex-col items-center pt-8 pb-5 px-5 border-b border-gray-100">
                  <div className="w-24 h-24 rounded-full bg-[#FFCA3A] flex items-center justify-center text-[#001049] text-3xl font-bold shrink-0 overflow-hidden ring-4 ring-white shadow-md">
                    {profile.profilePic ? (
                      <img src={profile.profilePic} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      `${profile.firstName?.[0] ?? ""}${profile.lastName?.[0] ?? ""}`.toUpperCase()
                    )}
                  </div>
                  <h1 className="mt-3 text-xl font-bold text-gray-900 text-center leading-tight">{displayName}</h1>
                  <div className="flex items-center gap-3 mt-2 text-sm">
                    <span className="text-gray-500">
                      <span className="font-semibold text-gray-900">{profile.followersCount}</span> followers
                    </span>
                    <span className="text-gray-300">·</span>
                    <span className="text-gray-500">
                      <span className="font-semibold text-gray-900">{profile.followingCount}</span> following
                    </span>
                  </div>
                  {profile.id !== user.id && (
                    <button
                      type="button"
                      onClick={toggleFollow}
                      disabled={followInFlight}
                      className={`mt-3 px-4 py-2 rounded-xl text-sm font-semibold border transition disabled:opacity-60 ${
                        profile.isFollowing
                          ? "border-gray-200 text-gray-600 hover:border-red-200 hover:text-red-500 hover:bg-red-50"
                          : "border-[#001049] text-[#001049] hover:bg-[#001049]/5"
                      }`}
                    >
                      {profile.isFollowing ? "Following" : "Follow"}
                    </button>
                  )}
                </div>

                <div className="px-5 py-4 space-y-3">
                  {profile.schoolName && (
                    <div className="flex items-center gap-2.5">
                      <EntityLogo name={profile.schoolName} preferEdu={true} size={11} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{profile.schoolName}</p>
                        <p className="text-xs text-gray-500">
                          {[profile.degreeLevel, profile.major].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                    </div>
                  )}
                  {profile.schoolYear || profile.graduationYear ? (
                    <p className="text-xs text-gray-400">
                      {[profile.schoolYear, profile.graduationYear ? `Class of ${profile.graduationYear}` : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  ) : null}
                </div>

                {(profile.linkedin || profile.x || profile.instagram || profile.facebook) && (
                  <div className="px-5 py-4 border-t border-gray-100 space-y-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Links</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.linkedin && (
                        <a href={profile.linkedin} target="_blank" rel="noreferrer" className="px-3 py-1 rounded-full border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 transition">LinkedIn</a>
                      )}
                      {profile.x && (
                        <a href={profile.x} target="_blank" rel="noreferrer" className="px-3 py-1 rounded-full border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 transition">X</a>
                      )}
                      {profile.instagram && (
                        <a href={profile.instagram} target="_blank" rel="noreferrer" className="px-3 py-1 rounded-full border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 transition">Instagram</a>
                      )}
                      {profile.facebook && (
                        <a href={profile.facebook} target="_blank" rel="noreferrer" className="px-3 py-1 rounded-full border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 transition">Facebook</a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </aside>

            <main className="flex-1 min-w-0 space-y-3">
              <div className="lg:hidden bg-white rounded-2xl shadow-sm p-5">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#FFCA3A] flex items-center justify-center text-[#001049] text-xl font-bold shrink-0 overflow-hidden">
                    {profile.profilePic ? <img src={profile.profilePic} alt={displayName} className="w-full h-full object-cover" /> : `${profile.firstName?.[0] ?? ""}${profile.lastName?.[0] ?? ""}`.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-lg font-bold text-gray-900">{displayName}</h1>
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
                        className={`mt-2 px-3 py-1.5 rounded-lg border text-sm font-medium ${
                          profile.isFollowing ? "border-gray-200 text-gray-600" : "border-[#001049] text-[#001049]"
                        }`}
                      >
                        {profile.isFollowing ? "Following" : "Follow"}
                      </button>
                    )}
                  </div>
                </div>

                {(profile.linkedin || profile.x || profile.instagram || profile.facebook) && (
                  <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
                    {profile.linkedin && (
                      <a href={profile.linkedin} target="_blank" rel="noreferrer" className="px-3 py-1 rounded-full border border-gray-200 text-xs text-gray-700">LinkedIn</a>
                    )}
                    {profile.x && (
                      <a href={profile.x} target="_blank" rel="noreferrer" className="px-3 py-1 rounded-full border border-gray-200 text-xs text-gray-700">X</a>
                    )}
                    {profile.instagram && (
                      <a href={profile.instagram} target="_blank" rel="noreferrer" className="px-3 py-1 rounded-full border border-gray-200 text-xs text-gray-700">Instagram</a>
                    )}
                    {profile.facebook && (
                      <a href={profile.facebook} target="_blank" rel="noreferrer" className="px-3 py-1 rounded-full border border-gray-200 text-xs text-gray-700">Facebook</a>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900">About</h2>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mt-3">
                  {profile.bio || "No bio added yet."}
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900">Education</h2>
                <div className="mt-4">
                  {profile.schoolName ? (
                    <div className="flex gap-4">
                      <EntityLogo name={profile.schoolName} preferEdu={true} size={12} />
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
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900">Work Experience</h2>
                <div className="mt-4">
                  {experiences.length === 0 ? (
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

            </main>

            <aside className="w-80 shrink-0 space-y-4 sticky top-4 self-start hidden xl:block">
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <h3 className="text-base font-bold text-gray-900 mb-1">Next Profiles</h3>
                <p className="text-sm text-gray-400 mb-4">Suggested based on your strongest network overlap.</p>
                {nextProfiles.length === 0 ? (
                  <p className="text-xs text-gray-400">No suggested profiles yet.</p>
                ) : (
                  <div className="space-y-3.5">
                    {nextProfiles.map((nextProfile) => {
                      const initials = `${nextProfile.firstName?.[0] ?? ""}${nextProfile.lastName?.[0] ?? ""}`.toUpperCase();
                      return (
                        <Link
                          key={nextProfile.id}
                          href={`/dashboard/network/${nextProfile.id}`}
                          className="block rounded-2xl border border-gray-100 p-3.5 hover:border-[#001049]/20 hover:bg-gray-50 transition"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-full bg-[#001049]/10 flex items-center justify-center text-[#001049] text-sm font-bold shrink-0 overflow-hidden">
                              {nextProfile.profilePic
                                ? <img src={nextProfile.profilePic} alt={`${nextProfile.firstName} ${nextProfile.lastName}`} className="w-full h-full object-cover" />
                                : initials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-base font-semibold text-gray-900 leading-tight">
                                {nextProfile.firstName} {nextProfile.lastName}
                              </p>
                              <div className="mt-1.5 flex items-center gap-2 min-w-0">
                                <EntityLogo name={nextProfile.schoolName} preferEdu={true} size={7} rounded="rounded-md" />
                                <p className="text-sm text-gray-500 truncate">
                                  {nextProfile.schoolName || "No school listed"}
                                  {nextProfile.graduationYear ? ` · ${nextProfile.graduationYear}` : ""}
                                </p>
                              </div>
                              <div className="mt-2 flex items-center gap-2 flex-wrap">
                                {nextProfile.mutualCount > 0 && (
                                  <span className="text-xs px-2.5 py-1 rounded-full bg-[#001049]/8 text-[#001049] font-medium">
                                    {nextProfile.mutualCount} mutual connection{nextProfile.mutualCount === 1 ? "" : "s"}
                                  </span>
                                )}
                                {nextProfile.sameSchool && (
                                  <span className="text-xs px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700 font-medium">same school</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
