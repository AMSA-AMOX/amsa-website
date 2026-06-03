"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCollegesData } from "../../use-colleges-data";
import type { ScorecardProfile } from "@/app/api/colleges/[id]/scorecard/route";


// ─── SVG Icon library ─────────────────────────────────────────────────────────

type IconProps = { size?: number; className?: string };

function IcBuilding({ size = 18, className = "" }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg>;
}
function IcBarChart({ size = 18, className = "" }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="12" width="4" height="9"/><rect x="10" y="7" width="4" height="14"/><rect x="17" y="3" width="4" height="18"/></svg>;
}
function IcLightbulb({ size = 18, className = "" }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9 21h6M12 3a6 6 0 0 1 6 6c0 2.4-1.4 4.5-3.5 5.6L14 17H10l-.5-2.4C7.4 13.5 6 11.4 6 9a6 6 0 0 1 6-6z"/></svg>;
}
function IcDollar({ size = 18, className = "" }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="9"/><path d="M12 6v12M9 9.5c0-1.38 1.34-2.5 3-2.5s3 1.12 3 2.5-1.34 2.5-3 2.5-3 1.12-3 2.5 1.34 2.5 3 2.5 3-1.12 3-2.5"/></svg>;
}
function IcReceipt({ size = 18, className = "" }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 2v20l3-2 3 2 3-2 3 2 3-2V2l-3 2-3-2-3 2-3-2-3 2z"/><path d="M8 10h8M8 14h5"/></svg>;
}
function IcGradCap({ size = 18, className = "" }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 10l-10 6L2 10l10-6 10 6z"/><path d="M6 12.5V17c0 1.66 2.69 3 6 3s6-1.34 6-3v-4.5"/><path d="M22 10v5"/></svg>;
}
function IcStar({ size = 18, className = "" }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>;
}
function IcUsers({ size = 18, className = "" }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}
function IcGlobe({ size = 18, className = "" }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z"/></svg>;
}
function IcShield({ size = 18, className = "" }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>;
}
function IcGift({ size = 18, className = "" }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><path d="M12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>;
}
function IcRefresh({ size = 18, className = "" }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>;
}
function IcTrophy({ size = 18, className = "" }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 9H3V4h3M18 9h3V4h-3M6 4h12v7a6 6 0 0 1-12 0V4z"/><path d="M8 21h8M12 17v4"/></svg>;
}
function IcFlask({ size = 18, className = "" }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9 3h6M9 3v7l-5 9a1 1 0 0 0 .9 1.5h14.2A1 1 0 0 0 20 19l-5-9V3"/><path d="M8 17h8"/></svg>;
}
function IcMapPin({ size = 18, className = "" }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
}
function IcAlert({ size = 18, className = "" }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
}
function IcXCircle({ size = 18, className = "" }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>;
}
function IcCheck({ size = 18, className = "" }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12"/></svg>;
}
function IcExternalLink({ size = 14, className = "" }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>;
}
function IcFileText({ size = 18, className = "" }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
const pct = (n: number) => Math.round(n) + "%";

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

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useScorecardProfile(unitid: number | null) {
  const [data, setData] = useState<ScorecardProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!unitid) return;
    setLoading(true);
    fetch(`/api/colleges/${unitid}/scorecard`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [unitid]);

  return { profile: data, profileLoading: loading };
}

// ─── Flat primitives (no bubbles, no color fills) ─────────────────────────────

// Section header + body, separated by a rule — matches Places → State page.
function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="py-6 border-t-2 border-gray-200 first:border-t-0 first:pt-0">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[#001049] opacity-60 shrink-0">{icon}</span>
        <p className="text-sm font-bold tracking-wide uppercase text-gray-500">{title}</p>
      </div>
      {children}
    </section>
  );
}

// Plain label / value stat (no box, no fill).
function Stat({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 font-medium mb-1">{label}</p>
      <p className="text-base font-bold leading-snug text-[#001049]">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// Big number stat (no box, no fill).
function BigStat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-2xl font-black text-[#001049] leading-none">{value}</p>
      <p className="text-xs text-gray-500 mt-1 leading-tight">{label}</p>
    </div>
  );
}

// Monochrome progress bar.
function Bar({ pct: width }: { pct: number }) {
  return (
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className="h-full bg-[#001049] rounded-full" style={{ width: `${Math.min(Math.max(width, 0), 100)}%` }} />
    </div>
  );
}

// Test score range (monochrome).
function ScoreRange({ label, lo, hi, min = 200, max = 800 }: {
  label: string; lo: number | null; hi: number | null; min?: number; max?: number;
}) {
  if (!lo && !hi) return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm text-gray-300">N/A</span>
    </div>
  );
  const range = max - min;
  const loX = lo ? ((lo - min) / range) * 100 : 0;
  const hiX = hi ? ((hi - min) / range) * 100 : 100;
  return (
    <div className="py-2.5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600">{label}</span>
        <span className="text-sm font-bold text-[#001049]">{lo ?? "?"} – {hi ?? "?"}</span>
      </div>
      <div className="relative h-2 bg-gray-100 rounded-full">
        <div className="absolute h-full rounded-full bg-[#001049]" style={{ left: `${loX}%`, width: `${hiX - loX}%` }}/>
      </div>
      <div className="flex justify-between mt-1 text-[10px] text-gray-300">
        <span>{min}</span><span>{max}</span>
      </div>
    </div>
  );
}

// ─── College photo: Pexels campus search + Wikipedia fallback ──────────────────

type CPhoto = { id: number; thumb: string; large: string; photographer: string; photographerUrl: string; alt: string };

function useCollegePhotos(name: string) {
  const [photos, setPhotos] = useState<CPhoto[]>([]);
  const [wikiThumb, setWikiThumb] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!name) return;
    setLoading(true);
    fetch(`/api/college-photos?name=${encodeURIComponent(name)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.photos?.length) {
          setPhotos(d.photos);
          setLoading(false);
        } else {
          return fetch(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`,
            { headers: { "Api-User-Agent": "amsa-website/1.0" } }
          )
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
              if (d?.thumbnail?.source) setWikiThumb(d.thumbnail.source.replace(/\/\d+px-/, "/800px-"));
              setLoading(false);
            });
        }
      })
      .catch(() => setLoading(false));
  }, [name]);

  return { photos, wikiThumb, loading };
}

function CollegeWikiPhoto({ name }: { name: string }) {
  const { photos, wikiThumb, loading } = useCollegePhotos(name);
  const [idx, setIdx] = useState(0);
  const [lightbox, setLightbox] = useState<CPhoto | string | null>(null);

  if (loading) return <div className="aspect-video bg-gray-100 animate-pulse rounded-lg" />;

  if (photos.length > 0) {
    const photo = photos[idx];
    return (
      <div className="flex flex-col gap-2">
        <button type="button" onClick={() => setLightbox(photo)} className="w-full rounded-lg overflow-hidden focus:outline-none cursor-zoom-in">
          <img src={photo.large} alt={photo.alt} className="w-full h-auto block" loading="lazy" />
        </button>
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1 overflow-x-auto pb-0.5 flex-1">
            {photos.slice(0, 8).map((p, i) => (
              <button key={p.id} type="button" onClick={() => setIdx(i)}
                className={`shrink-0 w-10 h-7 rounded-md overflow-hidden border transition-all ${i === idx ? "border-[#001049] opacity-100" : "border-transparent opacity-50 hover:opacity-80"}`}>
                <img src={p.thumb} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
          <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer" className="shrink-0 text-[10px] text-gray-300 hover:text-gray-500 transition-colors">via Pexels</a>
        </div>
        {lightbox && typeof lightbox === "object" && "large" in lightbox && (
          <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
            <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
              <img src={(lightbox as CPhoto).large} alt={(lightbox as CPhoto).alt} className="w-full h-auto rounded-2xl shadow-2xl" />
              <p className="text-white/50 text-xs mt-2 text-right">
                Photo by <a href={(lightbox as CPhoto).photographerUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-white" onClick={(e) => e.stopPropagation()}>{(lightbox as CPhoto).photographer}</a> on Pexels
              </p>
              <button type="button" onClick={() => setLightbox(null)} className="absolute -top-3 -right-3 bg-white text-[#001049] rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (wikiThumb) {
    return (
      <div className="flex flex-col gap-2">
        <button type="button" onClick={() => setLightbox(wikiThumb)} className="w-full rounded-lg overflow-hidden focus:outline-none cursor-zoom-in">
          <img src={wikiThumb} alt={name} className="w-full h-auto block" loading="lazy" />
        </button>
        <a href={`https://en.wikipedia.org/wiki/${encodeURIComponent(name)}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-gray-400 hover:text-gray-600 text-center transition-colors">via Wikipedia</a>
        {lightbox && typeof lightbox === "string" && (
          <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
            <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
              <img src={lightbox} alt={name} className="w-full h-auto rounded-2xl shadow-2xl" />
              <button type="button" onClick={() => setLightbox(null)} className="absolute -top-3 -right-3 bg-white text-[#001049] rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}

// ─── Students & posts (inline, single column) ─────────────────────────────────

type SchoolStudent = {
  id: number; firstName: string | null; lastName: string | null;
  profilePic: string | null; role: string | null;
  major: string | null; graduationYear: string | null;
};

type CollegePost = {
  id: number; title: string; body: string; images: string[];
  createdAt: string; appreciationCount: number; topic: string | null;
  author: { id: number; firstName: string; lastName: string; profilePic: string | null; headline: string | null } | null;
  college: { id: number; name: string; logoUrl: string | null } | null;
};

function StudentRow({ s }: { s: SchoolStudent }) {
  const initials = `${s.firstName?.[0] ?? ""}${s.lastName?.[0] ?? ""}`.toUpperCase();
  return (
    <a href={`/dashboard/network/${s.id}`} className="flex items-center gap-3 py-3 group">
      <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-semibold shrink-0 overflow-hidden">
        {s.profilePic ? <img src={s.profilePic} alt="" className="w-full h-full object-cover" /> : initials}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900 group-hover:text-[#001049] transition-colors truncate">
          {s.firstName} {s.lastName}
          {s.role === "ambassador" && <span className="ml-2 text-xs font-medium text-gray-400">Ambassador</span>}
        </p>
        {(s.major || s.graduationYear) && (
          <p className="text-xs text-gray-400 truncate">{[s.major, s.graduationYear].filter(Boolean).join(" · ")}</p>
        )}
      </div>
    </a>
  );
}

function PostRow({ post }: { post: CollegePost }) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  const initials = `${post.author?.firstName?.[0] ?? ""}${post.author?.lastName?.[0] ?? ""}`.toUpperCase() || "U";
  return (
    <div className="py-4">
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold flex items-center justify-center overflow-hidden shrink-0">
          {post.author?.profilePic ? <img src={post.author.profilePic} alt="" className="w-full h-full object-cover" /> : initials}
        </div>
        <span className="text-xs font-semibold text-gray-700">
          {post.author ? `${post.author.firstName} ${post.author.lastName}` : "AMSA Member"}
        </span>
        <span className="text-gray-300">·</span>
        <span className="text-xs text-gray-400">{formatRelative(post.createdAt)}</span>
        {post.topic && <span className="text-xs text-gray-400 ml-auto">{post.topic}</span>}
      </div>
      <p className="text-sm font-semibold text-[#001049] leading-snug">{post.title}</p>
      {post.body && <p className="text-sm text-gray-600 mt-1 leading-relaxed whitespace-pre-wrap line-clamp-4">{post.body}</p>}
      {post.images.length > 0 && (
        <div className="flex gap-2 mt-3 flex-wrap">
          {post.images.slice(0, 4).map((url, i) => (
            <button key={i} onClick={() => setLightbox(url)} className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200 hover:opacity-90 transition-opacity">
              <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}
      {post.appreciationCount > 0 && <p className="text-xs text-gray-400 mt-2">{post.appreciationCount} appreciations</p>}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="" className="max-w-full max-h-full rounded-xl object-contain shadow-xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

function StudentsSection({ unitid }: { unitid: number }) {
  const [students, setStudents] = useState<SchoolStudent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!unitid) return;
    setLoading(true);
    fetch(`/api/colleges/${unitid}/students`)
      .then((r) => (r.ok ? r.json() : { students: [] }))
      .then((d) => setStudents(d.students ?? []))
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, [unitid]);

  return (
    <Section icon={<IcUsers size={18}/>} title={loading ? "AMSA Members at This School" : `${students.length} AMSA ${students.length === 1 ? "Member" : "Members"} at This School`}>
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}
        </div>
      ) : students.length === 0 ? (
        <p className="text-sm text-gray-400">No AMSA members have linked this school to their profile yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 divide-y divide-gray-100 sm:divide-y-0">
          {students.map((s) => <StudentRow key={s.id} s={s} />)}
        </div>
      )}
    </Section>
  );
}

function PostsSection({ unitid }: { unitid: number }) {
  const [posts, setPosts] = useState<CollegePost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!unitid) return;
    setLoading(true);
    fetch(`/api/colleges/${unitid}/posts`)
      .then((r) => (r.ok ? r.json() : { posts: [] }))
      .then((d) => setPosts(d.posts ?? []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [unitid]);

  return (
    <Section icon={<IcFileText size={18}/>} title={loading ? "Posts From This School" : `${posts.length} ${posts.length === 1 ? "Post" : "Posts"} From This School`}>
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />)}
        </div>
      ) : posts.length === 0 ? (
        <p className="text-sm text-gray-400">No posts from this school yet. Be the first to share your experience.</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {posts.map((post) => <PostRow key={post.id} post={post} />)}
          <a href="/dashboard/feed" className="inline-flex items-center gap-1 text-xs font-semibold text-[#001049] hover:underline pt-3">
            View all in Feed <IcExternalLink size={11}/>
          </a>
        </div>
      )}
    </Section>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function CollegeDetailPage() {
  const params = useParams<{ id: string }>();
  const unitid = Number(params?.id);
  const { colleges, loading, error } = useCollegesData();
  const college = useMemo(() => colleges.find((c) => c.id === unitid) ?? null, [colleges, unitid]);

  const { profile } = useScorecardProfile(college ? unitid : null);
  const [logoErr, setLogoErr] = useState(false);

  const tips = useMemo(() => {
    if (!college) return [];
    const t: string[] = [];
    if (college.noLoanPolicy) t.push("No-loan policy — all aid is grants, zero institutional debt.");
    if (college.meetsFullDemonstratedNeed) t.push("Meets 100% of demonstrated need for every admitted student.");
    if (college.stemOptEligible) t.push("STEM OPT eligible — 36 months work auth vs. standard 12.");
    if (college.type === "public") t.push("Public school: internationals pay out-of-state tuition with minimal aid.");
    if (college.internationalAcceptanceRate != null && college.overallAcceptanceRate != null &&
        college.internationalAcceptanceRate < college.overallAcceptanceRate * 0.6)
      t.push(`International acceptance (${college.internationalAcceptanceRate}%) is much lower than overall (${college.overallAcceptanceRate}%).`);
    if (college.healthInsurance > 4000) t.push(`F-1 health insurance is ${fmt(college.healthInsurance)}/yr — mandatory.`);
    return t;
  }, [college]);

  if (loading) return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-4 animate-pulse">
      {[1,2,3].map(i => <div key={i} className="h-28 bg-gray-100 rounded"/>)}
    </div>
  );
  if (error || (!loading && !college)) return (
    <div className="max-w-3xl mx-auto px-6 py-12 text-center">
      <p className="text-gray-400 text-sm mb-4">{error ?? "College not found."}</p>
      <Link href="/dashboard/research" className="text-sm font-semibold text-[#001049] underline">← Back</Link>
    </div>
  );
  if (!college) return null;

  // Header meta line (plain text, no pills).
  const meta = [
    college.type === "public" ? "Public" : "Private",
    college.nationalRank != null ? `#${college.nationalRank} US Ranking` : null,
    college.stemOptEligible ? "STEM OPT eligible" : null,
    college.meetsFullDemonstratedNeed ? "Meets full need" : null,
    college.noLoanPolicy ? "No loans" : null,
  ].filter(Boolean) as string[];

  const headlineStats = [
    { label: "Tuition", value: fmt(college.tuition), sub: college.type === "public" ? "OOS rate" : "per year" },
    { label: college.estimatedNetCost != null ? "Est. Net Cost" : "Total COA", value: fmt(college.estimatedNetCost ?? college.totalCostOfAttendance), sub: college.estimatedNetCost != null ? "after avg aid" : "full price" },
    { label: "Acceptance Rate", value: college.overallAcceptanceRate != null ? pct(college.overallAcceptanceRate) : "N/A", sub: college.overallAcceptanceRate != null && college.overallAcceptanceRate < 10 ? "Highly selective" : "Overall" },
    { label: "Int'l Students", value: college.internationalPercent != null ? college.internationalPercent + "%" : "N/A", sub: college.intlStudentsEstimate != null ? `≈ ${college.intlStudentsEstimate.toLocaleString()} students` : "of enrollment" },
  ];

  return (
    <div className="bg-white min-h-full">
      <div className="px-6 py-6 max-w-3xl mx-auto">
        {/* Back */}
        <Link href="/dashboard/research" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#001049] mb-5 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
          </svg>
          Back to research
        </Link>

        {/* Header */}
        <div className="flex items-start gap-4 mb-5">
          {college.logoUrl && !logoErr
            ? <img src={college.logoUrl} alt={college.name} className="w-14 h-14 rounded-xl border border-gray-100 bg-white p-1.5 object-contain shrink-0" onError={() => setLogoErr(true)}/>
            : <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 text-xl font-bold shrink-0">{college.name.slice(0,2).toUpperCase()}</div>
          }
          <div className="min-w-0">
            <h2 className="text-2xl font-bold text-[#001049] leading-tight">{college.name}</h2>
            <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1"><IcMapPin size={13} className="shrink-0 opacity-60"/>{college.location}</p>
            <p className="text-xs text-gray-400 mt-1">{meta.join(" · ")}</p>
          </div>
        </div>

        {/* Campus photo */}
        <div className="mb-6">
          <CollegeWikiPhoto name={college.name} />
        </div>

        {/* Headline stats */}
        <section className="pb-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-5 gap-x-4">
            {headlineStats.map((s) => <Stat key={s.label} value={s.value} label={s.label} sub={s.sub} />)}
          </div>
        </section>

        {/* Students who go here — emphasized, near the top */}
        <StudentsSection unitid={unitid} />

        {/* Their posts */}
        <PostsSection unitid={unitid} />

        {/* At a Glance */}
        <Section icon={<IcBarChart size={18}/>} title="At a Glance">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-5 gap-x-4">
            <BigStat value={`${college.financialAccessibilityScore}/100`} label="Aid score (financial access)"/>
            {(college.completionRate4yr ?? profile?.gradRate) != null && (
              <BigStat value={pct(Math.round((college.completionRate4yr ?? profile?.gradRate ?? 0) * 100))} label="Grad rate (4-yr)"/>
            )}
            {(college.retentionRate ?? profile?.retentionRate) != null && (
              <BigStat value={pct(Math.round((college.retentionRate ?? profile?.retentionRate ?? 0) * 100))} label="1-yr retention"/>
            )}
            <BigStat value={college.internationalPercent != null ? college.internationalPercent + "%" : "N/A"} label="Int'l share of campus"/>
          </div>
        </Section>

        {/* Average Student Profile */}
        <Section icon={<IcGradCap size={18}/>} title="Average Student Profile">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-5 gap-x-4 mb-5">
            <BigStat value={college.overallAcceptanceRate != null ? pct(college.overallAcceptanceRate) : "—"} label="Overall accept rate"/>
            <BigStat value={college.internationalAcceptanceRate != null ? pct(college.internationalAcceptanceRate) : "Same"} label="Int'l accept rate"/>
            {(college.ugds ?? profile?.enrollment) != null && <BigStat value={(college.ugds ?? profile?.enrollment ?? 0).toLocaleString()} label="Undergrads"/>}
            {(college.gradStudents ?? profile?.gradStudents) != null && <BigStat value={(college.gradStudents ?? profile?.gradStudents ?? 0).toLocaleString()} label="Grad students"/>}
          </div>

          {(college.testRequirements ?? profile?.testRequirements) != null && (() => {
            const req = college.testRequirements ?? profile?.testRequirements;
            const label = req === 1 ? "Tests Required" : req === 2 ? "Tests Recommended" : req === 3 ? "Test-Optional / Test-Free" : "Tests Considered (not required)";
            return <p className="text-sm text-gray-600 mb-4">Testing policy: <span className="font-semibold text-[#001049]">{label}</span></p>;
          })()}

          {(() => {
            const satAvg   = college.satAvg   ?? profile?.satAvg;
            const sat25M   = college.satMath25 ?? profile?.sat25Math;
            const sat75M   = college.satMath75 ?? profile?.sat75Math;
            const sat25R   = college.satRead25 ?? profile?.sat25Read;
            const sat75R   = college.satRead75 ?? profile?.sat75Read;
            const actMid   = college.actMid    ?? profile?.actMid;
            const act25    = college.act25     ?? profile?.act25;
            const act75    = college.act75     ?? profile?.act75;
            const hasData  = satAvg ?? sat25M ?? act25;
            if (!hasData) return <p className="text-xs text-gray-400 mt-2">SAT/ACT data not reported for this school.</p>;
            return (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Test Score Ranges (25th–75th Percentile)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                  <div>
                    {satAvg != null && (
                      <div className="flex items-center justify-between py-2.5 border-b border-gray-100">
                        <span className="text-sm font-medium text-gray-600">SAT Average</span>
                        <span className="text-base font-bold text-[#001049]">{Math.round(satAvg)}</span>
                      </div>
                    )}
                    <ScoreRange label="SAT Math"    lo={sat25M ?? null} hi={sat75M ?? null} min={200} max={800}/>
                    <ScoreRange label="SAT Reading" lo={sat25R ?? null} hi={sat75R ?? null} min={200} max={800}/>
                  </div>
                  <div>
                    {actMid != null && (
                      <div className="flex items-center justify-between py-2.5 border-b border-gray-100">
                        <span className="text-sm font-medium text-gray-600">ACT Midpoint</span>
                        <span className="text-base font-bold text-[#001049]">{actMid}</span>
                      </div>
                    )}
                    <ScoreRange label="ACT Composite" lo={act25 ?? null} hi={act75 ?? null} min={1} max={36}/>
                  </div>
                </div>
              </div>
            );
          })()}
        </Section>

        {/* Tips for international applicants */}
        {tips.length > 0 && (
          <Section icon={<IcLightbulb size={18}/>} title="Tips for International Applicants">
            <ul className="space-y-2.5">
              {tips.map((t, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 leading-relaxed">
                  <span className="text-[#001049] opacity-50 shrink-0 mt-0.5"><IcCheck size={15}/></span>
                  {t}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* International Students */}
        <Section icon={<IcGlobe size={18}/>} title="International Students">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-5 gap-x-4 mb-5">
            <BigStat value={college.internationalPercent != null ? college.internationalPercent + "%" : "N/A"} label="Of undergrads"/>
            {college.intlStudentsEstimate != null && college.intlStudentsEstimate > 0 && (
              <BigStat value={"~" + college.intlStudentsEstimate.toLocaleString()} label="Est. intl enrollment"/>
            )}
            {college.countriesRepresented != null && <BigStat value={String(college.countriesRepresented)} label="Countries represented"/>}
            {college.internationalAcceptanceRate != null && <BigStat value={pct(college.internationalAcceptanceRate)} label="Intl accept rate"/>}
          </div>

          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            {college.type === "public"
              ? "Public school — international students typically pay full out-of-state tuition. Most state-funded schools are prohibited from giving need-based aid to non-residents; merit scholarships may exist but are limited."
              : "Private school — institutional aid is generally available to international students. Private colleges set their own aid policies and assess financial need using the CSS Profile or institutional forms."}
          </p>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
            {([
              { label: "Meets full demonstrated need", active: college.meetsFullDemonstratedNeed },
              { label: "No-loan policy", active: college.noLoanPolicy },
              { label: "STEM OPT eligible (36 mo)", active: college.stemOptEligible },
              { label: "Aid is renewable", active: college.aidIsRenewable },
              { label: "Actively recruits international students", active: college.activelyRecruitsUnderrepresented },
            ] as const).map(b => (
              <li key={b.label} className="flex items-center gap-2 py-2 border-b border-gray-100 text-sm">
                <span className="text-[#001049] opacity-50 shrink-0">{b.active ? <IcCheck size={15}/> : <IcXCircle size={15}/>}</span>
                <span className={b.active ? "text-gray-700" : "text-gray-400"}>{b.label}</span>
              </li>
            ))}
          </ul>
        </Section>

        {/* Financial Aid */}
        <Section icon={<IcDollar size={18}/>} title="Financial Aid for Internationals">
          {!college.offersAidToInternationals ? (
            <div className="flex items-start gap-2.5 text-sm">
              <span className="text-[#001049] opacity-50 mt-0.5 shrink-0"><IcXCircle size={18}/></span>
              <p className="text-gray-700">No institutional aid for international undergrads — expect full cost of attendance.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-5 gap-x-4 mb-5">
                {college.averageAidPackage != null && <BigStat value={fmt(college.averageAidPackage)} label="Avg aid package / yr"/>}
                {college.percentReceivingAid != null && <BigStat value={college.percentReceivingAid + "%"} label="Receiving aid"/>}
                {college.estimatedNetCost != null && <BigStat value={fmt(college.estimatedNetCost)} label="Est. net cost after aid"/>}
              </div>
              {college.renewalConditions && (
                <p className="text-sm text-gray-600 leading-relaxed mb-4"><span className="font-semibold text-[#001049]">Renewal: </span>{college.renewalConditions}</p>
              )}
              {college.meritScholarships.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Merit Scholarships</p>
                  <ul className="divide-y divide-gray-100">
                    {college.meritScholarships.map((s, i) => (
                      <li key={i} className="flex items-center justify-between py-2.5 text-sm">
                        <span className="text-gray-700">{s.name}</span>
                        {s.amount != null && <span className="font-semibold text-[#001049]">{fmt(s.amount)}/yr</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </Section>

        {/* Cost Breakdown */}
        <Section icon={<IcReceipt size={18}/>} title="Full Cost Breakdown (Annual)">
          <ul className="divide-y divide-gray-100">
            {([
              { label: "Tuition", value: college.tuition, note: college.type === "public" ? "OOS rate" : undefined, bold: false },
              { label: "Room & Board", value: college.roomAndBoard },
              { label: "Books & Supplies", value: college.booksAndSupplies },
              { label: "Personal Expenses", value: college.personalExpenses },
              { label: "Health Insurance (F-1 mandatory)", value: college.healthInsurance },
              { label: "Total Cost of Attendance", value: college.totalCostOfAttendance, bold: true },
              ...(college.estimatedNetCost != null ? [{ label: "Est. Net Cost after Avg Aid", value: college.estimatedNetCost, bold: true }] : []),
            ] as { label: string; value: number; note?: string; bold?: boolean }[]).map((r) => (
              <li key={r.label} className="flex items-center justify-between py-3 text-sm">
                <span className={r.bold ? "font-bold text-[#001049]" : "text-gray-600"}>
                  {r.label}{r.note && <span className="ml-1.5 text-xs text-gray-400">({r.note})</span>}
                </span>
                <span className={r.bold ? "font-bold text-[#001049]" : "font-medium text-gray-800"}>{fmt(r.value)}</span>
              </li>
            ))}
          </ul>
        </Section>

        {/* Net Price by Income */}
        {(college.netPrice0_30k ?? college.netPrice30k_48k ?? college.avgNetPriceOverall) != null && (
          <Section icon={<IcDollar size={18}/>} title="Net Price by Family Income">
            <p className="text-xs text-gray-500 mb-4">Average annual net price (tuition + fees + housing − all grants & scholarships) for full-time first-time students by family income.</p>
            <div className="space-y-3">
              {([
                { label: "Under $30k / yr",   value: college.netPrice0_30k },
                { label: "$30k – $48k / yr",  value: college.netPrice30k_48k },
                { label: "$48k – $75k / yr",  value: college.netPrice48k_75k },
                { label: "$75k – $110k / yr", value: college.netPrice75k_110k },
                { label: "Over $110k / yr",   value: college.netPrice110kPlus },
              ] as { label: string; value: number | null }[]).map(({ label, value }) => {
                if (value == null) return null;
                const maxBracket = Math.max(
                  college.netPrice0_30k ?? 0, college.netPrice30k_48k ?? 0,
                  college.netPrice48k_75k ?? 0, college.netPrice75k_110k ?? 0,
                  college.netPrice110kPlus ?? 0
                );
                return (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 font-medium">{label}</span>
                      <span className="font-bold text-[#001049]">${value.toLocaleString()}</span>
                    </div>
                    <Bar pct={maxBracket > 0 ? (value / maxBracket) * 100 : 0} />
                  </div>
                );
              })}
            </div>
            {college.avgNetPriceOverall != null && (
              <div className="mt-4 flex justify-between text-sm border-t border-gray-100 pt-3">
                <span className="text-gray-600 font-medium">Institution-wide avg net price</span>
                <span className="font-bold text-[#001049]">${college.avgNetPriceOverall.toLocaleString()}</span>
              </div>
            )}
            {college.priceCalculatorUrl && (
              <a href={college.priceCalculatorUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#001049] hover:underline">
                <IcExternalLink size={12}/>Calculate your personal net price →
              </a>
            )}
          </Section>
        )}

        {/* Outcomes & Debt */}
        <Section icon={<IcTrophy size={18}/>} title="Outcomes & Debt">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-5 gap-x-4 mb-5">
            {(college.completionRate4yr ?? profile?.gradRate) != null && (
              <BigStat value={pct(Math.round((college.completionRate4yr ?? profile?.gradRate ?? 0) * 100))} label="Grad rate (4-yr)"/>
            )}
            {(college.retentionRate ?? profile?.retentionRate) != null && (
              <BigStat value={pct(Math.round((college.retentionRate ?? profile?.retentionRate ?? 0) * 100))} label="1-yr retention"/>
            )}
            {college.averageStartingSalary != null && (
              <BigStat value={"$" + Math.round(college.averageStartingSalary / 1000) + "k"} label="Earnings (10yr median)"/>
            )}
            {(college.defaultRate3yr ?? profile?.defaultRate3yr) != null && (
              <BigStat value={pct(Math.round((college.defaultRate3yr ?? profile?.defaultRate3yr ?? 0) * 100))} label="3-yr default rate"/>
            )}
          </div>

          {(college.medianDebtCompleters ?? profile?.medianDebtCompleters) != null && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Student Debt at Graduation</p>
              <ul className="divide-y divide-gray-100">
                {(college.medianDebtCompleters ?? profile?.medianDebtCompleters) != null && (
                  <li className="flex items-center justify-between py-2.5 text-sm"><span className="text-gray-600">Median debt (completers)</span><span className="font-bold text-[#001049]">{fmt(college.medianDebtCompleters ?? profile?.medianDebtCompleters ?? 0)}</span></li>
                )}
                {(college.medianDebtMonthly ?? profile?.medianDebtMonthly) != null && (
                  <li className="flex items-center justify-between py-2.5 text-sm"><span className="text-gray-600">Est. monthly payment</span><span className="font-bold text-[#001049]">${Math.round(college.medianDebtMonthly ?? profile?.medianDebtMonthly ?? 0)}/mo</span></li>
                )}
                {(college.pellGrantRate ?? profile?.pellGrantRate) != null && (
                  <li className="flex items-center justify-between py-2.5 text-sm"><span className="text-gray-600">Share with Pell Grant</span><span className="font-bold text-[#001049]">{pct(Math.round((college.pellGrantRate ?? profile?.pellGrantRate ?? 0) * 100))}</span></li>
                )}
                {(college.federalLoanRate ?? profile?.federalLoanRate) != null && (
                  <li className="flex items-center justify-between py-2.5 text-sm"><span className="text-gray-600">Share taking federal loans</span><span className="font-bold text-[#001049]">{pct(Math.round((college.federalLoanRate ?? profile?.federalLoanRate ?? 0) * 100))}</span></li>
                )}
              </ul>
            </div>
          )}

          {(college.debt90th ?? profile?.debt90th) != null && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Cumulative Debt Distribution</p>
              <div className="space-y-2.5">
                {([
                  { label: "10th pct", value: college.debt10th ?? profile?.debt10th },
                  { label: "25th pct", value: college.debt25th ?? profile?.debt25th },
                  { label: "75th pct", value: college.debt75th ?? profile?.debt75th },
                  { label: "90th pct", value: college.debt90th ?? profile?.debt90th },
                ] as { label: string; value: number | null }[]).filter(d => d.value != null).map(({ label, value }) => {
                  const maxDebt = college.debt90th ?? profile?.debt90th ?? 1;
                  return (
                    <div key={label} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-14 shrink-0 text-right">{label}</span>
                      <div className="flex-1"><Bar pct={(value! / maxDebt) * 100} /></div>
                      <span className="text-xs font-semibold text-gray-700 w-16 shrink-0">{fmt(value!)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Section>

        {/* Institution Profile */}
        <Section icon={<IcBuilding size={18}/>} title="Institution Profile">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
            {(college.accreditor ?? profile?.accreditor) && (
              <div className="flex items-center justify-between py-2.5 border-b border-gray-100 text-sm"><span className="text-gray-500">Accreditor</span><span className="font-medium text-gray-800 text-right">{college.accreditor ?? profile?.accreditor}</span></div>
            )}
            {(college.carnegieBasic ?? profile?.carnegieBasic) != null && (() => {
              const cb = college.carnegieBasic ?? profile?.carnegieBasic;
              const label = cb === 15 ? "R1 – Doctoral (Very High Research)" : cb === 16 ? "R2 – Doctoral (High Research)" : cb === 17 ? "Doctoral/Professional" : cb === 18 ? "Master's (Large)" : cb === 19 ? "Master's (Medium)" : cb === 20 ? "Master's (Small)" : cb === 21 ? "Baccalaureate (Arts & Sciences)" : cb === 22 ? "Baccalaureate (Diverse)" : cb === 23 ? "Baccalaureate/Associate's" : `Carnegie Class ${cb}`;
              return <div className="flex items-center justify-between py-2.5 border-b border-gray-100 text-sm"><span className="text-gray-500">Carnegie Class</span><span className="font-medium text-gray-800 text-right">{label}</span></div>;
            })()}
            {(college.endowment ?? profile?.endowment) != null && (
              <div className="flex items-center justify-between py-2.5 border-b border-gray-100 text-sm"><span className="text-gray-500">Endowment</span><span className="font-medium text-gray-800">{(college.endowment ?? profile?.endowment)! >= 1e9 ? `$${((college.endowment ?? profile?.endowment)! / 1e9).toFixed(1)}B` : `$${Math.round((college.endowment ?? profile?.endowment)! / 1e6)}M`}</span></div>
            )}
            {(college.facultySalary ?? profile?.facultySalary) != null && (
              <div className="flex items-center justify-between py-2.5 border-b border-gray-100 text-sm"><span className="text-gray-500">Avg Faculty Salary</span><span className="font-medium text-gray-800">${Math.round((college.facultySalary ?? profile?.facultySalary ?? 0)).toLocaleString()}/mo</span></div>
            )}
            {(college.ftFacultyRate ?? profile?.ftFacultyRate) != null && (
              <div className="flex items-center justify-between py-2.5 border-b border-gray-100 text-sm"><span className="text-gray-500">Full-time Faculty</span><span className="font-medium text-gray-800">{pct(Math.round((college.ftFacultyRate ?? profile?.ftFacultyRate ?? 0) * 100))}</span></div>
            )}
            {(college.minorityServing.hispanic || college.minorityServing.annh || college.minorityServing.tribal || college.minorityServing.aanipi) && (
              <div className="flex items-center justify-between py-2.5 border-b border-gray-100 text-sm"><span className="text-gray-500">Minority-Serving</span><span className="font-medium text-gray-800 text-right">{[college.minorityServing.hispanic && "HSI", college.minorityServing.annh && "ANNH", college.minorityServing.tribal && "Tribal", college.minorityServing.aanipi && "AANIPI"].filter(Boolean).join(" · ")}</span></div>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-5 gap-x-4 mt-5">
            {(college.shareFirstGen ?? profile?.shareFirstGen) != null && (
              <BigStat value={pct(Math.round((college.shareFirstGen ?? profile?.shareFirstGen ?? 0) * 100))} label="First-gen students"/>
            )}
            {(college.shareLowIncome ?? profile?.shareLowIncome) != null && (
              <BigStat value={pct(Math.round((college.shareLowIncome ?? profile?.shareLowIncome ?? 0) * 100))} label="Low income (<$30k)"/>
            )}
            {(college.sharePartTime ?? profile?.partTimeShare) != null && (
              <BigStat value={pct(Math.round((college.sharePartTime ?? profile?.partTimeShare ?? 0) * 100))} label="Part-time students"/>
            )}
            {(college.share25Older ?? profile?.share25Older) != null && (
              <BigStat value={pct(Math.round((college.share25Older ?? profile?.share25Older ?? 0) * 100))} label="Age 25+"/>
            )}
          </div>
        </Section>

        {/* Demographics */}
        <Section icon={<IcUsers size={18}/>} title="Campus Demographics">
          {(college.demoMen ?? profile?.menShare) != null && (
            <div className="mb-4 space-y-1.5">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Gender split</span>
                <span className="font-bold text-[#001049]">{Math.round((college.demoMen ?? profile?.menShare ?? 0) * 100)}% M · {Math.round((college.demoWomen ?? profile?.womenShare ?? 0) * 100)}% W</span>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden flex bg-gray-100">
                <div className="h-full bg-[#001049]" style={{ width: `${Math.round((college.demoMen ?? profile?.menShare ?? 0) * 100)}%` }}/>
                <div className="h-full bg-gray-300 flex-1"/>
              </div>
              <div className="flex justify-between text-[10px] text-gray-400"><span>Men</span><span>Women</span></div>
            </div>
          )}

          {(college.demoWhite ?? profile?.demoWhite) != null && (() => {
            const races = [
              { label: "White",            value: college.demoWhite          ?? profile?.demoWhite },
              { label: "Asian",            value: college.demoAsian          ?? profile?.demoAsian },
              { label: "Hispanic/Latino",  value: college.demoHispanic       ?? profile?.demoHispanic },
              { label: "Black/Afr. Am.",   value: college.demoBlack          ?? profile?.demoBlack },
              { label: "Two or more",      value: college.demoTwoOrMore      ?? profile?.demoTwoOrMore },
              { label: "Intl. students",   value: college.demoNonResidentAlien ?? profile?.demoNonResidentAlien },
            ].filter(r => r.value != null && r.value > 0);
            return (
              <div className="mt-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Race & Ethnicity</p>
                <div className="space-y-2.5">
                  {races.map(({ label, value }) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600 font-medium">{label}</span>
                        <span className="font-bold text-gray-800">{Math.round((value ?? 0) * 100)}%</span>
                      </div>
                      <Bar pct={(value ?? 0) * 100} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </Section>

        <p className="text-xs text-gray-400 pt-6 pb-2 leading-relaxed border-t-2 border-gray-200">
          Data: US Dept of Education College Scorecard · Common Data Set · IPEDS.
          Aid figures are averages — verify with each school&apos;s official net-price calculator.
        </p>
      </div>
    </div>
  );
}
