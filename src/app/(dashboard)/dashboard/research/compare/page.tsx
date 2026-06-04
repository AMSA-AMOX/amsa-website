"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { College } from "../types";
import { useCollegesData } from "../use-colleges-data";

// ─── Types ────────────────────────────────────────────────────────────────────

type AppStatus =
  | ""
  | "researching"
  | "applying"
  | "applied"
  | "admitted"
  | "waitlisted"
  | "rejected"
  | "enrolled";

type CustomColumn = { id: string; name: string };

type JournalData = {
  rowOrder: number[];
  customColumns: CustomColumn[];
  customData: Record<string, Record<string, string>>;
  statusData: Record<string, AppStatus>;
  notesData: Record<string, string>;
};

const JOURNAL_KEY = "research_journal_v1";
const COMPARE_KEY = "research_compare_ids";
const MAX_CUSTOM_COLS = 6;

const STATUS_OPTIONS: { value: AppStatus; label: string; dot: string; text: string }[] = [
  { value: "",            label: "Select",       dot: "bg-gray-300",    text: "text-gray-400" },
  { value: "researching", label: "Researching", dot: "bg-blue-400",    text: "text-gray-700" },
  { value: "applying",    label: "Applying",    dot: "bg-amber-400",   text: "text-gray-700" },
  { value: "applied",     label: "Applied",     dot: "bg-purple-400",  text: "text-gray-700" },
  { value: "admitted",    label: "Admitted",    dot: "bg-green-500",   text: "text-gray-700" },
  { value: "waitlisted",  label: "Waitlisted",  dot: "bg-orange-400",  text: "text-gray-700" },
  { value: "rejected",    label: "Rejected",    dot: "bg-red-400",     text: "text-gray-700" },
  { value: "enrolled",    label: "Enrolled",    dot: "bg-emerald-500", text: "text-gray-700" },
];

// ─── Persistence helpers ───────────────────────────────────────────────────────

function emptyJournal(): JournalData {
  return { rowOrder: [], customColumns: [], customData: {}, statusData: {}, notesData: {} };
}

function loadJournal(): JournalData {
  try {
    const raw = localStorage.getItem(JOURNAL_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as JournalData;
      if (Array.isArray(parsed.rowOrder)) return parsed;
    }
  } catch { /* ignore */ }
  return emptyJournal();
}

function persistJournal(data: JournalData) {
  try { localStorage.setItem(JOURNAL_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

// ─── Utilities ────────────────────────────────────────────────────────────────

const fmt = (n: number) => "$" + Math.round(n).toLocaleString("en-US");

function parseIds(raw: string | null): number[] {
  if (!raw) return [];
  return raw.split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => Number.isFinite(n));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SchoolCell({ college }: { college: College }) {
  const [broken, setBroken] = useState(false);
  return (
    <div className="flex items-center gap-2.5 min-w-[200px]">
      {college.logoUrl && !broken ? (
        <img
          src={college.logoUrl}
          alt={college.name}
          className="w-9 h-9 bg-white object-contain rounded-sm shrink-0"
          onError={() => setBroken(true)}
        />
      ) : (
        <span className="w-7 h-7 bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 shrink-0">
          {college.name.slice(0, 2).toUpperCase()}
        </span>
      )}
      <div className="min-w-0">
        <Link
          href={`/dashboard/research/college/${college.id}`}
          className="block font-medium text-[#001049] hover:underline text-sm leading-snug truncate max-w-[200px]"
        >
          {college.name}
        </Link>
        <p className="text-xs text-gray-400 truncate max-w-[200px]">{college.location}</p>
      </div>
    </div>
  );
}

const SCORE_COLOR = (s: number) =>
  s >= 75 ? "text-green-600" : s >= 55 ? "text-amber-600" : "text-red-500";

// ─── Th / Td helpers ─────────────────────────────────────────────────────────

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-4 py-2.5 text-left border-r border-gray-200 last:border-r-0 ${className}`}>
      {children}
    </th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`px-4 py-3 border-r border-gray-100 last:border-r-0 ${className}`}>
      {children}
    </td>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ResearchComparePage() {
  const { colleges: allColleges, loading, error } = useCollegesData();
  const [journal, setJournal] = useState<JournalData>(emptyJournal());
  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  useEffect(() => {
    const stored = loadJournal();
    const urlIds = parseIds(new URLSearchParams(window.location.search).get("ids"));
    let legacyIds: number[] = [];
    try {
      const raw = localStorage.getItem(COMPARE_KEY);
      if (raw) legacyIds = JSON.parse(raw) as number[];
    } catch { /* ignore */ }

    const toMerge = [...urlIds, ...legacyIds];
    const existingSet = new Set(stored.rowOrder);
    const newIds = toMerge.filter((id) => !existingSet.has(id));
    const merged: JournalData = { ...stored, rowOrder: [...stored.rowOrder, ...newIds] };
    setJournal(merged);
    persistJournal(merged);
  }, []);

  const collegeMap = useMemo(() => {
    const m = new Map<number, College>();
    for (const c of allColleges) m.set(c.id, c);
    return m;
  }, [allColleges]);

  const rows = useMemo(
    () => journal.rowOrder.map((id) => collegeMap.get(id)).filter((c): c is College => c !== undefined),
    [journal.rowOrder, collegeMap]
  );

  const update = (updater: (prev: JournalData) => JournalData) => {
    setJournal((prev) => {
      const next = updater(prev);
      persistJournal(next);
      setSavedAt(new Date());
      return next;
    });
  };

  const moveRow = (idx: number, dir: -1 | 1) => {
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= rows.length) return;
    const idA = rows[idx].id;
    const idB = rows[targetIdx].id;
    update((prev) => {
      const order = [...prev.rowOrder];
      const posA = order.indexOf(idA);
      const posB = order.indexOf(idB);
      if (posA === -1 || posB === -1) return prev;
      [order[posA], order[posB]] = [order[posB], order[posA]];
      return { ...prev, rowOrder: order };
    });
  };

  const reorderRow = (fromIdx: number, toIdx: number) => {
    const fromId = rows[fromIdx]?.id;
    const toId = rows[toIdx]?.id;
    if (fromId === undefined || toId === undefined || fromId === toId) return;
    update((prev) => {
      const order = [...prev.rowOrder];
      const fromPos = order.indexOf(fromId);
      const toPos = order.indexOf(toId);
      if (fromPos === -1 || toPos === -1) return prev;
      order.splice(fromPos, 1);
      order.splice(toPos, 0, fromId);
      return { ...prev, rowOrder: order };
    });
  };

  const removeRow = (id: number) => {
    update((prev) => ({ ...prev, rowOrder: prev.rowOrder.filter((x) => x !== id) }));
    try {
      const raw = localStorage.getItem(COMPARE_KEY);
      if (raw) {
        const ids = JSON.parse(raw) as number[];
        localStorage.setItem(COMPARE_KEY, JSON.stringify(ids.filter((x) => x !== id)));
      }
    } catch { /* ignore */ }
  };

  const setStatus = (id: number, status: AppStatus) =>
    update((prev) => ({ ...prev, statusData: { ...prev.statusData, [id]: status } }));



  const setCellValue = (colId: string, collegeId: number, value: string) =>
    update((prev) => ({
      ...prev,
      customData: {
        ...prev.customData,
        [colId]: { ...(prev.customData[colId] ?? {}), [String(collegeId)]: value },
      },
    }));

  const addColumn = () => {
    if (journal.customColumns.length >= MAX_CUSTOM_COLS) return;
    const id = `col_${Date.now()}`;
    update((prev) => ({ ...prev, customColumns: [...prev.customColumns, { id, name: "New Column" }] }));
    setEditingColId(id);
  };

  const renameColumn = (colId: string, name: string) =>
    update((prev) => ({
      ...prev,
      customColumns: prev.customColumns.map((c) => (c.id === colId ? { ...c, name: name.trim() || c.name } : c)),
    }));

  const removeColumn = (colId: string) =>
    update((prev) => {
      const data = { ...prev.customData };
      delete data[colId];
      return { ...prev, customColumns: prev.customColumns.filter((c) => c.id !== colId), customData: data };
    });

  const clearAll = () => {
    if (!confirm("Clear your entire college journal? This cannot be undone.")) return;
    const cleared = emptyJournal();
    setJournal(cleared);
    persistJournal(cleared);
    try { localStorage.removeItem(COMPARE_KEY); } catch { /* ignore */ }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="py-8 px-4 md:px-7">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[#001049]">My College Journal</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Rank schools · track status · add notes
            {savedAt && (
              <span className="ml-2 text-xs">
                · Saved {savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </p>
        </div>
        <Link
          href="/dashboard/research"
          className="text-sm font-medium text-white bg-[#001049] hover:bg-[#001049]/90 px-3.5 py-1.5 rounded transition-colors"
        >
          + Add Schools
        </Link>
      </div>

      {/* Loading */}
      {loading && (
        <div className="border border-gray-200 bg-white p-8 text-center">
          <div className="space-y-2 animate-pulse max-w-md mx-auto">
            <div className="h-3.5 bg-gray-100 rounded w-3/4 mx-auto" />
            <div className="h-3.5 bg-gray-100 rounded w-1/2 mx-auto" />
          </div>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="border border-red-100 bg-red-50 p-5 text-sm text-red-600">{error}</div>
      )}

      {/* Empty state */}
      {!loading && !error && rows.length === 0 && (
        <div className="border border-gray-200 bg-white p-14 text-center">
          <p className="text-sm font-semibold text-[#001049] mb-1">Your journal is empty</p>
          <p className="text-sm text-gray-400 mb-6 max-w-sm mx-auto">
            Browse schools and click <strong>Compare</strong> to add them here.
          </p>
          <Link
            href="/dashboard/research"
            className="inline-flex text-sm font-medium text-white bg-[#001049] px-4 py-2 rounded hover:bg-[#001049]/90 transition-colors"
          >
            Browse Schools →
          </Link>
        </div>
      )}

      {/* Table */}
      {!loading && !error && rows.length > 0 && (
        <>
          <div className="overflow-x-auto border-2 rounded-lg border-gray-200 bg-white">
            <table className="w-full text-sm border-collapse">

              {/* Head */}
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {/* Drag / # */}
                  <th className="w-12 border-r border-gray-200 px-3 py-2.5 text-center">
                    <span className="text-xs font-medium text-gray-400">#</span>
                  </th>

                  <Th className="min-w-[220px]">
                    <span className="text-xs font-medium text-gray-500">School</span>
                  </Th>
                  <Th><span className="text-xs font-medium text-gray-500">Rank</span></Th>
                  <Th><span className="text-xs font-medium text-gray-500">Housing</span></Th>
                  <Th><span className="text-xs font-medium text-gray-500">Tuition (yr)</span></Th>
                  <Th><span className="text-xs font-medium text-gray-500">Net Cost (est.)</span></Th>
                  <Th><span className="text-xs font-medium text-gray-500">Accept</span></Th>
                  <Th><span className="text-xs font-medium text-gray-500">Aid Score</span></Th>
                  <Th><span className="text-xs font-medium text-gray-500">Status</span></Th>

                  {/* Custom columns */}
                  {journal.customColumns.map((col) => (
                    <th key={col.id} className="px-4 py-2.5 text-left border-r border-gray-200 min-w-[140px] group/col">
                      <div className="flex items-center gap-1.5">
                        {editingColId === col.id ? (
                          <input
                            autoFocus
                            defaultValue={col.name}
                            onBlur={(e) => { renameColumn(col.id, e.target.value); setEditingColId(null); }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                              if (e.key === "Escape") setEditingColId(null);
                            }}
                            className="text-xs font-medium text-[#001049] bg-transparent border-b border-[#001049]/40 outline-none max-w-[100px]"
                          />
                        ) : (
                          <button
                            onClick={() => setEditingColId(col.id)}
                            className="text-xs font-medium text-gray-500 hover:text-[#001049] transition-colors"
                            title="Click to rename"
                          >
                            {col.name}
                          </button>
                        )}
                        <button
                          onClick={() => removeColumn(col.id)}
                          className="text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover/col:opacity-100"
                          title="Remove column"
                        >
                          <svg viewBox="0 0 16 16" className="w-3 h-3 fill-current">
                            <path d="M4.5 4.5l7 7m0-7l-7 7" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                    </th>
                  ))}

                  {/* Add column */}
                  <th className="px-3 py-2.5 border-r border-gray-200">
                    {journal.customColumns.length < MAX_CUSTOM_COLS ? (
                      <button
                        onClick={addColumn}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Add column"
                      >
                        <svg viewBox="0 0 16 16" className="w-4 h-4 fill-current">
                          <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                        </svg>
                      </button>
                    ) : (
                      <span className="text-xs text-gray-300">Max</span>
                    )}
                  </th>
                  <th className="w-16" />
                </tr>
              </thead>

              {/* Body */}
              <tbody>
                {rows.map((college, idx) => {
                  const status = journal.statusData[String(college.id)] ?? "";
const statusOpt = STATUS_OPTIONS.find((o) => o.value === status) ?? STATUS_OPTIONS[0];

                  return (
                    <tr
                      key={college.id}
                      onDragOver={(e) => { e.preventDefault(); setDragOverIdx(idx); }}
                      onDragLeave={(e) => {
                        if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverIdx(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (dragIdx !== null && dragIdx !== idx) reorderRow(dragIdx, idx);
                        setDragIdx(null);
                        setDragOverIdx(null);
                      }}
                      className={`border-b border-gray-100 last:border-b-0 group/row transition-colors ${
                        dragIdx === idx
                          ? "opacity-40 bg-gray-50"
                          : dragOverIdx === idx && dragIdx !== null
                          ? "bg-blue-50/40"
                          : "hover:bg-gray-50/60"
                      }`}
                    >
                      {/* # / drag */}
                      <td
                        draggable
                        onDragStart={(e) => { setDragIdx(idx); e.dataTransfer.effectAllowed = "move"; }}
                        onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
                        className="w-12 border-r border-gray-100 px-3 py-3 cursor-grab active:cursor-grabbing select-none"
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          <svg viewBox="0 0 16 16" className="w-3 h-3 fill-current text-gray-300 opacity-0 group-hover/row:opacity-100 transition-opacity" aria-hidden="true">
                            <circle cx="5" cy="3" r="1.2"/><circle cx="11" cy="3" r="1.2"/>
                            <circle cx="5" cy="8" r="1.2"/><circle cx="11" cy="8" r="1.2"/>
                            <circle cx="5" cy="13" r="1.2"/><circle cx="11" cy="13" r="1.2"/>
                          </svg>
                          <span className="text-xs text-gray-400 leading-none">{idx + 1}</span>
                          <button
                            onClick={() => moveRow(idx, -1)}
                            onDragStart={(e) => e.preventDefault()}
                            disabled={idx === 0}
                            className="w-4 h-3 flex items-center justify-center text-gray-300 hover:text-gray-500 disabled:opacity-0 transition-colors"
                          >
                            <svg viewBox="0 0 10 6" className="w-2 h-2 fill-current"><path d="M5 0L10 6H0z"/></svg>
                          </button>
                          <button
                            onClick={() => moveRow(idx, 1)}
                            onDragStart={(e) => e.preventDefault()}
                            disabled={idx === rows.length - 1}
                            className="w-4 h-3 flex items-center justify-center text-gray-300 hover:text-gray-500 disabled:opacity-0 transition-colors"
                          >
                            <svg viewBox="0 0 10 6" className="w-2 h-2 fill-current"><path d="M5 6L0 0H10z"/></svg>
                          </button>
                        </div>
                      </td>

                      {/* School */}
                      <Td><SchoolCell college={college} /></Td>

                      {/* Rank */}
                      <Td>
                        <span className="text-sm text-gray-700 tabular-nums">
                          {college.nationalRank != null ? `#${college.nationalRank}` : "—"}
                        </span>
                      </Td>

                      {/* Housing */}
                      <Td>
                        <span className="text-sm text-gray-700 tabular-nums">{fmt(college.roomAndBoard)}</span>
                      </Td>

                      {/* Tuition */}
                      <Td>
                        <span className="text-sm text-gray-700 tabular-nums">{fmt(college.tuition)}</span>
                      </Td>

                      {/* Net Cost */}
                      <Td>
                        {college.estimatedNetCost != null ? (
                          <span className="text-sm text-gray-700 tabular-nums">{fmt(college.estimatedNetCost)}</span>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </Td>

                      {/* Accept */}
                      <Td>
                        <span className="text-sm text-gray-700 tabular-nums">
                          {college.overallAcceptanceRate != null ? `${college.overallAcceptanceRate}%` : "—"}
                        </span>
                      </Td>

                      {/* Aid Score */}
                      <Td>
                        <span className={`text-sm font-semibold tabular-nums ${SCORE_COLOR(college.financialAccessibilityScore)}`}>
                          {college.financialAccessibilityScore}
                        </span>
                      </Td>

                      {/* Status */}
                      <Td>
                        <div className="relative inline-flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusOpt.dot}`} />
                          <select
                            value={status}
                            onChange={(e) => setStatus(college.id, e.target.value as AppStatus)}
                            className={`text-xs bg-transparent border-0 outline-none cursor-pointer appearance-none pr-3 ${statusOpt.text}`}
                          >
                            {STATUS_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                          <svg viewBox="0 0 10 6" className="w-2 h-2 fill-current text-gray-300 pointer-events-none shrink-0">
                            <path d="M5 6L0 0H10z"/>
                          </svg>
                        </div>
                      </Td>

                      {/* Custom cells */}
                      {journal.customColumns.map((col) => {
                        const val = journal.customData[col.id]?.[String(college.id)] ?? "";
                        return (
                          <Td key={col.id}>
                            <input
                              type="text"
                              placeholder="—"
                              value={val}
                              onChange={(e) => setCellValue(col.id, college.id, e.target.value)}
                              className="w-full text-xs text-gray-600 placeholder-gray-300 border-b border-transparent focus:border-gray-200 outline-none bg-transparent py-0.5 min-w-[120px]"
                            />
                          </Td>
                        );
                      })}

                      <td className="border-r border-gray-100" />

                      {/* Remove */}
                      <td className="px-3 py-3 text-right">
                        <button
                          onClick={() => removeRow(college.id)}
                          className="text-xs text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover/row:opacity-100 whitespace-nowrap"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
              <span>{rows.length} school{rows.length !== 1 ? "s" : ""}</span>
              {(() => {
                const statuses = rows.map((c) => journal.statusData[String(c.id)]).filter(Boolean);
                const applied = statuses.filter((s) =>
                  ["applied", "admitted", "waitlisted", "enrolled"].includes(s!)
                ).length;
                return applied > 0 ? <span>{applied} applied / in-progress</span> : null;
              })()}
            </div>
            <button onClick={clearAll} className="text-xs text-gray-300 hover:text-red-500 transition-colors">
              Clear journal
            </button>
          </div>
        </>
      )}
    </div>
  );
}
