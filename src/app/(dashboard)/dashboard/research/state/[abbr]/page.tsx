"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { STATE_DATA } from "../../state-data";
import { useCollegesData } from "../../use-colleges-data";
import type { StatePhoto } from "@/app/api/state-photos/[abbr]/route";

// ─── Wikipedia summary ────────────────────────────────────────────────────────

type WikiSummary = { extract: string; thumbnail?: { source: string } };

function useWikiSummary(name: string) {
  const [data, setData] = useState<WikiSummary | null>(null);
  useEffect(() => {
    if (!name) return;
    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`, {
      headers: { "Api-User-Agent": "amsa-website/1.0" },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setData(d))
      .catch(() => null);
  }, [name]);
  return data;
}

function usePlaceThumb(place: string) {
  const [thumb, setThumb] = useState<string | null>(null);
  useEffect(() => {
    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(place)}`, {
      headers: { "Api-User-Agent": "amsa-website/1.0" },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.thumbnail?.source && setThumb(d.thumbnail.source))
      .catch(() => null);
  }, [place]);
  return thumb;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  "$" + Math.round(n).toLocaleString("en-US", { maximumFractionDigits: 0 });

const COL_TIER_LABEL = { very_high: "Very High", high: "High", moderate: "Moderate", affordable: "Affordable" } as const;
const COL_TIER_COLOR = {
  very_high: "bg-red-50 text-red-700 border-red-200",
  high: "bg-orange-50 text-orange-700 border-orange-200",
  moderate: "bg-amber-50 text-amber-700 border-amber-200",
  affordable: "bg-green-50 text-green-700 border-green-200",
} as const;
const TRANSPORT_LABEL = { excellent: "Excellent", good: "Good", limited: "Limited", poor: "Car needed" } as const;
const TRANSPORT_COLOR = { excellent: "text-green-700", good: "text-blue-700", limited: "text-amber-700", poor: "text-red-600" } as const;

// ─── Icons ────────────────────────────────────────────────────────────────────

function IcHome() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
}
function IcBus() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="13" rx="2"/><path d="M3 16h18M8 20h.01M16 20h.01M3 7h18"/></svg>;
}
function IcDollar() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v12M9 9.5c0-1.38 1.34-2.5 3-2.5s3 1.12 3 2.5-1.34 2.5-3 2.5-3 1.12-3 2.5 1.34 2.5 3 2.5 3-1.12 3-2.5"/></svg>;
}
function IcCity() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg>;
}
function IcCloud() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>;
}
function IcLightbulb() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M9 21h6M12 3a6 6 0 0 1 6 6c0 2.4-1.4 4.5-3.5 5.6L14 17H10l-.5-2.4C7.4 13.5 6 11.4 6 9a6 6 0 0 1 6-6z"/></svg>;
}
function IcMapPin() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
}
function IcExternalLink() {
  return <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>;
}
function IcChevronLeft() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>;
}
function IcChevronRight() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>;
}
function IcX() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>;
}

// ─── Photo Sidebar (top-right, natural aspect ratio, no cropping) ─────────────

function PhotoSidebar({ abbr }: { abbr: string }) {
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
      <div className="p-4 space-y-2">
        <div className="aspect-video bg-gray-200 animate-pulse rounded-xl" />
        <div className="flex gap-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-10 h-7 bg-gray-100 animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }
  if (photos.length === 0) {
    return (
      <div className="p-4 h-48 flex items-center justify-center text-center">
        <p className="text-xs text-gray-400 leading-relaxed">
          Add PEXELS_API_KEY<br />to .env.local to show photos
        </p>
      </div>
    );
  }

  const photo = photos[idx];

  return (
    <div className="p-3 flex flex-col gap-2">
      {/* Main photo — natural aspect ratio, zero cropping */}
      <button
        type="button"
        onClick={() => setLightbox(photo)}
        className="w-full rounded-xl overflow-hidden focus:outline-none cursor-zoom-in group relative"
      >
        <img
          src={photo.large}
          alt={photo.alt}
          className="w-full h-auto block"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-xl" />
      </button>

      {/* Thumbnail strip + attribution */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1 overflow-x-auto pb-0.5 flex-1">
          {photos.slice(0, 20).map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setIdx(i)}
              className={`shrink-0 w-10 h-7 rounded-md overflow-hidden border-2 transition-all ${
                i === idx ? "border-[#001049] opacity-100" : "border-transparent opacity-50 hover:opacity-80"
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

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            <img src={lightbox.large} alt={lightbox.alt} className="w-full rounded-2xl shadow-2xl" />
            <p className="text-white/50 text-xs mt-2 text-right">
              Photo by{" "}
              <a
                href={lightbox.photographerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-white"
                onClick={(e) => e.stopPropagation()}
              >
                {lightbox.photographer}
              </a>{" "}
              on Pexels
            </p>
            <button
              type="button"
              onClick={() => setLightbox(null)}
              className="absolute -top-3 -right-3 bg-white text-[#001049] rounded-full w-8 h-8 flex items-center justify-center shadow-lg"
            >
              <IcX />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Place Card (Wikipedia thumbnail) ────────────────────────────────────────

function PlaceCard({ place }: { place: string }) {
  const thumb = usePlaceThumb(place);

  return (
    <a
      href={`https://en.wikipedia.org/wiki/${encodeURIComponent(place)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group rounded-2xl overflow-hidden border border-gray-100 hover:border-[#001049]/25 shadow-sm hover:shadow-md transition-all bg-white"
    >
      <div className="aspect-video bg-gradient-to-br from-[#001049]/5 to-[#001049]/10 overflow-hidden relative">
        {thumb ? (
          <img
            src={thumb}
            alt={place}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <IcMapPin />
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
      </div>
      <div className="px-3 py-2.5 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-gray-700 group-hover:text-[#001049] leading-snug">{place}</p>
        <span className="text-gray-300 group-hover:text-[#001049]/50 shrink-0">
          <IcExternalLink />
        </span>
      </div>
    </a>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function StateDetailPage() {
  const { abbr } = useParams<{ abbr: string }>();
  const upperAbbr = abbr?.toUpperCase() ?? "";
  const info = STATE_DATA[upperAbbr];
  const wiki = useWikiSummary(info?.name ?? "");
  const { colleges } = useCollegesData();

  const stateColleges = colleges.filter((c) => c.state?.trim().toUpperCase() === upperAbbr);
  const ranked = stateColleges.filter((c) => c.nationalRank != null);
  const topRank = ranked.length > 0 ? Math.min(...ranked.map((c) => c.nationalRank!)) : null;
  const avgCOA =
    stateColleges.length > 0
      ? Math.round(stateColleges.reduce((s, c) => s + c.totalCostOfAttendance, 0) / stateColleges.length)
      : null;

  if (!info) {
    return (
      <div className="py-8 px-4 md:px-7">
        <Link href="/dashboard/research" className="text-sm text-[#001049] hover:underline mb-4 inline-block">
          ← Back to Research
        </Link>
        <p className="text-gray-500">State not found.</p>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 md:px-7">

      {/* Back */}
      <Link
        href="/dashboard/research"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#001049] mb-5 transition-colors"
      >
        <IcChevronLeft />
        Back to College Research
      </Link>

      {/* ── MAIN CARD ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="flex flex-col lg:flex-row">

          {/* ── Left: text content ── */}
          <div className="flex-1 min-w-0 divide-y divide-gray-100">

            {/* Header */}
            <div className="px-6 pt-5 pb-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="text-3xl font-bold text-[#001049]">{info.name}</h1>
                  <p className="text-sm text-gray-500 mt-1">
                    {stateColleges.length} tracked school{stateColleges.length !== 1 ? "s" : ""}
                    {topRank != null ? ` · Best national rank #${topRank}` : ""}
                  </p>
                </div>
                <span className={`text-sm font-semibold px-3 py-1.5 rounded-full border shrink-0 ${COL_TIER_COLOR[info.colTier]}`}>
                  Cost of Living: {COL_TIER_LABEL[info.colTier]}
                </span>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100">
              {[
                { icon: <IcHome />, label: "Monthly Rent", value: info.monthlyRent, sub: "1-bedroom apt" },
                { icon: <IcBus />, label: "Public Transit", value: TRANSPORT_LABEL[info.publicTransport], sub: "in major cities", color: TRANSPORT_COLOR[info.publicTransport] },
                { icon: <IcDollar />, label: "Avg Total COA", value: avgCOA != null ? fmt(avgCOA) + "/yr" : "N/A", sub: "tracked schools" },
                { icon: <IcCity />, label: "Major Cities", value: info.cities.slice(0, 2).join(", "), sub: info.cities.length > 2 ? `+${info.cities.length - 2} more` : "" },
              ].map(({ icon, label, value, sub, color }) => (
                <div key={label} className="px-5 py-4">
                  <div className="flex items-center gap-1.5 text-[#001049]/50 mb-2">{icon}<p className="text-xs font-medium text-gray-400">{label}</p></div>
                  <p className={`text-lg font-bold ${color ?? "text-[#001049]"}`}>{value}</p>
                  {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
                </div>
              ))}
            </div>

            {/* Climate + tip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
              <div className="px-5 py-4">
                <div className="flex items-center gap-1.5 text-[#001049]/50 mb-2">
                  <IcCloud /><p className="text-xs font-bold text-[#001049] uppercase tracking-wide">Climate</p>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{info.climate}</p>
              </div>
              <div className="px-5 py-4 bg-[#FFFCF3]">
                <div className="flex items-center gap-1.5 text-amber-600 mb-2">
                  <IcLightbulb /><p className="text-xs font-bold text-amber-700 uppercase tracking-wide">Tip for International Students</p>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{info.intlTip}</p>
              </div>
            </div>

          </div>

          {/* ── Right: photo sidebar ── */}
          <div className="lg:w-1/2 shrink-0 border-t lg:border-t-0 lg:border-l border-gray-100 bg-gray-50/50">
            <PhotoSidebar abbr={upperAbbr} />
          </div>

        </div>
      </div>

      {/* ── About ── */}
      {wiki?.extract && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 mb-6">
          <p className="text-xs font-bold text-[#001049] uppercase tracking-wide mb-2">About {info.name}</p>
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-5">{wiki.extract}</p>
          <a
            href={`https://en.wikipedia.org/wiki/${encodeURIComponent(info.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[#001049]/60 hover:text-[#001049] mt-2 transition-colors"
          >
            Read more on Wikipedia <IcExternalLink />
          </a>
        </div>
      )}

      {/* ── Places to Visit ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <IcMapPin />
          <h2 className="text-base font-bold text-[#001049]">Places to Visit</h2>
          <span className="text-xs text-gray-400">· click to open Wikipedia</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {info.places.map((place) => (
            <PlaceCard key={place} place={place} />
          ))}
        </div>
      </div>

      {/* ── Colleges ── */}
      {stateColleges.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-base font-bold text-[#001049] mb-3">
            Schools in {info.name}{" "}
            <span className="text-gray-400 font-normal">({stateColleges.length})</span>
          </h2>
          <div className="space-y-2">
            {stateColleges
              .sort((a, b) => (a.nationalRank ?? 99999) - (b.nationalRank ?? 99999))
              .map((c) => (
                <Link
                  key={c.id}
                  href={`/dashboard/research/college/${c.id}`}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 hover:border-[#001049]/20 hover:bg-[#001049]/3 transition-colors"
                >
                  {c.logoUrl ? (
                    <img src={c.logoUrl} alt={c.name} className="w-8 h-8 rounded-lg object-contain bg-white border border-gray-100 p-0.5 shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-[#001049]/10 flex items-center justify-center text-xs font-bold text-[#001049] shrink-0">
                      {c.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#001049] truncate">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.location}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {c.nationalRank != null && <p className="text-xs font-semibold text-[#001049]">#{c.nationalRank}</p>}
                    <p className="text-xs text-gray-400">{fmt(c.totalCostOfAttendance)}/yr</p>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
