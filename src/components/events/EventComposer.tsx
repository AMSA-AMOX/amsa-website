"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

const UNLIMITED_SEATS = 1000000;

const MINUTE_OPTIONS = ["00","05","10","15","20","25","30","35","40","45","50","55"];
const HOUR_OPTIONS = ["12","1","2","3","4","5","6","7","8","9","10","11"];

const TIMEZONES = [
  { value: "Asia/Ulaanbaatar", label: "Ulaanbaatar (UTC+8)" },
  { value: "America/New_York", label: "Eastern — EST/EDT" },
  { value: "America/Chicago", label: "Central — CST/CDT" },
  { value: "America/Denver", label: "Mountain — MST/MDT" },
  { value: "America/Los_Angeles", label: "Pacific — PST/PDT" },
  { value: "Europe/London", label: "London — GMT/BST" },
  { value: "Europe/Paris", label: "Central Europe — CET/CEST" },
  { value: "UTC", label: "UTC" },
] as const;

type EventImage = { id: number; imageUrl: string; sortOrder: number };

export type DashboardEvent = {
  id: number;
  title: string;
  description: string;
  location: string | null;
  startAt: string | null;
  endAt: string | null;
  timezone: string | null;
  feeAmount: number;
  currency: string;
  totalSeats: number;
  isMemberExclusive: boolean;
  eventMode: "virtual" | "in_person" | "hybrid";
  virtualMeetingUrl: string | null;
  virtualLinkSoon: boolean;
  seatsRemaining: number;
  waitlistCount: number;
  EventImages: EventImage[];
  myReservation: unknown;
};

type EventComposerProps = {
  onCreated: (event: DashboardEvent) => void;
  onClose?: () => void;
  editEvent?: DashboardEvent;
};

const MAX_TITLE = 150;
const MAX_BODY = 4000;
const MAX_FILE_SIZE = 8 * 1024 * 1024;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseDTLocal(val: string): { date: string; hour: string; minute: string; ampm: "AM" | "PM" } {
  if (!val) return { date: "", hour: "12", minute: "00", ampm: "AM" };
  const [datePart, timePart] = val.split("T");
  const [hStr, mStr] = (timePart || "00:00").split(":");
  const h24 = Number(hStr);
  const ampm: "AM" | "PM" = h24 < 12 ? "AM" : "PM";
  const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
  const rawMin = Number(mStr || 0);
  const snappedMin = Math.round(rawMin / 5) * 5;
  const minute = snappedMin >= 60 ? "55" : String(snappedMin).padStart(2, "0");
  return { date: datePart || "", hour: String(h12), minute, ampm };
}

function buildDTLocal(date: string, hour: string, minute: string, ampm: "AM" | "PM"): string {
  if (!date) return "";
  let h24 = Number(hour) % 12;
  if (ampm === "PM") h24 += 12;
  return `${date}T${String(h24).padStart(2, "0")}:${minute}`;
}

function localToUTC(localStr: string, tz: string): string {
  const asUTC = new Date(localStr + ":00Z");
  const parts: Record<string, string> = {};
  new Intl.DateTimeFormat("en-US", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(asUTC).forEach(({ type, value }) => { parts[type] = value; });
  const tzHour = Number(parts.hour) === 24 ? 0 : Number(parts.hour);
  const gotMs = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), tzHour, Number(parts.minute));
  return new Date(asUTC.getTime() - (gotMs - asUTC.getTime())).toISOString();
}

function utcToLocal(isoStr: string, tz: string): string {
  const d = new Date(isoStr);
  const parts: Record<string, string> = {};
  new Intl.DateTimeFormat("en-US", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(d).forEach(({ type, value }) => { parts[type] = value; });
  const h = parts.hour === "24" ? "00" : parts.hour;
  return `${parts.year}-${parts.month}-${parts.day}T${h}:${parts.minute}`;
}

// ─── DateTimePicker ───────────────────────────────────────────────────────────

function DateTimePicker({ label, value, onChange }: {
  label: string; value: string; onChange: (val: string) => void;
}) {
  const { date, hour, minute, ampm } = parseDTLocal(value);
  const update = (d: string, h: string, m: string, a: "AM" | "PM") => onChange(buildDTLocal(d, h, m, a));
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <div className="flex gap-1.5">
        <input type="date" value={date} onChange={(e) => update(e.target.value, hour, minute, ampm)}
          className="flex-1 min-w-0 border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#001049]/20" />
        <select value={hour} onChange={(e) => update(date, e.target.value, minute, ampm)}
          className="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none">
          {HOUR_OPTIONS.map((h) => <option key={h} value={h}>{h}</option>)}
        </select>
        <select value={minute} onChange={(e) => update(date, hour, e.target.value, ampm)}
          className="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none">
          {MINUTE_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={ampm} onChange={(e) => update(date, hour, minute, e.target.value as "AM" | "PM")}
          className="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none">
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function EventComposer({ onCreated, onClose, editEvent }: EventComposerProps) {
  const { user, authFetch } = useAuth();
  const isEdit = Boolean(editEvent);

  const [title, setTitle] = useState(editEvent?.title ?? "");
  const [description, setDescription] = useState(editEvent?.description ?? "");
  const [link, setLink] = useState(editEvent?.virtualMeetingUrl ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(
    editEvent?.EventImages?.[0]?.imageUrl ?? null
  );

  const [showAdvanced, setShowAdvanced] = useState(() => {
    if (!editEvent) return false;
    return Boolean(editEvent.startAt || editEvent.location || editEvent.feeAmount || !editEvent.isMemberExclusive === false);
  });

  const tz = editEvent?.timezone || "Asia/Ulaanbaatar";
  const [location, setLocation] = useState(editEvent?.location ?? "");
  const [startAt, setStartAt] = useState(editEvent?.startAt ? utcToLocal(editEvent.startAt, tz) : "");
  const [endAt, setEndAt] = useState(editEvent?.endAt ? utcToLocal(editEvent.endAt, tz) : "");
  const [timezone, setTimezone] = useState(tz);
  const [eventMode, setEventMode] = useState<"virtual" | "in_person" | "hybrid">(editEvent?.eventMode ?? "in_person");
  const [hasFee, setHasFee] = useState(Number(editEvent?.feeAmount ?? 0) > 0);
  const [feeAmount, setFeeAmount] = useState(Number(editEvent?.feeAmount ?? 0) > 0 ? String(editEvent!.feeAmount) : "");
  const [currency, setCurrency] = useState(editEvent?.currency ?? "MNT");
  const [hasSeatLimit, setHasSeatLimit] = useState(Number(editEvent?.totalSeats ?? UNLIMITED_SEATS) < UNLIMITED_SEATS);
  const [totalSeats, setTotalSeats] = useState(
    Number(editEvent?.totalSeats ?? UNLIMITED_SEATS) < UNLIMITED_SEATS ? String(editEvent!.totalSeats) : ""
  );
  const [isMemberExclusive, setIsMemberExclusive] = useState(Boolean(editEvent?.isMemberExclusive));

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const canSubmit = title.trim().length > 0 && !submitting;

  const onPickFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) { setError("Only image files are allowed."); return; }
    if (f.size > MAX_FILE_SIZE) { setError(`Image exceeds 8 MB.`); return; }
    setError("");
    setExistingImageUrl(null);
    setFile(f);
    e.target.value = "";
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    try {
      let imageUrl: string | null = existingImageUrl;

      if (file) {
        const ext = file.name.includes(".") ? file.name.split(".").pop()?.toLowerCase() ?? "jpg" : "jpg";
        const path = `events/${user?.id ?? "user"}-${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("event-images")
          .upload(path, file, { upsert: false, contentType: file.type });
        if (uploadErr) throw new Error(`Image upload failed: ${uploadErr.message}`);
        imageUrl = supabase.storage.from("event-images").getPublicUrl(path).data.publicUrl;
      }

      const payload: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim(),
        virtualMeetingUrl: link.trim() || null,
        images: imageUrl ? [imageUrl] : [],
      };

      if (showAdvanced) {
        payload.location = location.trim() || null;
        payload.eventMode = eventMode;
        payload.isMemberExclusive = isMemberExclusive;
        payload.feeAmount = hasFee ? Number(feeAmount || 0) : 0;
        payload.currency = currency;
        payload.totalSeats = hasSeatLimit ? Number(totalSeats || 30) : UNLIMITED_SEATS;

        const tzVal = timezone || "Asia/Ulaanbaatar";
        if (startAt) payload.startAt = localToUTC(startAt, tzVal);
        if (endAt) payload.endAt = localToUTC(endAt, tzVal);
        if (startAt || endAt) payload.timezone = tzVal;
      }

      let data: { event: DashboardEvent };
      if (isEdit && editEvent) {
        data = await authFetch(`/api/events/${editEvent.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        data = await authFetch("/api/events", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      onCreated(data.event);
      onClose?.();
    } catch (e: any) {
      setError(e?.message ?? "Failed to save event.");
    } finally {
      setSubmitting(false);
    }
  };

  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase();
  const displayImage = previewUrl ?? existingImageUrl;

  return (
    <div className="bg-white rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
      {/* Header */}
      <div className="flex items-start gap-3 px-5 pt-5 pb-4">
        <div className="w-12 h-12 rounded-full bg-[#FFCA3A] flex items-center justify-center text-[#001049] text-sm font-bold shrink-0 overflow-hidden">
          {user?.profilePic
            ? <img src={user.profilePic} alt={user.firstName} className="w-full h-full object-cover" />
            : initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-gray-900">{user?.firstName} {user?.lastName}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
            <span className="text-xs text-gray-400">{isEdit ? "Editing event" : "New event"}</span>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 space-y-4 py-3">
        {/* Title */}
        <div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Event title"
            maxLength={MAX_TITLE}
            className="w-full text-xl font-semibold text-gray-900 placeholder:text-gray-300 placeholder:font-light bg-transparent focus:outline-none leading-snug"
          />
          {title.length > 0 && (
            <p className="text-xs text-gray-300 mt-0.5">{title.length}/{MAX_TITLE}</p>
          )}
        </div>

        {/* Description */}
        <textarea
          ref={descRef}
          value={description}
          onChange={(e) => {
            const el = e.target;
            el.style.height = "auto";
            el.style.height = `${el.scrollHeight}px`;
            setDescription(el.value);
          }}
          placeholder="Description (optional)"
          maxLength={MAX_BODY}
          className="w-full text-base font-light text-gray-700 placeholder:text-gray-300 bg-transparent focus:outline-none resize-none leading-relaxed min-h-20 overflow-hidden"
        />

        {/* Link */}
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
          </svg>
          <input
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="Link (optional)"
            className="flex-1 text-sm text-gray-700 placeholder:text-gray-300 bg-transparent focus:outline-none"
          />
          {link && (
            <button type="button" onClick={() => setLink("")} className="text-gray-300 hover:text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Image preview */}
        {displayImage && (
          <div className="relative rounded-xl overflow-hidden border border-gray-100">
            <img src={displayImage} alt="Event image" className="w-full" />
            <button type="button"
              onClick={() => { setFile(null); setExistingImageUrl(null); }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white text-sm hover:bg-black/75 flex items-center justify-center">
              ×
            </button>
          </div>
        )}

        {/* Advanced section */}
        {showAdvanced && (
          <div className="space-y-4 border-t border-gray-100 pt-4">
            {/* Location */}
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location"
                className="flex-1 text-sm text-gray-700 placeholder:text-gray-300 bg-transparent focus:outline-none"
              />
            </div>

            {/* Dates */}
            <div className="space-y-3">
              <DateTimePicker label="Start" value={startAt} onChange={setStartAt} />
              <DateTimePicker label="End" value={endAt} onChange={setEndAt} />
            </div>

            {/* Timezone */}
            {(startAt || endAt) && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Timezone</p>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#001049]/20"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Event mode */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Mode</p>
              <select
                value={eventMode}
                onChange={(e) => setEventMode(e.target.value as "virtual" | "in_person" | "hybrid")}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#001049]/20"
              >
                <option value="in_person">In person</option>
                <option value="virtual">Virtual</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>

            {/* Fee */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none shrink-0">
                <div
                  onClick={() => setHasFee((v) => !v)}
                  className={`relative w-8 h-5 rounded-full transition-colors ${hasFee ? "bg-[#001049]" : "bg-gray-200"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${hasFee ? "translate-x-3" : "translate-x-0"}`} />
                </div>
                <span className="text-xs text-gray-500">Fee</span>
              </label>
              {hasFee && (
                <>
                  <input
                    type="number"
                    min={0}
                    value={feeAmount}
                    onChange={(e) => setFeeAmount(e.target.value)}
                    placeholder="Amount"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#001049]/20"
                  />
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  >
                    <option value="MNT">MNT</option>
                    <option value="USD">USD</option>
                  </select>
                </>
              )}
            </div>

            {/* Seats */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none shrink-0">
                <div
                  onClick={() => setHasSeatLimit((v) => !v)}
                  className={`relative w-8 h-5 rounded-full transition-colors ${hasSeatLimit ? "bg-[#001049]" : "bg-gray-200"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${hasSeatLimit ? "translate-x-3" : "translate-x-0"}`} />
                </div>
                <span className="text-xs text-gray-500">Seat limit</span>
              </label>
              {hasSeatLimit && (
                <input
                  type="number"
                  min={1}
                  value={totalSeats}
                  onChange={(e) => setTotalSeats(e.target.value)}
                  placeholder="e.g. 30"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#001049]/20"
                />
              )}
            </div>

            {/* Member exclusive */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div
                onClick={() => setIsMemberExclusive((v) => !v)}
                className={`relative w-8 h-5 rounded-full transition-colors ${isMemberExclusive ? "bg-[#001049]" : "bg-gray-200"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isMemberExclusive ? "translate-x-3" : "translate-x-0"}`} />
              </div>
              <span className="text-xs text-gray-500">Members only</span>
            </label>
          </div>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      {/* Toolbar */}
      <div className="flex items-center px-5 py-4 border-t border-gray-100">
        <div className="flex-1 flex items-center gap-1">
          {/* Image upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onPickFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={Boolean(displayImage)}
            title={displayImage ? "Remove current image first" : "Add image"}
            className="p-2 rounded-lg transition text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
          </button>

          {/* Advanced toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
              showAdvanced
                ? "bg-[#001049]/8 text-[#001049]"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
            </svg>
            Advanced
          </button>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="px-5 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-40 disabled:bg-gray-200 disabled:text-gray-500 enabled:bg-[#001049] enabled:text-white enabled:hover:opacity-90"
        >
          {submitting ? (isEdit ? "Saving…" : "Creating…") : (isEdit ? "Save" : "Create")}
        </button>
      </div>
    </div>
  );
}
