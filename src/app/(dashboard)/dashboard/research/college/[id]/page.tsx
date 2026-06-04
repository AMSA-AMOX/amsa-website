"use client";

import { useEffect, useMemo, useState, useCallback, useRef, type ChangeEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { IoRose, IoRoseOutline } from "react-icons/io5";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useCollegesData } from "../../use-colleges-data";
import type { ScorecardProfile } from "@/app/api/colleges/[id]/scorecard/route";


// ─── SVG Icon library ─────────────────────────────────────────────────────────

type IconProps = { size?: number; className?: string };

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
function IcFlask({ size = 18, className = "" }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9 3h6M9 3v7l-5 9a1 1 0 0 0 .9 1.5h14.2A1 1 0 0 0 20 19l-5-9V3"/><path d="M8 17h8"/></svg>;
}
function IcMapPin({ size = 18, className = "" }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
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
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

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
    <section className="py-5 border-t-2 border-gray-300 first:border-t-0 first:pt-0">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[#001049] opacity-60 shrink-0">{icon}</span>
        <p className="text-sm font-semibold tracking-wide uppercase text-gray-400">{title}</p>
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

// ─── College Reviews ──────────────────────────────────────────────────────────

const MAX_REVIEW_IMAGES = 4;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

type CollegeReview = {
  id: string;
  college_id: number;
  content: string;
  images: string[];
  created_at: string;
  user_id: number;
  helpfulCount: number;
  hasHelpful: boolean;
  Users: { id: number; firstName: string; lastName: string; profilePic: string | null } | null;
};

function CollegeReviewComposer({ collegeId, collegeName, onCreated }: { collegeId: number; collegeName: string; onCreated: (r: CollegeReview) => void }) {
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
      const path = `reviews/colleges/${user.id}/${Date.now()}-${i}.${ext}`;
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
      const res = await authFetch("/api/colleges/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collegeId, content: content.trim(), images }),
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
        placeholder={`Share your experience at ${collegeName}…`}
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
              <button type="button" onClick={() => removeFile(i)} className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between mt-2 gap-3">
        <button type="button" onClick={() => fileRef.current?.click()} disabled={files.length >= MAX_REVIEW_IMAGES}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-[#001049] disabled:opacity-40 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
          </svg>
        </button>
        <button type="button" onClick={submit} disabled={submitting}
          className="px-4 py-2 rounded-lg bg-[#001049] text-white text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity">
          {submitting ? "Posting…" : "Post"}
        </button>
      </div>
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </div>
  );
}

function CollegeReviewItem({ review, currentUserId, currentUserRole, onDelete, onHelpful, markingHelpful }: {
  review: CollegeReview;
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
  const initials = author ? `${author.firstName?.[0] ?? ""}${author.lastName?.[0] ?? ""}`.toUpperCase() : "?";
  const authorName = author ? `${author.firstName} ${author.lastName}`.trim() : "Member";
  const canDelete = currentUserId === review.user_id || currentUserRole === "admin";

  const deleteReview = async () => {
    if (!confirm("Delete this review?")) return;
    setDeleting(true);
    try {
      await authFetch(`/api/colleges/reviews/${review.id}`, { method: "DELETE" });
      onDelete(review.id);
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-full bg-[#FFCA3A] flex items-center justify-center text-[#001049] text-[10px] font-bold shrink-0 overflow-hidden">
          {author?.profilePic ? <img src={author.profilePic} alt="" className="w-full h-full object-cover" /> : initials}
        </div>
        <span className="text-xs font-semibold text-gray-700">{authorName}</span>
        <span className="text-gray-300">·</span>
        <span className="text-xs text-gray-400">{formatRelative(review.created_at)}</span>
        {canDelete && (
          <button onClick={deleteReview} disabled={deleting} className="ml-auto text-gray-300 hover:text-red-500 transition-colors disabled:opacity-40">
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
            <button key={i} onClick={() => setLightbox(url)} className="w-20 h-20 rounded-xl overflow-hidden border border-gray-200 hover:opacity-90 transition-opacity">
              <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}
      <div className="mt-3">
        <button type="button" onClick={() => onHelpful(review.id)} disabled={!currentUserId || markingHelpful}
          title={review.hasHelpful ? "Remove helpful" : "Helpful"}
          className={`flex items-center gap-1.5 transition disabled:opacity-50 ${review.hasHelpful ? "text-emerald-800" : "text-gray-400 hover:text-emerald-800"}`}>
          {review.hasHelpful ? <IoRose className="w-6 h-6" aria-hidden /> : <IoRoseOutline className="w-6 h-6" aria-hidden />}
          <span className="text-sm font-medium">Helpful</span>
          {review.helpfulCount > 0 && <span className="text-sm font-medium tabular-nums">{review.helpfulCount}</span>}
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

function CollegeReviewsColumn({ collegeId, collegeName }: { collegeId: number; collegeName: string }) {
  const { user, authFetch } = useAuth();
  const [reviews, setReviews] = useState<CollegeReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [markingHelpful, setMarkingHelpful] = useState<Set<string>>(new Set());

  const load = useCallback(() => {
    setLoading(true);
    const fetcher = user
      ? authFetch(`/api/colleges/reviews?collegeId=${collegeId}`)
      : fetch(`/api/colleges/reviews?collegeId=${collegeId}`).then((r) => r.json());
    Promise.resolve(fetcher)
      .then((d) => { setReviews(d.reviews ?? []); setLoading(false); })
      .catch(() => { setError("Failed to load reviews."); setLoading(false); });
  }, [collegeId, user, authFetch]);

  useEffect(() => { load(); }, [load]);

  const onCreated = (r: CollegeReview) => setReviews((prev) => [{ ...r, helpfulCount: 0, hasHelpful: false }, ...prev]);
  const onDelete = (id: string) => setReviews((prev) => prev.filter((r) => r.id !== id));

  const onHelpful = async (id: string) => {
    if (!user || markingHelpful.has(id)) return;
    const current = reviews.find((r) => r.id === id);
    if (!current) return;
    const liking = !current.hasHelpful;
    setMarkingHelpful((prev) => new Set(prev).add(id));
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, hasHelpful: liking, helpfulCount: Math.max(0, r.helpfulCount + (liking ? 1 : -1)) } : r));
    try {
      const data = await authFetch(`/api/colleges/reviews/${id}/helpful`, { method: "POST" });
      setReviews((prev) => prev.map((r) => r.id === id ? { ...r, hasHelpful: Boolean(data.hasHelpful), helpfulCount: Number(data.helpfulCount ?? r.helpfulCount) } : r));
    } catch {
      setReviews((prev) => prev.map((r) => r.id === id ? { ...r, hasHelpful: current.hasHelpful, helpfulCount: current.helpfulCount } : r));
    } finally {
      setMarkingHelpful((prev) => { const next = new Set(prev); next.delete(id); return next; });
    }
  };

  return (
    <div className="flex flex-col lg:h-full min-h-0">
      <div className="bg-gray-50 border-b-2 border-gray-300 px-6 py-4 flex items-center justify-between shrink-0">
        <h1 className="text-lg font-bold text-gray-900">Reviews</h1>
      </div>
      <div className="lg:flex-1 lg:overflow-y-auto px-6 py-5 space-y-5">
        {user?.role !== "member" && (
          <CollegeReviewComposer collegeId={collegeId} collegeName={collegeName} onCreated={onCreated} />
        )}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            {reviews.length} {reviews.length === 1 ? "Review" : "Reviews"}
          </p>
          {error && !loading && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
              {error} — make sure the <code className="font-mono">college_reviews</code> table exists in Supabase.
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
              <img src="/assets/empty/review_leaves.svg" alt="" className="w-44 h-auto mb-8 select-none pointer-events-none" draggable={false} />
              <p className="text-lg font-medium text-gray-400">No reviews yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <CollegeReviewItem key={r.id} review={r} currentUserId={user?.id} currentUserRole={user?.role}
                  onDelete={onDelete} onHelpful={onHelpful} markingHelpful={markingHelpful.has(r.id)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
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
    <div className="lg:h-full flex flex-col lg:flex-row bg-gray-50">
      {/* ── Info column (left) ── */}
      <div className="flex-1 min-w-0 lg:overflow-y-auto bg-gray-50">
      <div className="px-6 py-6 max-w-5xl">
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
        <section className="pb-5">
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

        {/* More information elsewhere */}
        <Section icon={<IcGlobe size={18}/>} title="More Information">
          <ul className="divide-y divide-gray-100">
            {([
              { label: "Niche", desc: "Student reviews, demographics, rankings & grades", domain: "niche.com", href: `https://www.niche.com/colleges/${college.nicheSlug ?? slugify(college.name)}/` },
              { label: "U.S. News & World Report", desc: "Official rankings & full profile", domain: "usnews.com", href: `https://www.usnews.com/best-colleges/${college.usNewsSlug ?? slugify(college.name)}-${college.id}` },
              { label: "The Princeton Review", desc: "Campus culture & best-of lists", domain: "princetonreview.com", href: `https://www.princetonreview.com/college-search?name=${encodeURIComponent(college.name)}` },
              { label: "College Factual", desc: "Major outcomes & earnings data", domain: "collegefactual.com", href: `https://www.collegefactual.com/colleges/${slugify(college.name)}/` },
              ...(college.website ? [{ label: "Official website", desc: "Admissions, programs & contact", domain: new URL(college.website.startsWith("http") ? college.website : `https://${college.website}`).hostname, href: college.website.startsWith("http") ? college.website : `https://${college.website}` }] : []),
            ] as { label: string; desc: string; domain: string; href: string }[]).map((l) => (
              <li key={l.label}>
                <a href={l.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 py-3 group">
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${l.domain}&sz=32`}
                    alt=""
                    className="w-6 h-6 rounded shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-[#001049] transition-colors">{l.label}</p>
                    <p className="text-xs text-gray-400">{l.desc}</p>
                  </div>
                  <span className="text-gray-300 group-hover:text-[#001049] shrink-0 transition-colors"><IcExternalLink size={15}/></span>
                </a>
              </li>
            ))}
          </ul>
        </Section>

        <p className="text-xs text-gray-400 pt-5 pb-2 leading-relaxed border-t-2 border-gray-300">
          Data sourced from 2024 College Scorecard, Common Data Set, and IPEDS. Figures such as tuition, aid, and acceptance rates may change year to year — verify with each school&apos;s official website.
        </p>
      </div>
      </div>

      {/* ── Reviews column (right) ── */}
      <aside className="w-full lg:w-[520px] shrink-0 border-t-2 lg:border-t-0 lg:border-l-2 border-gray-300">
        <CollegeReviewsColumn collegeId={unitid} collegeName={college.name} />
      </aside>
    </div>
  );
}
