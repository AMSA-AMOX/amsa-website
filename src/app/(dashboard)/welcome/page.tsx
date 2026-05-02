"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { extractSchoolEmailDomain, getKnownSchoolDomain, getLookupNameVariants } from "@/lib/logo-lookup";
import PostCard from "@/components/posts/PostCard";
import type { PostItem } from "@/components/posts/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type FullProfile = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  acceptanceStatus: string;
  profilePic: string | null;
  level: string | null;
  headline: string | null;
  bio: string | null;
  createdAt: string;
  schoolName: string | null;
  schoolEmail: string | null;
  major: string | null;
  degreeLevel: string | null;
  graduationYear: string | null;
  schoolYear: string | null;
  x: string | null;
  facebook: string | null;
  instagram: string | null;
  linkedin: string | null;
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

type ExpForm = {
  jobTitle: string; company: string; employmentType: string;
  startMonth: string; startYear: string; endMonth: string; endYear: string;
  currentlyWorking: boolean; location: string; description: string;
};

type Education = {
  id: number;
  userId: number;
  schoolName: string;
  degreeLevel: string | null;
  major: string | null;
  schoolYear: string | null;
  graduationYear: string | null;
  currentlyEnrolled: boolean;
};

type EduForm = {
  schoolName: string; degreeLevel: string; major: string;
  schoolYear: string; graduationYear: string; currentlyEnrolled: boolean;
};

const EMPTY_EDU: EduForm = {
  schoolName: "", degreeLevel: "", major: "", schoolYear: "", graduationYear: "", currentlyEnrolled: false,
};

type EditForm = {
  firstName: string; lastName: string; headline: string; bio: string; profilePic: string;
  schoolName: string; schoolEmail: string; degreeLevel: string; major: string;
  schoolYear: string; graduationYear: string;
  x: string; facebook: string; instagram: string; linkedin: string;
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

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY_EXP: ExpForm = {
  jobTitle: "", company: "", employmentType: "", startMonth: "", startYear: "",
  endMonth: "", endYear: "", currentlyWorking: false, location: "", description: "",
};

const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Internship", "Apprenticeship", "Contract", "Freelance", "Volunteer"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const YEARS = Array.from({ length: new Date().getFullYear() - 1989 }, (_, i) => String(new Date().getFullYear() - i));

const DEGREE_LEVELS = ["Associate's","Bachelor's","Master's","PhD / Doctorate","Professional (MD / JD / MBA)","Certificate"];
const SCHOOL_YEARS = ["Freshman","Sophomore","Junior","Senior","Graduate Student","Alumni"];
const LOGO_DEV_TOKEN = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN?.trim();


const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  board_member: "Board Member",
  us_member: "US Member",
  member: "Member",
};

const parseMajors = (value: string | null | undefined): string[] =>
  (value ?? "")
    .split(/\s*(?:\/|,|\|)\s*/g)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 3);

const serializeMajors = (majors: string[]): string =>
  majors
    .map((major) => major.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(" / ");

// ─── Small components ─────────────────────────────────────────────────────────

const inputCls = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001049]/20 focus:border-[#001049] bg-white transition";
const selectCls = `${inputCls} appearance-none`;

const Field = ({ label, name, value, onChange, type = "text", placeholder }: {
  label: string; name: keyof EditForm; value: string;
  onChange: (n: keyof EditForm, v: string) => void; type?: string; placeholder?: string;
}) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
    <input type={type} value={value} onChange={(e) => onChange(name, e.target.value)}
      placeholder={placeholder ?? label} className={inputCls} />
  </div>
);

const SelectField = ({ label, name, value, onChange, options, placeholder = "Select…" }: {
  label: string; name: keyof EditForm; value: string;
  onChange: (n: keyof EditForm, v: string) => void; options: string[]; placeholder?: string;
}) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
    <select value={value} onChange={(e) => onChange(name, e.target.value)} className={selectCls}>
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const SectionHeader = ({ title, onAdd }: { title: string; onAdd?: () => void }) => (
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-lg font-bold text-gray-900">{title}</h2>
    {onAdd && (
      <button onClick={onAdd} className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>
    )}
  </div>
);

const LOGO_DOMAIN_CACHE = new Map<string, string | null>();
const LOGO_DOMAIN_PENDING = new Map<string, Promise<string | null>>();

const normalizeLookupName = (value: string) => value.trim().toLowerCase();

const findUniversityDomain = (schoolName: string) => {
  return getKnownSchoolDomain(schoolName);
};

function nameMatchScore(query: string, resultName: string): number {
  const normalize = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  const q = normalize(query);
  const r = normalize(resultName);
  if (q === r) return 1000;
  const qWords = q.split(" ").filter(Boolean);
  const rWords = new Set(r.split(" ").filter(Boolean));
  const matchedWords = qWords.filter((w) => rWords.has(w)).length;
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
      const results = await res.json() as Array<{ name?: string; domain?: string }>;
      if (!Array.isArray(results) || results.length === 0) continue;

      const pool = preferEdu
        ? results.filter((r) => r.domain?.toLowerCase().endsWith(".edu"))
        : results.filter((r) => !!r.domain);

      if (pool.length === 0) continue;

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

const buildLogoUrl = (domain: string) => {
  const base = `https://img.logo.dev/${domain}`;
  if (!LOGO_DEV_TOKEN) return base;
  return `${base}?token=${encodeURIComponent(LOGO_DEV_TOKEN)}`;
};

const resolveLogoDomain = async (
  name: string,
  preferEdu: boolean,
  mappedDomain?: string | null,
): Promise<string | null> => {
  if (mappedDomain) return mappedDomain;
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

const useLogoDomain = (
  name: string | null | undefined,
  preferEdu: boolean,
  mappedDomain?: string | null,
) => {
  const [domain, setDomain] = useState<string | null>(mappedDomain ?? null);

  useEffect(() => {
    let cancelled = false;

    if (!name?.trim()) {
      setDomain(null);
      return;
    }

    if (mappedDomain) {
      setDomain(mappedDomain);
      return;
    }

    resolveLogoDomain(name, preferEdu, mappedDomain).then((resolved) => {
      if (!cancelled) setDomain(resolved);
    });

    return () => { cancelled = true; };
  }, [name, preferEdu, mappedDomain]);

  return domain;
};

function UniLogo({ schoolName, schoolEmail, size = 10 }: { schoolName: string | null | undefined; schoolEmail?: string | null; size?: number }) {
  const [err, setErr] = useState(false);
  const emailDomain = extractSchoolEmailDomain(schoolEmail);
  const mappedDomain = emailDomain ?? (schoolName ? findUniversityDomain(schoolName) : null);
  const domain = useLogoDomain(schoolName, true, mappedDomain);
  const boxSize = { width: `${size * 4}px`, height: `${size * 4}px` };
  const iconSize = `${Math.max(10, size * 2)}px`;

  useEffect(() => {
    setErr(false);
  }, [domain, schoolName]);

  if (!domain || err) {
    return (
      <div
        style={boxSize}
        className="rounded-lg bg-[#001049]/10 flex items-center justify-center text-[#001049] shrink-0"
      >
        <svg style={{ width: iconSize, height: iconSize }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 3.741-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
        </svg>
      </div>
    );
  }
  return (
    <img
      src={buildLogoUrl(domain)}
      alt={schoolName ?? ""}
      onError={() => setErr(true)}
      style={boxSize}
      className="rounded-lg object-contain shrink-0 bg-white border border-gray-100"
    />
  );
}

function CompanyLogo({ company, size = 12 }: { company: string; size?: number }) {
  const [err, setErr] = useState(false);
  const domain = useLogoDomain(company, false);
  const boxSize = { width: `${size * 4}px`, height: `${size * 4}px` };
  const iconSize = `${Math.max(10, size * 2)}px`;

  useEffect(() => {
    setErr(false);
  }, [domain, company]);

  if (!domain || err) {
    return (
      <div
        style={boxSize}
        className="rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 shrink-0"
      >
        <svg style={{ width: iconSize, height: iconSize }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={buildLogoUrl(domain)}
      alt={company}
      onError={() => setErr(true)}
      style={boxSize}
      className="rounded-xl object-contain shrink-0 bg-white border border-gray-100"
    />
  );
}

// ─── Thread sub-components ────────────────────────────────────────────────────

function AnsweredThreadActions({
  thread,
  onToggleAnon,
  onDelete,
  toggling,
  deleting,
}: {
  thread: ThreadItem;
  onToggleAnon: () => void;
  onDelete: () => void;
  toggling: boolean;
  deleting: boolean;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  return (
    <div className="flex items-center gap-3 px-5 py-3 border-t border-gray-100 bg-white">
      <button
        type="button"
        onClick={onToggleAnon}
        disabled={toggling || deleting}
        className="text-xs font-medium text-gray-500 hover:text-[#001049] disabled:opacity-50 transition"
      >
        {toggling ? "Updating…" : thread.isAnonymous ? "Make public" : "Go anonymous"}
      </button>
      <div className="flex-1" />
      {confirmDelete ? (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Delete?</span>
          <button
            type="button"
            onClick={() => { setConfirmDelete(false); onDelete(); }}
            disabled={deleting}
            className="text-xs font-semibold text-red-500 hover:text-red-700 disabled:opacity-50 transition"
          >
            {deleting ? "Deleting…" : "Yes"}
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(false)}
            className="text-xs text-gray-400 hover:text-gray-600 transition"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          disabled={deleting || toggling}
          className="text-xs font-medium text-red-400 hover:text-red-600 disabled:opacity-50 transition"
        >
          Delete
        </button>
      )}
    </div>
  );
}

function UnansweredCard({
  thread,
  askerInitials,
  askerName,
  timeText,
  answerDraft,
  isAnonDraft,
  onDraftChange,
  onAnonDraftChange,
  onSubmit,
  onDelete,
  submitting,
  deleting,
}: {
  thread: ThreadItem;
  askerInitials: string;
  askerName: string;
  timeText: string;
  answerDraft: string;
  isAnonDraft: boolean;
  onDraftChange: (val: string) => void;
  onAnonDraftChange: (val: boolean) => void;
  onSubmit: () => void;
  onDelete: () => void;
  submitting: boolean;
  deleting: boolean;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  return (
    <article className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100">
        <div className="w-9 h-9 rounded-full bg-[#FFCA3A] flex items-center justify-center text-[#001049] text-sm font-bold shrink-0 overflow-hidden">
          {thread.asker?.profilePic
            ? <img src={thread.asker.profilePic} alt={askerName} className="w-full h-full object-cover" />
            : askerInitials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{askerName}</p>
          <p className="text-xs text-gray-400">{timeText}</p>
        </div>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-600">Unanswered</span>
      </div>
      <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Q</p>
        <p className="text-sm text-gray-800 leading-relaxed">{thread.question}</p>
      </div>
      <div className="px-5 py-4 bg-white border-b border-gray-100 space-y-2">
        <textarea
          value={answerDraft}
          onChange={(e) => onDraftChange(e.target.value)}
          placeholder="Write your answer… (max 2000 chars)"
          maxLength={2000}
          rows={3}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#001049]/20 text-gray-800"
        />
        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isAnonDraft}
              onChange={(e) => onAnonDraftChange(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-[#001049] focus:ring-[#001049]/20"
            />
            <span className="text-xs text-gray-500">Post anonymously</span>
          </label>
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting || answerDraft.trim().length === 0}
            className="px-4 py-1.5 rounded-xl text-sm font-semibold bg-[#001049] text-white disabled:opacity-50 hover:opacity-90 transition"
          >
            {submitting ? "Saving…" : "Submit answer"}
          </button>
        </div>
        {isAnonDraft && (
          <p className="text-xs text-gray-400">Your name won't appear on your profile or the public feed.</p>
        )}
      </div>
      <div className="flex items-center justify-end gap-2 px-5 py-3 bg-white">
        {confirmDelete ? (
          <>
            <span className="text-xs text-gray-500">Delete this thread?</span>
            <button
              type="button"
              onClick={() => { setConfirmDelete(false); onDelete(); }}
              disabled={deleting}
              className="text-xs font-semibold text-red-500 hover:text-red-700 disabled:opacity-50 transition"
            >
              {deleting ? "Deleting…" : "Yes, delete"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="text-xs text-gray-400 hover:text-gray-600 transition"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            disabled={deleting}
            className="text-xs font-medium text-red-400 hover:text-red-600 disabled:opacity-50 transition"
          >
            Delete
          </button>
        )}
      </div>
    </article>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, authFetch, updateUser, loading } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<EditForm>({
    firstName: "", lastName: "", headline: "", bio: "", profilePic: "",
    schoolName: "", schoolEmail: "", degreeLevel: "", major: "", schoolYear: "", graduationYear: "",
    x: "", facebook: "", instagram: "", linkedin: "",
  });
  const [majorFieldCount, setMajorFieldCount] = useState(1);
  const [majorValues, setMajorValues] = useState<string[]>([""]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [schoolSuggestionsOpen, setSchoolSuggestionsOpen] = useState(false);
  const [schoolSuggestions, setSchoolSuggestions] = useState<Array<{ id: number; name: string; domain: string | null }>>([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarRemoved, setAvatarRemoved] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [expModal, setExpModal] = useState<{ open: boolean; editing: Experience | null }>({ open: false, editing: null });
  const [expForm, setExpForm] = useState<ExpForm>(EMPTY_EXP);
  const [educations, setEducations] = useState<Education[]>([]);
  const [eduModal, setEduModal] = useState<{ open: boolean; editing: Education | null }>({ open: false, editing: null });
  const [eduForm, setEduForm] = useState<EduForm>(EMPTY_EDU);
  const [eduSaving, setEduSaving] = useState(false);
  const [eduError, setEduError] = useState("");
  const [expSaving, setExpSaving] = useState(false);
  const [expError, setExpError] = useState("");
  const [expDeleting, setExpDeleting] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "posts" | "threads">("profile");
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [postsLoaded, setPostsLoaded] = useState(false);
  const [appreciating, setAppreciating] = useState<Set<number>>(new Set());
  const [deletingPost, setDeletingPost] = useState<Set<number>>(new Set());
  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [threadsLoaded, setThreadsLoaded] = useState(false);
  const [pendingThreads, setPendingThreads] = useState<ThreadItem[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingLoaded, setPendingLoaded] = useState(false);
  const [threadsView, setThreadsView] = useState<"answered" | "unanswered">("answered");
  const [answerDraft, setAnswerDraft] = useState<Record<number, string>>({});
  const [anonDraft, setAnonDraft] = useState<Record<number, boolean>>({});
  const [submittingAnswer, setSubmittingAnswer] = useState<Set<number>>(new Set());
  const [togglingAnon, setTogglingAnon] = useState<Set<number>>(new Set());
  const [deletingThread, setDeletingThread] = useState<Set<number>>(new Set());
  const [threadErrors, setThreadErrors] = useState<Record<number, string>>({});

  const loadOwnPosts = useCallback(async () => {
    if (postsLoaded || loadingPosts) return;
    setLoadingPosts(true);
    try {
      const data = await authFetch(`/api/posts?includeModeration=true&limit=40&creatorId=${user!.id}`);
      setPosts((data.posts ?? []) as PostItem[]);
      setPostsLoaded(true);
    } catch {
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  }, [authFetch, postsLoaded, loadingPosts]);

  const loadOwnThreads = useCallback(async () => {
    if (threadsLoaded || loadingThreads) return;
    setLoadingThreads(true);
    try {
      const data = await authFetch(`/api/threads/profile/${user!.id}`);
      setThreads((data.threads ?? []) as ThreadItem[]);
      setThreadsLoaded(true);
    } catch {
      setThreads([]);
    } finally {
      setLoadingThreads(false);
    }
  }, [authFetch, user, threadsLoaded, loadingThreads]);

  const loadPendingThreads = useCallback(async () => {
    if (pendingLoaded || pendingLoading) return;
    setPendingLoading(true);
    try {
      const data = await authFetch("/api/threads?view=inbox");
      setPendingThreads(((data.threads ?? []) as ThreadItem[]).filter((t) => t.status === "pending"));
      setPendingLoaded(true);
    } catch {
      setPendingThreads([]);
    } finally {
      setPendingLoading(false);
    }
  }, [authFetch, pendingLoaded, pendingLoading]);

  const handleThreadsViewChange = (view: "answered" | "unanswered") => {
    setThreadsView(view);
    if (view === "unanswered" && !pendingLoaded) loadPendingThreads();
    if (view === "answered" && !threadsLoaded) loadOwnThreads();
  };

  const handleAnswer = async (threadId: number) => {
    const answer = (answerDraft[threadId] ?? "").trim();
    if (!answer || submittingAnswer.has(threadId)) return;
    setSubmittingAnswer((p) => new Set(p).add(threadId));
    setThreadErrors((p) => ({ ...p, [threadId]: "" }));
    try {
      const isAnonymous = anonDraft[threadId] ?? false;
      const data = await authFetch(`/api/threads/${threadId}`, {
        method: "PATCH",
        body: JSON.stringify({ answer, isAnonymous }),
      });
      setPendingThreads((p) => p.filter((t) => t.id !== threadId));
      setThreads((p) => [data.thread as ThreadItem, ...p]);
      setAnswerDraft((p) => { const n = { ...p }; delete n[threadId]; return n; });
      setAnonDraft((p) => { const n = { ...p }; delete n[threadId]; return n; });
    } catch (e: any) {
      setThreadErrors((p) => ({ ...p, [threadId]: e?.message ?? "Failed to save answer." }));
    } finally {
      setSubmittingAnswer((p) => { const n = new Set(p); n.delete(threadId); return n; });
    }
  };

  const handleToggleAnon = async (threadId: number) => {
    if (togglingAnon.has(threadId)) return;
    const thread = [...threads, ...pendingThreads].find((t) => t.id === threadId);
    if (!thread) return;
    setTogglingAnon((p) => new Set(p).add(threadId));
    try {
      await authFetch(`/api/threads/${threadId}`, {
        method: "PATCH",
        body: JSON.stringify({ isAnonymous: !thread.isAnonymous }),
      });
      const flip = (list: ThreadItem[]) =>
        list.map((t) => (t.id === threadId ? { ...t, isAnonymous: !t.isAnonymous } : t));
      setThreads(flip);
      setPendingThreads(flip);
    } catch (e: any) {
      setThreadErrors((p) => ({ ...p, [threadId]: e?.message ?? "Failed to update." }));
    } finally {
      setTogglingAnon((p) => { const n = new Set(p); n.delete(threadId); return n; });
    }
  };

  const handleDeleteThread = async (threadId: number) => {
    if (deletingThread.has(threadId)) return;
    setDeletingThread((p) => new Set(p).add(threadId));
    try {
      await authFetch(`/api/threads/${threadId}`, { method: "DELETE" });
      setThreads((p) => p.filter((t) => t.id !== threadId));
      setPendingThreads((p) => p.filter((t) => t.id !== threadId));
    } catch (e: any) {
      setThreadErrors((p) => ({ ...p, [threadId]: e?.message ?? "Failed to delete." }));
    } finally {
      setDeletingThread((p) => { const n = new Set(p); n.delete(threadId); return n; });
    }
  };

  const onDeletePost = useCallback(async (postId: number) => {
    setDeletingPost((prev) => new Set(prev).add(postId));
    try {
      await authFetch(`/api/posts/${postId}`, { method: "DELETE" });
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch {
      // leave post in list on failure
    } finally {
      setDeletingPost((prev) => { const next = new Set(prev); next.delete(postId); return next; });
    }
  }, [authFetch]);

  const onAppreciate = useCallback(async (postId: number) => {
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
  }, [authFetch, appreciating, posts]);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/login"); return; }
    // Auto-open Unanswered threads tab when coming from a notification link
    const params = new URLSearchParams(window.location.search);
    if (params.get("threads") === "unanswered") {
      setActiveTab("threads");
      setThreadsView("unanswered");
      loadPendingThreads();
      loadOwnThreads();
    }
    Promise.all([
      authFetch("/api/auth/me").then((d) => setProfile(d.user)).catch(() => {}),
      authFetch("/api/user/experience").then((d) => setExperiences(d.experiences ?? [])).catch(() => {}),
      authFetch("/api/user/education").then((d) => setEducations(d.educations ?? [])).catch(() => {}),
      authFetch("/api/user/follows").then((d) => {
        setFollowersCount(d.followersCount ?? 0);
        setFollowingCount(d.followingCount ?? 0);
      }).catch(() => {}),
    ]).finally(() => setLoadingProfile(false));
  }, [user, loading]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) setShareOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const openEdit = () => {
    if (!profile) return;
    const majors = parseMajors(profile.major);
    setForm({
      firstName: profile.firstName ?? "", lastName: profile.lastName ?? "",
      headline: profile.headline ?? "", bio: profile.bio ?? "", profilePic: profile.profilePic ?? "",
      schoolName: profile.schoolName ?? "", schoolEmail: profile.schoolEmail ?? "",
      degreeLevel: profile.degreeLevel ?? "",
      major: serializeMajors(majors), schoolYear: profile.schoolYear ?? "",
      graduationYear: profile.graduationYear ?? "",
      x: profile.x ?? "", facebook: profile.facebook ?? "", instagram: profile.instagram ?? "", linkedin: profile.linkedin ?? "",
    });
    const count = Math.max(1, majors.length || 1);
    setMajorFieldCount(count);
    setMajorValues(Array.from({ length: count }, (_, i) => majors[i] ?? ""));
    setSaveError(""); setAvatarFile(null); setAvatarPreview(null);
    setAvatarRemoved(false); setAvatarError(""); setSchoolSuggestionsOpen(false); setEditOpen(true);
  };

  const handleField = (name: keyof EditForm, value: string) => setForm((f) => ({ ...f, [name]: value }));

  const handleMajorChange = (index: number, value: string) => {
    setMajorValues((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const addMajorField = () => {
    setMajorFieldCount((prev) => Math.min(3, prev + 1));
    setMajorValues((prev) => [...prev, ""]);
  };
  const removeMajorField = () => {
    setMajorFieldCount((prev) => {
      const nextCount = Math.max(1, prev - 1);
      setMajorValues((current) => current.slice(0, nextCount));
      return nextCount;
    });
  };

  useEffect(() => {
    const q = form.schoolName.trim();
    if (q.length < 2) { setSchoolSuggestions([]); return; }
    const timer = setTimeout(() => {
      fetch(`/api/colleges/search?q=${encodeURIComponent(q)}`)
        .then((r) => r.ok ? r.json() : { colleges: [] })
        .then((d) => setSchoolSuggestions(d.colleges ?? []))
        .catch(() => {});
    }, 250);
    return () => clearTimeout(timer);
  }, [form.schoolName]);

  const compressImage = (file: File, maxDim = 400, quality = 0.8): Promise<Blob> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas unavailable"));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((b) => b ? resolve(b) : reject(new Error("Compression failed")), "image/jpeg", quality);
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = url;
    });

  const handleAvatarPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setAvatarError("Please select an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { setAvatarError("Image must be under 5 MB."); return; }
    setAvatarError("");
    compressImage(file)
      .then((blob) => {
        setAvatarFile(new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }));
        setAvatarPreview(URL.createObjectURL(blob));
      })
      .catch(() => {
        setAvatarFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
        reader.readAsDataURL(file);
      });
  };

  const getStoragePath = (publicUrl: string) => {
    const marker = "/object/public/avatars/";
    const idx = publicUrl.indexOf(marker);
    return idx !== -1 ? publicUrl.slice(idx + marker.length) : null;
  };

  const deleteOldAvatar = async (oldUrl: string) => {
    const path = getStoragePath(oldUrl);
    if (path) await supabase.storage.from("avatars").remove([path]);
  };

  const handleSave = async () => {
    setSaving(true); setSaveError("");
    try {
      let uploadedUrl = form.profilePic;
      const oldUrl = form.profilePic;
      if (avatarFile && user) {
        const path = `${user.id}-${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage.from("avatars").upload(path, avatarFile, { contentType: avatarFile.type });
        if (uploadError) throw new Error("Photo upload failed: " + uploadError.message);
        uploadedUrl = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
        if (oldUrl) await deleteOldAvatar(oldUrl);
      } else if (avatarRemoved) {
        uploadedUrl = "";
        if (oldUrl) await deleteOldAvatar(oldUrl);
      }
      const data = await authFetch("/api/user/profile", { method: "PATCH", body: JSON.stringify({ ...form, major: serializeMajors(majorValues), profilePic: uploadedUrl }) });
      setProfile(data.user);
      updateUser({ firstName: data.user.firstName, lastName: data.user.lastName, bio: data.user.bio, profilePic: data.user.profilePic });
      setEditOpen(false);
    } catch (e: any) {
      setSaveError(e?.message ?? "Failed to save. Please try again.");
    } finally { setSaving(false); }
  };

  const openAddExp = () => { setExpForm(EMPTY_EXP); setExpError(""); setExpModal({ open: true, editing: null }); };
  const openEditExp = (exp: Experience) => {
    setExpForm({
      jobTitle: exp.jobTitle, company: exp.company, employmentType: exp.employmentType ?? "",
      startMonth: exp.startMonth, startYear: exp.startYear,
      endMonth: exp.endMonth ?? "", endYear: exp.endYear ?? "",
      currentlyWorking: exp.currentlyWorking, location: exp.location ?? "", description: exp.description ?? "",
    });
    setExpError(""); setExpModal({ open: true, editing: exp });
  };

  const handleExpSave = async () => {
    if (!expForm.jobTitle.trim() || !expForm.company.trim() || !expForm.startMonth || !expForm.startYear) {
      setExpError("Job title, company, start month, and start year are required."); return;
    }
    setExpSaving(true); setExpError("");
    try {
      if (expModal.editing) {
        const data = await authFetch(`/api/user/experience/${expModal.editing.id}`, { method: "PATCH", body: JSON.stringify(expForm) });
        setExperiences((prev) => prev.map((e) => e.id === expModal.editing!.id ? data.experience : e));
      } else {
        const data = await authFetch("/api/user/experience", { method: "POST", body: JSON.stringify(expForm) });
        setExperiences((prev) => [data.experience, ...prev]);
      }
      setExpModal({ open: false, editing: null });
    } catch { setExpError("Failed to save. Please try again."); }
    finally { setExpSaving(false); }
  };

  const handleExpDelete = async (id: number) => {
    setExpDeleting(id);
    try {
      await authFetch(`/api/user/experience/${id}`, { method: "DELETE" });
      setExperiences((prev) => prev.filter((e) => e.id !== id));
    } catch { } finally { setExpDeleting(null); }
  };

  const openAddEdu = () => { setEduForm(EMPTY_EDU); setEduError(""); setEduModal({ open: true, editing: null }); };
  const openEditEdu = (edu: Education) => {
    setEduForm({
      schoolName: edu.schoolName, degreeLevel: edu.degreeLevel ?? "",
      major: edu.major ?? "", schoolYear: edu.schoolYear ?? "",
      graduationYear: edu.graduationYear ?? "", currentlyEnrolled: edu.currentlyEnrolled,
    });
    setEduError(""); setEduModal({ open: true, editing: edu });
  };

  const handleEduSave = async () => {
    if (!eduForm.schoolName.trim()) { setEduError("School name is required."); return; }
    setEduSaving(true); setEduError("");
    try {
      if (eduModal.editing) {
        const data = await authFetch(`/api/user/education/${eduModal.editing.id}`, { method: "PATCH", body: JSON.stringify(eduForm) });
        setEducations((prev) => prev.map((e) => e.id === eduModal.editing!.id ? data.education : e));
      } else {
        const data = await authFetch("/api/user/education", { method: "POST", body: JSON.stringify(eduForm) });
        setEducations((prev) => [data.education, ...prev]);
      }
      setEduModal({ open: false, editing: null });
    } catch { setEduError("Failed to save. Please try again."); }
    finally { setEduSaving(false); }
  };

  const handleEduDelete = async (id: number) => {
    try {
      await authFetch(`/api/user/education/${id}`, { method: "DELETE" });
      setEducations((prev) => prev.filter((e) => e.id !== id));
    } catch { }
  };

  if (!user) return null;

  const displayName = `${user.firstName} ${user.lastName}`;
  const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase();
  const schoolLine = [
    profile?.graduationYear ? `'${profile.graduationYear.slice(-2)}` : null,
    profile?.major,
  ].filter(Boolean).join(" · ");
  const profileHeadline = (profile?.headline ?? "").trim() || [profile?.major, profile?.schoolName ? `@ ${profile.schoolName}` : null]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-4 px-3 md:px-5">
        <div className="max-w-[1500px] mx-auto flex gap-4 items-start">

          {/* ── Left sidebar ─────────────────────────────────────────────── */}
          <aside className="w-80 shrink-0 space-y-4 sticky top-4 self-start hidden lg:block">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {/* Avatar */}
              <div className="flex flex-col items-center pt-8 pb-5 px-5 border-b border-gray-100">
                <div className="w-24 h-24 rounded-full bg-[#FFCA3A] flex items-center justify-center text-[#001049] text-3xl font-bold shrink-0 overflow-hidden ring-4 ring-white shadow-md">
                  {profile?.profilePic
                    ? <img src={profile.profilePic} alt={displayName} className="w-full h-full object-cover" />
                    : initials}
                </div>
                <h1 className="mt-3 text-xl font-bold text-gray-900 text-center leading-tight">{displayName}</h1>

                {/* Followers / Following */}
                <div className="flex items-center gap-3 mt-2 text-sm">
                  <button className="text-gray-500 hover:text-[#001049] transition">
                    <span className="font-semibold text-gray-900">{followersCount}</span> followers
                  </button>
                  <span className="text-gray-300">·</span>
                  <button className="text-gray-500 hover:text-[#001049] transition">
                    <span className="font-semibold text-gray-900">{followingCount}</span> following
                  </button>
                </div>

                {/* LinkedIn-style headline (About stays as separate section) */}
                {profileHeadline && (
                  <p className="mt-2 text-sm text-gray-500 text-center leading-snug">{profileHeadline}</p>
                )}
              </div>

              {/* School + role info */}
              <div className="px-5 py-4 space-y-3 border-b border-gray-100">
                {profile?.schoolName && (
                  <div className="flex items-center gap-2.5">
                    <UniLogo schoolName={profile.schoolName} schoolEmail={profile.schoolEmail} size={11} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{profile.schoolName}</p>
                      {schoolLine && <p className="text-xs text-gray-500">{schoolLine}</p>}
                    </div>
                  </div>
                )}

                {/* Role badge */}
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    user.role === "admin" ? "bg-purple-100 text-purple-700" :
                    user.role === "board_member" ? "bg-[#FFCA3A]/20 text-[#001049]" :
                    user.role === "us_member" ? "bg-blue-100 text-blue-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {ROLE_LABELS[user.role] ?? "Member"}
                  </span>
                  {profile?.level && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">
                      Level {profile.level}
                    </span>
                  )}
                </div>

                {/* Membership status */}
                {user.acceptanceStatus?.toLowerCase() === "approved" && (
                  <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    Member
                  </div>
                )}
                {user.role === "member" && (
                  <div className="text-xs text-blue-700 bg-blue-50 rounded-lg px-3 py-2 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                      Apply to become a US Member
                    </div>
                    <Link
                      href="/verification"
                      className="inline-flex items-center font-semibold underline underline-offset-2 hover:text-blue-800 transition"
                    >
                      Open US Member application
                    </Link>
                  </div>
                )}
              </div>

              {/* Share + Edit */}
              <div className="px-5 py-4 flex gap-2">
                <div ref={shareRef} className="relative flex-1">
                  <button
                    onClick={() => setShareOpen((o) => !o)}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                  >
                    Share
                    <svg xmlns="http://www.w3.org/2000/svg" className={`w-3.5 h-3.5 transition-transform ${shareOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                  {shareOpen && (
                    <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                      <button
                        onClick={() => { navigator.clipboard.writeText(window.location.href); setShareOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition text-left"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                        </svg>
                        Copy profile link
                      </button>
                      {profile?.linkedin && (
                        <a
                          href={`mailto:?subject=Check out my profile&body=${profile.linkedin}`}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                          </svg>
                          Share via email
                        </a>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={openEdit}
                  disabled={loadingProfile}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-40"
                >
                  Edit
                </button>
              </div>

              {/* Links */}
              {(profile?.x || profile?.linkedin || profile?.instagram || profile?.facebook) && (
                <div className="px-5 pb-4 border-t border-gray-100 pt-4 space-y-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Links</p>
                  <div className="space-y-1.5">
                    {profile?.x && (
                      <a href={profile.x} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-gray-600 hover:text-black transition truncate">
                        <svg className="w-4 h-4 text-black shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M18.244 2H21l-6.02 6.86L22 22h-5.55l-4.347-5.727L7.078 22H4.32l6.44-7.338L2 2h5.69l3.93 5.182L18.244 2Zm-.967 18.38h1.527L6.86 3.54H5.22L17.277 20.38Z" />
                        </svg>
                        <span className="truncate">X</span>
                      </a>
                    )}
                    {profile?.linkedin && (
                      <a href={profile.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-700 transition truncate">
                        <svg className="w-4 h-4 text-blue-700 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                        <span className="truncate">LinkedIn</span>
                      </a>
                    )}
                    {profile?.instagram && (
                      <a href={profile.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-gray-600 hover:text-pink-500 transition truncate">
                        <svg className="w-4 h-4 text-pink-500 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                        <span className="truncate">Instagram</span>
                      </a>
                    )}
                    {profile?.facebook && (
                      <a href={profile.facebook} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition truncate">
                        <svg className="w-4 h-4 text-blue-600 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        <span className="truncate">Facebook</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* ── Center content ─────────────────────────────────────────────── */}
          <main className="flex-1 min-w-0 space-y-3">

            {/* Tab nav */}
            <div className="flex justify-center gap-8 border-b border-gray-200">
              {(["profile", "posts", "threads"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab);
                    if (tab === "posts" && !postsLoaded) loadOwnPosts();
                    if (tab === "threads" && !threadsLoaded) loadOwnThreads();
                  }}
                  className={`py-3.5 text-base font-semibold border-b-2 transition-colors -mb-px ${
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
            <div className="lg:hidden bg-white rounded-2xl shadow-sm p-5">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-[#FFCA3A] flex items-center justify-center text-[#001049] text-xl font-bold shrink-0 overflow-hidden">
                  {profile?.profilePic ? <img src={profile.profilePic} alt={displayName} className="w-full h-full object-cover" /> : initials}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg font-bold text-gray-900">{displayName}</h1>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                    <span><strong className="text-gray-900">{followersCount}</strong> followers</span>
                    <span>·</span>
                    <span><strong className="text-gray-900">{followingCount}</strong> following</span>
                  </div>
                  {profileHeadline && <p className="text-sm text-gray-500 mt-1">{profileHeadline}</p>}
                </div>
                <button onClick={openEdit} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">Edit</button>
              </div>
            </div>

            {activeTab === "posts" && (
              <div className="space-y-3">
                {loadingPosts &&
                  Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} className="bg-white rounded-2xl shadow-sm p-5 space-y-3 animate-pulse border border-gray-100">
                      <div className="h-5 bg-gray-100 rounded w-3/4" />
                      <div className="h-4 bg-gray-100 rounded w-full" />
                      <div className="h-4 bg-gray-100 rounded w-4/5" />
                    </div>
                  ))}
                {!loadingPosts && posts.length === 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                    <p className="text-sm font-semibold text-[#001049]">No posts yet</p>
                    <p className="text-xs text-gray-400 mt-1">Posts you create will appear here.</p>
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
                      onDelete={onDeletePost}
                      deleting={deletingPost.has(post.id)}
                    />
                  ))}
              </div>
            )}

            {activeTab === "threads" && (
              <div className="space-y-3">
                {/* Sub-tabs */}
                <div className="flex gap-1 bg-white border border-gray-100 rounded-2xl p-1 w-fit shadow-sm">
                  <button
                    type="button"
                    onClick={() => handleThreadsViewChange("answered")}
                    className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition ${
                      threadsView === "answered" ? "bg-[#001049] text-white shadow-sm" : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    Answered
                  </button>
                  <button
                    type="button"
                    onClick={() => handleThreadsViewChange("unanswered")}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-sm font-semibold transition ${
                      threadsView === "unanswered" ? "bg-[#001049] text-white shadow-sm" : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    Unanswered
                    {pendingThreads.length > 0 && (
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                        threadsView === "unanswered" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-600"
                      }`}>
                        {pendingThreads.length}
                      </span>
                    )}
                  </button>
                </div>

                {/* Answered */}
                {threadsView === "answered" && (
                  <>
                    {loadingThreads && Array.from({ length: 2 }).map((_, idx) => (
                      <div key={idx} className="bg-white rounded-2xl shadow-sm h-32 animate-pulse border border-gray-100" />
                    ))}
                    {!loadingThreads && threads.length === 0 && (
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                        <p className="text-sm font-semibold text-[#001049]">No answered threads yet</p>
                        <p className="text-xs text-gray-400 mt-1">Questions you answer will appear here.</p>
                      </div>
                    )}
                    {!loadingThreads && threads.map((t) => {
                      const initials = `${t.recipient?.firstName?.[0] ?? ""}${t.recipient?.lastName?.[0] ?? ""}`.toUpperCase();
                      return (
                        <div key={t.id}>
                          <article className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 bg-gray-50">
                              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Q</p>
                              <p className="text-sm text-gray-800 leading-relaxed">{t.question}</p>
                            </div>
                            <div className="px-5 py-4 bg-white border-t border-gray-100">
                              <div className="flex items-center gap-2 mb-2.5">
                                {t.isAnonymous ? (
                                  <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs font-bold shrink-0">?</div>
                                ) : (
                                  <div className="w-7 h-7 rounded-full bg-[#FFCA3A] flex items-center justify-center text-[#001049] text-xs font-bold shrink-0 overflow-hidden">
                                    {t.recipient?.profilePic
                                      ? <img src={t.recipient.profilePic} alt={initials} className="w-full h-full object-cover" />
                                      : initials}
                                  </div>
                                )}
                                <span className="text-sm font-semibold text-gray-800">
                                  {t.isAnonymous ? "Anonymous" : (t.recipient ? `${t.recipient.firstName} ${t.recipient.lastName}` : "You")}
                                </span>
                                {t.isAnonymous && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 font-medium">Anonymous</span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 leading-relaxed">{t.answer}</p>
                            </div>
                            <AnsweredThreadActions
                              thread={t}
                              onToggleAnon={() => handleToggleAnon(t.id)}
                              onDelete={() => handleDeleteThread(t.id)}
                              toggling={togglingAnon.has(t.id)}
                              deleting={deletingThread.has(t.id)}
                            />
                          </article>
                          {threadErrors[t.id] && (
                            <p className="text-xs text-red-500 mt-1 px-1">{threadErrors[t.id]}</p>
                          )}
                        </div>
                      );
                    })}
                  </>
                )}

                {/* Unanswered */}
                {threadsView === "unanswered" && (
                  <>
                    {pendingLoading && Array.from({ length: 2 }).map((_, idx) => (
                      <div key={idx} className="bg-white rounded-2xl shadow-sm h-44 animate-pulse border border-gray-100" />
                    ))}
                    {!pendingLoading && pendingThreads.length === 0 && (
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                        <p className="text-sm font-semibold text-gray-500">No unanswered questions.</p>
                        <p className="text-xs text-gray-400 mt-1">You're all caught up.</p>
                      </div>
                    )}
                    {!pendingLoading && pendingThreads.map((t) => {
                      const askerInitials = `${t.asker?.firstName?.[0] ?? ""}${t.asker?.lastName?.[0] ?? ""}`.toUpperCase();
                      const askerName = t.asker ? `${t.asker.firstName} ${t.asker.lastName}`.trim() : "Member";
                      const diff = Date.now() - new Date(t.createdAt).getTime();
                      const mins = Math.floor(diff / 60000);
                      const timeText = mins < 1 ? "just now" : mins < 60 ? `${mins}m` : mins < 1440 ? `${Math.floor(mins / 60)}h` : `${Math.floor(mins / 1440)}d`;
                      return (
                        <div key={t.id}>
                          <UnansweredCard
                            thread={t}
                            askerInitials={askerInitials}
                            askerName={askerName}
                            timeText={timeText}
                            answerDraft={answerDraft[t.id] ?? ""}
                            isAnonDraft={anonDraft[t.id] ?? false}
                            onDraftChange={(val: string) => setAnswerDraft((p) => ({ ...p, [t.id]: val }))}
                            onAnonDraftChange={(val: boolean) => setAnonDraft((p) => ({ ...p, [t.id]: val }))}
                            onSubmit={() => handleAnswer(t.id)}
                            onDelete={() => handleDeleteThread(t.id)}
                            submitting={submittingAnswer.has(t.id)}
                            deleting={deletingThread.has(t.id)}
                          />
                          {threadErrors[t.id] && (
                            <p className="text-xs text-red-500 mt-1 px-1">{threadErrors[t.id]}</p>
                          )}
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}

            {activeTab === "profile" && <>

            {/* About */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <SectionHeader title="About" />
              {loadingProfile ? (
                <div className="space-y-2 animate-pulse">{[1,2].map(i => <div key={i} className="h-4 bg-gray-100 rounded" />)}</div>
              ) : profile?.bio ? (
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
              ) : (
                <button onClick={openEdit} className="text-sm text-[#001049] hover:underline">Add a bio</button>
              )}
            </div>

            {/* Education */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <SectionHeader title="Education" onAdd={openAddEdu} />
              {loadingProfile ? (
                <div className="space-y-2 animate-pulse">{[1,2,3].map(i => <div key={i} className="h-4 bg-gray-100 rounded" />)}</div>
              ) : (
                <>
                  {/* Primary school from profile */}
                  {profile?.schoolName && (
                    <div className="flex gap-4 group pb-4 border-b border-gray-100 mb-4 last:border-0 last:mb-0 last:pb-0">
                      <UniLogo schoolName={profile.schoolName} schoolEmail={profile.schoolEmail} size={12} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900">
                              {[profile.degreeLevel, profile.major].filter(Boolean).join(", ") || profile.schoolName}
                            </p>
                            <p className="text-sm text-gray-600 mt-0.5">{profile.schoolName}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {[profile.schoolYear, profile.graduationYear ? `Class of ${profile.graduationYear}` : null].filter(Boolean).join(" · ")}
                            </p>
                          </div>
                          <button onClick={openEdit} className="p-1.5 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition opacity-0 group-hover:opacity-100 shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Additional education entries */}
                  {educations.map((edu) => (
                    <div key={edu.id} className="flex gap-4 group py-4 border-b border-gray-100 last:border-0 last:pb-0 first:pt-0">
                      <UniLogo schoolName={edu.schoolName} size={12} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900">
                              {[edu.degreeLevel, edu.major].filter(Boolean).join(", ") || edu.schoolName}
                            </p>
                            <p className="text-sm text-gray-600 mt-0.5">{edu.schoolName}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {edu.currentlyEnrolled ? "Currently enrolled" : [edu.schoolYear, edu.graduationYear ? `Class of ${edu.graduationYear}` : null].filter(Boolean).join(" · ")}
                            </p>
                          </div>
                          <button onClick={() => openEditEdu(edu)} className="p-1.5 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition opacity-0 group-hover:opacity-100 shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!profile?.schoolName && educations.length === 0 && (
                    <button onClick={openAddEdu} className="w-full border-2 border-dashed border-gray-200 rounded-xl py-6 text-sm text-gray-400 hover:border-[#001049]/30 hover:text-[#001049]/60 transition">
                      Add your education
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Work Experience */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <SectionHeader title="Work Experience" onAdd={openAddExp} />
              {experiences.length === 0 ? (
                <button onClick={openAddExp} className="w-full border-2 border-dashed border-gray-200 rounded-xl py-6 flex flex-col items-center gap-1.5 text-gray-400 hover:border-[#001049]/30 hover:text-[#001049]/60 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                  <span className="text-sm font-medium">Add work experience</span>
                </button>
              ) : (
                <div className="divide-y divide-gray-100">
                  {experiences.map((exp) => {
                    const dateRange = exp.currentlyWorking
                      ? `${exp.startMonth} ${exp.startYear} – Present`
                      : `${exp.startMonth} ${exp.startYear}${exp.endMonth && exp.endYear ? ` – ${exp.endMonth} ${exp.endYear}` : ""}`;
                    return (
                      <div key={exp.id} className="py-4 first:pt-0 last:pb-0 flex gap-4 group">
                        <CompanyLogo company={exp.company} size={12} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-gray-900 leading-snug">{exp.jobTitle}</p>
                              <p className="text-sm text-gray-600 mt-0.5">
                                {exp.company}{exp.employmentType && <span className="text-gray-400"> · {exp.employmentType}</span>}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">{dateRange}{exp.location && ` · ${exp.location}`}</p>
                            </div>
                            <button onClick={() => openEditExp(exp)} className="p-1.5 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition opacity-0 group-hover:opacity-100 shrink-0">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
                              </svg>
                            </button>
                          </div>
                          {exp.description && <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{exp.description}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            </>}

          </main>

          {/* ── Right sidebar ─────────────────────────────────────────────── */}
          <aside className="w-72 shrink-0 space-y-4 sticky top-4 self-start hidden xl:block">

            {/* Board member badge */}
            {user.role === "board_member" && (
              <div className="bg-[#001049] rounded-2xl p-4">
                <p className="text-xs font-bold text-[#FFCA3A] mb-1">Board Member</p>
                <p className="text-xs text-blue-200 leading-snug">Full access to create events, articles, and more.</p>
              </div>
            )}

          </aside>

        </div>
      </div>

      {/* ── Edit profile modal ───────────────────────────────────────────── */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/55" onClick={() => !saving && setEditOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl flex flex-col max-h-[92vh] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <h2 className="text-lg font-bold text-gray-900">Edit Profile</h2>
              <button onClick={() => !saving && setEditOpen(false)} className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Photo */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Profile Photo</p>
                <div className="flex items-center gap-4">
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="relative w-16 h-16 rounded-full bg-[#FFCA3A] flex items-center justify-center text-[#001049] text-xl font-bold shrink-0 overflow-hidden border-2 border-gray-200 group hover:opacity-90 transition">
                    {avatarPreview
                      ? <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                      : !avatarRemoved && form.profilePic
                      ? <img src={form.profilePic} alt="Current" className="w-full h-full object-cover" />
                      : initials}
                    <span className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                      </svg>
                    </span>
                  </button>
                  <div className="flex-1 min-w-0">
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarPick} />
                    <div className="flex items-center gap-2 flex-wrap">
                      <button type="button" onClick={() => fileInputRef.current?.click()}
                        className="text-sm font-medium text-[#001049] border border-[#001049]/20 px-3 py-1.5 rounded-lg hover:bg-[#001049]/5 transition">
                        {avatarFile ? "Change photo" : "Upload photo"}
                      </button>
                      {(avatarFile || (!avatarRemoved && form.profilePic)) && (
                        <button type="button" onClick={() => { setAvatarFile(null); setAvatarPreview(null); setAvatarRemoved(true); setAvatarError(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                          className="text-sm font-medium text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition">
                          Remove
                        </button>
                      )}
                    </div>
                    {avatarFile
                      ? <p className="text-xs text-gray-500 mt-1 truncate">{avatarFile.name} · {(avatarFile.size / 1024).toFixed(0)} KB</p>
                      : avatarRemoved
                      ? <p className="text-xs text-red-400 mt-1">Photo will be removed on save</p>
                      : <p className="text-xs text-gray-400 mt-1">JPG, PNG — max 5 MB</p>}
                    {avatarError && <p className="text-xs text-red-500 mt-1">{avatarError}</p>}
                  </div>
                </div>
              </div>

              {/* Basic info */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Basic Info</p>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="First Name" name="firstName" value={form.firstName} onChange={handleField} />
                    <Field label="Last Name" name="lastName" value={form.lastName} onChange={handleField} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Custom Header</label>
                    <input
                      type="text"
                      value={form.headline}
                      onChange={(e) => handleField("headline", e.target.value)}
                      placeholder="e.g. Computer Science @ UMD"
                      maxLength={140}
                      className={inputCls}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">About / Bio</label>
                    <textarea value={form.bio} onChange={(e) => handleField("bio", e.target.value)}
                      placeholder="Tell the community about yourself…" rows={3}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001049]/20 focus:border-[#001049] bg-white transition resize-none" />
                  </div>
                </div>
              </div>

              {/* Education */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Education</p>
                <div className="space-y-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">School Name</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={form.schoolName}
                        onChange={(e) => {
                          handleField("schoolName", e.target.value);
                          setSchoolSuggestionsOpen(true);
                        }}
                        onFocus={() => setSchoolSuggestionsOpen(true)}
                        onBlur={() => setTimeout(() => setSchoolSuggestionsOpen(false), 120)}
                        placeholder="Search your university…"
                        className={inputCls}
                        autoComplete="off"
                      />
                      {schoolSuggestionsOpen && schoolSuggestions.length > 0 && (
                        <div className="absolute z-30 top-full left-0 right-0 mt-1 max-h-64 overflow-auto rounded-xl border border-gray-200 bg-white shadow-lg">
                          {schoolSuggestions.map((u) => (
                            <button
                              key={u.id}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleField("schoolName", u.name);
                                setSchoolSuggestionsOpen(false);
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                            >
                              {u.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400">Live search across all universities.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <SelectField label="Degree Level" name="degreeLevel" value={form.degreeLevel} onChange={handleField} options={DEGREE_LEVELS} />
                    <div className="col-span-2 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Major(s) (up to 3)</label>
                        <div className="flex items-center gap-2">
                          {majorFieldCount > 1 && (
                            <button
                              type="button"
                              onClick={removeMajorField}
                              className="text-xs font-medium text-gray-500 hover:text-gray-700"
                            >
                              Remove
                            </button>
                          )}
                          {majorFieldCount < 3 && (
                            <button
                              type="button"
                              onClick={addMajorField}
                              className="text-xs font-medium text-[#001049] hover:text-[#073D97]"
                            >
                              + Add major
                            </button>
                          )}
                        </div>
                      </div>
                      {majorValues.map((major: string, index: number) => (
                        <input
                          key={`major-${index}`}
                          type="text"
                          value={major}
                          onChange={(e) => handleMajorChange(index, e.target.value)}
                          placeholder={`Major ${index + 1}`}
                          className={inputCls}
                        />
                      ))}
                    </div>
                    <SelectField label="School Year" name="schoolYear" value={form.schoolYear} onChange={handleField} options={SCHOOL_YEARS} />
                    <Field label="Graduation Year" name="graduationYear" value={form.graduationYear} onChange={handleField} placeholder="2026" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      School Email <span className="text-gray-400 font-normal normal-case">(e.g. you@umd.edu)</span>
                    </label>
                    <input
                      type="email"
                      value={form.schoolEmail}
                      onChange={(e) => handleField("schoolEmail", e.target.value)}
                      placeholder="your.name@university.edu"
                      className={inputCls}
                      autoComplete="off"
                    />
                    <p className="text-[11px] text-gray-400">Used to show the correct school logo. Not visible to other members.</p>
                  </div>
                </div>
              </div>

              {/* Social links */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Social Links</p>
                <div className="space-y-3">
                  {[
                    { name: "x" as keyof EditForm, placeholder: "https://x.com/…", icon: <svg className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2H21l-6.02 6.86L22 22h-5.55l-4.347-5.727L7.078 22H4.32l6.44-7.338L2 2h5.69l3.93 5.182L18.244 2Zm-.967 18.38h1.527L6.86 3.54H5.22L17.277 20.38Z" /></svg> },
                    { name: "facebook" as keyof EditForm, placeholder: "https://facebook.com/…", icon: <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
                    { name: "instagram" as keyof EditForm, placeholder: "https://instagram.com/…", icon: <svg className="w-5 h-5 text-pink-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg> },
                    { name: "linkedin" as keyof EditForm, placeholder: "https://linkedin.com/in/…", icon: <svg className="w-5 h-5 text-blue-700" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> },
                  ].map(({ name, placeholder, icon }) => (
                    <div key={name} className="flex items-center gap-3">
                      <span className="w-6 shrink-0">{icon}</span>
                      <input type="url" value={form[name]} onChange={(e) => handleField(name, e.target.value)}
                        placeholder={placeholder} className={`flex-1 ${inputCls}`} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="h-2" />
            </div>

            <div className="shrink-0 px-6 py-4 border-t border-gray-100 bg-white flex items-center gap-3">
              {saveError && <p className="text-sm text-red-500 flex-1">{saveError}</p>}
              {!saveError && <div className="flex-1" />}
              <button onClick={() => !saving && setEditOpen(false)} disabled={saving}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition disabled:opacity-40">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#001049] text-white hover:bg-[#073D97] transition disabled:opacity-50 flex items-center gap-2">
                {saving ? (<><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Saving…</>) : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Experience modal ─────────────────────────────────────────────── */}
      {expModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !expSaving && setExpModal({ open: false, editing: null })} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <h2 className="text-lg font-bold text-gray-900">{expModal.editing ? "Edit Experience" : "Add Experience"}</h2>
              <button onClick={() => !expSaving && setExpModal({ open: false, editing: null })} className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Job Title <span className="text-red-400">*</span></label>
                  <input type="text" value={expForm.jobTitle} onChange={(e) => setExpForm((f) => ({ ...f, jobTitle: e.target.value }))} placeholder="e.g. Software Engineer Intern" className={inputCls} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Company <span className="text-red-400">*</span></label>
                  <input type="text" value={expForm.company} onChange={(e) => setExpForm((f) => ({ ...f, company: e.target.value }))} placeholder="e.g. Google" className={inputCls} />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Employment Type</label>
                <select value={expForm.employmentType} onChange={(e) => setExpForm((f) => ({ ...f, employmentType: e.target.value }))} className={selectCls}>
                  <option value="">Select type…</option>
                  {EMPLOYMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Start Month <span className="text-red-400">*</span></label>
                  <select value={expForm.startMonth} onChange={(e) => setExpForm((f) => ({ ...f, startMonth: e.target.value }))} className={selectCls}>
                    <option value="">Month</option>
                    {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Start Year <span className="text-red-400">*</span></label>
                  <select value={expForm.startYear} onChange={(e) => setExpForm((f) => ({ ...f, startYear: e.target.value }))} className={selectCls}>
                    <option value="">Year</option>
                    {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input type="checkbox" checked={expForm.currentlyWorking} onChange={(e) => setExpForm((f) => ({ ...f, currentlyWorking: e.target.checked, endMonth: "", endYear: "" }))} className="w-4 h-4 rounded border-gray-300 text-[#001049] focus:ring-[#001049]/30" />
                <span className="text-sm text-gray-700">I currently work here</span>
              </label>
              {!expForm.currentlyWorking && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">End Month</label>
                    <select value={expForm.endMonth} onChange={(e) => setExpForm((f) => ({ ...f, endMonth: e.target.value }))} className={selectCls}>
                      <option value="">Month</option>
                      {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">End Year</label>
                    <select value={expForm.endYear} onChange={(e) => setExpForm((f) => ({ ...f, endYear: e.target.value }))} className={selectCls}>
                      <option value="">Year</option>
                      {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Location</label>
                <input type="text" value={expForm.location} onChange={(e) => setExpForm((f) => ({ ...f, location: e.target.value }))} placeholder="e.g. New York, NY · Remote" className={inputCls} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</label>
                <textarea value={expForm.description} onChange={(e) => setExpForm((f) => ({ ...f, description: e.target.value }))} placeholder="Describe your role, responsibilities, and impact…" rows={4} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001049]/20 focus:border-[#001049] bg-white transition resize-none" />
              </div>
              {expError && <p className="text-sm text-red-500">{expError}</p>}
            </div>
            <div className="shrink-0 px-6 py-4 border-t border-gray-100 bg-white flex items-center gap-3">
              {expModal.editing && (
                <button type="button" onClick={() => { handleExpDelete(expModal.editing!.id); setExpModal({ open: false, editing: null }); }} className="text-sm text-red-500 hover:text-red-600 font-medium transition">
                  Delete
                </button>
              )}
              <div className="flex-1" />
              <button onClick={() => !expSaving && setExpModal({ open: false, editing: null })} disabled={expSaving} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition disabled:opacity-40">Cancel</button>
              <button onClick={handleExpSave} disabled={expSaving} className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#001049] text-white hover:bg-[#073D97] transition disabled:opacity-50 flex items-center gap-2">
                {expSaving ? (<><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Saving…</>) : expModal.editing ? "Save changes" : "Add experience"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Education modal ──────────────────────────────────────────────── */}
      {eduModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !eduSaving && setEduModal({ open: false, editing: null })} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <h2 className="text-lg font-bold text-gray-900">{eduModal.editing ? "Edit Education" : "Add Education"}</h2>
              <button onClick={() => !eduSaving && setEduModal({ open: false, editing: null })} className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">School Name <span className="text-red-400">*</span></label>
                <input type="text" value={eduForm.schoolName} onChange={(e) => setEduForm((f) => ({ ...f, schoolName: e.target.value }))} placeholder="e.g. University of Minnesota" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Degree</label>
                  <select value={eduForm.degreeLevel} onChange={(e) => setEduForm((f) => ({ ...f, degreeLevel: e.target.value }))} className={selectCls}>
                    <option value="">Select…</option>
                    {["Associate's", "Bachelor's", "Master's", "PhD", "MD", "JD", "MBA", "Other"].map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Major / Field</label>
                  <input type="text" value={eduForm.major} onChange={(e) => setEduForm((f) => ({ ...f, major: e.target.value }))} placeholder="e.g. Computer Science" className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Year</label>
                  <select value={eduForm.schoolYear} onChange={(e) => setEduForm((f) => ({ ...f, schoolYear: e.target.value }))} className={selectCls}>
                    <option value="">Select…</option>
                    {["Freshman", "Sophomore", "Junior", "Senior", "Graduate"].map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Graduation Year</label>
                  <select value={eduForm.graduationYear} onChange={(e) => setEduForm((f) => ({ ...f, graduationYear: e.target.value }))} disabled={eduForm.currentlyEnrolled} className={selectCls}>
                    <option value="">Year</option>
                    {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input type="checkbox" checked={eduForm.currentlyEnrolled} onChange={(e) => setEduForm((f) => ({ ...f, currentlyEnrolled: e.target.checked, graduationYear: "" }))} className="w-4 h-4 rounded border-gray-300 text-[#001049] focus:ring-[#001049]/30" />
                <span className="text-sm text-gray-700">I currently study here</span>
              </label>
              {eduError && <p className="text-sm text-red-500">{eduError}</p>}
            </div>
            <div className="shrink-0 px-6 py-4 border-t border-gray-100 bg-white flex items-center gap-3">
              {eduModal.editing && (
                <button type="button" onClick={() => { handleEduDelete(eduModal.editing!.id); setEduModal({ open: false, editing: null }); }} className="text-sm text-red-500 hover:text-red-600 font-medium transition">
                  Delete
                </button>
              )}
              <div className="flex-1" />
              <button onClick={() => !eduSaving && setEduModal({ open: false, editing: null })} disabled={eduSaving} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition disabled:opacity-40">Cancel</button>
              <button onClick={handleEduSave} disabled={eduSaving} className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#001049] text-white hover:bg-[#073D97] transition disabled:opacity-50 flex items-center gap-2">
                {eduSaving ? (<><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Saving…</>) : eduModal.editing ? "Save changes" : "Add education"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
