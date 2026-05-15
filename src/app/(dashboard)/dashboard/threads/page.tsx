"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import SchoolBadge from "@/components/threads/SchoolBadge";

// ─── Logo.dev ─────────────────────────────────────────────────────────────────

const LOGO_DEV_TOKEN = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN?.trim();

function buildLogoUrl(domain: string): string {
  const base = `https://img.logo.dev/${domain}`;
  return LOGO_DEV_TOKEN ? `${base}?token=${encodeURIComponent(LOGO_DEV_TOKEN)}` : base;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type SchoolResult = { name: string; domain: string };

type ThreadUser = {
  id: number;
  firstName: string;
  lastName: string;
  profilePic: string | null;
};

type HubThread = {
  id: number;
  title: string;
  body: string;
  category: string;
  categoryDomain: string | null;
  images: string[];
  status: string;
  isAnon: boolean;
  asker: ThreadUser | null;
  commentCount: number;
  approvedAt: string | null;
  createdAt: string;
};

type HubComment = {
  id: number;
  content: string;
  isAnon: boolean;
  author: ThreadUser | null;
  createdAt: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Avatar({ user, size = "w-8 h-8" }: { user: ThreadUser | null; size?: string }) {
  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "?";
  return (
    <div className={`${size} rounded-full bg-[#FFCA3A] flex items-center justify-center text-[#001049] text-xs font-bold shrink-0 overflow-hidden`}>
      {user?.profilePic ? (
        <img src={user.profilePic} alt="" className="w-full h-full object-cover" />
      ) : initials}
    </div>
  );
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253M3 12a8.96 8.96 0 0 0 .284 2.253" />
    </svg>
  );
}

// ─── School search (Clearbit autocomplete) ────────────────────────────────────

async function fetchSchoolSuggestions(query: string): Promise<SchoolResult[]> {
  if (!query.trim()) return [];
  try {
    const res = await fetch(
      `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(query)}`
    );
    if (!res.ok) return [];
    const results = (await res.json()) as Array<{ name?: string; domain?: string }>;
    const edu = results.filter((r) => r.name && r.domain?.endsWith(".edu"));
    return edu.slice(0, 5).map((r) => ({ name: r.name!, domain: r.domain! }));
  } catch {
    return [];
  }
}

function SchoolSearch({
  selectedName,
  selectedDomain,
  onSelect,
}: {
  selectedName: string;
  selectedDomain: string | null;
  onSelect: (name: string, domain: string | null) => void;
}) {
  const isGeneral = selectedName === "general" || selectedName === "General" || !selectedName;
  const [query, setQuery] = useState(() => (isGeneral ? "" : selectedName));
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SchoolResult[]>([]);
  const [searching, setSearching] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const q = query.trim();
    if (!q) { setResults([]); setSearching(false); return; }

    setSearching(true);
    timerRef.current = setTimeout(async () => {
      const r = await fetchSchoolSuggestions(q);
      setResults(r);
      setSearching(false);
    }, 250);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelectGeneral = () => {
    onSelect("general", null);
    setQuery("");
    setOpen(false);
  };

  const handleSelectSchool = (s: SchoolResult) => {
    onSelect(s.name, s.domain);
    setQuery(s.name);
    setOpen(false);
    setResults([]);
  };

  const showGeneral = !query.trim() || "general".startsWith(query.trim().toLowerCase());
  const displayValue = !isGeneral && !query ? selectedName : query;

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative flex items-center">
        <div className="absolute left-3 flex items-center justify-center w-5 h-5 shrink-0 pointer-events-none">
          {isGeneral && !query ? (
            <GlobeIcon className="w-4 h-4 text-gray-400" />
          ) : selectedDomain && !query ? (
            <img
              src={buildLogoUrl(selectedDomain)}
              alt=""
              className="w-4 h-4 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          )}
        </div>

        <input
          type="text"
          value={displayValue}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search schools…"
          className="w-full border border-gray-200 rounded-xl pl-9 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#001049]/20 bg-white"
        />

        <div className="absolute right-3 flex items-center">
          {searching ? (
            <svg className="animate-spin w-4 h-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : query ? (
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); setQuery(""); setResults([]); onSelect("general", null); }}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          ) : null}
        </div>
      </div>

      {open && (showGeneral || results.length > 0 || searching) && (
        <div className="absolute z-30 top-full mt-1.5 left-0 right-0 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden">
          {showGeneral && (
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleSelectGeneral(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left ${isGeneral && !query ? "bg-gray-50" : ""}`}
            >
              <div className="w-8 h-8 rounded-lg bg-[#001049]/10 flex items-center justify-center shrink-0">
                <GlobeIcon className="w-4 h-4 text-[#001049]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">General</p>
                <p className="text-xs text-gray-400">Not college-specific</p>
              </div>
              {isGeneral && !query && (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#001049] ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              )}
            </button>
          )}

          {showGeneral && results.length > 0 && (
            <div className="mx-4 border-t border-gray-100" />
          )}

          {results.map((s) => {
            const logoUrl = buildLogoUrl(s.domain);
            const isSelected = selectedName === s.name;
            return (
              <button
                key={s.domain}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); handleSelectSchool(s); }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left ${isSelected ? "bg-gray-50" : ""}`}
              >
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                  <img
                    src={logoUrl}
                    alt=""
                    className="w-6 h-6 object-contain"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.style.display = "none";
                      img.parentElement!.innerHTML = `<span class="text-xs font-bold text-gray-400">${s.name[0]}</span>`;
                    }}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{s.name}</p>
                  <p className="text-xs text-gray-400 truncate">{s.domain}</p>
                </div>
                {isSelected && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#001049] ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                )}
              </button>
            );
          })}

          {query.trim() && !searching && results.length === 0 && !showGeneral && (
            <div className="px-4 py-3 text-sm text-gray-400">No schools found</div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Image uploader ───────────────────────────────────────────────────────────

function ImageUploader({ images, onChange, uploading }: { images: string[]; onChange: (urls: string[]) => void; uploading: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localUploading, setLocalUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = 3 - images.length;
    if (remaining <= 0) return;
    setLocalUploading(true);
    setUploadError(null);
    const newUrls: string[] = [];
    for (const file of Array.from(files).slice(0, remaining)) {
      const form = new FormData();
      form.append("file", file);
      const stored = typeof window !== "undefined" ? localStorage.getItem("amsa_auth") : null;
      const token = stored ? (JSON.parse(stored) as { token?: string }).token : null;
      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: form,
        });
        if (res.ok) {
          newUrls.push(((await res.json()) as { url: string }).url);
        } else {
          const err = await res.json().catch(() => ({}));
          setUploadError((err as any)?.message ?? "Upload failed. Make sure the storage bucket exists in Supabase.");
        }
      } catch {
        setUploadError("Upload failed. Check your connection and Supabase storage configuration.");
      }
    }
    onChange([...images, ...newUrls]);
    setLocalUploading(false);
  };

  const removeImage = (i: number) => onChange(images.filter((_, idx) => idx !== i));
  const busy = uploading || localUploading;

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {images.map((url, i) => (
          <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-100 group shrink-0">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeImage(i)}
              className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
        {images.length < 3 && (
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-[#001049]/40 hover:text-[#001049]/60 transition disabled:opacity-50 shrink-0"
          >
            {localUploading ? (
              <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
                <span className="text-xs">{images.length}/3</span>
              </>
            )}
          </button>
        )}
      </div>
      {uploadError && (
        <p className="text-xs text-red-500 mb-1">{uploadError}</p>
      )}
      <p className="text-xs text-gray-400">Up to 3 images · JPEG, PNG, GIF, WebP · max 5 MB each</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}

// ─── Thread card — expandable with inline comments ────────────────────────────

function ThreadCard({ thread, isAdmin, onDeleted }: { thread: HubThread; isAdmin: boolean; onDeleted: (id: number) => void }) {
  const { authFetch } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [comments, setComments] = useState<HubComment[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [commentIsAnon, setCommentIsAnon] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [replyCount, setReplyCount] = useState(thread.commentCount);

  const handleExpand = async () => {
    const next = !expanded;
    setExpanded(next);
    if (next && !commentsLoaded) {
      setCommentsLoading(true);
      try {
        const data = await authFetch(`/api/hub-threads/${thread.id}`);
        setComments((data.comments ?? []) as HubComment[]);
        setCommentsLoaded(true);
      } catch { /* silently fail */ }
      finally { setCommentsLoading(false); }
    }
  };

  const handleComment = async () => {
    const c = commentDraft.trim();
    if (!c || submitting) return;
    setSubmitting(true);
    try {
      const data = await authFetch(`/api/hub-threads/${thread.id}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: c, isAnon: commentIsAnon }),
      });
      setComments((prev) => [...prev, data.comment as HubComment]);
      setCommentDraft("");
      setReplyCount((n) => n + 1);
      setSubmitMsg(null);
    } catch (e: any) {
      setSubmitMsg({ text: e?.message ?? "Failed to post reply.", ok: false });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this thread and all its replies?")) return;
    setDeleting(true);
    try {
      await authFetch(`/api/hub-threads/${thread.id}`, { method: "DELETE" });
      onDeleted(thread.id);
    } catch { /* silently fail */ }
    finally { setDeleting(false); }
  };

  const askerName = thread.isAnon ? "Anonymous"
    : thread.asker ? `${thread.asker.firstName} ${thread.asker.lastName}`.trim() : "Member";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Card header — click to expand */}
      <div
        onClick={handleExpand}
        className="w-full text-left px-6 py-5 hover:bg-gray-50/60 transition group cursor-pointer"
      >
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <SchoolBadge category={thread.category} categoryDomain={thread.categoryDomain} />
          <span className="text-sm text-gray-400">{formatRelative(thread.approvedAt ?? thread.createdAt)}</span>
        </div>

        <p className="text-base font-semibold text-gray-900 leading-snug group-hover:text-[#001049] transition-colors line-clamp-2 mb-2">
          {thread.title}
        </p>

        {thread.body && (
          <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">{thread.body}</p>
        )}

        {thread.images.length > 0 && (
          <div className="mt-3 flex gap-2">
            {thread.images.slice(0, 3).map((url, i) => (
              <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                <img src={url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {thread.isAnon
              ? <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs font-bold shrink-0">?</div>
              : <Avatar user={thread.asker} />}
            <span className="text-sm text-gray-500 truncate">{askerName}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {isAdmin && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition disabled:opacity-50"
                title="Delete thread"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </button>
            )}
            <span className={`text-sm flex items-center gap-1.5 font-medium transition ${expanded ? "text-[#001049]" : "text-gray-400"}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
              </svg>
              {replyCount} {replyCount === 1 ? "reply" : "replies"}
              <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 ml-0.5 transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </div>
        </div>
      </div>

      {/* Expanded section: comments + reply form */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50/40 px-6 py-5 space-y-4">
          {/* Loading skeleton */}
          {commentsLoading && (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse shrink-0" />
                  <div className="flex-1 h-16 bg-gray-200 rounded-xl animate-pulse" />
                </div>
              ))}
            </div>
          )}

          {/* No replies */}
          {!commentsLoading && commentsLoaded && comments.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-2">No replies yet. Be the first!</p>
          )}

          {/* Comment list */}
          {!commentsLoading && comments.length > 0 && (
            <div className="space-y-3">
              {comments.map((c) => {
                const authorName = c.isAnon ? "Anonymous"
                  : c.author ? `${c.author.firstName} ${c.author.lastName}`.trim() : "Member";
                return (
                  <div key={c.id} className="flex gap-3">
                    {c.isAnon
                      ? <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs font-bold shrink-0">?</div>
                      : <Avatar user={c.author} />}
                    <div className="flex-1 bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-sm font-semibold text-gray-800">{authorName}</span>
                        <span className="text-xs text-gray-400">{formatRelative(c.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{c.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Reply form */}
          <div className="pt-1">
            {submitMsg && (
              <p className={`text-sm mb-2 ${submitMsg.ok ? "text-green-600" : "text-red-500"}`}>{submitMsg.text}</p>
            )}
            <textarea
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              placeholder="Write a reply…"
              maxLength={2000}
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#001049]/20 bg-white"
            />
            <div className="mt-2.5 flex items-center justify-between gap-3 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={commentIsAnon}
                  onChange={(e) => setCommentIsAnon(e.target.checked)}
                  className="rounded border-gray-300 accent-[#001049]"
                />
                <span className="text-sm text-gray-500">Reply anonymously</span>
              </label>
              <button
                type="button"
                disabled={submitting || commentDraft.trim().length === 0}
                onClick={handleComment}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#001049] text-white disabled:opacity-50 hover:opacity-90 transition"
              >
                {submitting ? "Posting…" : "Post Reply"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ThreadsPage() {
  const { user, loading, authFetch } = useAuth();
  const router = useRouter();

  const [threads, setThreads] = useState<HubThread[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // Create-post form state
  const [postOpen, setPostOpen] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [bodyDraft, setBodyDraft] = useState("");
  const [categoryName, setCategoryName] = useState("general");
  const [categoryDomain, setCategoryDomain] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isAnon, setIsAnon] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Feed filter
  const [activeCategory, setActiveCategory] = useState<string>("all");

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/login"); return; }
    let active = true;
    setPageLoading(true);
    authFetch("/api/hub-threads?limit=20")
      .then((data) => {
        if (!active) return;
        setThreads((data.threads ?? []) as HubThread[]);
        setNextCursor(data.nextCursor ?? null);
      })
      .catch(() => { if (!active) return; setThreads([]); })
      .finally(() => { if (!active) return; setPageLoading(false); });
    return () => { active = false; };
  }, [loading, user, router, authFetch]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await authFetch(`/api/hub-threads?limit=20&cursor=${encodeURIComponent(nextCursor)}`);
      setThreads((prev) => [...prev, ...((data.threads ?? []) as HubThread[])]);
      setNextCursor(data.nextCursor ?? null);
    } catch { /* silently fail */ }
    finally { setLoadingMore(false); }
  }, [nextCursor, loadingMore, authFetch]);

  const handleSubmit = async () => {
    const title = titleDraft.trim();
    if (!title || submitting) return;
    setSubmitting(true);
    try {
      await authFetch("/api/hub-threads", {
        method: "POST",
        body: JSON.stringify({ title, body: bodyDraft.trim(), category: categoryName, categoryDomain, images: imageUrls, isAnon }),
      });
      setTitleDraft(""); setBodyDraft(""); setCategoryName("general"); setCategoryDomain(null);
      setImageUrls([]); setIsAnon(false); setPostOpen(false);
      setSubmitMsg({ text: "Your post has been submitted for review. It will appear once a board member approves it.", ok: true });
      setTimeout(() => setSubmitMsg(null), 6000);
    } catch (e: any) {
      setSubmitMsg({ text: e?.message ?? "Failed to submit post.", ok: false });
    } finally {
      setSubmitting(false);
    }
  };

  const categoryTabs = useMemo(() => {
    const seen = new Map<string, string | null>();
    for (const t of threads) {
      if (!seen.has(t.category)) seen.set(t.category, t.categoryDomain);
    }
    return Array.from(seen.entries()).map(([cat, domain]) => ({ cat, domain }));
  }, [threads]);

  const visibleThreads = activeCategory === "all"
    ? threads
    : threads.filter((t) => t.category === activeCategory);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 md:px-8">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm text-gray-500 mt-1">Community posts reviewed by board members before going public.</p>
          </div>
          <button
            type="button"
            onClick={() => { setPostOpen((v) => !v); setSubmitMsg(null); }}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#001049] text-white hover:opacity-90 transition shrink-0"
          >
            {postOpen ? "Cancel" : "New Post"}
          </button>
        </div>

        {submitMsg && (
          <div className={`mb-4 px-4 py-3 rounded-xl text-sm ${submitMsg.ok ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
            {submitMsg.text}
          </div>
        )}

        {/* Create post form */}
        {postOpen && (
          <div className="mb-5 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
            <p className="text-base font-semibold text-gray-900">Create a post</p>

            <div>
              <label className="text-sm font-medium text-gray-500 mb-1.5 block">
                College <span className="text-gray-400">(or General)</span>
              </label>
              <SchoolSearch
                selectedName={categoryName}
                selectedDomain={categoryDomain}
                onSelect={(name, domain) => { setCategoryName(name); setCategoryDomain(domain); }}
              />
              {categoryName && categoryName !== "general" && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm text-gray-400">Posting to:</span>
                  <SchoolBadge category={categoryName} categoryDomain={categoryDomain} size="md" />
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500 mb-1.5 block">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                placeholder="Give your post a title"
                maxLength={150}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#001049]/20"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{titleDraft.length}/150</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500 mb-1.5 block">
                Body <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                value={bodyDraft}
                onChange={(e) => setBodyDraft(e.target.value)}
                placeholder="Share more details…"
                maxLength={2000}
                rows={5}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#001049]/20"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{bodyDraft.length}/2000</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500 mb-1.5 block">
                Images <span className="text-gray-400">(optional)</span>
              </label>
              <ImageUploader images={imageUrls} onChange={setImageUrls} uploading={submitting} />
            </div>

            <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isAnon}
                  onChange={(e) => setIsAnon(e.target.checked)}
                  className="rounded border-gray-300 accent-[#001049]"
                />
                <span className="text-sm text-gray-500">Post anonymously</span>
              </label>
              <button
                type="button"
                disabled={submitting || titleDraft.trim().length === 0}
                onClick={handleSubmit}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#001049] text-white disabled:opacity-50 hover:opacity-90 transition"
              >
                {submitting ? "Submitting…" : "Submit for Review"}
              </button>
            </div>
          </div>
        )}

        {/* Category filter tabs */}
        {!pageLoading && categoryTabs.length > 1 && (
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setActiveCategory("all")}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition shrink-0 ${activeCategory === "all" ? "bg-[#001049] text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"}`}
            >
              All
            </button>
            {categoryTabs.map(({ cat, domain }) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition shrink-0 ${activeCategory === cat ? "bg-[#001049] text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"}`}
              >
                {cat !== "general" && domain && activeCategory !== cat && (
                  <img src={buildLogoUrl(domain)} alt="" className="w-4 h-4 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                )}
                {cat === "general" ? "General" : cat}
              </button>
            ))}
          </div>
        )}

        {/* Feed */}
        {pageLoading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm h-36 animate-pulse" />
            ))}
          </div>
        )}

        {!pageLoading && visibleThreads.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <p className="text-base font-semibold text-gray-500">No posts yet.</p>
            <p className="text-sm text-gray-400 mt-1">Be the first to post.</p>
          </div>
        )}

        {!pageLoading && visibleThreads.length > 0 && (
          <div className="space-y-3">
            {visibleThreads.map((t) => (
              <ThreadCard
                key={t.id}
                thread={t}
                isAdmin={user.role === "admin"}
                onDeleted={(id) => setThreads((prev) => prev.filter((x) => x.id !== id))}
              />
            ))}
            {nextCursor && activeCategory === "all" && (
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition"
                >
                  {loadingMore ? "Loading…" : "Load more"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
