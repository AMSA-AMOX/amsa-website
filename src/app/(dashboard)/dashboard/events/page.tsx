"use client";

import { useMemo, useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

const UNLIMITED_SEATS = 1000000;

type EventImage = {
  id: number;
  imageUrl: string;
  sortOrder: number;
};

type MyReservation = {
  status: "reserved" | "waitlisted" | "paid" | "cancelled" | "expired";
  waitlistPosition: number | null;
  paymentDueAt: string | null;
  paymentStatus: string;
};

type DashboardEvent = {
  id: number;
  title: string;
  description: string;
  location: string | null;
  startAt: string;
  endAt: string;
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
  myReservation: MyReservation | null;
};

type AdminReservation = {
  id: number;
  userId: number;
  status: string;
  waitlistPosition: number | null;
  paymentStatus: string;
  paymentDueAt: string | null;
  checkedIn: boolean;
  checkedInAt: string | null;
  createdAt: string;
  Users: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string | null;
  } | null;
};

type CreateEventForm = {
  title: string;
  description: string;
  location: string;
  startAt: string;
  endAt: string;
  hasFee: boolean;
  feeAmount: string;
  currency: string;
  hasSeatLimit: boolean;
  totalSeats: string;
  isMemberExclusive: boolean;
  eventMode: "virtual" | "in_person" | "hybrid";
  virtualMeetingUrl: string;
  virtualLinkSoon: boolean;
};

type SelectedImage = {
  file: File;
  previewUrl: string;
};

const initialForm: CreateEventForm = {
  title: "",
  description: "",
  location: "",
  startAt: "",
  endAt: "",
  hasFee: false,
  feeAmount: "",
  currency: "MNT",
  hasSeatLimit: false,
  totalSeats: "",
  isMemberExclusive: false,
  eventMode: "in_person",
  virtualMeetingUrl: "",
  virtualLinkSoon: false,
};

function formatDate(date: string) {
  return new Date(date).toLocaleString();
}

function formatMoney(amount: number, currency: string) {
  return `${amount.toLocaleString()} ${currency}`;
}

function toIcsDateString(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function generateIcsContent(event: DashboardEvent): string {
  const uid = `${event.id}@amsa.mn`;
  const dtStart = toIcsDateString(new Date(event.startAt));
  const dtEnd = toIcsDateString(new Date(event.endAt));
  const now = toIcsDateString(new Date());
  const location = event.location || "TBD";

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AMSA//Events//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${event.title.replace(/\n/g, " ")}`,
    `DESCRIPTION:${event.description.replace(/\n/g, " ")}`,
    `LOCATION:${location.replace(/\n/g, " ")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export default function EventsPage() {
  const { user, loading, authFetch } = useAuth();
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionEventId, setActionEventId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [form, setForm] = useState<CreateEventForm>(initialForm);
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [manageEvent, setManageEvent] = useState<DashboardEvent | null>(null);
  const [adminReservations, setAdminReservations] = useState<AdminReservation[]>([]);
  const [isLoadingAdminReservations, setIsLoadingAdminReservations] = useState(false);
  const [eventImageIndex, setEventImageIndex] = useState<Record<number, number>>({});

  const isAdmin = user?.role === "admin";

  const upcomingEvents = useMemo(() => {
    const now = Date.now();
    return events.filter((event) => new Date(event.endAt).getTime() >= now);
  }, [events]);

  const pastEvents = useMemo(() => {
    const now = Date.now();
    return events.filter((event) => new Date(event.endAt).getTime() < now);
  }, [events]);

  useEffect(() => {
    setForm((prev) => ({ ...initialForm, ...prev }));
  }, []);

  useEffect(() => {
    return () => {
      for (const image of selectedImages) {
        URL.revokeObjectURL(image.previewUrl);
      }
    };
  }, [selectedImages]);

  useEffect(() => {
    setEventImageIndex((prev) => {
      const next: Record<number, number> = {};
      for (const event of events) {
        const imageCount = event.EventImages?.length || 1;
        const current = prev[event.id] ?? 0;
        next[event.id] = Math.min(current, Math.max(0, imageCount - 1));
      }
      return next;
    });
  }, [events]);

  const loadEvents = async () => {
    if (!user) return;
    setIsLoadingEvents(true);
    setError(null);
    try {
      const data = await authFetch("/api/events", { method: "GET" });
      setEvents(data.events || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load events");
    } finally {
      setIsLoadingEvents(false);
    }
  };

  useEffect(() => {
    if (!loading && user) {
      void loadEvents();
    }
    if (!loading && !user) {
      setIsLoadingEvents(false);
    }
  }, [loading, user]);

  const handleReserve = async (eventId: number) => {
    setActionEventId(eventId);
    try {
      await authFetch(`/api/events/${eventId}/reserve`, { method: "POST" });
      await loadEvents();
    } catch (e: any) {
      setError(e?.message || "Failed to reserve");
    } finally {
      setActionEventId(null);
    }
  };

  const handleCancel = async (eventId: number) => {
    setActionEventId(eventId);
    try {
      await authFetch(`/api/events/${eventId}/cancel`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      await loadEvents();
    } catch (e: any) {
      setError(e?.message || "Failed to cancel reservation");
    } finally {
      setActionEventId(null);
    }
  };

  const loadAdminReservations = async (eventId: number) => {
    setIsLoadingAdminReservations(true);
    try {
      const data = await authFetch(`/api/events/${eventId}/reservations`, { method: "GET" });
      setAdminReservations(data.reservations || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load reservations");
    } finally {
      setIsLoadingAdminReservations(false);
    }
  };

  const handleAdminMarkPaid = async (eventId: number, userId: number) => {
    setActionEventId(eventId);
    try {
      await authFetch(`/api/events/${eventId}/mark-paid`, {
        method: "POST",
        body: JSON.stringify({ userId }),
      });
      await loadAdminReservations(eventId);
      await loadEvents();
    } catch (e: any) {
      setError(e?.message || "Failed to mark paid");
    } finally {
      setActionEventId(null);
    }
  };

  const handleAdminCheckIn = async (eventId: number, userId: number) => {
    setActionEventId(eventId);
    try {
      await authFetch(`/api/events/${eventId}/check-in`, {
        method: "POST",
        body: JSON.stringify({ userId }),
      });
      await loadAdminReservations(eventId);
      await loadEvents();
    } catch (e: any) {
      setError(e?.message || "Failed to check in member");
    } finally {
      setActionEventId(null);
    }
  };

  const downloadCalendarReminder = (event: DashboardEvent) => {
    const ics = generateIcsContent(event);
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${event.title.toLowerCase().replace(/\s+/g, "-") || "event"}.ics`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreateError(null);
    if (selectedImages.length + existingImageUrls.length > 1) {
      setCreateError("Only one image is allowed per event.");
      return;
    }
    if (modalMode === "create" && selectedImages.length === 0) {
      setCreateError("Please add at least one event image.");
      return;
    }
    if (
      (form.eventMode ?? "in_person") === "virtual" &&
      !(form.virtualMeetingUrl ?? "").trim() &&
      !Boolean(form.virtualLinkSoon)
    ) {
      setCreateError("For virtual events, provide a meeting link or mark it as coming soon.");
      return;
    }

    setActionEventId(-1);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < selectedImages.length; i += 1) {
        const file = selectedImages[i].file;
        const cleanName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
        const path = `events/${user?.id || "user"}-${Date.now()}-${i}-${cleanName}`;

        const { error: uploadError } = await supabase.storage
          .from("event-images")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (uploadError) {
          throw new Error(`Image upload failed: ${uploadError.message}`);
        }
        const publicUrl = supabase.storage.from("event-images").getPublicUrl(path).data.publicUrl;
        uploadedUrls.push(publicUrl);
      }

      const finalImages = [...existingImageUrls, ...uploadedUrls];

      const payload = {
        title: form.title,
        description: form.description,
        location: form.location || null,
        startAt: form.startAt,
        endAt: form.endAt,
        feeAmount: form.hasFee ? Number(form.feeAmount || 0) : 0,
        currency: form.currency,
        totalSeats: form.hasSeatLimit
          ? Number(form.totalSeats || 0)
          : UNLIMITED_SEATS,
        isMemberExclusive: form.isMemberExclusive,
        eventMode: form.eventMode ?? "in_person",
        virtualMeetingUrl: (form.virtualMeetingUrl ?? "").trim() || null,
        virtualLinkSoon: Boolean(form.virtualLinkSoon),
        images: finalImages,
      };

      if (modalMode === "edit" && editingEventId) {
        await authFetch(`/api/events/${editingEventId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await authFetch("/api/events", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      setForm(initialForm);
      for (const image of selectedImages) {
        URL.revokeObjectURL(image.previewUrl);
      }
      setSelectedImages([]);
      setExistingImageUrls([]);
      setEditingEventId(null);
      setModalMode("create");
      setShowCreateModal(false);
      await loadEvents();
    } catch (e: any) {
      setCreateError(e?.message || "Failed to create event");
    } finally {
      setActionEventId(null);
    }
  };

  const addFiles = (incoming: FileList | File[]) => {
    const next = Array.from(incoming);
    const imageOnly = next.filter((file) => file.type.startsWith("image/"));
    if (imageOnly.length !== next.length) {
      setCreateError("Only image files are allowed.");
      return;
    }
    const mapped = imageOnly.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    if (mapped.length === 0) return;
    const previousSelected = [...selectedImages];
    const merged = [mapped[0]];
    if (existingImageUrls.length + merged.length > 1) {
      for (const image of mapped) {
        URL.revokeObjectURL(image.previewUrl);
      }
      setCreateError("Only one image is allowed per event.");
      return;
    }
    for (const image of previousSelected) {
      URL.revokeObjectURL(image.previewUrl);
    }
    setCreateError(null);
    setExistingImageUrls([]);
    setSelectedImages(merged);
  };

  const removeImageAt = (index: number) => {
    setSelectedImages((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const removeExistingImageAt = (index: number) => {
    setExistingImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const openCreateModal = () => {
    setModalMode("create");
    setEditingEventId(null);
    setForm(initialForm);
    for (const image of selectedImages) {
      URL.revokeObjectURL(image.previewUrl);
    }
    setSelectedImages([]);
    setExistingImageUrls([]);
    setCreateError(null);
    setShowCreateModal(true);
  };

  const openEditModal = (event: DashboardEvent) => {
    const sortedImages = [...(event.EventImages || [])]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((img) => img.imageUrl);

    const toDateInputValue = (value: string) => {
      const d = new Date(value);
      const tzOffsetMs = d.getTimezoneOffset() * 60000;
      return new Date(d.getTime() - tzOffsetMs).toISOString().slice(0, 16);
    };

    setModalMode("edit");
    setEditingEventId(event.id);
    setForm({
      title: event.title || "",
      description: event.description || "",
      location: event.location || "",
      startAt: toDateInputValue(event.startAt),
      endAt: toDateInputValue(event.endAt),
      hasFee: Number(event.feeAmount || 0) > 0,
      feeAmount: Number(event.feeAmount || 0) > 0 ? String(event.feeAmount) : "",
      currency: event.currency || "MNT",
      hasSeatLimit:
        Number(event.totalSeats || UNLIMITED_SEATS) < UNLIMITED_SEATS,
      totalSeats:
        Number(event.totalSeats || UNLIMITED_SEATS) < UNLIMITED_SEATS
          ? String(event.totalSeats)
          : "",
      isMemberExclusive: Boolean(event.isMemberExclusive),
      eventMode: event.eventMode || "in_person",
      virtualMeetingUrl: event.virtualMeetingUrl || "",
      virtualLinkSoon: Boolean(event.virtualLinkSoon),
    });
    setExistingImageUrls(sortedImages);
    for (const image of selectedImages) {
      URL.revokeObjectURL(image.previewUrl);
    }
    setSelectedImages([]);
    setCreateError(null);
    setShowCreateModal(true);
  };

  const handleDeleteEvent = async (eventId: number) => {
    const confirmed = window.confirm("Delete this event? This cannot be undone.");
    if (!confirmed) return;

    setActionEventId(eventId);
    try {
      await authFetch(`/api/events/${eventId}`, { method: "DELETE" });
      await loadEvents();
    } catch (e: any) {
      setError(e?.message || "Failed to delete event");
    } finally {
      setActionEventId(null);
    }
  };

  const renderEventCard = (event: DashboardEvent) => {
    const myReservation = event.myReservation;
    const isBusy = actionEventId === event.id;
    const eventImages = (event.EventImages || []).map((img) => img.imageUrl);
    const imageCount = eventImages.length;
    const currentIndex = Math.min(eventImageIndex[event.id] ?? 0, Math.max(0, imageCount - 1));
    const currentImage = imageCount > 0 ? eventImages[currentIndex] : null;
    const isVirtualOnly = event.eventMode === "virtual";
    const isVirtualJoinEnabled =
      event.eventMode === "virtual" || event.eventMode === "hybrid";
    const now = Date.now();
    const startAtMs = new Date(event.startAt).getTime();
    const endAtMs = new Date(event.endAt).getTime();
    const hasStarted = now >= startAtMs;
    const hasEnded = now > endAtMs;

    return (
      <div
        key={event.id}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden md:grid md:grid-cols-5"
      >
        <div className="relative w-full h-56 md:h-full md:col-span-2 bg-gray-100">
          {currentImage ? (
            <img
              src={currentImage}
              alt={`${event.title} image ${currentIndex + 1}`}
              className="w-full h-full object-cover"
            />
          ) : null}
          {imageCount > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous image"
                onClick={() =>
                  setEventImageIndex((prev) => ({
                    ...prev,
                    [event.id]:
                      ((prev[event.id] ?? 0) - 1 + imageCount) % imageCount,
                  }))
                }
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/45 backdrop-blur-sm text-white hover:bg-black/60 transition flex items-center justify-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="w-4 h-4"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <button
                type="button"
                aria-label="Next image"
                onClick={() =>
                  setEventImageIndex((prev) => ({
                    ...prev,
                    [event.id]: ((prev[event.id] ?? 0) + 1) % imageCount,
                  }))
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/45 backdrop-blur-sm text-white hover:bg-black/60 transition flex items-center justify-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="w-4 h-4"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m9 6 6 6-6 6" />
                </svg>
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-black/40 text-white text-xs">
                {currentIndex + 1}/{imageCount}
              </div>
            </>
          )}
        </div>
        <div className="p-6 space-y-4 md:col-span-3">
          <div>
            <h2 className="text-2xl font-semibold text-[#001049]">{event.title}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {formatDate(event.startAt)} - {formatDate(event.endAt)}
            </p>
          </div>
          <p className="text-base text-gray-700">{event.description}</p>
          <div className="text-sm text-gray-600 space-y-1.5">
            <p>Location: {event.location || "TBD"}</p>
            <p>
              Mode:{" "}
              {event.eventMode === "in_person"
                ? "In person"
                : event.eventMode === "virtual"
                ? "Virtual"
                : "Hybrid"}
            </p>
            <p>
              Fee:{" "}
              {Number(event.feeAmount || 0) > 0
                ? formatMoney(event.feeAmount, event.currency)
                : "Free"}
            </p>
            {!isVirtualOnly && (
              <p>
                Seats left:{" "}
                {Number(event.totalSeats || 0) >= UNLIMITED_SEATS
                  ? "Unlimited"
                  : event.seatsRemaining}
              </p>
            )}
            {!isVirtualOnly && <p>Waitlist: {event.waitlistCount}</p>}
            <p>Audience: {event.isMemberExclusive ? "Members only" : "All logged-in users"}</p>
          </div>

          <div className="pt-2 flex items-center gap-3 overflow-x-auto whitespace-nowrap pb-1">
            <button
              type="button"
              onClick={() => downloadCalendarReminder(event)}
              className="px-4 py-2.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              Add reminder
            </button>

            {isVirtualJoinEnabled && (
              <>
                {!hasStarted ? (
                  <span className="px-4 py-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed">
                    Has not started
                  </span>
                ) : hasEnded ? (
                  <span className="px-4 py-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed">
                    Event ended
                  </span>
                ) : event.virtualMeetingUrl ? (
                  <a
                    href={event.virtualMeetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 text-sm rounded-lg bg-[#001049] text-white hover:bg-[#122371]"
                  >
                    Join
                  </a>
                ) : (
                  <span className="px-4 py-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed">
                    Link unavailable
                  </span>
                )}
              </>
            )}

            {!isVirtualOnly && !myReservation && (
              <button
                type="button"
                onClick={() => handleReserve(event.id)}
                disabled={isBusy}
                className="px-4 py-2.5 text-sm rounded-lg bg-[#001049] text-white hover:bg-[#122371] disabled:opacity-60"
              >
                Reserve spot
              </button>
            )}

            {!isVirtualOnly && myReservation && (
              <>
                {(myReservation.status === "reserved" || myReservation.status === "paid") && (
                  <button
                    type="button"
                    onClick={() => handleCancel(event.id)}
                    disabled={isBusy}
                    className="px-4 py-2.5 text-sm rounded-lg border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                )}
                {myReservation.status === "waitlisted" && (
                  <button
                    type="button"
                    onClick={() => handleCancel(event.id)}
                    disabled={isBusy}
                    className="px-4 py-2.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-60"
                  >
                    Leave waitlist
                  </button>
                )}
              </>
            )}

            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setManageEvent(event);
                  void loadAdminReservations(event.id);
                }}
                disabled={isVirtualOnly}
                className="px-4 py-2.5 text-sm rounded-lg border border-indigo-200 text-indigo-700 hover:bg-indigo-50 disabled:opacity-60"
              >
                Manage reservations
              </button>
            )}
            {isAdmin && (
              <button
                type="button"
                onClick={() => openEditModal(event)}
                className="px-4 py-2.5 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                Edit
              </button>
            )}
            {isAdmin && (
              <button
                type="button"
                onClick={() => handleDeleteEvent(event.id)}
                disabled={isBusy}
                className="px-4 py-2.5 text-sm rounded-lg border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-60"
              >
                Delete
              </button>
            )}
          </div>

          {!isVirtualOnly && myReservation && (
            <div className="text-sm rounded-lg bg-gray-50 border border-gray-100 px-4 py-3 text-gray-700">
              <p>Status: {myReservation.status}</p>
              {myReservation.status === "waitlisted" && myReservation.waitlistPosition ? (
                <p>Waitlist position: #{myReservation.waitlistPosition}</p>
              ) : null}
              {myReservation.status === "reserved" && myReservation.paymentDueAt ? (
                <p>Payment due: {formatDate(myReservation.paymentDueAt)}</p>
              ) : null}
              {(myReservation.status === "reserved" || myReservation.status === "paid") && (
                <p className="mt-1 text-xs text-gray-500">
                  Payment is handled by phone transfer; admin confirms manually.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="py-10 px-4 md:px-8 max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#001049] mb-1">Events</h1>
          <p className="text-gray-500 text-base">Upcoming and past AMSA events.</p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl bg-[#001049] text-white text-sm hover:bg-[#122371]"
          >
            Add Event
          </button>
        )}
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-100 bg-red-50 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {isLoadingEvents ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm p-5 space-y-3 animate-pulse">
              <div className="h-40 bg-gray-100 rounded-xl" />
              <div className="h-4 bg-gray-100 rounded w-2/3" />
              <div className="h-3 bg-gray-100 rounded w-full" />
              <div className="h-3 bg-gray-100 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <section className="mb-10">
            <h2 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-3">Upcoming</h2>
            {upcomingEvents.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-2xl p-6 text-sm text-gray-500">
                No upcoming events right now.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {upcomingEvents.map(renderEventCard)}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-3">Past</h2>
            {pastEvents.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-2xl p-6 text-sm text-gray-500">
                No past events yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {pastEvents.map(renderEventCard)}
              </div>
            )}
          </section>
        </>
      )}

      {showCreateModal && isAdmin && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#001049]">
                  {modalMode === "edit" ? "Edit Event" : "Create Event"}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setModalMode("create");
                    setEditingEventId(null);
                    setExistingImageUrls([]);
                    for (const image of selectedImages) {
                      URL.revokeObjectURL(image.previewUrl);
                    }
                    setSelectedImages([]);
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Close
                </button>
              </div>

              {createError && (
                <div className="rounded-lg border border-red-100 bg-red-50 text-red-700 px-3 py-2 text-sm">
                  {createError}
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files?.length) addFiles(e.target.files);
                  e.target.value = "";
                }}
                className="hidden"
                id="event-image-upload-input"
              />
              <input
                required
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Event title"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
              <textarea
                required
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Description"
                rows={4}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
              <input
                value={form.location}
                onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                placeholder="Location"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="text-sm text-gray-700">
                  Start
                  <input
                    type="datetime-local"
                    required
                    value={form.startAt}
                    onChange={(e) => setForm((prev) => ({ ...prev, startAt: e.target.value }))}
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-sm text-gray-700">
                  End
                  <input
                    type="datetime-local"
                    required
                    value={form.endAt}
                    onChange={(e) => setForm((prev) => ({ ...prev, endAt: e.target.value }))}
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="text-sm text-gray-700">
                  <div className="flex items-center gap-2 mb-1 min-h-6">
                    <input
                      type="checkbox"
                      checked={form.hasFee}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          hasFee: e.target.checked,
                          feeAmount: e.target.checked ? prev.feeAmount || "0" : "",
                        }))
                      }
                    />
                    <span>This event has a fee</span>
                  </div>
                  Fee
                  <input
                    type="number"
                    min={0}
                    disabled={!form.hasFee}
                    value={form.feeAmount}
                    onChange={(e) => setForm((prev) => ({ ...prev, feeAmount: e.target.value }))}
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-sm text-gray-700">
                  <div className="mb-1 min-h-6" aria-hidden="true" />
                  Currency
                  <select
                    value={form.currency}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, currency: e.target.value }))
                    }
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="MNT">MNT</option>
                    <option value="USD">USD</option>
                  </select>
                </label>
                <label className="text-sm text-gray-700">
                  <div className="flex items-center gap-2 mb-1 min-h-6">
                    <input
                      type="checkbox"
                      checked={form.hasSeatLimit}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          hasSeatLimit: e.target.checked,
                          totalSeats: e.target.checked ? prev.totalSeats || "30" : "",
                        }))
                      }
                    />
                    <span>Seat limit</span>
                  </div>
                  Seats
                  <input
                    type="number"
                    min={1}
                    disabled={!form.hasSeatLimit}
                    value={form.totalSeats}
                    onChange={(e) => setForm((prev) => ({ ...prev, totalSeats: e.target.value }))}
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  />
                </label>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.isMemberExclusive}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, isMemberExclusive: e.target.checked }))
                  }
                />
                Member exclusive
              </label>

              <label className="text-sm text-gray-700 block">
                Event mode
                <select
                  value={form.eventMode}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      eventMode: e.target.value as "virtual" | "in_person" | "hybrid",
                    }))
                  }
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="in_person">In person</option>
                  <option value="virtual">Virtual</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </label>

              {((form.eventMode ?? "in_person") === "virtual" ||
                (form.eventMode ?? "in_person") === "hybrid") && (
                <div className="space-y-2">
                  <label className="text-sm text-gray-700 block">
                    Meeting link URL
                    <input
                      type="url"
                      value={form.virtualMeetingUrl ?? ""}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, virtualMeetingUrl: e.target.value }))
                      }
                      placeholder="https://meet.google.com/..."
                      className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={Boolean(form.virtualLinkSoon)}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, virtualLinkSoon: e.target.checked }))
                      }
                    />
                    Link coming soon
                  </label>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-700">Event image (1 max)</p>
                {existingImageUrls.length > 0 && (
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {existingImageUrls.map((url, index) => (
                      <div
                        key={`${url}-${index}`}
                        className="relative rounded-lg border border-gray-200 overflow-hidden"
                      >
                        <img
                          src={url}
                          alt={`Existing event image ${index + 1}`}
                          className="w-full h-24 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImageAt(index)}
                          className="absolute top-1 right-1 text-xs px-2 py-1 rounded bg-white/90 text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <label
                  htmlFor="event-image-upload-input"
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragActive(true);
                  }}
                  onDragLeave={() => setIsDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragActive(false);
                    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
                  }}
                  className={`mt-1 flex items-center justify-center border-2 border-dashed rounded-lg px-4 py-6 text-sm cursor-pointer transition ${
                    isDragActive
                      ? "border-[#001049] bg-[#001049]/5 text-[#001049]"
                      : "border-gray-200 text-gray-500 hover:border-[#001049]/40"
                  }`}
                >
                  Drag and drop images here, or click to browse
                </label>
                {selectedImages.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {selectedImages.map((item, index) => (
                      <div
                        key={`${item.file.name}-${index}`}
                        className="relative rounded-lg border border-gray-200 overflow-hidden"
                      >
                        <img
                          src={item.previewUrl}
                          alt={item.file.name}
                          className="w-full h-24 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImageAt(index)}
                          className="absolute top-1 right-1 text-xs px-2 py-1 rounded bg-white/90 text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionEventId === -1}
                  className="px-4 py-2 rounded-lg bg-[#001049] text-white text-sm hover:bg-[#122371] disabled:opacity-60"
                >
                  {actionEventId === -1
                    ? modalMode === "edit"
                      ? "Saving..."
                      : "Creating..."
                    : modalMode === "edit"
                    ? "Save changes"
                    : "Create event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {manageEvent && isAdmin && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#001049]">Reservations</h3>
                <p className="text-xs text-gray-500">{manageEvent.title}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setManageEvent(null);
                  setAdminReservations([]);
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>

            <div className="p-6">
              {isLoadingAdminReservations ? (
                <p className="text-sm text-gray-500">Loading reservations...</p>
              ) : adminReservations.length === 0 ? (
                <p className="text-sm text-gray-500">No reservations yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b border-gray-100">
                        <th className="py-2 pr-3">Name</th>
                        <th className="py-2 pr-3">Email</th>
                        <th className="py-2 pr-3">Phone</th>
                        <th className="py-2 pr-3">Status</th>
                        <th className="py-2 pr-3">Waitlist</th>
                        <th className="py-2 pr-3">Due</th>
                        <th className="py-2 pr-3">Check-in</th>
                        <th className="py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminReservations.map((reservation) => {
                        const isRowBusy = actionEventId === manageEvent.id;
                        return (
                          <tr key={reservation.id} className="border-b border-gray-50">
                            <td className="py-2 pr-3 font-medium text-gray-800">
                              {reservation.Users
                                ? `${reservation.Users.firstName} ${reservation.Users.lastName}`
                                : `User #${reservation.userId}`}
                            </td>
                            <td className="py-2 pr-3 text-gray-600">
                              {reservation.Users?.email || "-"}
                            </td>
                            <td className="py-2 pr-3 text-gray-600">
                              {reservation.Users?.phoneNumber || "-"}
                            </td>
                            <td className="py-2 pr-3 text-gray-700">
                              {reservation.status} / {reservation.paymentStatus}
                            </td>
                            <td className="py-2 pr-3 text-gray-700">
                              {reservation.waitlistPosition ? `#${reservation.waitlistPosition}` : "-"}
                            </td>
                            <td className="py-2 pr-3 text-gray-700">
                              {reservation.paymentDueAt ? formatDate(reservation.paymentDueAt) : "-"}
                            </td>
                            <td className="py-2 pr-3 text-gray-700">
                              {reservation.checkedIn ? "Checked in" : "Not checked in"}
                            </td>
                            <td className="py-2">
                              <div className="flex gap-2">
                                {reservation.paymentStatus !== "paid" && reservation.status !== "waitlisted" && (
                                  <button
                                    type="button"
                                    disabled={isRowBusy}
                                    onClick={() =>
                                      handleAdminMarkPaid(manageEvent.id, reservation.userId)
                                    }
                                    className="px-2.5 py-1.5 rounded-md text-xs bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                                  >
                                    Mark paid
                                  </button>
                                )}
                                {!reservation.checkedIn &&
                                  (reservation.status === "reserved" || reservation.status === "paid") && (
                                    <button
                                      type="button"
                                      disabled={isRowBusy}
                                      onClick={() =>
                                        handleAdminCheckIn(manageEvent.id, reservation.userId)
                                      }
                                      className="px-2.5 py-1.5 rounded-md text-xs border border-indigo-200 text-indigo-700 hover:bg-indigo-50 disabled:opacity-60"
                                    >
                                      Check in
                                    </button>
                                  )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
