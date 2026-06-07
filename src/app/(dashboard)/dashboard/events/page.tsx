"use client";

import { useMemo, useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import EventComposer, { type DashboardEvent } from "@/components/events/EventComposer";

const UNLIMITED_SEATS = 1000000;

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

type MyReservation = {
  status: "reserved" | "waitlisted" | "paid" | "cancelled" | "expired";
  waitlistPosition: number | null;
  paymentDueAt: string | null;
  paymentStatus: string;
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

function formatDate(date: string) {
  return new Date(date).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

function formatMoney(amount: number, currency: string) {
  return `${amount.toLocaleString()} ${currency}`;
}

function formatInTZ(isoStr: string, tz: string): string {
  const tzLabel = TIMEZONES.find((t) => t.value === tz)?.label ?? tz;
  const time = new Date(isoStr).toLocaleString("en-US", {
    timeZone: tz, month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
  return `${time} (${tzLabel})`;
}

function toIcsDateString(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function generateIcsContent(event: DashboardEvent): string {
  const uid = `${event.id}@amsa.mn`;
  const dtStart = toIcsDateString(new Date(event.startAt!));
  const dtEnd = toIcsDateString(new Date(event.endAt!));
  const now = toIcsDateString(new Date());
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//AMSA//Events//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`, `DTSTAMP:${now}`, `DTSTART:${dtStart}`, `DTEND:${dtEnd}`,
    `SUMMARY:${event.title.replace(/\n/g, " ")}`,
    `DESCRIPTION:${(event.description || "").replace(/\n/g, " ")}`,
    `LOCATION:${(event.location || "TBD").replace(/\n/g, " ")}`,
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
}

export default function EventsPage() {
  const { user, loading, authFetch } = useAuth();
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionEventId, setActionEventId] = useState<number | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<DashboardEvent | null>(null);
  const [manageEvent, setManageEvent] = useState<DashboardEvent | null>(null);
  const [adminReservations, setAdminReservations] = useState<AdminReservation[]>([]);
  const [isLoadingAdminReservations, setIsLoadingAdminReservations] = useState(false);

  const isAdmin = user?.role === "admin";

  const upcomingEvents = useMemo(() => {
    const now = Date.now();
    return events.filter((e) => !e.endAt || new Date(e.endAt).getTime() >= now);
  }, [events]);

  const pastEvents = useMemo(() => {
    const now = Date.now();
    return events.filter((e) => e.endAt && new Date(e.endAt).getTime() < now);
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
    if (!loading && user) void loadEvents();
    if (!loading && !user) setIsLoadingEvents(false);
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
      await authFetch(`/api/events/${eventId}/cancel`, { method: "POST", body: JSON.stringify({}) });
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
      await authFetch(`/api/events/${eventId}/mark-paid`, { method: "POST", body: JSON.stringify({ userId }) });
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
      await authFetch(`/api/events/${eventId}/check-in`, { method: "POST", body: JSON.stringify({ userId }) });
      await loadAdminReservations(eventId);
      await loadEvents();
    } catch (e: any) {
      setError(e?.message || "Failed to check in member");
    } finally {
      setActionEventId(null);
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (!window.confirm("Delete this event? This cannot be undone.")) return;
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

  const renderEventCard = (event: DashboardEvent) => {
    const myReservation = event.myReservation as MyReservation | null;
    const isBusy = actionEventId === event.id;
    const currentImage = event.EventImages?.[0]?.imageUrl ?? null;
    const isVirtualOnly = event.eventMode === "virtual";
    const isVirtualJoinEnabled = event.eventMode === "virtual" || event.eventMode === "hybrid";
    const isInPersonLink = event.eventMode === "in_person" && Boolean(event.virtualMeetingUrl);
    const now = Date.now();
    const startAtMs = event.startAt ? new Date(event.startAt).getTime() : null;
    const endAtMs = event.endAt ? new Date(event.endAt).getTime() : null;
    const hasStarted = startAtMs !== null ? now >= startAtMs : true;
    const hasEnded = endAtMs !== null ? now > endAtMs : false;
    const tz = event.timezone || "Asia/Ulaanbaatar";

    return (
      <div
        key={event.id}
        className="bg-white rounded-xl shadow-md border-2 border-gray-200 flex flex-col md:flex-row"
      >
        {currentImage && (
          <div className="p-4 md:w-2/5 flex items-center justify-center shrink-0">
            <img src={currentImage} alt={event.title} className="w-full h-auto object-contain rounded-xl" />
          </div>
        )}
        {currentImage && <div className="hidden md:block w-px bg-gray-100 my-4 shrink-0" />}
        <div className="p-6 space-y-4 flex-1">
          <div>
            <h2 className="text-2xl font-semibold text-[#001049]">{event.title}</h2>
            {event.startAt && (
              <p className="text-sm text-gray-500 mt-1">
                {formatInTZ(event.startAt, tz)}
                {event.endAt && (
                  <> – {new Date(event.endAt).toLocaleString("en-US", {
                    timeZone: tz, hour: "numeric", minute: "2-digit", hour12: true,
                  })}</>
                )}
              </p>
            )}
          </div>
          {event.description && (
            <p className="text-base text-gray-700 whitespace-pre-wrap">{event.description}</p>
          )}
          <div className="text-sm text-gray-600 space-y-1.5">
            {event.location && <p>Location: {event.location}</p>}
            <p>
              Mode:{" "}
              {event.eventMode === "in_person" ? "In person" : event.eventMode === "virtual" ? "Virtual" : "Hybrid"}
            </p>
            {Number(event.feeAmount || 0) > 0 && (
              <p>Fee: {formatMoney(event.feeAmount, event.currency)}</p>
            )}
            {!isVirtualOnly && !isInPersonLink && Number(event.totalSeats || 0) < UNLIMITED_SEATS && (
              <p>Seats left: {event.seatsRemaining}</p>
            )}
            {!isVirtualOnly && !isInPersonLink && event.waitlistCount > 0 && (
              <p>Waitlist: {event.waitlistCount}</p>
            )}
            {event.isMemberExclusive && <p>Members only</p>}
          </div>

          <div className="pt-2 flex items-center gap-3 overflow-x-auto whitespace-nowrap pb-1">
            {event.startAt && event.endAt && (
              <button type="button" onClick={() => downloadCalendarReminder(event)}
                className="px-4 py-2.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50">
                Add reminder
              </button>
            )}

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
                  <a href={event.virtualMeetingUrl} target="_blank" rel="noreferrer"
                    className="px-4 py-2.5 text-sm rounded-lg bg-[#001049] text-white hover:bg-[#122371]">
                    Join
                  </a>
                ) : (
                  <span className="px-4 py-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed">
                    Link unavailable
                  </span>
                )}
              </>
            )}

            {isInPersonLink && (
              <a href={event.virtualMeetingUrl!} target="_blank" rel="noreferrer"
                className="px-4 py-2.5 text-sm rounded-lg bg-[#001049] text-white hover:bg-[#122371]">
                Register
              </a>
            )}

            {!isVirtualOnly && !isInPersonLink && !myReservation && (
              <button type="button" onClick={() => handleReserve(event.id)} disabled={isBusy}
                className="px-4 py-2.5 text-sm rounded-lg bg-[#001049] text-white hover:bg-[#122371] disabled:opacity-60">
                Reserve spot
              </button>
            )}

            {!isVirtualOnly && !isInPersonLink && myReservation && (
              <>
                {(myReservation.status === "reserved" || myReservation.status === "paid") && (
                  <button type="button" onClick={() => handleCancel(event.id)} disabled={isBusy}
                    className="px-4 py-2.5 text-sm rounded-lg border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-60">
                    Cancel
                  </button>
                )}
                {myReservation.status === "waitlisted" && (
                  <button type="button" onClick={() => handleCancel(event.id)} disabled={isBusy}
                    className="px-4 py-2.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-60">
                    Leave waitlist
                  </button>
                )}
              </>
            )}

            {isAdmin && !isInPersonLink && (
              <button type="button" disabled={isVirtualOnly}
                onClick={() => { setManageEvent(event); void loadAdminReservations(event.id); }}
                className="px-4 py-2.5 text-sm rounded-lg border border-indigo-200 text-indigo-700 hover:bg-indigo-50 disabled:opacity-60">
                Manage reservations
              </button>
            )}
            {isAdmin && (
              <button type="button" onClick={() => { setEditingEvent(event); setComposerOpen(true); }}
                className="px-4 py-2.5 text-sm rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50">
                Edit
              </button>
            )}
            {isAdmin && (
              <button type="button" onClick={() => handleDeleteEvent(event.id)} disabled={isBusy}
                className="px-4 py-2.5 text-sm rounded-lg border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-60">
                Delete
              </button>
            )}
          </div>

          {!isVirtualOnly && !isInPersonLink && myReservation && (
            <div className="text-sm rounded-lg bg-gray-50 border border-gray-100 px-4 py-3 text-gray-700">
              <p>Status: {myReservation.status}</p>
              {myReservation.status === "waitlisted" && myReservation.waitlistPosition && (
                <p>Waitlist position: #{myReservation.waitlistPosition}</p>
              )}
              {myReservation.status === "reserved" && myReservation.paymentDueAt && (
                <p>Payment due: {formatDate(myReservation.paymentDueAt)}</p>
              )}
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
        {isAdmin && (
          <button type="button"
            onClick={() => { setEditingEvent(null); setComposerOpen(true); }}
            className="px-4 py-2 rounded-xl bg-[#001049] text-white text-sm hover:bg-[#122371]">
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
        <div className="grid grid-cols-1 gap-5">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-white border-2 border-gray-200 rounded-xl shadow-sm p-5 space-y-3 animate-pulse">
              <div className="h-40 bg-gray-200 rounded-xl" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
              <div className="h-3 bg-gray-200 rounded w-full" />
              <div className="h-3 bg-gray-200 rounded w-3/4" />
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
              <div className="grid grid-cols-1 gap-6">{upcomingEvents.map(renderEventCard)}</div>
            )}
          </section>

          <section>
            <h2 className="text-sm font-semibold tracking-wide uppercase text-gray-500 mb-3">Past</h2>
            {pastEvents.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-2xl p-6 text-sm text-gray-500">
                No past events yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">{pastEvents.map(renderEventCard)}</div>
            )}
          </section>
        </>
      )}

      {/* Event composer modal */}
      {composerOpen && isAdmin && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="w-full max-w-xl">
            <EventComposer
              editEvent={editingEvent ?? undefined}
              onCreated={async () => { setComposerOpen(false); setEditingEvent(null); await loadEvents(); }}
              onClose={() => { setComposerOpen(false); setEditingEvent(null); }}
            />
          </div>
        </div>
      )}

      {/* Manage reservations modal */}
      {manageEvent && isAdmin && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#001049]">Reservations</h3>
                <p className="text-xs text-gray-500">{manageEvent.title}</p>
              </div>
              <button type="button" onClick={() => { setManageEvent(null); setAdminReservations([]); }}
                className="text-sm text-gray-500 hover:text-gray-700">
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
                            <td className="py-2 pr-3 text-gray-600">{reservation.Users?.email || "-"}</td>
                            <td className="py-2 pr-3 text-gray-600">{reservation.Users?.phoneNumber || "-"}</td>
                            <td className="py-2 pr-3 text-gray-700">{reservation.status} / {reservation.paymentStatus}</td>
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
                                  <button type="button" disabled={isRowBusy}
                                    onClick={() => handleAdminMarkPaid(manageEvent.id, reservation.userId)}
                                    className="px-2.5 py-1.5 rounded-md text-xs bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60">
                                    Mark paid
                                  </button>
                                )}
                                {!reservation.checkedIn && (reservation.status === "reserved" || reservation.status === "paid") && (
                                  <button type="button" disabled={isRowBusy}
                                    onClick={() => handleAdminCheckIn(manageEvent.id, reservation.userId)}
                                    className="px-2.5 py-1.5 rounded-md text-xs border border-indigo-200 text-indigo-700 hover:bg-indigo-50 disabled:opacity-60">
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
