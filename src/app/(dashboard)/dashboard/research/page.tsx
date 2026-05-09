"use client";

import { useState, useEffect, useMemo } from "react";
import { geoAlbersUsa, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import usAtlas from "us-atlas/states-10m.json";
import Link from "next/link";
import type { College, Filters } from "./types";
import { DEFAULT_FILTERS } from "./types";
import { useCollegesData } from "./use-colleges-data";
import { STATE_DATA, FIPS_TO_ABBR } from "./state-data";
import type { StatePhoto } from "@/app/api/state-photos/[abbr]/route";

// ─── Standard CIP program categories (always shown in field-of-study filter) ─
// These mirror the categories derived from CIP codes by the import pipeline.
// Even if the database has no major_categories populated yet, the filter is
// usable because schools that DO have categories will match these options.

const STANDARD_FIELDS = [
  "Agriculture",
  "Architecture",
  "Area and Ethnic Studies",
  "Arts and Design",
  "Biology",
  "Business",
  "Communication and Journalism",
  "Computer Science",
  "Education",
  "Engineering",
  "English",
  "Health and Nursing",
  "History",
  "Interdisciplinary Studies",
  "Languages",
  "Legal Studies",
  "Liberal Arts",
  "Math and Statistics",
  "Music",
  "Natural Resources",
  "Philosophy and Religion",
  "Physical Sciences",
  "Psychology",
  "Public Administration",
  "Social Sciences",
] as const;

// ─── Utilities ────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  "$" + Math.round(n).toLocaleString("en-US", { maximumFractionDigits: 0 });

// ─── Map: Explore by State ────────────────────────────────────────────────────

function USIntlDotMap({
  colleges,
  selectedState,
  onSelectState,
}: {
  colleges: College[];
  selectedState: string | null;
  onSelectState: (abbr: string | null) => void;
}) {
  const MAP_WIDTH = 975;
  const MAP_HEIGHT = 610;

  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const { stateShapes, stateCentroids } = useMemo(() => {
    const topo = usAtlas as unknown as { objects: { states: unknown } };
    const rawStates = feature(topo as never, topo.objects.states as never) as
      | GeoJSON.FeatureCollection
      | GeoJSON.Feature;
    const allStates: GeoJSON.FeatureCollection =
      rawStates.type === "FeatureCollection"
        ? rawStates
        : { type: "FeatureCollection", features: [rawStates] };

    const contiguous: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: allStates.features.filter((f) => {
        const id = String(f.id ?? "");
        return id !== "02" && id !== "15" && id !== "72";
      }),
    };

    const projection = geoAlbersUsa().fitSize([MAP_WIDTH, MAP_HEIGHT], contiguous);
    const pathBuilder = geoPath(projection);

    const shapes = contiguous.features.map((f) => ({
      fipsId: String(f.id ?? ""),
      abbr: FIPS_TO_ABBR[String(f.id ?? "")] ?? "",
      path: pathBuilder(f) ?? "",
    }));

    const centroids = contiguous.features
      .map((f) => {
        const fipsId = String(f.id ?? "");
        const abbr = FIPS_TO_ABBR[fipsId];
        if (!abbr) return null;
        const [cx, cy] = pathBuilder.centroid(f);
        if (!Number.isFinite(cx) || !Number.isFinite(cy)) return null;
        return { abbr, cx, cy };
      })
      .filter((v): v is NonNullable<typeof v> => v !== null);

    return { stateShapes: shapes, stateCentroids: centroids };
  }, []);

  const collegesByState = useMemo(() => {
    const map = new Map<string, College[]>();
    for (const c of colleges) {
      if (!c.state) continue;
      const abbr = c.state.trim().toUpperCase();
      if (!map.has(abbr)) map.set(abbr, []);
      map.get(abbr)!.push(c);
    }
    return map;
  }, [colleges]);

  // Tooltip data for the currently hovered state
  const tooltipColleges = hoveredState ? (collegesByState.get(hoveredState) ?? []) : [];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5 mb-6">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <h2 className="text-base font-bold text-[#001049]">Explore by State</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {selectedState
              ? `Filtering to ${STATE_DATA[selectedState]?.name ?? selectedState} — click again or press Clear to reset`
              : `Hover a state to preview schools · click to filter · ${collegesByState.size} states tracked`}
          </p>
        </div>
        {selectedState && (
          <button
            type="button"
            onClick={() => onSelectState(null)}
            className="shrink-0 text-sm font-semibold text-[#001049] border border-[#001049]/20 bg-[#001049]/5 px-3 py-1.5 rounded-lg"
          >
            Clear · {STATE_DATA[selectedState]?.name ?? selectedState}
          </button>
        )}
      </div>

      <div
        className="relative rounded-xl border border-gray-100 bg-[#f7f9ff] overflow-hidden"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setMousePos({
            x: ((e.clientX - rect.left) / rect.width) * 100,
            y: ((e.clientY - rect.top) / rect.height) * 100,
          });
        }}
        onMouseLeave={() => {
          setHoveredState(null);
          setMousePos(null);
        }}
      >
        <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} className="w-full h-auto block">
          {/* State shapes */}
          {stateShapes.map((state) => {
            const isSelected = state.abbr === selectedState;
            const isHovered = state.abbr === hoveredState;
            const hasColleges = collegesByState.has(state.abbr);
            return (
              <path
                key={state.fipsId}
                d={state.path}
                fill={
                  isSelected
                    ? "rgba(0, 16, 73, 0.28)"
                    : isHovered
                    ? "rgba(0, 16, 73, 0.16)"
                    : hasColleges
                    ? "rgba(0, 16, 73, 0.09)"
                    : "rgba(31, 42, 125, 0.04)"
                }
                stroke={isSelected ? "rgba(0, 16, 73, 0.5)" : "rgba(31, 42, 125, 0.22)"}
                strokeWidth={isSelected ? "1.2" : "0.7"}
                style={{ cursor: hasColleges ? "pointer" : "default", transition: "fill 100ms" }}
                onMouseEnter={() => hasColleges && setHoveredState(state.abbr)}
                onMouseLeave={() => setHoveredState(null)}
                onClick={() => {
                  if (!hasColleges) return;
                  onSelectState(state.abbr === selectedState ? null : state.abbr);
                }}
              />
            );
          })}

          {/* State abbreviation labels */}
          {stateCentroids.map(({ abbr, cx, cy }) => {
            const hasColleges = collegesByState.has(abbr);
            const isSelected = abbr === selectedState;
            return (
              <text
                key={`lbl-${abbr}`}
                x={cx}
                y={cy + 4}
                textAnchor="middle"
                fontSize={10}
                fontWeight={hasColleges ? 600 : 400}
                fill={
                  isSelected
                    ? "rgba(0, 16, 73, 0.75)"
                    : hasColleges
                    ? "rgba(0, 16, 73, 0.45)"
                    : "rgba(0, 16, 73, 0.18)"
                }
                style={{ pointerEvents: "none", userSelect: "none", fontFamily: "sans-serif" }}
              >
                {abbr}
              </text>
            );
          })}
        </svg>

        {/* Hover tooltip — follows the cursor */}
        {hoveredState && mousePos && tooltipColleges.length > 0 && (
          <div
            className="absolute z-20 pointer-events-none"
            style={{
              left: `${mousePos.x}%`,
              top: `${mousePos.y}%`,
              transform: mousePos.y > 65
                ? "translate(-50%, calc(-100% - 12px))"
                : "translate(-50%, 14px)",
            }}
          >
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xl px-3 py-2.5 min-w-40">
              <p className="text-[11px] font-semibold text-[#001049] mb-1.5">
                {STATE_DATA[hoveredState]?.name ?? hoveredState}
                <span className="font-normal text-gray-400 ml-1">
                  · {tooltipColleges.length} school{tooltipColleges.length !== 1 ? "s" : ""}
                </span>
              </p>
              <div className="flex items-center gap-1 flex-wrap">
                {tooltipColleges.slice(0, 5).map((college) =>
                  college.logoUrl ? (
                    <img
                      key={college.id}
                      src={college.logoUrl}
                      alt={college.name}
                      className="w-6 h-6 rounded-full object-cover border border-gray-100 bg-white"
                    />
                  ) : (
                    <span
                      key={college.id}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold bg-[#001049]/10 border border-[#001049]/15 text-[#001049]"
                    >
                      {college.name.slice(0, 1)}
                    </span>
                  )
                )}
                {tooltipColleges.length > 5 && (
                  <span className="text-[10px] font-bold text-[#001049] pl-0.5">
                    +{tooltipColleges.length - 5}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5">Click to filter</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── State Photo Strip ────────────────────────────────────────────────────────

function StatePhotoStrip({ abbr }: { abbr: string }) {
  const [photos, setPhotos] = useState<StatePhoto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setPhotos([]);
    fetch(`/api/state-photos/${abbr}`)
      .then((r) => r.json())
      .then((d) => {
        setPhotos(d.photos ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [abbr]);

  if (loading) {
    return (
      <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 w-40 shrink-0 rounded-xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (photos.length === 0) return null;

  return (
    <div className="mt-4 border-t border-gray-100 pt-4">
      <p className="text-xs font-bold text-[#001049] uppercase tracking-wide mb-2">
        Photos of {STATE_DATA[abbr]?.name}
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {photos.slice(0, 6).map((photo) => (
          <a
            key={photo.id}
            href={photo.photographerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 relative h-24 w-40 rounded-xl overflow-hidden group"
          >
            <img
              src={photo.thumb}
              alt={photo.alt}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />
          </a>
        ))}
      </div>
      <p className="text-[10px] text-gray-400 mt-1.5">Photos via Pexels</p>
    </div>
  );
}

// ─── State Info Panel ─────────────────────────────────────────────────────────

function StateInfoPanel({
  abbr,
  allColleges,
}: {
  abbr: string;
  allColleges: College[];
}) {
  const info = STATE_DATA[abbr];
  if (!info) return null;

  const stateColleges = allColleges.filter(
    (c) => c.state?.trim().toUpperCase() === abbr
  );

  const COL_TIER_LABEL = {
    very_high: "Very High",
    high: "High",
    moderate: "Moderate",
    affordable: "Affordable",
  } as const;
  const COL_TIER_COLOR = {
    very_high: "bg-red-50 text-red-700 border-red-200",
    high: "bg-orange-50 text-orange-700 border-orange-200",
    moderate: "bg-amber-50 text-amber-700 border-amber-200",
    affordable: "bg-green-50 text-green-700 border-green-200",
  } as const;
  const TRANSPORT_COLOR = {
    excellent: "text-green-700",
    good: "text-blue-700",
    limited: "text-amber-700",
    poor: "text-red-600",
  } as const;
  const TRANSPORT_LABEL = {
    excellent: "Excellent",
    good: "Good",
    limited: "Limited",
    poor: "Poor / Car needed",
  } as const;

  const ranked = stateColleges.filter((c) => c.nationalRank != null);
  const topRank = ranked.length > 0 ? Math.min(...ranked.map((c) => c.nationalRank!)) : null;
  const avgCOA =
    stateColleges.length > 0
      ? Math.round(stateColleges.reduce((s, c) => s + c.totalCostOfAttendance, 0) / stateColleges.length)
      : null;

  return (
    <div className="bg-white rounded-2xl border border-[#001049]/10 shadow-sm overflow-hidden mb-6">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-lg font-bold text-[#001049]">{info.name}</h2>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${COL_TIER_COLOR[info.colTier]}`}
            >
              Cost of Living: {COL_TIER_LABEL[info.colTier]}
            </span>
          </div>
          <Link
            href={`/dashboard/research/state/${abbr}`}
            className="text-sm font-semibold text-[#001049] border border-[#001049]/20 bg-[#001049]/5 hover:bg-[#001049]/10 px-3 py-1.5 rounded-lg transition-colors shrink-0"
          >
            View State Details →
          </Link>
        </div>
        <p className="text-sm text-gray-500 mt-1.5">
          {stateColleges.length} school{stateColleges.length !== 1 ? "s" : ""} tracked in our database
          {topRank != null ? ` · Best national rank: #${topRank}` : ""}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100">
        <div className="px-4 py-4">
          <p className="text-xs text-gray-400 font-medium mb-1">Monthly Rent</p>
          <p className="text-base font-bold text-[#001049]">{info.monthlyRent}</p>
          <p className="text-xs text-gray-400 mt-0.5">1-bedroom apartment</p>
        </div>
        <div className="px-4 py-4">
          <p className="text-xs text-gray-400 font-medium mb-1">Public Transit</p>
          <p className={`text-base font-bold ${TRANSPORT_COLOR[info.publicTransport]}`}>
            {TRANSPORT_LABEL[info.publicTransport]}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">in major cities</p>
        </div>
        <div className="px-4 py-4">
          <p className="text-xs text-gray-400 font-medium mb-1">Avg Total COA</p>
          <p className="text-base font-bold text-[#001049]">
            {avgCOA != null ? fmt(avgCOA) + "/yr" : "N/A"}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">across tracked schools</p>
        </div>
        <div className="px-4 py-4">
          <p className="text-xs text-gray-400 font-medium mb-1">Major Cities</p>
          <p className="text-base font-bold text-[#001049]">{info.cities.slice(0, 2).join(", ")}</p>
          {info.cities.length > 2 && (
            <p className="text-xs text-gray-400 mt-0.5">+{info.cities.length - 2} more</p>
          )}
        </div>
      </div>

      {/* Climate + tip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 border-t border-gray-100">
        <div className="px-5 py-4">
          <p className="text-xs font-bold text-[#001049] uppercase tracking-wide mb-1.5">Climate</p>
          <p className="text-sm text-gray-600 leading-relaxed">{info.climate}</p>
        </div>
      </div>

      {/* Photo strip */}
      <div className="px-5 pb-5">
        <StatePhotoStrip abbr={abbr} />
      </div>
    </div>
  );
}

// ─── Score Badge ───────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 75
      ? "bg-green-50 border-green-300 text-green-700"
      : score >= 55
      ? "bg-amber-50 border-amber-300 text-amber-700"
      : "bg-red-50 border-red-300 text-red-600";
  return (
    <div
      className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl border-2 shrink-0 ${color}`}
    >
      <span className="text-xl font-bold leading-none">{score}</span>
      <span className="text-xs font-semibold uppercase tracking-widest mt-0.5 opacity-60">
        score
      </span>
    </div>
  );
}

function SchoolLogo({ college }: { college: College }) {
  const [broken, setBroken] = useState(false);
  if (!college.logoUrl || broken) {
    return (
      <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
        {college.name.slice(0, 2).toUpperCase()}
      </div>
    );
  }
  return (
    <img
      src={college.logoUrl}
      alt={`${college.name} logo`}
      className="w-10 h-10 rounded-lg object-contain bg-white border border-gray-200 p-1 shrink-0"
      onError={() => setBroken(true)}
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  );
}

// ─── Badge Pill ────────────────────────────────────────────────────────────────

function BadgePill({
  label,
  color = "navy",
}: {
  label: string;
  color?: "navy" | "gold" | "green" | "gray";
}) {
  const cls =
    color === "navy"
      ? "bg-[#001049]/8 text-[#001049] border-[#001049]/20"
      : color === "gold"
      ? "bg-[#FFCA3A]/15 text-amber-700 border-amber-300"
      : color === "green"
      ? "bg-green-50 text-green-700 border-green-200"
      : "bg-gray-100 text-gray-500 border-gray-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {label}
    </span>
  );
}

// ─── Data Quality Dot ─────────────────────────────────────────────────────────

function DataQualityDot({ source }: { source: College["dataSource"] }) {
  const cfg =
    source === "cds_high"
      ? { color: "bg-green-500", title: "High confidence — sourced from Common Data Set" }
      : source === "cds_medium"
      ? { color: "bg-amber-400", title: "Estimated — sourced from Common Data Set (partial)" }
      : source === "ipeds_fallback"
      ? { color: "bg-amber-400", title: "General aid data — international-specific data unavailable" }
      : { color: "bg-gray-300", title: "Limited data available" };

  return (
    <span
      title={cfg.title}
      aria-label={cfg.title}
      className={`inline-block w-2 h-2 rounded-full shrink-0 ${cfg.color}`}
    />
  );
}

// ─── Stat Grid ─────────────────────────────────────────────────────────────────

function StatGrid({ college }: { college: College }) {
  const netCost = college.estimatedNetCost ?? college.totalCostOfAttendance;
  const cells = [
    {
      label: "Est. Net Cost",
      value: fmt(netCost) + "/yr",
      sub: college.estimatedNetCost ? "after avg aid" : "no aid data",
    },
    {
      label: "% Receiving Aid",
      value:
        college.percentReceivingAid != null
          ? college.percentReceivingAid + "%"
          : "N/A",
      sub: "of internationals",
    },
    {
      label: "Int'l Students",
      value: college.internationalPercent != null ? college.internationalPercent + "%" : "N/A",
      sub: "of enrollment",
    },
    {
      label: "Tuition",
      value: fmt(college.tuition) + "/yr",
      sub: college.type === "public" ? "out-of-state" : "full tuition",
    },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
      {cells.map((c) => (
        <div key={c.label} className="bg-gray-50 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-500 font-medium">{c.label}</p>
          <p className="text-base font-bold text-[#001049] mt-0.5">{c.value}</p>
          <p className="text-xs text-gray-400 mt-0.5">{c.sub}</p>
        </div>
      ))}
    </div>
  );
}

// ─── College Card ──────────────────────────────────────────────────────────────

function CollegeCard({
  college,
  compared,
  onToggleCompare,
}: {
  college: College;
  compared: boolean;
  onToggleCompare: () => void;
}) {
  const TYPE_LABEL: Record<College["type"], string> = {
    private: "Private",
    public: "Public",
    liberal_arts: "Liberal Arts",
  };
  const TYPE_COLOR: Record<College["type"], string> = {
    private: "bg-[#001049]/8 text-[#001049] border-[#001049]/20",
    public: "bg-blue-50 text-blue-700 border-blue-200",
    liberal_arts: "bg-purple-50 text-purple-700 border-purple-200",
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Card header */}
      <div className="p-5">
        <div className="flex items-start gap-4">
          <SchoolLogo college={college} />
          <ScoreBadge score={college.financialAccessibilityScore} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${TYPE_COLOR[college.type]}`}
              >
                {TYPE_LABEL[college.type]}
              </span>
              {college.meetsFullDemonstratedNeed && (
                <BadgePill label="Meets Full Need" color="green" />
              )}
              {college.noLoanPolicy && <BadgePill label="No Loans" color="green" />}
              {college.stemOptEligible && <BadgePill label="STEM OPT" color="navy" />}
              {college.meritScholarships.length > 0 && (
                <BadgePill label="Merit Aid" color="gold" />
              )}
              {college.nationalRank != null && (
                <BadgePill label={`US Rank #${college.nationalRank}`} color="navy" />
              )}
            </div>
            <h2 className="text-[15px] font-bold text-[#001049] mt-1 leading-snug flex items-center gap-1.5">
              {college.name}
              <DataQualityDot source={college.dataSource} />
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">{college.location}</p>
            {college.majorCategories.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Programs: {college.majorCategories.slice(0, 3).join(" · ")}
                {college.majorCategories.length > 3 ? ` +${college.majorCategories.length - 3}` : ""}
              </p>
            )}
          </div>
        </div>

        <StatGrid college={college} />

        {/* Financial Accessibility Score explanation */}
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Financial Accessibility Score · sorted by this by default
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleCompare}
              className="text-sm font-semibold text-white bg-[#001049] hover:bg-[#001049]/90 px-3 py-1.5 rounded-lg"
            >
              {compared ? "Remove Compare" : "Compare"}
            </button>
            <Link
              href={`/dashboard/research/college/${college.id}`}
              className="text-sm font-semibold text-[#001049] border border-[#001049]/25 hover:bg-[#001049]/5 px-3 py-1.5 rounded-lg"
            >
              View Detail
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Toggle ────────────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl border text-xs font-medium transition-colors ${
        checked
          ? "bg-[#001049]/5 border-[#001049] text-[#001049]"
          : "border-gray-200 text-gray-600 hover:border-gray-300"
      }`}
    >
      <span
        className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${
          checked ? "bg-[#001049] border-[#001049]" : "border-gray-300"
        }`}
      >
        {checked && (
          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
      {label}
    </button>
  );
}

// ─── Slider ────────────────────────────────────────────────────────────────────

function Slider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-gray-500 font-medium">{label}</span>
        <span className="text-sm font-semibold text-[#001049]">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: "#001049" }}
      />
      <div className="flex justify-between mt-1">
        <span className="text-xs text-gray-400">{format(min)}</span>
        <span className="text-xs text-gray-400">{format(max)}</span>
      </div>
    </div>
  );
}

// ─── Filter Panel ──────────────────────────────────────────────────────────────

function FilterPanel({
  filters,
  onChange,
  onClose,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  onClose?: () => void;
}) {
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => onChange({ ...filters, [k]: v });

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs font-bold text-[#001049] uppercase tracking-wider">Filters</p>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-5 pr-1">
        {/* Financial Aid */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            Financial Aid
          </p>
          <div className="space-y-2">
            <Toggle
              checked={filters.offersAidOnly}
              onChange={(v) => set("offersAidOnly", v)}
              label="Only schools offering aid to internationals"
            />
            <Toggle
              checked={filters.meetsFullNeedOnly}
              onChange={(v) => set("meetsFullNeedOnly", v)}
              label="Meets 100% of demonstrated need"
            />
            <Toggle
              checked={filters.meritScholarshipsOnly}
              onChange={(v) => set("meritScholarshipsOnly", v)}
              label="Has merit scholarships for internationals"
            />
          </div>
          <div className="mt-3">
            <Slider
              label="Min % of internationals receiving aid"
              value={filters.minAidPercent}
              min={0}
              max={100}
              step={5}
              format={(v) => v + "%"}
              onChange={(v) => set("minAidPercent", v)}
            />
          </div>
        </div>

        {/* Cost */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Cost</p>
          <div className="space-y-4">
            <Slider
              label="Max Total Cost of Attendance"
              value={filters.maxTotalCOA}
              min={40000}
              max={100000}
              step={5000}
              format={fmt}
              onChange={(v) => set("maxTotalCOA", v)}
            />
            <Slider
              label="Max Net Cost (after avg aid)"
              value={filters.maxNetCost}
              min={10000}
              max={100000}
              step={5000}
              format={fmt}
              onChange={(v) => set("maxNetCost", v)}
            />
          </div>
        </div>

        {/* International Profile */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            International Profile
          </p>
          <Slider
            label="Min % international students"
            value={filters.minInternationalPercent}
            min={0}
            max={30}
            step={1}
            format={(v) => v + "%"}
            onChange={(v) => set("minInternationalPercent", v)}
          />
        </div>

        {/* Career */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Career</p>
          <Toggle
            checked={filters.stemOptOnly}
            onChange={(v) => set("stemOptOnly", v)}
            label="STEM OPT eligible programs only (36-month extension)"
          />
        </div>
      </div>

      <button
        onClick={() => onChange(DEFAULT_FILTERS)}
        className="mt-5 w-full text-xs text-gray-400 hover:text-[#001049] font-medium py-2 border border-gray-200 rounded-xl transition-colors"
      >
        Reset all filters
      </button>
    </div>
  );
}

function TopFilterBar({
  filters,
  onChange,
  fieldOptions,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  fieldOptions: string[];
}) {
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => onChange({ ...filters, [k]: v });
  const sortedFieldOptions = useMemo(
    () => fieldOptions.filter((f) => f !== "Any").sort((a, b) => a.localeCompare(b)),
    [fieldOptions]
  );

  return (
    <div className="mb-5 space-y-2">
      {/* Search bar — standalone */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input
          type="text"
          value={filters.searchQuery}
          onChange={(e) => set("searchQuery", e.target.value)}
          placeholder="Search schools by name, city, or state…"
          className="flex-1 text-sm text-gray-700 outline-none placeholder:text-gray-400"
        />
        {filters.searchQuery && (
          <button
            type="button"
            onClick={() => set("searchQuery", "")}
            className="text-gray-300 hover:text-gray-500 transition-colors shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Filters row — separate */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
          <div className="text-sm">
            <span className="block text-gray-500 text-xs font-medium mb-1.5">Field of study</span>
            <select
              value={filters.selectedField}
              onChange={(e) => set("selectedField", e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 bg-white"
            >
              <option value="Any">Any field</option>
              {sortedFieldOptions.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          <div className="text-sm">
            <span className="block text-gray-500 text-xs font-medium mb-1.5">Sort by</span>
            <select
              value={filters.sortBy}
              onChange={(e) => set("sortBy", e.target.value as Filters["sortBy"])}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 bg-white"
            >
              <option value="ranking">US National Ranking</option>
              <option value="affordability">Financial Accessibility Score</option>
            </select>
          </div>

          <div className="text-sm">
            <span className="block text-gray-500 text-xs font-medium mb-1.5">Min % intl. students</span>
            <input
              type="number"
              min={0}
              max={40}
              step={1}
              value={filters.minInternationalPercent}
              onChange={(e) => set("minInternationalPercent", Number(e.target.value))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
            />
          </div>

          <div className="text-sm">
            <span className="block text-gray-500 text-xs font-medium mb-1.5">Max net cost (USD/yr)</span>
            <input
              type="number"
              min={10000}
              max={200000}
              step={1000}
              value={filters.maxNetCost}
              onChange={(e) => set("maxNetCost", Number(e.target.value))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
            />
          </div>

          <div className="text-sm flex items-end">
            <button
              onClick={() => onChange(DEFAULT_FILTERS)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-500 hover:text-[#001049] hover:border-[#001049]/30 transition-colors"
            >
              Reset filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonList() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 animate-pulse">
          <div className="flex gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-100 rounded w-1/4" />
              <div className="h-4 bg-gray-100 rounded w-2/3" />
              <div className="h-3 bg-gray-100 rounded w-1/3" />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-4">
            {[0, 1, 2, 3].map((j) => (
              <div key={j} className="h-14 bg-gray-100 rounded-xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ResearchPage() {
  const { colleges, loading, error } = useCollegesData();
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedState, setSelectedState] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("research_compare_ids");
      if (!raw) return;
      const ids = JSON.parse(raw) as number[];
      if (Array.isArray(ids)) setCompareIds(ids.filter((n) => Number.isFinite(n)));
    } catch {
      // ignore
    }
  }, []);

  const toggleCompare = (id: number) => {
    setCompareIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem("research_compare_ids", JSON.stringify(next));
      return next;
    });
  };

  const filtered = useMemo(() => {
    return colleges
      .filter((c) => {
        if (selectedState && c.state?.trim().toUpperCase() !== selectedState) return false;
        if (filters.offersAidOnly && !c.offersAidToInternationals) return false;
        if ((c.percentReceivingAid ?? 0) < filters.minAidPercent) return false;
        if (c.totalCostOfAttendance > filters.maxTotalCOA) return false;
        const net = c.estimatedNetCost ?? c.totalCostOfAttendance;
        if (net > filters.maxNetCost) return false;
        if (filters.meetsFullNeedOnly && !c.meetsFullDemonstratedNeed) return false;
        if (filters.meritScholarshipsOnly && c.meritScholarships.length === 0) return false;
        if ((c.internationalPercent ?? 0) < filters.minInternationalPercent) return false;
        if (filters.stemOptOnly && !c.stemOptEligible) return false;
        if (filters.selectedField !== "Any") {
          const q = filters.selectedField.toLowerCase().trim();
          const STEM_FIELDS = new Set([
            "engineering", "computer science", "math and statistics",
            "physical sciences", "biology", "architecture",
            "health and nursing", "natural resources",
          ]);
          const matchesCategories = c.majorCategories.some((cat) => cat.toLowerCase().includes(q));
          // Fallback: if no categories in DB, use has_stem_programs for STEM-adjacent fields
          const matchesStemFallback =
            c.majorCategories.length === 0 &&
            c.stemOptEligible &&
            STEM_FIELDS.has(q);
          if (q && !matchesCategories && !matchesStemFallback) {
            return false;
          }
        }
        if (filters.searchQuery.trim()) {
          const q = filters.searchQuery.toLowerCase().trim();
          const haystack = `${c.name} ${c.location} ${c.state}`.toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === "ranking") {
          const ar = a.nationalRank ?? Number.MAX_SAFE_INTEGER;
          const br = b.nationalRank ?? Number.MAX_SAFE_INTEGER;
          return ar - br;
        }
        return b.financialAccessibilityScore - a.financialAccessibilityScore;
      });
  }, [colleges, filters, selectedState]);

  const fieldOptions = useMemo(() => {
    // Always include all standard CIP categories so the filter is immediately
    // useful even before the pipeline has populated major_categories in the DB.
    const set = new Set<string>(STANDARD_FIELDS as unknown as string[]);
    for (const c of colleges) {
      for (const category of c.majorCategories) set.add(category);
    }
    return ["Any", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [colleges]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, selectedState]);

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const displayColleges = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const isFiltered =
    selectedState != null ||
    filters.offersAidOnly ||
    filters.minAidPercent > 0 ||
    filters.maxTotalCOA < 200000 ||
    filters.maxNetCost < 200000 ||
    filters.meetsFullNeedOnly ||
    filters.meritScholarshipsOnly ||
    filters.minInternationalPercent > 0 ||
    filters.stemOptOnly ||
    (filters.selectedField !== "Any" && filters.selectedField.trim().length > 0) ||
    filters.sortBy !== "ranking" ||
    filters.searchQuery.trim().length > 0;

  return (
    <div className="py-8 px-4 md:px-7">
      <div className="flex items-start justify-between gap-4 mb-1">
        <div>
          <h1 className="text-2xl font-bold text-[#001049]">College Research Tool</h1>
          <p className="text-sm text-gray-500 mt-1 max-w-3xl">
            Compare schools by ranking, affordability, and fit. Built for all applicants, including international and domestic students.
          </p>
        </div>
        <Link
          href={`/dashboard/research/compare${compareIds.length ? `?ids=${compareIds.join(",")}` : ""}`}
          className="text-sm font-semibold text-[#001049] border border-[#001049]/20 bg-[#001049]/5 px-3 py-2 rounded-xl shrink-0"
        >
          Compare list ({compareIds.length})
        </Link>
      </div>

      <div className="mt-5">
        <TopFilterBar filters={filters} onChange={setFilters} fieldOptions={fieldOptions} />

        {/* Map — always visible, passes all colleges so all state pins show */}
        {!loading && !error && (
          <USIntlDotMap
            colleges={colleges}
            selectedState={selectedState}
            onSelectState={setSelectedState}
          />
        )}

        {/* State info panel — appears when a state is selected */}
        {!loading && !error && selectedState && (
          <StateInfoPanel abbr={selectedState} allColleges={colleges} />
        )}

        {/* Loading */}
        {loading && <SkeletonList />}

        {/* Error */}
        {!loading && error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
            <p className="text-sm font-semibold text-red-700 mb-1">Could not load college data</p>
            <p className="text-xs text-red-500">{error}</p>
            <p className="text-xs text-gray-400 mt-2">
              Make sure the pipeline has been run (scripts/pipeline/run-pipeline.ts) and the
              Supabase colleges_base table is populated.
            </p>
          </div>
        )}

        {/* Results */}
        {!loading && !error && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                <span className="font-semibold text-[#001049]">{filtered.length}</span> school
                {filtered.length !== 1 ? "s" : ""}
                {selectedState ? ` in ${STATE_DATA[selectedState]?.name ?? selectedState}` : " match your filters"}
                {" "}· page {currentPage}/{totalPages}
                {isFiltered && (
                  <button
                    onClick={() => { setFilters(DEFAULT_FILTERS); setSelectedState(null); }}
                    className="ml-2 text-xs text-gray-400 hover:text-[#001049] underline"
                  >
                    Reset all
                  </button>
                )}
              </p>
              <p className="text-xs text-gray-400 hidden sm:block">
                Sorted by {filters.sortBy === "ranking" ? "US National Ranking" : "Financial Accessibility Score"}
              </p>
            </div>

            {/* Data quality legend */}
            <div className="flex items-center gap-4 text-xs text-gray-400 mb-4 flex-wrap">
              <span className="font-medium text-gray-500">Data quality:</span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                High confidence
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                Estimated
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />
                Limited data
              </span>
            </div>

            <div className="space-y-4">
              {displayColleges.map((c) => (
                <CollegeCard
                  key={c.id}
                  college={c}
                  compared={compareIds.includes(c.id)}
                  onToggleCompare={() => toggleCompare(c.id)}
                />
              ))}
            </div>

            {filtered.length > pageSize && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-500">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}

            {filtered.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
                <p className="text-sm font-semibold text-gray-600 mb-1">No schools match</p>
                <p className="text-xs text-gray-400 mb-4">
                  {selectedState
                    ? `No schools in ${STATE_DATA[selectedState]?.name ?? selectedState} match your current filters.`
                    : "Try loosening your filters — very few schools meet all criteria simultaneously."}
                </p>
                <button
                  onClick={() => { setFilters(DEFAULT_FILTERS); setSelectedState(null); }}
                  className="text-xs font-semibold text-[#001049] border border-[#001049]/20 px-4 py-2 rounded-xl hover:bg-[#001049]/5 transition-colors"
                >
                  Reset all filters
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
