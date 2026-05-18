"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

export type HubThreadItem = {
  id: number;
  title: string;
  body: string;
  category: string;
  categoryDomain: string | null;
  images: string[];
  status: string;
  isAnon: boolean;
  asker: { id: number; firstName: string; lastName: string; profilePic: string | null } | null;
  commentCount: number;
  approvedAt: string | null;
  createdAt: string;
};

type SchoolResult = { name: string; domain: string };

type ThreadComposerProps = {
  onCreated: (thread: HubThreadItem) => void;
  onClose?: () => void;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_TITLE = 150;
const MAX_BODY = 2000;
const MAX_IMAGES = 1;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const LOGO_DEV_TOKEN = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN?.trim();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildLogoUrl(domain: string): string {
  const base = `https://img.logo.dev/${domain}`;
  return LOGO_DEV_TOKEN ? `${base}?token=${encodeURIComponent(LOGO_DEV_TOKEN)}` : base;
}

async function fetchSchoolSuggestions(query: string): Promise<SchoolResult[]> {
  if (!query.trim()) return [];
  try {
    const res = await fetch(
      `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(query)}`
    );
    if (!res.ok) return [];
    const results = (await res.json()) as Array<{ name?: string; domain?: string }>;
    return results
      .filter((r) => r.name && r.domain?.endsWith(".edu"))
      .slice(0, 5)
      .map((r) => ({ name: r.name!, domain: r.domain! }));
  } catch {
    return [];
  }
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253M3 12a8.96 8.96 0 0 0 .284 2.253" />
    </svg>
  );
}

// ─── School search ────────────────────────────────────────────────────────────

function SchoolSearch({
  selectedName,
  selectedDomain,
  onSelect,
}: {
  selectedName: string;
  selectedDomain: string | null;
  onSelect: (name: string, domain: string | null) => void;
}) {
  const isGeneral = !selectedName || selectedName.toLowerCase() === "general";
  const [query, setQuery] = useState(() => (isGeneral ? "" : selectedName));
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SchoolResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null);
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
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    if (wrapRef.current) {
      const r = wrapRef.current.getBoundingClientRect();
      setDropdownRect({ top: r.bottom + 6, left: r.left, width: r.width });
    }
    setOpen(true);
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
            <img src={buildLogoUrl(selectedDomain)} alt="" className="w-4 h-4 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          )}
        </div>
        <input
          type="text"
          value={displayValue}
          onChange={(e) => { setQuery(e.target.value); handleOpen(); }}
          onFocus={handleOpen}
          placeholder="Search schools…"
          className="w-full border border-gray-200 rounded-xl pl-9 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#001049]/20 bg-white"
        />
        <div className="absolute right-3">
          {searching ? (
            <svg className="animate-spin w-4 h-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : query ? (
            <button type="button" onMouseDown={(e) => { e.preventDefault(); setQuery(""); setResults([]); onSelect("general", null); }}
              className="text-gray-400 hover:text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          ) : null}
        </div>
      </div>

      {open && dropdownRect && (showGeneral || results.length > 0 || searching) && (
        <div
          className="fixed z-200 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden"
          style={{ top: dropdownRect.top, left: dropdownRect.left, width: dropdownRect.width }}
        >
          {showGeneral && (
            <button type="button"
              onMouseDown={(e) => { e.preventDefault(); onSelect("general", null); setQuery(""); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left ${isGeneral && !query ? "bg-gray-50" : ""}`}>
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

          {showGeneral && results.length > 0 && <div className="mx-4 border-t border-gray-100" />}

          {results.map((s) => {
            const isSelected = selectedName === s.name;
            return (
              <button key={s.domain} type="button"
                onMouseDown={(e) => { e.preventDefault(); onSelect(s.name, s.domain); setQuery(s.name); setOpen(false); setResults([]); }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left ${isSelected ? "bg-gray-50" : ""}`}>
                <div className="w-8 h-8 flex items-center justify-center shrink-0">
                  <img src={buildLogoUrl(s.domain)} alt="" className="w-6 h-6 object-contain"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.style.display = "none";
                      img.parentElement!.innerHTML = `<span class="text-xs font-bold text-gray-400">${s.name[0]}</span>`;
                    }} />
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

// ─── Main component ───────────────────────────────────────────────────────────

export default function ThreadComposer({ onCreated, onClose }: ThreadComposerProps) {
  const { user, authFetch } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [categoryName, setCategoryName] = useState("general");
  const [categoryDomain, setCategoryDomain] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isAnon, setIsAnon] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const previewUrls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previewUrls.forEach((u) => URL.revokeObjectURL(u)), [previewUrls]);

  const canGoNext = title.trim().length > 0 && title.trim().length <= MAX_TITLE && files.length <= MAX_IMAGES;
  const canSubmit = canGoNext && !submitting;

  const onBodyChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
    setBody(el.value);
  };

  const onPickFiles = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (!selected.length) return;
    const tooLarge = selected.find((f) => f.size > MAX_FILE_SIZE);
    if (tooLarge) { setError(`"${tooLarge.name}" exceeds 5 MB.`); return; }
    const nonImage = selected.find((f) => !f.type.startsWith("image/"));
    if (nonImage) { setError(`"${nonImage.name}" is not an image.`); return; }
    setError("");
    setFiles((prev) => [...prev, ...selected].slice(0, MAX_IMAGES));
    e.target.value = "";
  };

  const removeFile = (i: number) => setFiles((prev) => prev.filter((_, idx) => idx !== i));

  const uploadFiles = async (): Promise<string[]> => {
    if (!user || files.length === 0) return [];
    const urls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() ?? "jpg" : "jpg";
      const path = `${user.id}/${Date.now()}-${i}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("post-images").upload(path, file, { upsert: false, contentType: file.type });
      if (uploadErr) throw new Error(`Image upload failed: ${uploadErr.message}`);
      const { data: { publicUrl } } = supabase.storage.from("post-images").getPublicUrl(path);
      urls.push(publicUrl);
    }
    return urls;
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    try {
      const images = await uploadFiles();
      const data = await authFetch("/api/hub-threads", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          category: categoryName,
          categoryDomain,
          images,
          isAnon,
        }),
      });
      onCreated(data.thread as HubThreadItem);
      setTitle(""); setBody(""); setCategoryName("general"); setCategoryDomain(null);
      setFiles([]); setIsAnon(false); setStep(1);
      onClose?.();
    } catch (e: any) {
      setError(e?.message ?? "Failed to submit post.");
    } finally {
      setSubmitting(false);
    }
  };

  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase();

  const Header = (
    <div className="flex items-start gap-3 px-5 pt-5 pb-4">
      <div className="w-12 h-12 rounded-full bg-[#FFCA3A] flex items-center justify-center text-[#001049] text-sm font-bold shrink-0 overflow-hidden">
        {user?.profilePic
          ? <img src={user.profilePic} alt={user.firstName} className="w-full h-full object-cover" />
          : initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-base font-semibold text-gray-900">{user?.firstName} {user?.lastName}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <span className="text-xs text-gray-400">Reviewed before publishing</span>
        </div>
      </div>
      {onClose && (
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-400 hover:text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
      {Header}

      {step === 1 ? (
        <>
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 space-y-4 py-3">
            {/* Title */}
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your post a title…"
                maxLength={MAX_TITLE}
                className="w-full text-xl font-semibold text-gray-900 placeholder:text-gray-300 placeholder:font-light bg-transparent focus:outline-none resize-none leading-snug"
              />
              {title.length > 0 && (
                <p className="text-xs text-gray-300 mt-1">{title.length}/{MAX_TITLE}</p>
              )}
            </div>

            {/* Body */}
            <textarea
              ref={bodyRef}
              value={body}
              onChange={onBodyChange}
              placeholder="Add more details… (optional)"
              maxLength={MAX_BODY}
              className="w-full text-base font-light text-gray-700 placeholder:text-gray-300 bg-transparent focus:outline-none resize-none leading-relaxed min-h-24 overflow-hidden"
            />

            {/* Image previews — full-width, same as PostComposer */}
            {files.length > 0 && (
              <div className="flex flex-col gap-2 border-t border-gray-100 pt-3">
                {files.map((file, idx) => (
                  <div key={`${file.name}-${idx}`} className="relative rounded-lg overflow-hidden">
                    <img src={previewUrls[idx]} alt={`Image ${idx + 1}`} className="w-full" />
                    <button type="button" onClick={() => removeFile(idx)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white text-xs hover:bg-black/75 flex items-center justify-center">
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          {/* Toolbar */}
          <div className="flex items-center px-5 py-4 border-t border-gray-100">
            <span className="text-xs text-gray-400 w-16">{body.length}/{MAX_BODY}</span>

            <div className="flex-1 flex items-center justify-center gap-1">
              {/* Image upload */}
              <label className={`p-2 rounded-lg transition ${files.length < MAX_IMAGES ? "hover:bg-gray-100 cursor-pointer text-gray-500 hover:text-gray-700" : "opacity-40 cursor-not-allowed text-gray-400"}`}
                title={files.length >= MAX_IMAGES ? "Max 1 image" : "Add image"}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={files.length >= MAX_IMAGES}
                  onChange={onPickFiles}
                  className="hidden"
                />
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
              </label>

              {files.length > 0 && (
                <span className="text-xs text-gray-400">{files.length}/{MAX_IMAGES}</span>
              )}
            </div>

            <div className="w-16 flex justify-end">
              <button type="button" onClick={() => setStep(2)} disabled={!canGoNext}
                className="px-5 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-40 disabled:bg-gray-200 disabled:text-gray-500 enabled:bg-[#001049] enabled:text-white enabled:hover:opacity-90">
                Next
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Step 2 — details */}
          <div className="flex-1 px-6 py-6 flex flex-col gap-5 overflow-y-auto">
            <div>
              <p className="text-base font-semibold text-gray-900">Where should this go?</p>
              <p className="text-sm text-gray-400 mt-0.5">Pick a school community or post it generally.</p>
            </div>

            <SchoolSearch
              selectedName={categoryName}
              selectedDomain={categoryDomain}
              onSelect={(name, domain) => { setCategoryName(name); setCategoryDomain(domain); }}
            />

            <div className="border-t border-gray-100 pt-4">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  onClick={() => setIsAnon((v) => !v)}
                  className={`relative w-10 h-6 rounded-full transition-colors ${isAnon ? "bg-[#001049]" : "bg-gray-200"}`}
                >
                  <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isAnon ? "translate-x-4" : "translate-x-0"}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Post anonymously</p>
                  <p className="text-xs text-gray-400">Your name won't be shown publicly</p>
                </div>
              </label>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <button type="button" onClick={() => { setStep(1); setError(""); }}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100 transition">
              ← Back
            </button>
            <button type="button" onClick={handleSubmit} disabled={!canSubmit}
              className="px-5 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-40 disabled:bg-gray-200 disabled:text-gray-500 enabled:bg-[#001049] enabled:text-white enabled:hover:opacity-90">
              {submitting ? "Submitting…" : "Submit for Review"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
