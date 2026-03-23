import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { assertRole, ROLES, verifyToken } from "@/lib/auth";
import { paymentDueAtFrom } from "@/lib/events/logic";

const UNLIMITED_SEATS = 1000000;

type CreateEventBody = {
  title?: string;
  description?: string;
  location?: string | null;
  eventMode?: "virtual" | "in_person" | "hybrid";
  virtualMeetingUrl?: string | null;
  virtualLinkSoon?: boolean;
  startAt?: string;
  endAt?: string;
  feeAmount?: number;
  currency?: string;
  totalSeats?: number;
  isMemberExclusive?: boolean;
  images?: string[];
};

function normalizeEventPayload(body: CreateEventBody) {
  const title = body.title?.trim();
  const description = body.description?.trim();
  const location = body.location?.trim() || null;
  const startAt = body.startAt ? new Date(body.startAt) : null;
  const endAt = body.endAt ? new Date(body.endAt) : null;
  const feeAmount = Number(body.feeAmount ?? 0);
  const parsedTotalSeats =
    body.totalSeats === undefined || body.totalSeats === null || body.totalSeats === ("" as any)
      ? UNLIMITED_SEATS
      : Number(body.totalSeats);
  const totalSeats = Number.isFinite(parsedTotalSeats)
    ? Math.floor(parsedTotalSeats)
    : UNLIMITED_SEATS;
  const currency = (body.currency || "MNT").toUpperCase();
  const eventMode = body.eventMode || "in_person";
  const virtualMeetingUrl = body.virtualMeetingUrl?.trim() || null;
  const virtualLinkSoon = Boolean(body.virtualLinkSoon);
  const images = (body.images || []).map((v) => v.trim()).filter(Boolean);

  if (!title || !description || !startAt || !endAt || Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    return { ok: false as const, message: "Title, description, startAt and endAt are required" };
  }
  if (endAt <= startAt) {
    return { ok: false as const, message: "endAt must be after startAt" };
  }
  if (!Number.isFinite(feeAmount) || feeAmount < 0) {
    return { ok: false as const, message: "feeAmount must be a non-negative number" };
  }
  if (!["MNT", "USD"].includes(currency)) {
    return { ok: false as const, message: "currency must be either MNT or USD" };
  }
  if (!Number.isInteger(totalSeats) || totalSeats <= 0) {
    return { ok: false as const, message: "totalSeats must be a positive integer when provided" };
  }
  if (images.length > 1) {
    return { ok: false as const, message: "An event can have only one image" };
  }
  if (!["virtual", "in_person", "hybrid"].includes(eventMode)) {
    return { ok: false as const, message: "eventMode must be virtual, in_person, or hybrid" };
  }
  if (eventMode === "virtual" && !virtualMeetingUrl && !virtualLinkSoon) {
    return {
      ok: false as const,
      message: "For virtual events, provide meeting link or mark link as coming soon",
    };
  }

  return {
    ok: true as const,
    value: {
      title,
      description,
      location,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      feeAmount,
      currency,
      totalSeats,
      isMemberExclusive: Boolean(body.isMemberExclusive),
      eventMode,
      virtualMeetingUrl,
      virtualLinkSoon,
      images,
    },
  };
}

export async function GET(request: Request) {
  let payload;
  try {
    payload = verifyToken(request);
  } catch (res) {
    return res as NextResponse;
  }

  try {
    const { data: events, error } = await supabase
      .from("Events")
      .select("*, EventImages(id, imageUrl, sortOrder), Users!Events_createdBy_fkey(id, firstName, lastName)")
      .order("startAt", { ascending: true });

    if (error) throw error;
    const eventIds = (events || []).map((event) => event.id);

    if (eventIds.length === 0) {
      return NextResponse.json({ events: [] });
    }

    const { data: reservations, error: reservationsError } = await supabase
      .from("EventReservations")
      .select("eventId, status, userId, waitlistPosition, paymentDueAt, paymentStatus")
      .in("eventId", eventIds)
      .in("status", ["reserved", "paid", "waitlisted"]);

    if (reservationsError) throw reservationsError;

    const seatCountByEvent = new Map<number, number>();
    const waitlistCountByEvent = new Map<number, number>();
    const myReservationByEvent = new Map<number, any>();

    for (const row of reservations || []) {
      if (row.status === "reserved" || row.status === "paid") {
        seatCountByEvent.set(row.eventId, (seatCountByEvent.get(row.eventId) || 0) + 1);
      }
      if (row.status === "waitlisted") {
        waitlistCountByEvent.set(row.eventId, (waitlistCountByEvent.get(row.eventId) || 0) + 1);
      }
      if (row.userId === payload.id) {
        myReservationByEvent.set(row.eventId, {
          status: row.status,
          waitlistPosition: row.waitlistPosition,
          paymentDueAt: row.paymentDueAt,
          paymentStatus: row.paymentStatus,
          hasPaymentWindow: row.status === "reserved" && row.paymentStatus !== "paid" && Boolean(row.paymentDueAt),
          paymentWindowHours: 24,
          defaultDueAt: row.paymentDueAt || paymentDueAtFrom(),
        });
      }
    }

    const hydrated = (events || []).map((event) => {
      const reservedCount = seatCountByEvent.get(event.id) || 0;
      const waitlistCount = waitlistCountByEvent.get(event.id) || 0;
      return {
        ...event,
        EventImages: (event.EventImages || []).sort(
          (a: any, b: any) => a.sortOrder - b.sortOrder
        ),
        seatsRemaining: Math.max(0, event.totalSeats - reservedCount),
        waitlistCount,
        myReservation: myReservationByEvent.get(event.id) || null,
      };
    });

    return NextResponse.json({ events: hydrated });
  } catch (e: any) {
    console.error("GET /api/events failed:", e.message);
    return NextResponse.json(
      { message: "Failed to load events", error: e.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let payload;
  try {
    payload = verifyToken(request);
    assertRole(payload, ROLES.ADMIN);
  } catch (res) {
    return res as NextResponse;
  }

  try {
    const body = (await request.json()) as CreateEventBody;
    const parsed = normalizeEventPayload(body);
    if (!parsed.ok) {
      return NextResponse.json({ message: parsed.message }, { status: 400 });
    }

    const eventPayload = parsed.value;

    const baseInsert = {
      title: eventPayload.title,
      description: eventPayload.description,
      location: eventPayload.location,
      startAt: eventPayload.startAt,
      endAt: eventPayload.endAt,
      feeAmount: eventPayload.feeAmount,
      currency: eventPayload.currency,
      totalSeats: eventPayload.totalSeats,
      isMemberExclusive: eventPayload.isMemberExclusive,
      createdBy: payload.id,
    };

    const { data: event, error } = await supabase
      .from("Events")
      .insert({
        ...baseInsert,
        eventMode: eventPayload.eventMode,
        virtualMeetingUrl: eventPayload.virtualMeetingUrl,
        virtualLinkSoon: eventPayload.virtualLinkSoon,
      })
      .select("*")
      .single();

    let createdEvent = event;
    if (error && String(error.message || "").includes("virtualLinkSoon")) {
      const retry = await supabase.from("Events").insert(baseInsert).select("*").single();
      if (retry.error || !retry.data) {
        throw retry.error || new Error("Failed to create event");
      }
      createdEvent = retry.data;
    } else if (error || !event) {
      throw error || new Error("Failed to create event");
    }

    if (eventPayload.images.length > 0) {
      const imageRows = eventPayload.images.map((imageUrl, index) => ({
        eventId: createdEvent.id,
        imageUrl,
        sortOrder: index,
      }));

      const { error: imagesError } = await supabase.from("EventImages").insert(imageRows);
      if (imagesError) throw imagesError;
    }

    const { data: hydrated, error: hydratedError } = await supabase
      .from("Events")
      .select("*, EventImages(id, imageUrl, sortOrder)")
      .eq("id", createdEvent.id)
      .single();

    if (hydratedError) throw hydratedError;
    return NextResponse.json({ event: hydrated }, { status: 201 });
  } catch (e: any) {
    console.error("POST /api/events failed:", e.message);
    return NextResponse.json(
      { message: "Failed to create event", error: e.message },
      { status: 500 }
    );
  }
}
