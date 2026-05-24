"use client";

import { useState, useEffect, useRef, useCallback, type ChangeEvent } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { STATE_DATA } from "../../research/state-data";
import type { StatePhoto } from "@/app/api/state-photos/[abbr]/route";

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
  Users: {
    id: number;
    firstName: string;
    lastName: string;
    profilePic: string | null;
  } | null;
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

// ─── Photo Gallery ────────────────────────────────────────────────────────────

function PhotoGallery({ abbr }: { abbr: string }) {
  const [photos, setPhotos] = useState<StatePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);
  const [lightbox, setLightbox] = useState<StatePhoto | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/state-photos/${abbr}`)
      .then((r) => r.json())
      .then((d) => { setPhotos(d.photos ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [abbr]);

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="aspect-video bg-gray-100 animate-pulse rounded-lg" />
        <div className="flex gap-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-12 h-8 bg-gray-100 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (photos.length === 0) return null;

  const photo = photos[idx];

  return (
    <div className="space-y-2">
      <button
        onClick={() => setLightbox(photo)}
        className="w-full rounded-2xl overflow-hidden cursor-zoom-in group relative"
      >
        <img
          src={photo.large}
          alt={photo.alt}
          className="w-full h-auto block"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
      </button>
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1 overflow-x-auto pb-0.5 flex-1">
          {photos.slice(0, 20).map((p, i) => (
            <button
              key={p.id}
              onClick={() => setIdx(i)}
              className={`shrink-0 w-12 h-8 rounded-lg overflow-hidden border-2 transition-all ${
                i === idx ? "border-[#001049] opacity-100" : "border-transparent opacity-40 hover:opacity-70"
              }`}
            >
              <img src={p.thumb} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
        <a
          href="https://www.pexels.com"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-[10px] text-gray-300 hover:text-gray-500 transition-colors"
        >
          via Pexels
        </a>
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            <img src={lightbox.large} alt={lightbox.alt} className="w-full rounded-2xl shadow-2xl" />
            <p className="text-white/50 text-xs mt-2 text-right">
              Photo by{" "}
              <a href={lightbox.photographerUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-white" onClick={(e) => e.stopPropagation()}>
                {lightbox.photographer}
              </a>{" "}
              on Pexels
            </p>
            <button
              onClick={() => setLightbox(null)}
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
    <p className="text-sm text-gray-400 text-center py-4">Sign in to leave a review.</p>
  );

  return (
    <div className="bg-gray-50 rounded-xl border-2 border-gray-200 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Share your experience</p>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={`What's it like living in ${STATE_DATA[abbr.toUpperCase()]?.name}? Rent, costs, neighborhoods, food…`}
        rows={3}
        maxLength={2000}
        className="w-full resize-none rounded-lg border-2 border-gray-200 focus:outline-none focus:border-[#001049] px-3 py-2 text-sm text-gray-800 placeholder-gray-400 transition-colors bg-white"
      />
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={files.length >= MAX_REVIEW_IMAGES}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-[#001049] disabled:opacity-40 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
            Photo{files.length > 0 ? ` (${files.length}/${MAX_REVIEW_IMAGES})` : ""}
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={onPickFiles} />
          {previews.map((url, i) => (
            <div key={i} className="relative w-8 h-8 rounded-md overflow-hidden border border-gray-200">
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
        <button
          onClick={submit}
          disabled={submitting || content.trim().length < 10}
          className="px-4 py-1.5 rounded-lg bg-[#001049] text-white text-sm font-semibold disabled:opacity-40 hover:bg-[#001049]/90 transition-colors"
        >
          {submitting ? "Posting…" : "Post"}
        </button>
      </div>
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </div>
  );
}

// ─── Review Item ─────────────────────────────────────────────────────────────

function ReviewItem({
  review,
  currentUserId,
  currentUserRole,
  onDelete,
}: {
  review: Review;
  currentUserId: number | undefined;
  currentUserRole: string | undefined;
  onDelete: (id: string) => void;
}) {
  const { authFetch } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const author = review.Users;
  const initials = author
    ? `${author.firstName?.[0] ?? ""}${author.lastName?.[0] ?? ""}`.toUpperCase()
    : "?";
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

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="border-b-2 border-gray-100 last:border-0 py-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-[#FFCA3A] flex items-center justify-center text-[#001049] text-xs font-bold shrink-0 overflow-hidden">
          {author?.profilePic
            ? <img src={author.profilePic} alt={initials} className="w-full h-full object-cover" />
            : initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-800">
                {author ? `${author.firstName} ${author.lastName}` : "Member"}
              </span>
              <span className="text-xs text-gray-400">{fmt(review.created_at)}</span>
            </div>
            {canDelete && (
              <button
                onClick={deleteReview}
                disabled={deleting}
                className="text-gray-300 hover:text-red-500 transition-colors disabled:opacity-40"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </button>
            )}
          </div>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{review.content}</p>
          {review.images.length > 0 && (
            <div className="flex gap-2 mt-2 flex-wrap">
              {review.images.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setLightbox(url)}
                  className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200 hover:opacity-90 transition-opacity"
                >
                  <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="" className="max-w-full max-h-full rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

// ─── Reviews Section ─────────────────────────────────────────────────────────

function ReviewsSection({ abbr }: { abbr: string }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/places/reviews?stateAbbr=${abbr}`)
      .then((r) => r.json())
      .then((d) => { setReviews(d.reviews ?? []); setLoading(false); })
      .catch(() => { setError("Failed to load reviews."); setLoading(false); });
  }, [abbr]);

  useEffect(() => { load(); }, [load]);

  const onCreated = (r: Review) => setReviews((prev) => [r, ...prev]);
  const onDelete = (id: string) => setReviews((prev) => prev.filter((r) => r.id !== id));

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden">
      <div className="px-5 pt-5 pb-4 border-b-2 border-gray-100">
        <h3 className="text-base font-bold text-[#001049]">Community Reviews</h3>
        <p className="text-xs text-gray-400 mt-0.5">
          Members sharing what it&apos;s like to live in {STATE_DATA[abbr.toUpperCase()]?.name}
        </p>
      </div>
      <div className="p-5 space-y-4">
        <ReviewComposer abbr={abbr.toUpperCase()} onCreated={onCreated} />

        {error && !loading && (
          <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
            {error} — make sure the <code className="font-mono">place_reviews</code> table exists in Supabase.
          </p>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-gray-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-32" />
                  <div className="h-3 bg-gray-100 rounded w-full" />
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-6">
            Be the first to share your experience with {STATE_DATA[abbr.toUpperCase()]?.name}!
          </p>
        ) : (
          <div>
            {reviews.map((r) => (
              <ReviewItem
                key={r.id}
                review={r}
                currentUserId={user?.id}
                currentUserRole={user?.role}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
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

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 py-6 max-w-6xl mx-auto">
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
        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
          { very_high: "bg-red-50 text-red-700 border-red-200", high: "bg-orange-50 text-orange-700 border-orange-200", moderate: "bg-amber-50 text-amber-700 border-amber-200", affordable: "bg-green-50 text-green-700 border-green-200" }[info.colTier]
        }`}>
          Cost of Living: {COL_TIER_LABEL[info.colTier]}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — stats + info */}
        <div className="lg:col-span-2 space-y-6">

          {/* Stats grid */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden">
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100">
              <div className="px-5 py-5">
                <p className="text-xs text-gray-400 font-medium mb-1">Monthly Rent</p>
                <p className="text-lg font-bold text-[#001049]">{info.monthlyRent}</p>
                <p className="text-xs text-gray-400 mt-0.5">1-bedroom apt</p>
              </div>
              <div className="px-5 py-5">
                <p className="text-xs text-gray-400 font-medium mb-1">Public Transit</p>
                <p className={`text-lg font-bold ${TRANSPORT_COLOR[info.publicTransport]}`}>
                  {TRANSPORT_LABEL[info.publicTransport]}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">in major cities</p>
              </div>
              <div className="px-5 py-5">
                <p className="text-xs text-gray-400 font-medium mb-1">Temperature</p>
                <p className="text-sm font-bold text-[#001049] leading-snug">{info.tempRange}</p>
              </div>
              <div className="px-5 py-5">
                <p className="text-xs text-gray-400 font-medium mb-1">Major Cities</p>
                <p className="text-base font-bold text-[#001049]">{info.cities.slice(0, 2).join(", ")}</p>
                {info.cities.length > 2 && (
                  <p className="text-xs text-gray-400 mt-0.5">+{info.cities.length - 2} more</p>
                )}
              </div>
            </div>

            {/* All cities */}
            <div className="px-5 py-4 border-t-2 border-gray-100">
              <p className="text-xs font-bold text-[#001049] uppercase tracking-wide mb-2">All Cities</p>
              <div className="flex flex-wrap gap-1.5">
                {info.cities.map((city) => (
                  <span key={city} className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
                    {city}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Climate + Transit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border-2 border-gray-200 px-5 py-5">
              <p className="text-xs font-bold text-[#001049] uppercase tracking-wide mb-2">Climate</p>
              <p className="text-sm text-gray-600 leading-relaxed">{info.climate}</p>
            </div>
            <div className="bg-white rounded-2xl border-2 border-gray-200 px-5 py-5">
              <p className="text-xs font-bold text-[#001049] uppercase tracking-wide mb-2">Getting Around</p>
              <p className="text-sm text-gray-600 leading-relaxed">{info.transitInfo}</p>
            </div>
          </div>

          {/* Notable places */}
          {info.places.length > 0 && (
            <div className="bg-white rounded-2xl border-2 border-gray-200 px-5 py-5">
              <p className="text-xs font-bold text-[#001049] uppercase tracking-wide mb-3">Notable Places</p>
              <div className="flex flex-wrap gap-2">
                {info.places.map((place) => (
                  <span key={place} className="text-sm px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 font-medium">
                    {place}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          <ReviewsSection abbr={abbr} />
        </div>

        {/* Right column — photos */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-4">
            <p className="text-xs font-bold text-[#001049] uppercase tracking-wide mb-3">
              Photos of {info.name}
            </p>
            <PhotoGallery abbr={abbr} />
          </div>
        </div>
      </div>
    </div>
  );
}
