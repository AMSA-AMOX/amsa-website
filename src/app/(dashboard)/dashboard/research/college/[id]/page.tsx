"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCollegesData } from "../../use-colleges-data";
import type { College } from "../../types";
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
function IcChat({ size = 18, className = "" }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
}
function IcUsers({ size = 18, className = "" }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}
function IcGlobe({ size = 18, className = "" }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z"/></svg>;
}
function IcTarget({ size = 18, className = "" }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
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
function IcHospital({ size = 18, className = "" }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8M8 12h8"/></svg>;
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
function IcClock({ size = 18, className = "" }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}
function IcClipboard({ size = 18, className = "" }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg>;
}
function IcExternalLink({ size = 14, className = "" }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>;
}
function IcFileText({ size = 18, className = "" }: IconProps) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;
}

// ─── Sidebar sections ─────────────────────────────────────────────────────────

const SECTIONS = [
  { id: "s-hero",         label: "Overview",         Icon: IcBuilding },
  { id: "s-glance",       label: "At a Glance",      Icon: IcBarChart },
  { id: "s-tips",         label: "Intl Tips",        Icon: IcLightbulb },
  { id: "s-intl",         label: "Intl Students",    Icon: IcGlobe },
  { id: "s-aid",          label: "Financial Aid",    Icon: IcDollar },
  { id: "s-cost",         label: "Cost Breakdown",   Icon: IcReceipt },
  { id: "s-netprice",     label: "Net Price",        Icon: IcDollar },
  { id: "s-admissions",   label: "Admissions",       Icon: IcGradCap },
  { id: "s-outcomes",     label: "Outcomes & Debt",  Icon: IcTrophy },
  { id: "s-institution",  label: "Institution",      Icon: IcBuilding },
  { id: "s-members",      label: "AMSA Members",     Icon: IcUsers },
  { id: "s-posts",        label: "Community Posts",  Icon: IcFileText },
  { id: "s-reviews",      label: "Student Reviews",  Icon: IcStar },
  { id: "s-reddit",       label: "Reddit & News",    Icon: IcChat },
  { id: "s-demographics", label: "Demographics",     Icon: IcUsers },
] as const;

type SectionId = typeof SECTIONS[number]["id"];

// ─── Brand logos ──────────────────────────────────────────────────────────────

function RedditLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="10" fill="#FF4500"/>
      <path d="M16.67 10a1.46 1.46 0 0 0-2.47-1 7.12 7.12 0 0 0-3.85-1.23l.65-3.07 2.13.45a1 1 0 1 0 1.07-.94 1 1 0 0 0-.93.61l-2.38-.5a.27.27 0 0 0-.32.2l-.73 3.44a7.14 7.14 0 0 0-3.89 1.23 1.46 1.46 0 1 0-1.61 2.39 2.87 2.87 0 0 0 0 .44c0 2.24 2.61 4.06 5.83 4.06s5.83-1.82 5.83-4.06a2.87 2.87 0 0 0 0-.44 1.46 1.46 0 0 0 .58-1.58zM7.27 11a1 1 0 1 1 1 1 1 1 0 0 1-1-1zm5.58 2.71a3.58 3.58 0 0 1-2.85.93 3.58 3.58 0 0 1-2.85-.93.19.19 0 0 1 .27-.27 3.2 3.2 0 0 0 2.58.8 3.2 3.2 0 0 0 2.58-.8.19.19 0 1 1 .27.27zm-.14-1.71a1 1 0 1 1 1-1 1 1 0 0 1-1 1z" fill="white"/>
    </svg>
  );
}

function GoogleNewsIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="5" fill="#4285F4"/>
      <path d="M5 7h14v2H5zm0 4h9v2H5zm0 4h11v2H5z" fill="white"/>
    </svg>
  );
}

function LinkedInIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <rect width="24" height="24" rx="5" fill="#0A66C2"/>
      <path d="M8 10h2v7H8v-7zm1-3a1.25 1.25 0 110 2.5A1.25 1.25 0 019 7zm3 3h2v1h.03c.28-.53.96-1.1 1.97-1.1 2.1 0 2.5 1.38 2.5 3.18V17h-2v-3.5c0-.83-.01-1.9-1.16-1.9-1.16 0-1.34.91-1.34 1.85V17h-2v-7z" fill="white"/>
    </svg>
  );
}

// Platform logo via favicon
const LOGO_DEV_TOKEN = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN?.trim();
function logoDevUrl(domain: string) {
  const base = `https://img.logo.dev/${domain}`;
  return LOGO_DEV_TOKEN ? `${base}?token=${encodeURIComponent(LOGO_DEV_TOKEN)}` : base;
}

function FaviconLogo({ domain, size = 28 }: { domain: string; size?: number }) {
  return (
    <img
      src={logoDevUrl(domain)}
      alt={domain}
      width={size}
      height={size}
      className="rounded-lg"
      loading="lazy"
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).src =
          `https://www.google.com/s2/favicons?domain=${domain}&sz=${size * 2}`;
      }}
    />
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
const pct = (n: number) => Math.round(n) + "%";
function slugify(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }

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

function useActiveSection(sectionIds: readonly string[]) {
  const [active, setActive] = useState<string>(sectionIds[0]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id);
        }
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    );
    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sectionIds]);

  return active;
}

// ─── Visual primitives ────────────────────────────────────────────────────────

function RingGauge({ value, max = 100, size = 88, stroke = 9, color, label, sub }: {
  value: number; max?: number; size?: number; stroke?: number;
  color: string; label: string; sub: string;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const fill = circ * Math.min(value / max, 1);
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={stroke}/>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"/>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-black text-[#001049]">{value}</span>
          <span className="text-[9px] text-gray-400">/{max}</span>
        </div>
      </div>
      <p className="text-xs font-bold text-[#001049] text-center">{label}</p>
      <p className="text-[11px] text-gray-400 text-center leading-tight">{sub}</p>
    </div>
  );
}

function ScoreRange({ label, lo, hi, min = 200, max = 800, color = "#001049" }: {
  label: string; lo: number | null; hi: number | null; min?: number; max?: number; color?: string;
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
        <span className="text-sm font-bold text-[#001049]">
          {lo ?? "?"} – {hi ?? "?"}
        </span>
      </div>
      <div className="relative h-2.5 bg-gray-100 rounded-full">
        <div className="absolute h-full rounded-full" style={{ left: `${loX}%`, width: `${hiX - loX}%`, backgroundColor: color, opacity: 0.85 }}/>
        {lo && <div className="absolute -top-0.5 w-1 h-3.5 rounded-full bg-white border-2 border-current" style={{ left: `${loX}%`, transform: "translateX(-50%)", borderColor: color }}/>}
        {hi && <div className="absolute -top-0.5 w-1 h-3.5 rounded-full bg-white border-2 border-current" style={{ left: `${hiX}%`, transform: "translateX(-50%)", borderColor: color }}/>}
      </div>
      <div className="flex justify-between mt-1 text-[10px] text-gray-300">
        <span>{min}</span><span>{max}</span>
      </div>
    </div>
  );
}

function BigStat({ value, label, color = "text-[#001049]" }: { value: string; label: string; color?: string }) {
  return (
    <div className="text-center">
      <p className={`text-3xl font-black ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5 leading-tight">{label}</p>
    </div>
  );
}

function Section({ id, icon, title, children }: { id: SectionId; icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div id={id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden scroll-mt-6">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-50">
        <span className="text-[#001049] opacity-70 shrink-0">{icon}</span>
        <h2 className="text-sm font-bold text-[#001049] uppercase tracking-wide">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function CostRow({ label, value, note, variant }: {
  label: string; value: number; note?: string;
  variant?: "amber" | "green" | "navy" | "bold";
}) {
  const row = variant === "amber" ? "bg-amber-50 border-amber-100" : variant === "navy" ? "bg-[#001049]" : variant === "green" ? "bg-green-50 border-green-100" : variant === "bold" ? "bg-gray-50 font-bold" : "";
  const lbl = variant === "navy" ? "text-white/80" : variant === "amber" ? "text-amber-800" : variant === "green" ? "text-green-800" : "text-gray-600";
  const val = variant === "navy" ? "text-white text-lg font-bold" : variant === "amber" ? "text-amber-800 font-semibold" : variant === "green" ? "text-green-800 font-semibold" : variant === "bold" ? "text-[#001049] font-bold" : "text-gray-800 font-medium";
  return (
    <div className={`flex items-center justify-between px-4 py-3 border-b last:border-b-0 text-sm ${row}`}>
      <div>
        <span className={lbl}>{label}</span>
        {note && <span className="ml-1.5 text-xs text-gray-400">({note})</span>}
      </div>
      <span className={val}>{fmt(value)}</span>
    </div>
  );
}

// ─── College photos: Pexels campus search + Wikipedia fallback ────────────────

type CPhoto = { id: number; thumb: string; large: string; photographer: string; photographerUrl: string; alt: string };

function useCollegePhotos(name: string) {
  const [photos, setPhotos] = useState<CPhoto[]>([]);
  const [wikiThumb, setWikiThumb] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!name) return;
    setLoading(true);

    // Pexels first
    fetch(`/api/college-photos?name=${encodeURIComponent(name)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.photos?.length) {
          setPhotos(d.photos);
          setLoading(false);
        } else {
          // Fall back to Wikipedia thumbnail
          return fetch(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`,
            { headers: { "Api-User-Agent": "amsa-website/1.0" } }
          )
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
              if (d?.thumbnail?.source) {
                setWikiThumb(d.thumbnail.source.replace(/\/\d+px-/, "/800px-"));
              }
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

  if (loading) {
    return (
      <div className="p-4 space-y-2">
        <div className="aspect-video bg-gray-100 animate-pulse rounded-xl" />
      </div>
    );
  }

  // Pexels campus photos
  if (photos.length > 0) {
    const photo = photos[idx];
    return (
      <div className="p-3 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setLightbox(photo)}
          className="w-full rounded-xl overflow-hidden focus:outline-none cursor-zoom-in"
        >
          <img src={photo.large} alt={photo.alt} className="w-full h-auto block" loading="lazy" />
        </button>

        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1 overflow-x-auto pb-0.5 flex-1">
            {photos.slice(0, 8).map((p, i) => (
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
          <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer"
            className="shrink-0 text-[10px] text-gray-300 hover:text-gray-500 transition-colors">
            via Pexels
          </a>
        </div>

        {lightbox && typeof lightbox === "object" && "large" in lightbox && (
          <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
            <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
              <img src={(lightbox as CPhoto).large} alt={(lightbox as CPhoto).alt} className="w-full h-auto rounded-2xl shadow-2xl" />
              <p className="text-white/50 text-xs mt-2 text-right">
                Photo by{" "}
                <a href={(lightbox as CPhoto).photographerUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-white" onClick={(e) => e.stopPropagation()}>
                  {(lightbox as CPhoto).photographer}
                </a>{" "}on Pexels
              </p>
              <button type="button" onClick={() => setLightbox(null)}
                className="absolute -top-3 -right-3 bg-white text-[#001049] rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Wikipedia thumbnail fallback
  if (wikiThumb) {
    return (
      <div className="p-3 flex flex-col gap-2">
        <button type="button" onClick={() => setLightbox(wikiThumb)}
          className="w-full rounded-xl overflow-hidden focus:outline-none cursor-zoom-in">
          <img src={wikiThumb} alt={name} className="w-full h-auto block" loading="lazy" />
        </button>
        <a href={`https://en.wikipedia.org/wiki/${encodeURIComponent(name)}`} target="_blank" rel="noopener noreferrer"
          className="text-[10px] text-gray-400 hover:text-gray-600 text-center transition-colors">
          via Wikipedia
        </a>
        {lightbox && typeof lightbox === "string" && (
          <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
            <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
              <img src={lightbox} alt={name} className="w-full h-auto rounded-2xl shadow-2xl" />
              <button type="button" onClick={() => setLightbox(null)}
                className="absolute -top-3 -right-3 bg-white text-[#001049] rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return <div className="h-1.5 bg-gradient-to-r from-[#001049] via-[#3b5bdb] to-[#6b8cff]" />;
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function CollegeDetailPage() {
  const params = useParams<{ id: string }>();
  const unitid = Number(params?.id);
  const { colleges, loading, error } = useCollegesData();
  const college = useMemo(() => colleges.find((c) => c.id === unitid) ?? null, [colleges, unitid]);

  const { profile, profileLoading } = useScorecardProfile(college ? unitid : null);
  const sectionIds = useMemo(() => SECTIONS.map((s) => s.id), []);
  const activeSection = useActiveSection(sectionIds);
  const [logoErr, setLogoErr] = useState(false);

  const [students, setStudents] = useState<Array<{
    id: number; firstName: string | null; lastName: string | null;
    profilePic: string | null; role: string | null;
    major: string | null; graduationYear: string | null;
  }>>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsLoaded, setStudentsLoaded] = useState(false);

  useEffect(() => {
    if (!college || studentsLoaded || studentsLoading) return;
    setStudentsLoading(true);
    fetch(`/api/colleges/${unitid}/students`)
      .then((r) => (r.ok ? r.json() : { students: [] }))
      .then((d) => { setStudents(d.students ?? []); setStudentsLoaded(true); })
      .catch(() => { setStudentsLoaded(true); })
      .finally(() => setStudentsLoading(false));
  }, [college, unitid, studentsLoaded, studentsLoading]);

  type CollegePost = {
    id: number; title: string; body: string; images: string[];
    createdAt: string; appreciationCount: number; topic: string | null;
    author: { id: number; firstName: string; lastName: string; profilePic: string | null; headline: string | null } | null;
    college: { id: number; name: string; logoUrl: string | null } | null;
  };
  const [collegePosts, setCollegePosts] = useState<CollegePost[]>([]);
  const [collegePostsLoading, setCollegePostsLoading] = useState(false);
  const [collegePostsLoaded, setCollegePostsLoaded] = useState(false);

  useEffect(() => {
    if (!college || collegePostsLoaded || collegePostsLoading) return;
    setCollegePostsLoading(true);
    fetch(`/api/colleges/${unitid}/posts`)
      .then((r) => (r.ok ? r.json() : { posts: [] }))
      .then((d) => { setCollegePosts(d.posts ?? []); setCollegePostsLoaded(true); })
      .catch(() => { setCollegePostsLoaded(true); })
      .finally(() => setCollegePostsLoading(false));
  }, [college, unitid, collegePostsLoaded, collegePostsLoading]);

  const tips = useMemo(() => {
    if (!college) return [];
    const t: { icon: React.ReactNode; color: string; text: string }[] = [];
    if (college.noLoanPolicy) t.push({ icon: <IcGift size={18}/>, color: "text-green-600 bg-green-50", text: "No-loan policy — all aid is grants, zero institutional debt." });
    if (college.meetsFullDemonstratedNeed) t.push({ icon: <IcShield size={18}/>, color: "text-green-600 bg-green-50", text: "Meets 100% of demonstrated need for every admitted student." });
    if (college.stemOptEligible) t.push({ icon: <IcFlask size={18}/>, color: "text-blue-600 bg-blue-50", text: "STEM OPT eligible — 36 months work auth vs. standard 12." });
    if (college.type === "public") t.push({ icon: <IcBuilding size={18}/>, color: "text-gray-600 bg-gray-50", text: "Public school: internationals pay out-of-state tuition with minimal aid." });
    if (college.internationalAcceptanceRate != null && college.overallAcceptanceRate != null &&
        college.internationalAcceptanceRate < college.overallAcceptanceRate * 0.6)
      t.push({ icon: <IcAlert size={18}/>, color: "text-amber-600 bg-amber-50", text: `International acceptance (${college.internationalAcceptanceRate}%) is much lower than overall (${college.overallAcceptanceRate}%).` });
    if (college.healthInsurance > 4000) t.push({ icon: <IcHospital size={18}/>, color: "text-red-500 bg-red-50", text: `F-1 health insurance is ${fmt(college.healthInsurance)}/yr — mandatory.` });
    return t;
  }, [college]);

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-4 animate-pulse">
      {[1,2,3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl"/>)}
    </div>
  );
  if (error || (!loading && !college)) return (
    <div className="max-w-7xl mx-auto px-4 py-12 text-center">
      <p className="text-gray-400 text-sm mb-4">{error ?? "College not found."}</p>
      <Link href="/dashboard/research" className="text-sm font-semibold text-[#001049] underline">← Back</Link>
    </div>
  );
  if (!college) return null;

  const schoolSubs = college.redditSubs;
  const sharedSubs = ["ApplyingToCollege", "gradadmissions", "IntltoUSA"];
  const nicheSlug  = college.nicheSlug  ?? slugify(college.name);
  const usNewsSlug = college.usNewsSlug ?? slugify(college.name);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">

      {/* ── Top nav bar ── */}
      <div className="flex items-center justify-between mb-5">
        <Link href="/dashboard/research" className="text-sm text-gray-400 hover:text-[#001049] flex items-center gap-1.5 transition-colors">
          <svg viewBox="0 0 16 16" className="w-4 h-4 fill-current"><path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 7H15a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"/></svg>
          Back to research
        </Link>
        <Link href="/dashboard/research/compare" className="text-sm font-semibold text-white bg-[#001049] hover:bg-[#001049]/90 px-4 py-2 rounded-xl transition-colors">
          + Add to Journal
        </Link>
      </div>

      {/* ── Two-column layout ── */}
      <div className="flex gap-6 items-start">

        {/* ════ MAIN CONTENT ════ */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* HERO */}
          <div id="s-hero" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden scroll-mt-6">
            <div className="flex flex-col lg:flex-row">
            <div className="flex-1 min-w-0 p-6">

              <div className="flex items-start gap-5 mb-5">
                {college.logoUrl && !logoErr
                  ? <img src={college.logoUrl} alt={college.name} className="w-20 h-20 rounded-2xl border border-gray-100 bg-white p-2 object-contain shrink-0 shadow-sm" onError={() => setLogoErr(true)}/>
                  : <div className="w-20 h-20 rounded-2xl bg-[#001049] flex items-center justify-center text-white text-2xl font-bold shrink-0">{college.name.slice(0,2).toUpperCase()}</div>
                }
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    {college.nationalRank != null && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold bg-[#001049] text-white px-2.5 py-1 rounded-full">
                        <svg viewBox="0 0 12 12" className="w-3 h-3 fill-current"><path d="M6 1l1.4 2.8 3.1.45-2.25 2.2.53 3.1L6 8.1l-2.78 1.45.53-3.1L1.5 4.25l3.1-.45L6 1z"/></svg>
                        #{college.nationalRank} US Ranking
                      </span>
                    )}
                    <span className="text-xs font-semibold text-gray-500 border border-gray-200 px-2.5 py-1 rounded-full">{college.type === "public" ? "Public" : "Private"}</span>
                    {college.stemOptEligible && <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">STEM OPT</span>}
                    {college.meetsFullDemonstratedNeed && <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">Meets Full Need</span>}
                    {college.noLoanPolicy && <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">No Loans</span>}
                  </div>
                  <h1 className="text-2xl font-bold text-[#001049] leading-tight">{college.name}</h1>
                  <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1"><IcMapPin size={13} className="shrink-0 opacity-60"/>{college.location}</p>
                  {college.majorCategories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {college.majorCategories.slice(0,7).map(c => (
                        <span key={c} className="text-xs bg-[#001049]/5 text-[#001049]/70 border border-[#001049]/10 px-2 py-0.5 rounded-full">{c}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {/* 4-stat row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { icon: <IcDollar size={22}/>, label: "Tuition", value: fmt(college.tuition), sub: college.type === "public" ? "OOS rate" : "per year", accent: false },
                  { icon: <IcShield size={22}/>, label: college.estimatedNetCost != null ? "Est. Net Cost" : "Total COA", value: fmt(college.estimatedNetCost ?? college.totalCostOfAttendance), sub: college.estimatedNetCost != null ? "after avg aid" : "full price", accent: college.estimatedNetCost != null },
                  { icon: <IcTarget size={22}/>, label: "Acceptance Rate", value: college.overallAcceptanceRate != null ? pct(college.overallAcceptanceRate) : "N/A", sub: college.overallAcceptanceRate != null && college.overallAcceptanceRate < 10 ? "Highly selective" : "Overall", accent: false },
                  { icon: <IcGlobe size={22}/>, label: "Int'l Students", value: college.internationalPercent != null ? college.internationalPercent + "%" : "N/A", sub: college.intlStudentsEstimate != null ? `≈ ${college.intlStudentsEstimate.toLocaleString()} students` : "of enrollment", accent: false },
                ].map(s => (
                  <div key={s.label} className={`rounded-2xl p-4 flex items-start gap-3 ${s.accent ? "bg-[#001049]" : "bg-gray-50 border border-gray-100"}`}>
                    <span className={`shrink-0 mt-0.5 ${s.accent ? "text-white/70" : "text-[#001049]/50"}`}>{s.icon}</span>
                    <div>
                      <p className={`text-xs font-medium ${s.accent ? "text-white/60" : "text-gray-400"}`}>{s.label}</p>
                      <p className={`text-xl font-bold leading-tight ${s.accent ? "text-white" : "text-[#001049]"}`}>{s.value}</p>
                      <p className={`text-xs ${s.accent ? "text-white/50" : "text-gray-400"}`}>{s.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right: Wikipedia college photo ── */}
            <div className="lg:w-80 shrink-0 border-t lg:border-t-0 lg:border-l border-gray-100 bg-gray-50/50 relative">
              <CollegeWikiPhoto name={college.name} />
            </div>
            </div>
          </div>

          {/* AT A GLANCE — score gauges */}
          <div id="s-glance" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden scroll-mt-6">
            <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-50">
              <span className="text-[#001049] opacity-70"><IcBarChart size={18}/></span>
              <h2 className="text-sm font-bold text-[#001049] uppercase tracking-wide">At a Glance</h2>
            </div>
            <div className="p-6 flex flex-wrap justify-around gap-6">
              <RingGauge value={college.financialAccessibilityScore} color="#001049" label="Aid Score" sub="financial access"/>
              {(college.completionRate4yr ?? profile?.gradRate) != null && (
                <RingGauge value={Math.round((college.completionRate4yr ?? profile?.gradRate ?? 0) * 100)} color="#8b5cf6" label="Grad Rate" sub="4-yr completion"/>
              )}
              {(college.retentionRate ?? profile?.retentionRate) != null && (
                <RingGauge value={Math.round((college.retentionRate ?? profile?.retentionRate ?? 0) * 100)} color="#10b981" label="Retention" sub="1-yr full-time"/>
              )}
              <RingGauge value={college.internationalPercent ?? 0} max={30} color="#3b82f6" label="Intl Share" sub="% of campus"/>
            </div>
          </div>

          {/* TIPS */}
          {tips.length > 0 && (
            <div id="s-tips" className="bg-[#FFFCF3] rounded-2xl border border-[#FFCA3A]/50 shadow-sm overflow-hidden scroll-mt-6">
              <div className="flex items-center gap-2.5 px-6 py-4 border-b border-[#FFCA3A]/30">
                <span className="text-amber-600"><IcLightbulb size={18}/></span>
                <h2 className="text-sm font-bold text-amber-900 uppercase tracking-wide">Tips for International Applicants</h2>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {tips.map((t, i) => (
                  <div key={i} className="bg-white rounded-xl px-4 py-3 flex items-start gap-3 border border-[#FFCA3A]/20">
                    <span className={`shrink-0 mt-0.5 rounded-lg p-1.5 ${t.color}`}>{t.icon}</span>
                    <p className="text-sm text-gray-700 leading-relaxed">{t.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* INTERNATIONAL STUDENTS */}
          <Section id="s-intl" icon={<IcGlobe size={18}/>} title="International Students">

            {/* Campus presence row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <div className="bg-[#001049] rounded-2xl p-4 text-center">
                <p className="text-3xl font-black text-white">{college.internationalPercent != null ? college.internationalPercent + "%" : "N/A"}</p>
                <p className="text-xs text-white/60 mt-1">of undergrads</p>
                <p className="text-xs text-white font-semibold mt-0.5">Int&apos;l Students</p>
              </div>
              {college.intlStudentsEstimate != null && college.intlStudentsEstimate > 0 && (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center">
                  <p className="text-3xl font-black text-blue-700">~{college.intlStudentsEstimate.toLocaleString()}</p>
                  <p className="text-xs text-blue-500 mt-1">undergrads</p>
                  <p className="text-xs text-blue-600 font-semibold mt-0.5">Est. Intl Enrollment</p>
                </div>
              )}
              {college.countriesRepresented != null && (
                <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 text-center">
                  <p className="text-3xl font-black text-purple-700">{college.countriesRepresented}</p>
                  <p className="text-xs text-purple-500 mt-1">countries</p>
                  <p className="text-xs text-purple-600 font-semibold mt-0.5">Represented</p>
                </div>
              )}
              {college.internationalAcceptanceRate != null ? (
                <div className={`rounded-2xl p-4 text-center border ${
                  college.overallAcceptanceRate != null && college.internationalAcceptanceRate < college.overallAcceptanceRate * 0.7
                    ? "bg-amber-50 border-amber-100"
                    : "bg-green-50 border-green-100"
                }`}>
                  <p className={`text-3xl font-black ${
                    college.overallAcceptanceRate != null && college.internationalAcceptanceRate < college.overallAcceptanceRate * 0.7
                      ? "text-amber-700" : "text-green-700"
                  }`}>{pct(college.internationalAcceptanceRate)}</p>
                  <p className={`text-xs mt-1 ${college.overallAcceptanceRate != null && college.internationalAcceptanceRate < college.overallAcceptanceRate * 0.7 ? "text-amber-500" : "text-green-500"}`}>
                    {college.overallAcceptanceRate != null ? `vs ${pct(college.overallAcceptanceRate)} overall` : "acceptance rate"}
                  </p>
                  <p className={`text-xs font-semibold mt-0.5 ${college.overallAcceptanceRate != null && college.internationalAcceptanceRate < college.overallAcceptanceRate * 0.7 ? "text-amber-600" : "text-green-600"}`}>
                    Intl Accept Rate
                  </p>
                </div>
              ) : college.overallAcceptanceRate != null && (
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-center">
                  <p className="text-3xl font-black text-[#001049]">{pct(college.overallAcceptanceRate)}</p>
                  <p className="text-xs text-gray-400 mt-1">no intl-specific data</p>
                  <p className="text-xs text-gray-500 font-semibold mt-0.5">Overall Accept Rate</p>
                </div>
              )}
            </div>

            {/* Aid eligibility band */}
            <div className={`rounded-xl px-4 py-3.5 flex items-start gap-3 mb-4 ${college.type === "public" ? "bg-amber-50 border border-amber-100" : "bg-green-50 border border-green-100"}`}>
              <span className={`shrink-0 mt-0.5 ${college.type === "public" ? "text-amber-500" : "text-green-500"}`}>
                {college.type === "public" ? <IcAlert size={20}/> : <IcShield size={20}/>}
              </span>
              <div>
                <p className={`text-sm font-semibold ${college.type === "public" ? "text-amber-800" : "text-green-800"}`}>
                  {college.type === "public"
                    ? "Public school — international students typically pay full out-of-state tuition"
                    : "Private school — institutional aid is generally available to international students"}
                </p>
                <p className={`text-xs mt-0.5 leading-relaxed ${college.type === "public" ? "text-amber-700" : "text-green-700"}`}>
                  {college.type === "public"
                    ? "Most state-funded schools are prohibited from giving need-based aid to non-residents. Merit scholarships may exist but are limited."
                    : "Private colleges set their own aid policies. Financial need is assessed using CSS Profile or institutional forms — international students can qualify."}
                </p>
              </div>
            </div>

            {/* Aid policy badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {([
                { label: "Meets Full Need",  active: college.meetsFullDemonstratedNeed, icon: <IcShield size={14}/>,  on: "bg-green-100 text-green-700 border-green-200",  off: "bg-gray-50 text-gray-300 border-gray-100" },
                { label: "No-Loan Policy",   active: college.noLoanPolicy,             icon: <IcGift size={14}/>,    on: "bg-emerald-100 text-emerald-700 border-emerald-200", off: "bg-gray-50 text-gray-300 border-gray-100" },
                { label: "STEM OPT (36 mo)", active: college.stemOptEligible,          icon: <IcFlask size={14}/>,   on: "bg-blue-100 text-blue-700 border-blue-200",    off: "bg-gray-50 text-gray-300 border-gray-100" },
                { label: "Renewable Aid",    active: college.aidIsRenewable,           icon: <IcRefresh size={14}/>, on: "bg-indigo-100 text-indigo-700 border-indigo-200", off: "bg-gray-50 text-gray-300 border-gray-100" },
                { label: "Recruits Intl",    active: college.activelyRecruitsUnderrepresented, icon: <IcGlobe size={14}/>, on: "bg-purple-100 text-purple-700 border-purple-200", off: "bg-gray-50 text-gray-300 border-gray-100" },
              ] as const).map(b => (
                <div key={b.label} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${b.active ? b.on : b.off}`}>
                  {b.icon}{b.label}
                </div>
              ))}
            </div>

            {/* Institutional grant stats from IPEDS */}
            {college.averageAidPackage != null && (
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">Institutional Grant Aid (IPEDS 2023-24 · All FTFT students)</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <p className="text-2xl font-black text-[#001049]">{fmt(college.averageAidPackage)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">avg institutional grant / yr</p>
                  </div>
                  {college.percentReceivingAid != null && (
                    <div>
                      <p className="text-2xl font-black text-[#001049]">{college.percentReceivingAid}%</p>
                      <p className="text-xs text-gray-500 mt-0.5">of first-time students receive any grant</p>
                    </div>
                  )}
                  {college.estimatedNetCost != null && (
                    <div>
                      <p className="text-2xl font-black text-[#001049]">{fmt(college.estimatedNetCost)}</p>
                      <p className="text-xs text-gray-500 mt-0.5">est. net cost after avg grant</p>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-gray-400 mt-3 leading-relaxed">
                  Source: IPEDS SFA data covers all first-time full-time undergrads. International students at private schools often receive comparable packages; public school figures reflect primarily domestic aid.
                </p>
              </div>
            )}

            {/* Renewal conditions note */}
            {college.renewalConditions && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex gap-2.5 mt-3">
                <span className="text-amber-600 shrink-0 mt-0.5"><IcClipboard size={16}/></span>
                <div>
                  <p className="text-xs font-semibold text-amber-800 mb-0.5">Aid Renewal Conditions</p>
                  <p className="text-xs text-amber-700 leading-relaxed">{college.renewalConditions}</p>
                </div>
              </div>
            )}
          </Section>

          {/* FINANCIAL AID */}
          <Section id="s-aid" icon={<IcDollar size={18}/>} title="Financial Aid for Internationals">
            {!college.offersAidToInternationals ? (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-4 flex gap-3">
                <span className="text-red-500 mt-0.5 shrink-0"><IcXCircle size={22}/></span>
                <div>
                  <p className="text-sm font-semibold text-red-700">Aid not available</p>
                  <p className="text-sm text-red-600 mt-0.5">No institutional aid for international undergrads — expect full cost of attendance.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  {college.averageAidPackage != null && (
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
                      <p className="text-xs text-green-600 font-semibold mb-1">Avg Aid Package</p>
                      <p className="text-4xl font-black text-green-700">{fmt(college.averageAidPackage)}</p>
                      <p className="text-xs text-green-600 mt-1">per year</p>
                    </div>
                  )}
                  {college.percentReceivingAid != null && (
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-center">
                      <p className="text-xs text-blue-600 font-semibold mb-1">% Receiving Aid</p>
                      <p className="text-4xl font-black text-blue-700">{college.percentReceivingAid}%</p>
                      <p className="text-xs text-blue-600 mt-1">of internationals</p>
                    </div>
                  )}
                  {college.estimatedNetCost != null && (
                    <div className="bg-[#001049] rounded-2xl p-5 text-center">
                      <p className="text-xs text-white/60 font-semibold mb-1">Est. Net Cost</p>
                      <p className="text-4xl font-black text-white">{fmt(college.estimatedNetCost)}</p>
                      <p className="text-xs text-white/50 mt-1">after avg aid</p>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {([
                    { label: "Full Need", active: college.meetsFullDemonstratedNeed, icon: <IcShield size={22}/> },
                    { label: "No Loans",  active: college.noLoanPolicy,              icon: <IcGift size={22}/> },
                    { label: "Renewable", active: college.aidIsRenewable,            icon: <IcRefresh size={22}/> },
                  ] as const).map(item => (
                    <div key={item.label} className={`rounded-xl p-3 text-center border flex flex-col items-center gap-1 ${item.active ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-100 opacity-40"}`}>
                      <span className={item.active ? "text-green-600" : "text-gray-400"}>{item.icon}</span>
                      <p className={`text-xs font-bold ${item.active ? "text-green-700" : "text-gray-400"}`}>{item.label}</p>
                    </div>
                  ))}
                </div>
                {college.renewalConditions && (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex gap-2.5 mb-3">
                    <span className="text-amber-600 shrink-0 mt-0.5"><IcClipboard size={16}/></span>
                    <p className="text-xs text-amber-800 leading-relaxed">{college.renewalConditions}</p>
                  </div>
                )}
                {college.meritScholarships.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {college.meritScholarships.map((s, i) => (
                      <div key={i} className="bg-[#FFFCF3] border border-[#FFCA3A]/40 rounded-xl px-3.5 py-2.5 flex items-center gap-2">
                        <span className="text-amber-500"><IcTrophy size={16}/></span>
                        <div>
                          <p className="text-sm font-semibold text-[#001049]">{s.name}</p>
                          {s.amount != null && <p className="text-xs text-amber-700">{fmt(s.amount)}/yr</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </Section>

          {/* COST BREAKDOWN */}
          <Section id="s-cost" icon={<IcReceipt size={18}/>} title="Full Cost Breakdown (Annual)">
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <CostRow label="Tuition" value={college.tuition} note={college.type === "public" ? "OOS rate" : undefined}/>
              <CostRow label="Room & Board" value={college.roomAndBoard}/>
              <CostRow label="Books & Supplies" value={college.booksAndSupplies}/>
              <CostRow label="Personal Expenses" value={college.personalExpenses}/>
              <CostRow label="Health Insurance (F-1 mandatory)" value={college.healthInsurance} variant="amber"/>
              <CostRow label="Total Cost of Attendance" value={college.totalCostOfAttendance} variant="bold"/>
              {college.estimatedNetCost != null && <CostRow label="Est. Net Cost after Avg Aid" value={college.estimatedNetCost} variant="navy"/>}
            </div>
          </Section>

          {/* NET PRICE BY INCOME */}
          {(college.netPrice0_30k ?? college.netPrice30k_48k ?? college.avgNetPriceOverall) != null && (
            <Section id="s-netprice" icon={<IcDollar size={18}/>} title="Net Price by Family Income">
              <p className="text-xs text-gray-500 mb-4">Average annual net price (tuition + fees + housing − all grants & scholarships) for full-time first-time students by family income.</p>
              <div className="space-y-3">
                {([
                  { label: "Under $30k / yr",     value: college.netPrice0_30k },
                  { label: "$30k – $48k / yr",    value: college.netPrice30k_48k },
                  { label: "$48k – $75k / yr",    value: college.netPrice48k_75k },
                  { label: "$75k – $110k / yr",   value: college.netPrice75k_110k },
                  { label: "Over $110k / yr",     value: college.netPrice110kPlus },
                ] as { label: string; value: number | null }[]).map(({ label, value }) => {
                  if (value == null) return null;
                  const maxBracket = Math.max(
                    college.netPrice0_30k ?? 0, college.netPrice30k_48k ?? 0,
                    college.netPrice48k_75k ?? 0, college.netPrice75k_110k ?? 0,
                    college.netPrice110kPlus ?? 0
                  );
                  const pctBar = maxBracket > 0 ? (value / maxBracket) * 100 : 0;
                  const isLow = value < 15000;
                  return (
                    <div key={label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600 font-medium">{label}</span>
                        <span className={`font-bold ${isLow ? "text-green-700" : "text-[#001049]"}`}>${value.toLocaleString()}</span>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${isLow ? "bg-green-500" : "bg-[#3b5bdb]"}`} style={{ width: `${pctBar}%` }}/>
                      </div>
                    </div>
                  );
                })}
              </div>
              {college.avgNetPriceOverall != null && (
                <div className="mt-4 bg-[#001049]/5 rounded-xl px-4 py-3 flex justify-between text-sm">
                  <span className="text-gray-600 font-medium">Institution-wide avg net price</span>
                  <span className="font-bold text-[#001049]">${college.avgNetPriceOverall.toLocaleString()}</span>
                </div>
              )}
              {college.priceCalculatorUrl && (
                <a href={college.priceCalculatorUrl} target="_blank" rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#3b5bdb] hover:underline">
                  <IcExternalLink size={12}/>Calculate your personal net price →
                </a>
              )}
            </Section>
          )}

          {/* ADMISSIONS + SAT */}
          <Section id="s-admissions" icon={<IcGradCap size={18}/>} title="Admissions & Test Scores">
            {/* Enrollment + acceptance stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <BigStat value={college.overallAcceptanceRate != null ? pct(college.overallAcceptanceRate) : "—"} label="Overall accept rate"/>
              <BigStat value={college.internationalAcceptanceRate != null ? pct(college.internationalAcceptanceRate) : "Same"} label="Int'l accept rate"/>
              {(college.ugds ?? profile?.enrollment) != null && <BigStat value={(college.ugds ?? profile?.enrollment ?? 0).toLocaleString()} label="Undergrads"/>}
              {(college.gradStudents ?? profile?.gradStudents) != null && <BigStat value={(college.gradStudents ?? profile?.gradStudents ?? 0).toLocaleString()} label="Grad students"/>}
            </div>

            {/* Test requirements badge */}
            {(college.testRequirements ?? profile?.testRequirements) != null && (() => {
              const req = college.testRequirements ?? profile?.testRequirements;
              const { label, cls } = req === 1
                ? { label: "Tests Required", cls: "bg-red-50 border-red-200 text-red-700" }
                : req === 2
                ? { label: "Tests Recommended", cls: "bg-amber-50 border-amber-200 text-amber-700" }
                : req === 3
                ? { label: "Test-Optional / Test-Free", cls: "bg-green-50 border-green-200 text-green-700" }
                : { label: "Tests Considered (not required)", cls: "bg-blue-50 border-blue-200 text-blue-700" };
              return (
                <div className={`inline-flex items-center gap-2 border rounded-full px-3 py-1 text-xs font-semibold mb-4 ${cls}`}>
                  <IcShield size={12}/>{label}
                </div>
              );
            })()}

            {/* SAT/ACT scores */}
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
              if (!hasData) return (
                <p className="text-xs text-gray-400 mt-2">SAT/ACT data not reported for this school.</p>
              );
              return (
                <div className="mt-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Test Score Ranges (25th–75th Percentile)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 divide-y sm:divide-y-0 divide-gray-100">
                    <div>
                      {satAvg != null && (
                        <div className="flex items-center justify-between py-2.5 border-b border-gray-100">
                          <span className="text-sm font-semibold text-gray-700">SAT Average</span>
                          <span className="text-xl font-black text-[#001049]">{Math.round(satAvg)}</span>
                        </div>
                      )}
                      <ScoreRange label="SAT Math"    lo={sat25M ?? null} hi={sat75M ?? null} min={200} max={800} color="#001049"/>
                      <ScoreRange label="SAT Reading" lo={sat25R ?? null} hi={sat75R ?? null} min={200} max={800} color="#3b5bdb"/>
                    </div>
                    <div>
                      {actMid != null && (
                        <div className="flex items-center justify-between py-2.5 border-b border-gray-100">
                          <span className="text-sm font-semibold text-gray-700">ACT Midpoint</span>
                          <span className="text-xl font-black text-[#001049]">{actMid}</span>
                        </div>
                      )}
                      <ScoreRange label="ACT Composite" lo={act25 ?? null} hi={act75 ?? null} min={1} max={36} color="#f59e0b"/>
                    </div>
                  </div>
                </div>
              );
            })()}

            {college.internationalAcceptanceRate != null && college.overallAcceptanceRate != null &&
              college.internationalAcceptanceRate < college.overallAcceptanceRate * 0.6 && (
              <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex gap-2.5">
                <span className="text-amber-500 shrink-0 mt-0.5"><IcAlert size={18}/></span>
                <p className="text-sm text-amber-800">International acceptance is significantly lower than the overall rate — competition for international spots is substantially higher.</p>
              </div>
            )}
          </Section>

          {/* OUTCOMES & DEBT */}
          <Section id="s-outcomes" icon={<IcTrophy size={18}/>} title="Outcomes & Debt">
            {/* Key stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
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

            {/* Debt breakdown */}
            {(college.medianDebtCompleters ?? profile?.medianDebtCompleters) != null && (
              <div className="mb-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Student Debt at Graduation</p>
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  {(college.medianDebtCompleters ?? profile?.medianDebtCompleters) != null && (
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 text-sm">
                      <span className="text-gray-600">Median debt (completers)</span>
                      <span className="font-bold text-[#001049]">{fmt(college.medianDebtCompleters ?? profile?.medianDebtCompleters ?? 0)}</span>
                    </div>
                  )}
                  {(college.medianDebtMonthly ?? profile?.medianDebtMonthly) != null && (
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 text-sm">
                      <span className="text-gray-600">Est. monthly payment</span>
                      <span className="font-bold text-[#001049]">${Math.round(college.medianDebtMonthly ?? profile?.medianDebtMonthly ?? 0)}/mo</span>
                    </div>
                  )}
                  {(college.pellGrantRate ?? profile?.pellGrantRate) != null && (
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 text-sm">
                      <span className="text-gray-600">Share with Pell Grant</span>
                      <span className="font-bold text-[#001049]">{pct(Math.round((college.pellGrantRate ?? profile?.pellGrantRate ?? 0) * 100))}</span>
                    </div>
                  )}
                  {(college.federalLoanRate ?? profile?.federalLoanRate) != null && (
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 text-sm">
                      <span className="text-gray-600">Share taking federal loans</span>
                      <span className="font-bold text-[#001049]">{pct(Math.round((college.federalLoanRate ?? profile?.federalLoanRate ?? 0) * 100))}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Cumulative debt distribution */}
            {(college.debt90th ?? profile?.debt90th) != null && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Cumulative Debt Distribution</p>
                <div className="space-y-2.5">
                  {([
                    { label: "10th pct", value: college.debt10th ?? profile?.debt10th, color: "bg-green-400" },
                    { label: "25th pct", value: college.debt25th ?? profile?.debt25th, color: "bg-green-500" },
                    { label: "75th pct", value: college.debt75th ?? profile?.debt75th, color: "bg-amber-500" },
                    { label: "90th pct", value: college.debt90th ?? profile?.debt90th, color: "bg-red-500" },
                  ] as { label: string; value: number | null; color: string }[]).filter(d => d.value != null).map(({ label, value, color }) => {
                    const maxDebt = college.debt90th ?? profile?.debt90th ?? 1;
                    return (
                      <div key={label} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-14 shrink-0 text-right">{label}</span>
                        <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${color}`} style={{ width: `${(value! / maxDebt) * 100}%` }}/>
                        </div>
                        <span className="text-xs font-semibold text-gray-700 w-16 shrink-0">{fmt(value!)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Section>

          {/* INSTITUTION PROFILE */}
          <Section id="s-institution" icon={<IcBuilding size={18}/>} title="Institution Profile">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                {(college.accreditor ?? profile?.accreditor) && (
                  <div className="flex items-start gap-2 text-sm">
                    <IcShield size={15} className="text-[#001049] shrink-0 mt-0.5 opacity-60"/>
                    <div>
                      <p className="text-xs text-gray-400">Accreditor</p>
                      <p className="font-medium text-gray-800">{college.accreditor ?? profile?.accreditor}</p>
                    </div>
                  </div>
                )}
                {(college.carnegieBasic ?? profile?.carnegieBasic) != null && (() => {
                  const cb = college.carnegieBasic ?? profile?.carnegieBasic;
                  const label = cb === 15 ? "R1 – Doctoral (Very High Research)" : cb === 16 ? "R2 – Doctoral (High Research)" : cb === 17 ? "Doctoral/Professional" : cb === 18 ? "Master's (Large)" : cb === 19 ? "Master's (Medium)" : cb === 20 ? "Master's (Small)" : cb === 21 ? "Baccalaureate (Arts & Sciences)" : cb === 22 ? "Baccalaureate (Diverse)" : cb === 23 ? "Baccalaureate/Associate's" : `Carnegie Class ${cb}`;
                  return (
                    <div className="flex items-start gap-2 text-sm">
                      <IcFlask size={15} className="text-[#001049] shrink-0 mt-0.5 opacity-60"/>
                      <div>
                        <p className="text-xs text-gray-400">Carnegie Classification</p>
                        <p className="font-medium text-gray-800">{label}</p>
                      </div>
                    </div>
                  );
                })()}
                {(college.endowment ?? profile?.endowment) != null && (
                  <div className="flex items-start gap-2 text-sm">
                    <IcDollar size={15} className="text-[#001049] shrink-0 mt-0.5 opacity-60"/>
                    <div>
                      <p className="text-xs text-gray-400">Endowment</p>
                      <p className="font-medium text-gray-800">
                        {(college.endowment ?? profile?.endowment)! >= 1e9
                          ? `$${((college.endowment ?? profile?.endowment)! / 1e9).toFixed(1)}B`
                          : `$${Math.round((college.endowment ?? profile?.endowment)! / 1e6)}M`}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                {(college.facultySalary ?? profile?.facultySalary) != null && (
                  <div className="flex items-start gap-2 text-sm">
                    <IcUsers size={15} className="text-[#001049] shrink-0 mt-0.5 opacity-60"/>
                    <div>
                      <p className="text-xs text-gray-400">Avg Faculty Salary</p>
                      <p className="font-medium text-gray-800">${Math.round((college.facultySalary ?? profile?.facultySalary ?? 0)).toLocaleString()}/mo</p>
                    </div>
                  </div>
                )}
                {(college.ftFacultyRate ?? profile?.ftFacultyRate) != null && (
                  <div className="flex items-start gap-2 text-sm">
                    <IcGradCap size={15} className="text-[#001049] shrink-0 mt-0.5 opacity-60"/>
                    <div>
                      <p className="text-xs text-gray-400">Full-time Faculty</p>
                      <p className="font-medium text-gray-800">{pct(Math.round((college.ftFacultyRate ?? profile?.ftFacultyRate ?? 0) * 100))}</p>
                    </div>
                  </div>
                )}
                {/* Minority serving flags */}
                {(college.minorityServing.hispanic || college.minorityServing.annh || college.minorityServing.tribal || college.minorityServing.aanipi) && (
                  <div className="flex items-start gap-2 text-sm">
                    <IcStar size={15} className="text-[#001049] shrink-0 mt-0.5 opacity-60"/>
                    <div>
                      <p className="text-xs text-gray-400">Minority-Serving Institution</p>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {college.minorityServing.hispanic && <span className="bg-orange-50 text-orange-700 border border-orange-200 text-xs font-semibold px-2 py-0.5 rounded-full">HSI</span>}
                        {college.minorityServing.annh     && <span className="bg-teal-50 text-teal-700 border border-teal-200 text-xs font-semibold px-2 py-0.5 rounded-full">ANNH</span>}
                        {college.minorityServing.tribal   && <span className="bg-brown-50 text-amber-800 border border-amber-200 text-xs font-semibold px-2 py-0.5 rounded-full">Tribal</span>}
                        {college.minorityServing.aanipi   && <span className="bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold px-2 py-0.5 rounded-full">AANIPI</span>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Student profile stats */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
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

          {/* AMSA MEMBERS */}
          <Section id="s-members" icon={<IcUsers size={18}/>} title="AMSA Members at This School">
            {studentsLoading && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            )}
            {!studentsLoading && students.length === 0 && (
              <p className="text-sm text-gray-400">No AMSA members have linked this school to their profile yet.</p>
            )}
            {!studentsLoading && students.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {students.map((s) => {
                  const initials = `${s.firstName?.[0] ?? ""}${s.lastName?.[0] ?? ""}`.toUpperCase();
                  const isAmbassador = s.role === "ambassador";
                  return (
                    <a
                      key={s.id}
                      href={`/dashboard/network/${s.id}`}
                      className="flex flex-col items-center text-center bg-gray-50 hover:bg-gray-100 rounded-xl p-3 transition"
                    >
                      <div className="w-12 h-12 rounded-full bg-[#FFCA3A] flex items-center justify-center text-[#001049] text-sm font-bold shrink-0 overflow-hidden">
                        {s.profilePic
                          ? <img src={s.profilePic} alt={`${s.firstName} ${s.lastName}`} className="w-full h-full object-cover" />
                          : initials}
                      </div>
                      <p className="text-xs font-semibold text-gray-800 mt-1.5 leading-snug line-clamp-1">
                        {s.firstName} {s.lastName}
                      </p>
                      {isAmbassador && (
                        <span className="mt-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#FFCA3A] text-[#001049]">
                          Ambassador
                        </span>
                      )}
                      {s.major && (
                        <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{s.major}</p>
                      )}
                    </a>
                  );
                })}
              </div>
            )}
          </Section>

          {/* COMMUNITY POSTS */}
          <Section id="s-posts" icon={<IcFileText size={18}/>} title="Community Posts">
            {collegePostsLoading && (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            )}
            {!collegePostsLoading && collegePosts.length === 0 && (
              <p className="text-sm text-gray-400">No posts tagged to this school yet.</p>
            )}
            {!collegePostsLoading && collegePosts.length > 0 && (
              <div className="space-y-3">
                {collegePosts.slice(0, 10).map((post) => {
                  const initials = `${post.author?.firstName?.[0] ?? ""}${post.author?.lastName?.[0] ?? ""}`.toUpperCase() || "U";
                  const ago = (() => {
                    const diffMs = Math.max(0, Date.now() - new Date(post.createdAt).getTime());
                    const diffMin = Math.floor(diffMs / 60000);
                    if (diffMin < 1) return "Just now";
                    if (diffMin < 60) return `${diffMin}m`;
                    const diffHr = Math.floor(diffMin / 60);
                    if (diffHr < 24) return `${diffHr}h`;
                    return `${Math.floor(diffHr / 24)}d`;
                  })();
                  return (
                    <div key={post.id} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="relative shrink-0">
                          <div className="w-8 h-8 rounded-full bg-[#FFCA3A] text-[#001049] text-xs font-bold flex items-center justify-center overflow-hidden">
                            {post.author?.profilePic
                              ? <img src={post.author.profilePic} alt="" className="w-full h-full object-cover" />
                              : initials}
                          </div>
                          {post.college?.logoUrl && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-gray-50 bg-white overflow-hidden">
                              <img src={post.college.logoUrl} alt={post.college.name} className="w-full h-full object-contain" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-gray-800 truncate">
                            {post.author ? `${post.author.firstName} ${post.author.lastName}` : "AMSA Member"}
                          </p>
                          <p className="text-[10px] text-gray-400">{ago}</p>
                        </div>
                        {post.topic && (
                          <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#001049]/8 text-[#001049]">
                            {post.topic}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-[#001049] leading-snug">{post.title}</p>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">{post.body}</p>
                    </div>
                  );
                })}
                <a
                  href="/dashboard/feed"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#001049] hover:underline mt-1"
                >
                  View all in Feed <IcExternalLink size={11}/>
                </a>
              </div>
            )}
          </Section>

          {/* STUDENT REVIEWS */}
          <Section id="s-reviews" icon={<IcStar size={18}/>} title="Student Happiness & Reviews">
            <p className="text-sm text-gray-400 -mt-1 mb-5">Aggregated from thousands of verified student reviews</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { domain: "niche.com", name: "Niche", desc: "Happiness · social life · diversity", href: `https://niche.com/colleges/${nicheSlug}/` },
                { domain: "usnews.com", name: "US News", desc: "Rankings · full profile", href: `https://www.usnews.com/best-colleges/${usNewsSlug}-${college.id}` },
                { domain: "princetonreview.com", name: "Princeton Review", desc: "Culture · best-of lists", href: `https://www.princetonreview.com/college-search?name=${encodeURIComponent(college.name)}` },
                { domain: "collegefactual.com", name: "College Factual", desc: "Major outcomes · earnings", href: `https://www.collegefactual.com/colleges/${slugify(college.name)}/` },
              ].map(item => (
                <a key={item.name} href={item.href} target="_blank" rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2.5 bg-gray-50 hover:bg-[#001049]/5 border border-gray-100 hover:border-[#001049]/20 rounded-2xl p-4 text-center transition-colors group">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                    <FaviconLogo domain={item.domain} size={28}/>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#001049] group-hover:underline">{item.name}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">{item.desc}</p>
                  </div>
                  <IcExternalLink size={13} className="text-gray-300"/>
                </a>
              ))}
            </div>
          </Section>

          {/* REDDIT & NEWS */}
          <Section id="s-reddit" icon={<IcChat size={18}/>} title="Reddit & News">
            <div className="space-y-5">
              {schoolSubs.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">School Communities</p>
                  <div className="flex flex-wrap gap-2">
                    {schoolSubs.map(sub => (
                      <a key={sub} href={`https://reddit.com/r/${sub}`} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-800 font-semibold text-sm rounded-full pl-2 pr-3.5 py-1.5 transition-colors">
                        <RedditLogo size={18}/>r/{sub}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Applicant Communities</p>
                <div className="flex flex-wrap gap-2">
                  {sharedSubs.map(sub => (
                    <a key={sub} href={`https://reddit.com/r/${sub}/search?q=${encodeURIComponent(college.name)}&sort=top`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-medium text-sm rounded-full pl-2 pr-3.5 py-1.5 transition-colors">
                      <RedditLogo size={18}/>r/{sub}
                    </a>
                  ))}
                  <a href={`https://www.reddit.com/search/?q=${encodeURIComponent(college.name)}&sort=top&t=year`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-dashed border-gray-300 text-gray-500 text-sm rounded-full pl-2 pr-3.5 py-1.5 transition-colors">
                    <RedditLogo size={18}/>Search all Reddit →
                  </a>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">News & Links</p>
                <div className="flex flex-wrap gap-2">
                  <a href={`https://news.google.com/search?q=${encodeURIComponent(`"${college.name}"`)}&hl=en-US`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 font-semibold text-sm rounded-full pl-2 pr-3.5 py-1.5">
                    <GoogleNewsIcon size={18}/>Google News
                  </a>
                  <a href={`https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(college.name)}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 border border-[#0A66C2]/30 text-[#0A66C2] font-semibold text-sm rounded-full pl-2 pr-3.5 py-1.5">
                    <LinkedInIcon size={18}/>LinkedIn Alumni
                  </a>
                  {college.website && (
                    <a href={college.website.startsWith("http") ? college.website : `https://${college.website}`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-[#001049]/5 hover:bg-[#001049]/10 border border-[#001049]/15 text-[#001049] font-semibold text-sm rounded-full px-3.5 py-1.5">
                      <IcGlobe size={16}/>Official Site
                    </a>
                  )}
                </div>
              </div>
            </div>
          </Section>

          {/* DEMOGRAPHICS */}
          <Section id="s-demographics" icon={<IcUsers size={18}/>} title="Campus Demographics">
            {/* Top stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <BigStat value={college.internationalPercent != null ? college.internationalPercent + "%" : "N/A"} label="Int'l students"/>
              {(college.ugds ?? profile?.enrollment ?? college.intlStudentsEstimate) != null && (
                <BigStat value={"~" + (college.ugds ?? profile?.enrollment ?? college.intlStudentsEstimate)!.toLocaleString()} label="Undergrad enrollment"/>
              )}
              {college.countriesRepresented != null && <BigStat value={String(college.countriesRepresented)} label="Countries represented"/>}
              {(college.demoWomen ?? profile?.womenShare) != null && (
                <BigStat value={`${Math.round((college.demoWomen ?? profile?.womenShare ?? 0) * 100)}% W`} label="Gender (women)"/>
              )}
            </div>

            {/* Gender split bar */}
            {(college.demoMen ?? profile?.menShare) != null && (
              <div className="mb-4 space-y-1.5">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Gender split</span>
                  <span className="font-bold text-[#001049]">
                    {Math.round((college.demoMen ?? profile?.menShare ?? 0) * 100)}% M · {Math.round((college.demoWomen ?? profile?.womenShare ?? 0) * 100)}% W
                  </span>
                </div>
                <div className="h-3 rounded-full overflow-hidden flex">
                  <div className="h-full bg-[#3b5bdb]" style={{ width: `${Math.round((college.demoMen ?? profile?.menShare ?? 0) * 100)}%` }}/>
                  <div className="h-full bg-[#f472b6] flex-1"/>
                </div>
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span className="text-[#3b5bdb] font-medium">Men</span>
                  <span className="text-[#f472b6] font-medium">Women</span>
                </div>
              </div>
            )}

            {/* Race/ethnicity breakdown */}
            {(college.demoWhite ?? profile?.demoWhite) != null && (() => {
              const races = [
                { label: "White",            value: college.demoWhite          ?? profile?.demoWhite,           color: "bg-sky-400" },
                { label: "Asian",            value: college.demoAsian          ?? profile?.demoAsian,           color: "bg-violet-500" },
                { label: "Hispanic/Latino",  value: college.demoHispanic       ?? profile?.demoHispanic,        color: "bg-orange-400" },
                { label: "Black/Afr. Am.",   value: college.demoBlack          ?? profile?.demoBlack,           color: "bg-teal-500" },
                { label: "Two or more",      value: college.demoTwoOrMore      ?? profile?.demoTwoOrMore,       color: "bg-amber-400" },
                { label: "Intl. students",   value: college.demoNonResidentAlien ?? profile?.demoNonResidentAlien, color: "bg-[#001049]" },
              ].filter(r => r.value != null && r.value > 0);
              return (
                <div className="mt-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Race & Ethnicity</p>
                  <div className="space-y-2.5">
                    {races.map(({ label, value, color }) => (
                      <div key={label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600 font-medium">{label}</span>
                          <span className="font-bold text-gray-800">{Math.round((value ?? 0) * 100)}%</span>
                        </div>
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min((value ?? 0) * 100, 100)}%` }}/>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Int'l share bar */}
            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-xs text-gray-500">
                <span>International student share</span>
                <span className="font-bold text-[#001049]">{college.internationalPercent != null ? college.internationalPercent + "%" : "N/A"}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#001049] to-[#3b5bdb] rounded-full" style={{ width: `${Math.min((college.internationalPercent ?? 0) * 3.33, 100)}%` }}/>
              </div>
              <div className="flex justify-between text-[10px] text-gray-300"><span>0%</span><span>10%</span><span>20%</span><span>30%+</span></div>
            </div>
          </Section>

          <p className="text-xs text-gray-400 pb-6 text-center leading-relaxed">
            Data: US Dept of Education College Scorecard · Common Data Set · IPEDS<br/>
            Aid figures are averages — verify with each school&apos;s official net-price calculator.
          </p>
        </div>

        {/* ════ STICKY RIGHT SIDEBAR ════ */}
        <aside className="w-56 shrink-0 hidden xl:block">
          <div className="sticky top-6 space-y-4">

            {/* Section navigation */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">On This Page</p>
              <nav className="space-y-0.5">
                {SECTIONS.map(s => {
                  const active = activeSection === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                      className={`w-full text-left flex items-center gap-2 text-xs px-3 py-2 rounded-xl transition-all ${
                        active ? "bg-[#001049] text-white font-bold" : "text-gray-500 hover:text-[#001049] hover:bg-gray-50"
                      }`}
                    >
                      <span className={`shrink-0 ${active ? "opacity-90" : "opacity-50"}`}><s.Icon size={14}/></span>
                      {s.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Quick stats card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Quick Stats</p>
              {college.nationalRank != null && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">US Rank</span>
                  <span className="text-sm font-bold text-[#001049]">#{college.nationalRank}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Tuition</span>
                <span className="text-sm font-bold text-[#001049]">{fmt(college.tuition)}</span>
              </div>
              {college.estimatedNetCost != null && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Net Cost</span>
                  <span className="text-sm font-bold text-green-700">{fmt(college.estimatedNetCost)}</span>
                </div>
              )}
              {profile?.satAvg != null && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Avg SAT</span>
                  <span className="text-sm font-bold text-[#001049]">{Math.round(profile.satAvg)}</span>
                </div>
              )}
              {profile?.actMid != null && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">ACT Mid</span>
                  <span className="text-sm font-bold text-[#001049]">{profile.actMid}</span>
                </div>
              )}
              {college.overallAcceptanceRate != null && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Accept rate</span>
                  <span className="text-sm font-bold text-[#001049]">{pct(college.overallAcceptanceRate)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Aid Score</span>
                <span className={`text-sm font-bold ${college.financialAccessibilityScore >= 70 ? "text-green-600" : "text-[#001049]"}`}>{college.financialAccessibilityScore}/100</span>
              </div>
              <div className="pt-1 border-t border-gray-100">
                <Link href="/dashboard/research/compare" className="block text-center text-xs font-semibold text-white bg-[#001049] hover:bg-[#001049]/90 py-2 rounded-xl transition-colors">
                  + Add to Journal
                </Link>
              </div>
            </div>

            {/* Data source note */}
            <p className="text-[11px] text-gray-400 text-center leading-relaxed px-1">
              Scores & SAT data: College Scorecard (US DOE)
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
