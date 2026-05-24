"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { STATE_DATA } from "../research/state-data";

// ─── Types ────────────────────────────────────────────────────────────────────

type ColTier = "very_high" | "high" | "moderate" | "affordable";
type TransitRating = "excellent" | "good" | "limited" | "poor";

// ─── Constants ────────────────────────────────────────────────────────────────

const COL_TIER_LABEL: Record<ColTier, string> = {
  very_high: "Very High",
  high: "High",
  moderate: "Moderate",
  affordable: "Affordable",
};

// ─── SVG + location mapping ───────────────────────────────────────────────────

type StateSvg = { file: string; location: string };

const STATE_SVG: Record<string, StateSvg> = {
  AK: { file: "fairbanks_alaska.webp",                                     location: "Fairbanks" },
  AL: { file: "birmingham_al.webp",                                      location: "Birmingham" },
  AZ: { file: "monument_valley_az.webp",                                  location: "Monument Valley" },
  AR: { file: "eureka_springs_arkansas.webp",                             location: "Eureka Springs" },
  CA: { file: "la_california.webp",                                       location: "Los Angeles" },
  CO: { file: "aspen_co.webp",                                            location: "Aspen" },
  CT: { file: "hartford_connecticut.webp",                                location: "Hartford" },
  DE: { file: "rehoboth_beach_delaware.webp",                             location: "Rehoboth Beach" },
  DC: { file: "washington_dc.webp",                                       location: "Washington D.C." },
  FL: { file: "miami_fl.webp",                                            location: "Miami" },
  GA: { file: "atlanta_ga.webp",                                          location: "Atlanta" },
  HI: { file: "oahu_hawaii.webp",                                         location: "Oahu" },
  ID: { file: "stanley_lake_idaho.webp",                                  location: "Stanley Lake" },
  IL: { file: "chicago_il.webp",                                          location: "Chicago" },
  IN: { file: "indiana_dunes_national_park_indiana.webp",                 location: "Indiana Dunes" },
  IA: { file: "northeastern_iowa.webp",                                   location: "Northeastern Iowa" },
  KS: { file: "wichita_kansas.webp",                                      location: "Wichita" },
  KY: { file: "louisville_ky.webp",                                       location: "Louisville" },
  LA: { file: "new_orleans_bayou_louisiana.webp",                         location: "New Orleans" },
  ME: { file: "portland_me.webp",                                         location: "Portland" },
  MD: { file: "annapolis_md.webp",                                        location: "Annapolis" },
  MA: { file: "boston_ma.webp",                                           location: "Boston" },
  MI: { file: "detroit_mi.webp",                                          location: "Detroit" },
  MN: { file: "minneapolis_minnesota.webp",                               location: "Minneapolis" },
  MS: { file: "tupelo_mississippi.webp",                                  location: "Tupelo" },
  MO: { file: "st_louis_missouri.webp",                                   location: "St. Louis" },
  MT: { file: "glacier_national_park_montana.webp",                       location: "Glacier NP" },
  NE: { file: "old_market_district_omaha_ne.webp",                        location: "Omaha" },
  NV: { file: "las_vegas_nevada.webp",                                    location: "Las Vegas" },
  NH: { file: "mt_washington_auto_road_new_hampshire.webp",               location: "Mt. Washington" },
  NJ: { file: "ocean_city_nj.webp",                                       location: "Ocean City" },
  NM: { file: "santafe_nm.webp",                                          location: "Santa Fe" },
  NY: { file: "brooklyn_ny.webp",                                         location: "Brooklyn" },
  NC: { file: "charlotte_nc.webp",                                        location: "Charlotte" },
  ND: { file: "theodore_roosevelt_national_park_north_dakota.webp",       location: "Theodore Roosevelt NP" },
  OH: { file: "columbus_ohio.webp",                                       location: "Columbus" },
  OK: { file: "scissortail_park_oklahoma.webp",                           location: "Scissortail Park" },
  OR: { file: "multnomah_falls_or.webp",                                  location: "Multnomah Falls" },
  PA: { file: "philadelphia_pennsylvania.webp",                           location: "Philadelphia" },
  RI: { file: "newport_rhode_island.webp",                                location: "Newport" },
  SC: { file: "charleston_sc.webp",                                       location: "Charleston" },
  SD: { file: "mount_rushmore_sd.webp",                                   location: "Mount Rushmore" },
  TN: { file: "nashville_tennessee.webp",                                 location: "Nashville" },
  TX: { file: "houston_tx.webp",                                          location: "Houston" },
  UT: { file: "arches_national_park_utah.webp",                           location: "Arches NP" },
  VT: { file: "stowe_vermont.webp",                                       location: "Stowe" },
  VA: { file: "richmond_va.webp",                                         location: "Richmond" },
  WA: { file: "Seattle_wa.webp",                                          location: "Seattle" },
  WV: { file: "new_river_gorge_bridge_wv.webp",                           location: "New River Gorge" },
  WI: { file: "madison_wi.webp",                                          location: "Madison" },
  WY: { file: "shoshone_national_forest_wyoming.webp",                    location: "Shoshone Forest" },
};

// ─── Carousel Card ────────────────────────────────────────────────────────────

function StateCard({
  abbr,
  studentCount,
  onExplore,
}: {
  abbr: string;
  studentCount: number;
  onExplore: () => void;
}) {
  const info = STATE_DATA[abbr];
  const svg = STATE_SVG[abbr];
  if (!info) return null;

  return (
    <div
      className="group bg-white rounded-xl shadow-md p-3 cursor-pointer select-none hover:shadow-lg transition-shadow"
      onClick={onExplore}
    >
      <div className="relative">
        <img
          src={svg ? `/states/${svg.file}` : ""}
          alt={info.name}
          className="w-full rounded-lg"
          draggable={false}
        />

        <div className="absolute top-3 left-0 right-0 flex items-center justify-center gap-2 px-3 opacity-70">
          <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm rounded-full pl-1 pr-2.5 py-0.5">
            <img src="/assets/logo.png" alt="AMSA" className="w-5 h-5 rounded-full object-cover" draggable={false} />
            <span className="text-xs font-bold text-gray-900 leading-none">{studentCount}</span>
          </div>
          <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm rounded-full px-2.5 py-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-red-500 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-2.079 3.218-4.402 3.218-7.273a6.5 6.5 0 0 0-13 0c0 2.871 1.274 5.194 3.218 7.273a19.58 19.58 0 0 0 2.683 2.282 16.975 16.975 0 0 0 1.144.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-semibold text-gray-900 leading-none whitespace-nowrap">
              {svg ? `${svg.location}, ${abbr}` : abbr}
            </span>
          </div>
        </div>

        <div className="absolute bottom-1 right-1 w-16 h-16 bg-gray-200/90 backdrop-blur-sm rounded-full flex items-center justify-center pointer-events-none transition-transform duration-200 ease-out group-hover:scale-125 group-active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
          </svg>
        </div>
      </div>

      <div className="px-1 pt-3 pb-1">
        <span className="font-black text-[20px] uppercase tracking-wide text-gray-950 leading-none">
          {info.name}
        </span>
      </div>
    </div>
  );
}

// ─── Carousel ─────────────────────────────────────────────────────────────────

function StateCarousel({
  abbrs,
  studentCounts,
  onSelect,
}: {
  abbrs: string[];
  studentCounts: Record<string, number>;
  onSelect: (abbr: string) => void;
}) {
  const n = abbrs.length;
  const [idx, setIdx] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const dragAccumRef = useRef(0);
  const rafPendingRef = useRef(false);
  const snapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idxRef = useRef(0);

  useEffect(() => { idxRef.current = idx; }, [idx]);

  useEffect(() => {
    setIdx(0);
    setDragOffset(0);
    dragAccumRef.current = 0;
  }, [abbrs]);

  const CARD_W = 340;
  const CARD_H = 565;
  const CARD_GAP = 20;
  const PEEK_W = 40;
  const slotW = CARD_W + CARD_GAP;
  const containerW = 4 * slotW - CARD_W + 2 * PEEK_W;

  // Center the active card in the viewport
  const translateX = containerW / 2 - CARD_W / 2 - idx * slotW - dragOffset;

  const slide = useCallback(
    (dir: 1 | -1) => {
      if (transitioning || dragOffset !== 0 || n === 0) return;
      const next = Math.max(0, Math.min(n - 1, idx + dir));
      if (next === idx) return;
      setTransitioning(true);
      setIdx(next);
    },
    [transitioning, dragOffset, n, idx]
  );

  const handleTransitionEnd = useCallback(() => setTransitioning(false), []);

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();

      dragAccumRef.current += e.deltaX;
      // Hard clamp — no movement past first or last card
      dragAccumRef.current = Math.max(
        -idxRef.current * slotW,
        Math.min((n - 1 - idxRef.current) * slotW, dragAccumRef.current)
      );

      if (!rafPendingRef.current) {
        rafPendingRef.current = true;
        requestAnimationFrame(() => {
          rafPendingRef.current = false;
          setDragOffset(dragAccumRef.current);
        });
      }

      if (snapTimerRef.current) clearTimeout(snapTimerRef.current);
      snapTimerRef.current = setTimeout(() => {
        const steps = Math.round(dragAccumRef.current / slotW);
        const target = Math.max(0, Math.min(n - 1, idxRef.current + steps));
        dragAccumRef.current = 0;
        setDragOffset(0);
        setTransitioning(true);
        setIdx(target);
      }, 80);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.removeEventListener("wheel", onWheel);
      if (snapTimerRef.current) clearTimeout(snapTimerRef.current);
    };
  }, [slotW, n]);

  if (n === 0) {
    return (
      <div className="text-center py-16 text-sm text-gray-400">
        No states match your filters.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 pt-4 pb-6">
      {/* Viewport */}
      <div
        className="relative overflow-hidden w-full"
        style={{ maxWidth: containerW, height: CARD_H + 120 }}
      >
        <div className="pointer-events-none absolute inset-y-0 left-0 w-10 z-10"
          style={{ background: "linear-gradient(to right, rgba(249,250,251,0.85) 0%, transparent 100%)" }} />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-10 z-10"
          style={{ background: "linear-gradient(to left, rgba(249,250,251,0.85) 0%, transparent 100%)" }} />

        {/* Track */}
        <div
          className="flex absolute"
          style={{
            top: 55,
            gap: CARD_GAP,
            transform: `translateX(${translateX}px)`,
            transition: (transitioning && dragOffset === 0) ? "transform 180ms ease-out" : "none",
            willChange: "transform",
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {abbrs.map((abbr, i) => {
            const visualCenter = idx + dragOffset / slotW;
            const dist = Math.abs(i - visualCenter);
            const isCenter = dist < 0.5;

            const opacity = dist <= 1 ? 1 - 0.25 * dist : Math.max(0, 0.75 - 0.35 * (dist - 1));
            const scaleFactor = dist < 1 ? 1 + 0.12 * (1 - dist) : 1;
            const ty = dist < 1 ? -14 * (1 - dist) : 0;

            return (
              <div
                key={abbr}
                style={{
                  width: CARD_W,
                  flexShrink: 0,
                  transform: `scale(${scaleFactor}) translateY(${ty}px)`,
                  transition: dragOffset === 0
                    ? "transform 180ms ease-out, opacity 180ms ease-out"
                    : "none",
                  opacity,
                  pointerEvents: (isCenter && dragOffset === 0) ? "auto" : "none",
                  zIndex: isCenter ? 2 : 1,
                }}
              >
                <StateCard
                  abbr={abbr}
                  studentCount={studentCounts[abbr] ?? 0}
                  onExplore={() => onSelect(abbr)}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => slide(-1)}
          disabled={idx === 0}
          className="px-5 h-11 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 flex items-center justify-center transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Previous"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>

        <span className="text-sm font-semibold text-gray-400 tabular-nums min-w-13 text-center">
          {idx + 1} / {n}
        </span>

        <button
          onClick={() => slide(1)}
          disabled={idx === n - 1}
          className="px-5 h-11 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 flex items-center justify-center transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Next"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────

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
  poor: "Poor / Car needed",
};

const TRANSPORT_COLOR: Record<TransitRating, string> = {
  excellent: "text-green-700",
  good: "text-blue-700",
  limited: "text-amber-700",
  poor: "text-red-600",
};

function FilterBar({
  colTiers,
  transit,
  onToggleCol,
  onToggleTransit,
  onClear,
}: {
  colTiers: Set<ColTier>;
  transit: Set<TransitRating>;
  onToggleCol: (t: ColTier) => void;
  onToggleTransit: (t: TransitRating) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const hasFilters = colTiers.size > 0 || transit.size > 0;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold border-2 border-gray-300 bg-white text-gray-600 hover:border-gray-400 transition"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
        </svg>
        {hasFilters && <span className="text-gray-700">· {colTiers.size + transit.size}</span>}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 z-20 bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-5 w-80">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Cost of Living</p>
            <div className="flex flex-wrap gap-1.5">
              {(["very_high", "high", "moderate", "affordable"] as ColTier[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => onToggleCol(t)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-lg text-sm font-semibold border-2 transition ${
                    colTiers.has(t) ? "bg-gray-200 text-black border-gray-500" : "border-gray-300 text-gray-600 bg-white hover:border-gray-400"
                  }`}
                >
                  {COL_TIER_LABEL[t]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Public Transit</p>
            <div className="flex flex-wrap gap-1.5">
              {(["excellent", "good", "limited", "poor"] as TransitRating[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => onToggleTransit(t)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-lg text-sm font-semibold border-2 transition ${
                    transit.has(t) ? "bg-gray-200 text-black border-gray-500" : "border-gray-300 text-gray-600 bg-white hover:border-gray-400"
                  }`}
                >
                  {TRANSPORT_LABEL[t]}
                </button>
              ))}
            </div>
          </div>
          {hasFilters && (
            <button type="button" onClick={onClear} className="mt-4 w-full py-2 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const ALL_STATE_ABBRS = Object.keys(STATE_DATA).sort((a, b) =>
  STATE_DATA[a].name.localeCompare(STATE_DATA[b].name)
);

export default function PlacesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [colTiers, setColTiers] = useState<Set<ColTier>>(new Set());
  const [transit, setTransit] = useState<Set<TransitRating>>(new Set());
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch("/api/places/student-counts")
      .then((r) => r.json())
      .then((d) => setStudentCounts(d.counts ?? {}))
      .catch(() => {});
  }, []);

  const toggleColTier = (t: ColTier) =>
    setColTiers((prev) => { const s = new Set(prev); s.has(t) ? s.delete(t) : s.add(t); return s; });
  const toggleTransit = (t: TransitRating) =>
    setTransit((prev) => { const s = new Set(prev); s.has(t) ? s.delete(t) : s.add(t); return s; });
  const clearFilters = () => { setColTiers(new Set()); setTransit(new Set()); };

  const filteredAbbrs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ALL_STATE_ABBRS.filter((abbr) => {
      const info = STATE_DATA[abbr];
      if (q && !info.name.toLowerCase().includes(q) && !info.cities.some((c) => c.toLowerCase().includes(q))) return false;
      if (colTiers.size > 0 && !colTiers.has(info.colTier)) return false;
      if (transit.size > 0 && !transit.has(info.publicTransport)) return false;
      return true;
    });
  }, [search, colTiers, transit]);

  const goToState = (abbr: string) => router.push(`/dashboard/places/${abbr.toLowerCase()}`);

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 py-6 max-w-7xl mx-auto">
      {/* Controls row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35m0 0A7.5 7.5 0 1 0 6.05 6.05a7.5 7.5 0 0 0 10.6 10.6Z" />
          </svg>
          <input
            type="text"
            placeholder="State or city…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-300 rounded-lg text-lg bg-gray-50 focus:border-gray-500 focus:bg-white focus:outline-none transition"
          />
        </div>

        {/* Filter */}
        <FilterBar
          colTiers={colTiers}
          transit={transit}
          onToggleCol={toggleColTier}
          onToggleTransit={toggleTransit}
          onClear={clearFilters}
        />

      </div>

      <StateCarousel
        abbrs={filteredAbbrs}
        studentCounts={studentCounts}
        onSelect={goToState}
      />
    </div>
  );
}
