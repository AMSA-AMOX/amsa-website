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

const STATUS_OPTIONS: { value: AppStatus; label: string; bg: string; text: string }[] = [
  { value: "",            label: "—",           bg: "bg-gray-50",      text: "text-gray-400" },
  { value: "researching", label: "Researching", bg: "bg-blue-50",      text: "text-blue-700" },
  { value: "applying",    label: "Applying",    bg: "bg-amber-50",     text: "text-amber-700" },
  { value: "applied",     label: "Applied",     bg: "bg-purple-50",    text: "text-purple-700" },
  { value: "admitted",    label: "Admitted ✓",  bg: "bg-green-50",     text: "text-green-700" },
  { value: "waitlisted",  label: "Waitlisted",  bg: "bg-orange-50",    text: "text-orange-700" },
  { value: "rejected",    label: "Rejected",    bg: "bg-red-50",       text: "text-red-600" },
  { value: "enrolled",    label: "Enrolled 🎓", bg: "bg-emerald-50",   text: "text-emerald-700" },
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
          className="w-8 h-8 rounded-lg border border-gray-100 bg-white object-contain p-0.5 shrink-0"
          onError={() => setBroken(true)}
        />
      ) : (
        <span className="w-8 h-8 rounded-lg bg-[#001049]/10 flex items-center justify-center text-[11px] font-bold text-[#001049] shrink-0">
          {college.name.slice(0, 2).toUpperCase()}
        </span>
      )}
      <div className="min-w-0">
        <Link
          href={`/dashboard/research/college/${college.id}`}
          className="block font-semibold text-[#001049] hover:underline text-sm leading-snug truncate max-w-[180px]"
        >
          {college.name}
        </Link>
        <p className="text-xs text-gray-400 truncate max-w-[180px]">{college.location}</p>
      </div>
    </div>
  );
}

function ScoreChip({ score }: { score: number }) {
  const cls =
    score >= 75
      ? "bg-green-50 text-green-700"
      : score >= 55
      ? "bg-amber-50 text-amber-700"
      : "bg-red-50 text-red-600";
  return (
    <span className={`inline-flex items-center justify-center w-9 h-9 rounded-xl text-sm font-bold ${cls}`}>
      {score}
    </span>
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

  // ── Load journal from storage on mount ──
  useEffect(() => {
    const stored = loadJournal();

    // Also absorb any IDs passed via the ?ids= query param (from research page "Compare" button)
    const urlIds = parseIds(new URLSearchParams(window.location.search).get("ids"));
    // And legacy compare list from localStorage
    let legacyIds: number[] = [];
    try {
      const raw = localStorage.getItem(COMPARE_KEY);
      if (raw) legacyIds = JSON.parse(raw) as number[];
    } catch { /* ignore */ }

    const toMerge = [...urlIds, ...legacyIds];
    const existingSet = new Set(stored.rowOrder);
    const newIds = toMerge.filter((id) => !existingSet.has(id));

    const merged: JournalData = {
      ...stored,
      rowOrder: [...stored.rowOrder, ...newIds],
    };
    setJournal(merged);
    persistJournal(merged);
  }, []);

  // ── Derived ordered list ──
  const collegeMap = useMemo(() => {
    const m = new Map<number, College>();
    for (const c of allColleges) m.set(c.id, c);
    return m;
  }, [allColleges]);

  const rows = useMemo(
    () =>
      journal.rowOrder
        .map((id) => collegeMap.get(id))
        .filter((c): c is College => c !== undefined),
    [journal.rowOrder, collegeMap]
  );

  // ── Mutation helpers ──
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
    // Keep the legacy compare list in sync
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

  const setNote = (id: number, note: string) =>
    update((prev) => ({ ...prev, notesData: { ...prev.notesData, [id]: note } }));

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
    update((prev) => ({
      ...prev,
      customColumns: [...prev.customColumns, { id, name: "New Column" }],
    }));
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

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#001049]">My College Journal</h1>
          <p className="text-sm text-gray-500 mt-1">
            Rank schools by priority · track application status · add your own notes &amp; columns
            {savedAt && (
              <span className="ml-2 text-xs text-gray-400">
                · Auto-saved {savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/research"
            className="text-sm font-semibold text-white bg-[#001049] hover:bg-[#001049]/90 px-4 py-2 rounded-xl transition-colors"
          >
            + Add Schools
          </Link>
        </div>
      </div>

      {/* ── Loading / error states ── */}
      {loading && (
        <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center">
          <div className="space-y-2 animate-pulse max-w-md mx-auto">
            <div className="h-4 bg-gray-100 rounded w-3/4 mx-auto" />
            <div className="h-4 bg-gray-100 rounded w-1/2 mx-auto" />
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && !error && rows.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-14 text-center shadow-sm">
          <div className="text-5xl mb-5">📋</div>
          <h2 className="text-lg font-bold text-[#001049] mb-2">Your journal is empty</h2>
          <p className="text-sm text-gray-500 mb-7 max-w-sm mx-auto">
            Browse schools and click <strong>Compare</strong> to add them here. Then organize them in
            your own priority order and track your applications.
          </p>
          <Link
            href="/dashboard/research"
            className="inline-flex text-sm font-semibold text-white bg-[#001049] px-5 py-2.5 rounded-xl hover:bg-[#001049]/90 transition-colors"
          >
            Browse Schools →
          </Link>
        </div>
      )}

      {/* ── Journal spreadsheet ── */}
      {!loading && !error && rows.length > 0 && (
        <>
          {/* Legend */}
          <div className="flex items-center gap-3 flex-wrap text-xs text-gray-400 mb-3">
            <span>Drag ⠿ or use ↑↓ to reorder</span>
            <span className="text-gray-200">·</span>
            <span>Click column headers to rename</span>
            <span className="text-gray-200">·</span>
            <span>All changes auto-save to your browser</span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm border-collapse">

              {/* ── Table Head ── */}
              <thead>
                <tr className="bg-[#001049]/[0.03] border-b-2 border-[#001049]/10">
                  {/* Priority */}
                  <th className="px-3 py-3 text-center w-14">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">#</span>
                  </th>
                  {/* School */}
                  <th className="px-4 py-3 text-left">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">School</span>
                  </th>
                  {/* US Rank */}
                  <th className="px-4 py-3 text-left whitespace-nowrap">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">US Rank</span>
                  </th>
                  {/* Type */}
                  <th className="px-4 py-3 text-left whitespace-nowrap">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Type</span>
                  </th>
                  {/* Tuition */}
                  <th className="px-4 py-3 text-left whitespace-nowrap">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Tuition</span>
                  </th>
                  {/* Net Cost */}
                  <th className="px-4 py-3 text-left whitespace-nowrap">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Net Cost</span>
                  </th>
                  {/* Accept % */}
                  <th className="px-4 py-3 text-left whitespace-nowrap">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Accept</span>
                  </th>
                  {/* Aid Score */}
                  <th className="px-4 py-3 text-left whitespace-nowrap">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Aid Score</span>
                  </th>
                  {/* Status */}
                  <th className="px-4 py-3 text-left whitespace-nowrap">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Status</span>
                  </th>
                  {/* Notes */}
                  <th className="px-4 py-3 text-left min-w-[180px]">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Notes</span>
                  </th>
                  {/* Custom columns */}
                  {journal.customColumns.map((col) => (
                    <th key={col.id} className="px-4 py-3 text-left min-w-[140px] group/col">
                      <div className="flex items-center gap-1.5">
                        {editingColId === col.id ? (
                          <input
                            autoFocus
                            defaultValue={col.name}
                            onBlur={(e) => {
                              renameColumn(col.id, e.target.value);
                              setEditingColId(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                              if (e.key === "Escape") setEditingColId(null);
                            }}
                            className="text-xs font-bold text-[#001049] uppercase tracking-wide bg-transparent border-b-2 border-[#001049]/40 outline-none max-w-[100px]"
                          />
                        ) : (
                          <button
                            onClick={() => setEditingColId(col.id)}
                            className="text-xs font-bold text-gray-400 uppercase tracking-wide hover:text-[#001049] transition-colors"
                            title="Click to rename"
                          >
                            {col.name}
                          </button>
                        )}
                        <button
                          onClick={() => removeColumn(col.id)}
                          className="text-gray-200 hover:text-red-400 transition-colors opacity-0 group-hover/col:opacity-100"
                          title="Remove column"
                        >
                          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-current">
                            <path d="M4.5 4.5l7 7m0-7l-7 7" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                          </svg>
                        </button>
                      </div>
                    </th>
                  ))}
                  {/* Add column button */}
                  <th className="px-3 py-3 whitespace-nowrap">
                    {journal.customColumns.length < MAX_CUSTOM_COLS ? (
                      <button
                        onClick={addColumn}
                        className="text-xs text-[#001049]/40 hover:text-[#001049] font-semibold border border-dashed border-[#001049]/20 hover:border-[#001049]/40 rounded-lg px-2.5 py-1.5 transition-colors whitespace-nowrap"
                      >
                        + Add column
                      </button>
                    ) : (
                      <span className="text-xs text-gray-300">Max columns</span>
                    )}
                  </th>
                  {/* Remove column */}
                  <th className="px-3 py-3 w-16" />
                </tr>
              </thead>

              {/* ── Table Body ── */}
              <tbody>
                {rows.map((college, idx) => {
                  const status = journal.statusData[String(college.id)] ?? "";
                  const note = journal.notesData[String(college.id)] ?? "";
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
                      className={`border-b border-gray-100 last:border-b-0 group transition-colors ${
                        dragIdx === idx
                          ? "opacity-40 bg-gray-50"
                          : dragOverIdx === idx && dragIdx !== null
                          ? "bg-[#001049]/[0.04]"
                          : "hover:bg-[#001049]/[0.015]"
                      }`}
                    >
                      {/* ── Priority cell ── */}
                      <td
                        draggable
                        onDragStart={(e) => {
                          setDragIdx(idx);
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
                        className="px-2 py-3 cursor-grab active:cursor-grabbing select-none"
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-current text-gray-300 mb-0.5" aria-hidden="true">
                            <circle cx="5" cy="3" r="1.3"/><circle cx="11" cy="3" r="1.3"/>
                            <circle cx="5" cy="8" r="1.3"/><circle cx="11" cy="8" r="1.3"/>
                            <circle cx="5" cy="13" r="1.3"/><circle cx="11" cy="13" r="1.3"/>
                          </svg>
                          <span className="text-sm font-bold text-[#001049] leading-none">
                            {idx + 1}
                          </span>
                          <button
                            onClick={() => moveRow(idx, -1)}
                            onDragStart={(e) => e.preventDefault()}
                            disabled={idx === 0}
                            className="w-5 h-4 flex items-center justify-center text-gray-300 hover:text-[#001049] disabled:opacity-0 transition-colors"
                            title="Move up"
                          >
                            <svg viewBox="0 0 10 6" className="w-2.5 h-2.5 fill-current">
                              <path d="M5 0L10 6H0z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => moveRow(idx, 1)}
                            onDragStart={(e) => e.preventDefault()}
                            disabled={idx === rows.length - 1}
                            className="w-5 h-4 flex items-center justify-center text-gray-300 hover:text-[#001049] disabled:opacity-0 transition-colors"
                            title="Move down"
                          >
                            <svg viewBox="0 0 10 6" className="w-2.5 h-2.5 fill-current">
                              <path d="M5 6L0 0H10z" />
                            </svg>
                          </button>
                        </div>
                      </td>

                      {/* ── School ── */}
                      <td className="px-4 py-3">
                        <SchoolCell college={college} />
                      </td>

                      {/* ── US Rank ── */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm font-bold text-[#001049]">
                          {college.nationalRank != null ? `#${college.nationalRank}` : "—"}
                        </span>
                      </td>

                      {/* ── Type ── */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                          college.type === "public"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-[#001049]/5 text-[#001049] border-[#001049]/15"
                        }`}>
                          {college.type === "public" ? "Public" : "Private"}
                        </span>
                      </td>

                      {/* ── Tuition ── */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-700">{fmt(college.tuition)}</span>
                        <p className="text-xs text-gray-400">{college.type === "public" ? "OOS" : "/yr"}</p>
                      </td>

                      {/* ── Net Cost ── */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {college.estimatedNetCost != null ? (
                          <>
                            <span className="text-sm font-semibold text-green-700">
                              {fmt(college.estimatedNetCost)}
                            </span>
                            <p className="text-xs text-gray-400">after avg aid</p>
                          </>
                        ) : (
                          <span className="text-sm text-gray-400">N/A</span>
                        )}
                      </td>

                      {/* ── Accept % ── */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-700">
                          {college.overallAcceptanceRate != null
                            ? `${college.overallAcceptanceRate}%`
                            : "—"}
                        </span>
                      </td>

                      {/* ── Aid Score ── */}
                      <td className="px-4 py-3">
                        <ScoreChip score={college.financialAccessibilityScore} />
                      </td>

                      {/* ── Status ── */}
                      <td className="px-4 py-3">
                        <div className="relative">
                          <select
                            value={status}
                            onChange={(e) => setStatus(college.id, e.target.value as AppStatus)}
                            className={`text-xs font-semibold rounded-lg border border-gray-200 px-2.5 py-1.5 pr-6 appearance-none cursor-pointer ${statusOpt.bg} ${statusOpt.text}`}
                          >
                            {STATUS_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>

                      {/* ── Notes ── */}
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          placeholder="Add a note…"
                          value={note}
                          onChange={(e) => setNote(college.id, e.target.value)}
                          className="w-full text-xs text-gray-700 placeholder-gray-300 border-b border-transparent focus:border-gray-300 outline-none bg-transparent py-1 min-w-[160px]"
                        />
                      </td>

                      {/* ── Custom column cells ── */}
                      {journal.customColumns.map((col) => {
                        const val = journal.customData[col.id]?.[String(college.id)] ?? "";
                        return (
                          <td key={col.id} className="px-4 py-3">
                            <input
                              type="text"
                              placeholder="—"
                              value={val}
                              onChange={(e) => setCellValue(col.id, college.id, e.target.value)}
                              className="w-full text-xs text-gray-700 placeholder-gray-300 border-b border-transparent focus:border-gray-300 outline-none bg-transparent py-1 min-w-[120px]"
                            />
                          </td>
                        );
                      })}

                      {/* Add column spacer */}
                      <td />

                      {/* ── Remove button ── */}
                      <td className="px-3 py-3 text-right">
                        <button
                          onClick={() => removeRow(college.id)}
                          className="text-xs text-gray-300 hover:text-red-500 font-medium opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap"
                          title="Remove from journal"
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

          {/* ── Summary bar ── */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
              <span>{rows.length} school{rows.length !== 1 ? "s" : ""} in journal</span>
              {(() => {
                const statuses = rows
                  .map((c) => journal.statusData[String(c.id)])
                  .filter(Boolean);
                const applied = statuses.filter((s) =>
                  ["applied", "admitted", "waitlisted", "enrolled"].includes(s!)
                ).length;
                return applied > 0 ? (
                  <span>{applied} applied / in-progress</span>
                ) : null;
              })()}
            </div>
            <button
              onClick={clearAll}
              className="text-xs text-gray-300 hover:text-red-500 transition-colors"
            >
              Clear journal
            </button>
          </div>
        </>
      )}
    </div>
  );
}
