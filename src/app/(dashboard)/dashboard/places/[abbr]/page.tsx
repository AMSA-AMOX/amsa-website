"use client";

import { useState, useEffect, useRef, useCallback, type ChangeEvent } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { IoRose, IoRoseOutline } from "react-icons/io5";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { STATE_DATA } from "../../research/state-data";

// ─── Types ────────────────────────────────────────────────────────────────────

type ColTier = "very_high" | "high" | "moderate" | "affordable";
type TransitRating = "excellent" | "good" | "limited" | "poor";

type Review = {
  id: string;
  state_abbr: string;
  content: string;
  images: string[];
  created_at: string;
  user_id: number;
  helpfulCount: number;
  hasHelpful: boolean;
  Users: {
    id: number;
    firstName: string;
    lastName: string;
    profilePic: string | null;
  } | null;
};

type PlacePhoto = {
  thumb: string;
  large: string;
  alt: string;
  photographer: string;
  photographerUrl: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const COL_TIER_LABEL: Record<ColTier, string> = {
  very_high: "Very High",
  high: "High",
  moderate: "Moderate",
  affordable: "Affordable",
};

const COL_TIER_COLOR: Record<ColTier, string> = {
  very_high: "bg-red-50 text-red-700 border-red-200",
  high: "bg-orange-50 text-orange-700 border-orange-200",
  moderate: "bg-amber-50 text-amber-700 border-amber-200",
  affordable: "bg-green-50 text-green-700 border-green-200",
};

const TRANSPORT_LABEL: Record<TransitRating, string> = {
  excellent: "Excellent",
  good: "Good",
  limited: "Limited",
  poor: "Car needed",
};

const TRANSPORT_COLOR: Record<TransitRating, string> = {
  excellent: "text-green-700",
  good: "text-blue-700",
  limited: "text-amber-700",
  poor: "text-red-600",
};

const MAX_REVIEW_IMAGES = 4;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

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

// ─── Place Photo Card (Pexels) ─────────────────────────────────────────────────

function PlacePhotoCard({ query, label }: { query: string; label: string }) {
  const [photo, setPhoto] = useState<PlacePhoto | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/place-photo?q=${encodeURIComponent(query)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!active) return;
        if (d?.photo) setPhoto(d.photo);
        setLoading(false);
      })
      .catch(() => active && setLoading(false));
    return () => { active = false; };
  }, [query]);

  return (
    <div>
      <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 relative">
        {loading ? (
          <div className="w-full h-full animate-pulse bg-gray-200" />
        ) : photo ? (
          <button
            type="button"
            onClick={() => setZoomed(true)}
            className="block w-full h-full group cursor-zoom-in"
          >
            <img
              src={photo.thumb}
              alt={photo.alt || label}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </button>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
        )}
      </div>
      <p className="text-sm font-medium text-gray-800 leading-snug mt-1.5">{label}</p>

      {zoomed && photo && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
          onClick={() => setZoomed(false)}
        >
          <div className="relative max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            <img src={photo.large} alt={photo.alt || label} className="w-full rounded-2xl shadow-2xl" />
            <p className="text-white/50 text-xs mt-2 text-right">
              {label} · Photo by{" "}
              <a
                href={photo.photographerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-white"
                onClick={(e) => e.stopPropagation()}
              >
                {photo.photographer}
              </a>{" "}
              on Pexels
            </p>
            <button
              type="button"
              onClick={() => setZoomed(false)}
              className="absolute -top-3 -right-3 bg-white text-[#001049] rounded-full w-8 h-8 flex items-center justify-center shadow-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Review Composer ─────────────────────────────────────────────────────────

function ReviewComposer({ abbr, onCreated }: { abbr: string; onCreated: (r: Review) => void }) {
  const { user, authFetch } = useAuth();
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  const onPickFiles = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (!selected.length) return;
    if (selected.find((f) => f.size > MAX_FILE_SIZE)) { setError("Max 5 MB per image."); return; }
    if (selected.find((f) => !f.type.startsWith("image/"))) { setError("Images only."); return; }
    setError("");
    setFiles((prev) => [...prev, ...selected].slice(0, MAX_REVIEW_IMAGES));
    e.target.value = "";
  };

  const removeFile = (i: number) => setFiles((prev) => prev.filter((_, idx) => idx !== i));

  const uploadImages = async (): Promise<string[]> => {
    if (!user || files.length === 0) return [];
    const urls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const ext = f.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `reviews/${user.id}/${Date.now()}-${i}.${ext}`;
      const { error: err } = await supabase.storage.from("post-images").upload(path, f, { upsert: false, contentType: f.type });
      if (err) throw new Error(err.message);
      urls.push(supabase.storage.from("post-images").getPublicUrl(path).data.publicUrl);
    }
    return urls;
  };

  const submit = async () => {
    if (content.trim().length < 10) { setError("Write at least 10 characters."); return; }
    setSubmitting(true);
    setError("");
    try {
      const images = await uploadImages();
      const res = await authFetch("/api/places/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stateAbbr: abbr, content: content.trim(), images }),
      });
      if (res?.review) { onCreated(res.review); setContent(""); setFiles([]); }
      else setError(res?.message ?? "Failed to submit.");
    } catch {
      setError("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return (
    <p className="text-sm text-gray-400 text-center py-4">
      <Link href="/login" className="font-semibold text-[#001049] hover:underline">Sign in</Link> to leave a review.
    </p>
  );

  return (
    <div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={`Share your experience living in ${STATE_DATA[abbr.toUpperCase()]?.name}…`}
        rows={3}
        maxLength={2000}
        className="w-full resize-none rounded-xl border-2 border-gray-300 focus:outline-none focus:border-[#001049] px-3 py-2 text-sm text-gray-800 placeholder-gray-400 transition-colors bg-white"
      />
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={onPickFiles} />
      {previews.length > 0 && (
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {previews.map((url, i) => (
            <div key={i} className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between mt-2 gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={files.length >= MAX_REVIEW_IMAGES}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-[#001049] disabled:opacity-40 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          className="px-4 py-2 rounded-xl bg-[#001049] text-white text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          {submitting ? "Posting…" : "Post"}
        </button>
      </div>
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </div>
  );
}

// ─── Review Item (threads-style comment UI) ────────────────────────────────────

function ReviewItem({
  review,
  currentUserId,
  currentUserRole,
  onDelete,
  onHelpful,
  markingHelpful,
}: {
  review: Review;
  currentUserId: number | undefined;
  currentUserRole: string | undefined;
  onDelete: (id: string) => void;
  onHelpful: (id: string) => void;
  markingHelpful: boolean;
}) {
  const { authFetch } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const author = review.Users;
  const initials = author
    ? `${author.firstName?.[0] ?? ""}${author.lastName?.[0] ?? ""}`.toUpperCase()
    : "?";
  const authorName = author ? `${author.firstName} ${author.lastName}`.trim() : "Member";
  const canDelete = currentUserId === review.user_id || currentUserRole === "admin";

  const deleteReview = async () => {
    if (!confirm("Delete this review?")) return;
    setDeleting(true);
    try {
      await authFetch(`/api/places/reviews/${review.id}`, { method: "DELETE" });
      onDelete(review.id);
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-full bg-[#FFCA3A] flex items-center justify-center text-[#001049] text-[10px] font-bold shrink-0 overflow-hidden">
          {author?.profilePic
            ? <img src={author.profilePic} alt="" className="w-full h-full object-cover" />
            : initials}
        </div>
        <span className="text-xs font-semibold text-gray-700">{authorName}</span>
        <span className="text-gray-300">·</span>
        <span className="text-xs text-gray-400">{formatRelative(review.created_at)}</span>
        {canDelete && (
          <button
            onClick={deleteReview}
            disabled={deleting}
            className="ml-auto text-gray-300 hover:text-red-500 transition-colors disabled:opacity-40"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </button>
        )}
      </div>
      <p className="text-base text-gray-700 leading-relaxed whitespace-pre-wrap">{review.content}</p>
      {review.images.length > 0 && (
        <div className="flex gap-2 mt-3 flex-wrap">
          {review.images.map((url, i) => (
            <button
              key={i}
              onClick={() => setLightbox(url)}
              className="w-20 h-20 rounded-xl overflow-hidden border border-gray-200 hover:opacity-90 transition-opacity"
            >
              <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      <div className="mt-3">
        <button
          type="button"
          onClick={() => onHelpful(review.id)}
          disabled={!currentUserId || markingHelpful}
          title={review.hasHelpful ? "Remove helpful" : "Helpful"}
          aria-label={review.hasHelpful ? "Remove helpful" : "Mark as helpful"}
          className={`flex items-center gap-1.5 transition disabled:opacity-50 ${
            review.hasHelpful ? "text-emerald-800" : "text-gray-400 hover:text-emerald-800"
          }`}
        >
          {review.hasHelpful ? (
            <IoRose className="w-6 h-6" aria-hidden />
          ) : (
            <IoRoseOutline className="w-6 h-6" aria-hidden />
          )}
          <span className="text-sm font-medium">Helpful</span>
          {review.helpfulCount > 0 && (
            <span className="text-sm font-medium tabular-nums">{review.helpfulCount}</span>
          )}
        </button>
      </div>

      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="" className="max-w-full max-h-full rounded-xl object-contain shadow-xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

// ─── Reviews Column (own top bar; threads-style comments) ───────────────────────

function ReviewsColumn({ abbr }: { abbr: string }) {
  const { user, authFetch } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [markingHelpful, setMarkingHelpful] = useState<Set<string>>(new Set());

  const load = useCallback(() => {
    setLoading(true);
    const fetcher = user
      ? authFetch(`/api/places/reviews?stateAbbr=${abbr}`)
      : fetch(`/api/places/reviews?stateAbbr=${abbr}`).then((r) => r.json());
    Promise.resolve(fetcher)
      .then((d) => { setReviews(d.reviews ?? []); setLoading(false); })
      .catch(() => { setError("Failed to load reviews."); setLoading(false); });
  }, [abbr, user, authFetch]);

  useEffect(() => { load(); }, [load]);

  const onCreated = (r: Review) =>
    setReviews((prev) => [{ ...r, helpfulCount: 0, hasHelpful: false }, ...prev]);
  const onDelete = (id: string) => setReviews((prev) => prev.filter((r) => r.id !== id));

  const onHelpful = async (id: string) => {
    if (!user || markingHelpful.has(id)) return;
    const current = reviews.find((r) => r.id === id);
    if (!current) return;

    const liking = !current.hasHelpful;
    setMarkingHelpful((prev) => new Set(prev).add(id));
    setReviews((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, hasHelpful: liking, helpfulCount: Math.max(0, r.helpfulCount + (liking ? 1 : -1)) }
          : r
      )
    );

    try {
      const data = await authFetch(`/api/places/reviews/${id}/helpful`, { method: "POST" });
      setReviews((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                hasHelpful: Boolean(data.hasHelpful),
                helpfulCount: Number(data.helpfulCount ?? r.helpfulCount),
              }
            : r
        )
      );
    } catch {
      setReviews((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, hasHelpful: current.hasHelpful, helpfulCount: current.helpfulCount }
            : r
        )
      );
    } finally {
      setMarkingHelpful((prev) => { const next = new Set(prev); next.delete(id); return next; });
    }
  };

  return (
    <div className="flex flex-col lg:h-full min-h-0">
      {/* Reviews top bar */}
      <div className="bg-gray-50 border-b-2 border-gray-300 px-6 py-4 flex items-center justify-between shrink-0">
        <h1 className="text-lg font-bold text-gray-900">Reviews</h1>
      </div>

      {/* Body */}
      <div className="lg:flex-1 lg:overflow-y-auto px-6 py-5 space-y-5">
        {user?.role !== "member" && (
          <ReviewComposer abbr={abbr.toUpperCase()} onCreated={onCreated} />
        )}

        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            {reviews.length} {reviews.length === 1 ? "Review" : "Reviews"}
          </p>

          {error && !loading && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
              {error} — make sure the <code className="font-mono">place_reviews</code> table exists in Supabase.
            </p>
          )}

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 px-5 py-4 animate-pulse">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-gray-100 shrink-0" />
                    <div className="h-3 bg-gray-100 rounded w-24" />
                  </div>
                  <div className="h-3 bg-gray-100 rounded w-full mb-1.5" />
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : reviews.length === 0 && !error ? (
            <div className="flex flex-col items-center text-center py-8">
              <img
                src="/assets/empty/review_leaves.svg"
                alt=""
                className="w-44 h-auto mb-4 select-none pointer-events-none"
                draggable={false}
              />
              <p className="text-sm font-semibold text-gray-600">No reviews yet</p>
              <p className="text-xs text-gray-400 mt-1">Be the first to share your experience!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <ReviewItem
                  key={r.id}
                  review={r}
                  currentUserId={user?.id}
                  currentUserRole={user?.role}
                  onDelete={onDelete}
                  onHelpful={onHelpful}
                  markingHelpful={markingHelpful.has(r.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Info Section (flat row, separated by lines) ───────────────────────────────

function InfoSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="py-5 border-t-2 border-gray-300 first:border-t-0 first:pt-0">
      <p className="text-sm font-semibold tracking-wide uppercase text-gray-400 mb-3">{label}</p>
      {children}
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlaceStatePage() {
  const { abbr: rawAbbr } = useParams<{ abbr: string }>();
  const abbr = rawAbbr?.toUpperCase() ?? "";
  const info = STATE_DATA[abbr];

  if (!info) {
    return (
      <div className="py-8 px-4 md:px-7">
        <Link href="/dashboard/places" className="text-sm text-[#001049] hover:underline mb-4 inline-block">
          ← Back to Places
        </Link>
        <p className="text-gray-500">State not found.</p>
      </div>
    );
  }

  const primaryCity = info.cities[0] ?? info.name;
  const housingLinks = [
    {
      label: "Apartments.com",
      desc: `Rentals across ${info.name}`,
      href: `https://www.apartments.com/${slug(info.name)}/`,
    },
    {
      label: "Zillow Rentals",
      desc: "Houses & apartments for rent",
      href: `https://www.zillow.com/${slug(info.name)}/rentals/`,
    },
    {
      label: `Student housing in ${primaryCity}`,
      desc: "Search student-focused listings",
      href: `https://www.google.com/search?q=${encodeURIComponent(`student housing ${primaryCity} ${info.name}`)}`,
    },
  ];

  const stats = [
    { label: "Monthly Rent", value: info.monthlyRent, sub: "1-bedroom apt", color: "text-[#001049]" },
    { label: "Public Transit", value: TRANSPORT_LABEL[info.publicTransport], sub: "in major cities", color: TRANSPORT_COLOR[info.publicTransport] },
    { label: "Temperature", value: info.tempRange, sub: "", color: "text-[#001049]" },
  ];

  return (
    <div className="lg:h-full flex flex-col lg:flex-row bg-gray-50">
      {/* ── State info section (left div) ── */}
      <div className="flex-1 min-w-0 lg:overflow-y-auto">
        <div className="px-6 py-6 max-w-5xl">
          {/* Back */}
          <Link
            href="/dashboard/places"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#001049] mb-5 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
            </svg>
            Back to Places
          </Link>

          {/* Header */}
          <div className="flex items-center gap-3 flex-wrap mb-6">
            <h2 className="text-2xl font-bold text-[#001049]">{info.name}</h2>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${COL_TIER_COLOR[info.colTier]}`}>
              Cost of Living: {COL_TIER_LABEL[info.colTier]}
            </span>
          </div>

          {/* Stats */}
          <section className="pb-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-5 gap-x-4">
              {stats.map((s) => (
                <div key={s.label}>
                  <p className="text-xs text-gray-400 font-medium mb-1">{s.label}</p>
                  <p className={`text-base font-bold leading-snug ${s.color}`}>{s.value}</p>
                  {s.sub && <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>}
                </div>
              ))}
            </div>
          </section>

          <InfoSection label="Climate">
            <p className="text-sm text-gray-700 leading-relaxed">{info.climate}</p>
          </InfoSection>

          <InfoSection label="Getting Around">
            <p className="text-sm text-gray-700 leading-relaxed">{info.transitInfo}</p>
          </InfoSection>

          {info.cities.length > 0 && (
            <InfoSection label="Major Cities">
              <p className="text-sm text-gray-700 leading-relaxed">{info.cities.join(" · ")}</p>
            </InfoSection>
          )}

          {info.places.length > 0 && (
            <InfoSection label="Notable Places">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {info.places.map((place) => (
                  <PlacePhotoCard key={place} query={`${place} ${info.name}`} label={place} />
                ))}
              </div>
            </InfoSection>
          )}

          {/* Housing & resources */}
          <InfoSection label="Find Housing & Resources">
            <ul className="divide-y-2 divide-gray-200">
              {housingLinks.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-3 py-3 group"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-[#001049] transition-colors">{l.label}</p>
                      <p className="text-xs text-gray-400">{l.desc}</p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-300 group-hover:text-[#001049] shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </InfoSection>
        </div>
      </div>

      {/* ── Reviews section (right div) — divider touches the top bar ── */}
      <aside className="w-full lg:w-[520px] shrink-0 border-t-2 lg:border-t-0 lg:border-l-2 border-gray-300">
        <ReviewsColumn abbr={abbr} />
      </aside>
    </div>
  );
}
