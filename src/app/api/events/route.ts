import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { assertRole, ROLES, verifyToken } from "@/lib/auth";
import { paymentDueAtFrom } from "@/lib/events/logic";
import { rpc } from "@/lib/rpc";

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
  timezone?: string;
  feeAmount?: number;
  currency?: string;
  totalSeats?: number;
  isMemberExclusive?: boolean;
  images?: string[];
};

function normalizeEventPayload(body: CreateEventBody) {
  const title = body.title?.trim();
  const description = typeof body.description === "string" ? body.description.replace(/\s+$/, "") : (body.description ?? "");
  const location = body.location?.trim() || null;
  const startAtRaw = body.startAt ? new Date(body.startAt) : null;
  const endAtRaw = body.endAt ? new Date(body.endAt) : null;
  const feeAmount = Number(body.feeAmount ?? 0);
  const parsedTotalSeats =
    body.totalSeats === undefined || body.totalSeats === null || body.totalSeats === ("" as any)
      ? UNLIMITED_SEATS
      : Number(body.totalSeats);
  const totalSeats = Number.isFinite(parsedTotalSeats) ? Math.floor(parsedTotalSeats) : UNLIMITED_SEATS;
  const currency = (body.currency || "MNT").toUpperCase();
  const eventMode = body.eventMode || "in_person";
  const virtualMeetingUrl = body.virtualMeetingUrl?.trim() || null;
  const virtualLinkSoon = Boolean(body.virtualLinkSoon);
  const timezone = typeof body.timezone === "string" && body.timezone.trim().length > 0
    ? body.timezone.trim()
    : null;
  const images = (body.images || []).map((v) => v.trim()).filter(Boolean);

  if (!title) {
    return { ok: false as const, message: "Title is required" };
  }
  if (startAtRaw && Number.isNaN(startAtRaw.getTime())) {
    return { ok: false as const, message: "Invalid startAt date" };
  }
  if (endAtRaw && Number.isNaN(endAtRaw.getTime())) {
    return { ok: false as const, message: "Invalid endAt date" };
  }
  if (startAtRaw && endAtRaw && endAtRaw <= startAtRaw) {
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

  return {
    ok: true as const,
    value: {
      title,
      description,
      location,
      startAt: startAtRaw ? startAtRaw.toISOString() : null,
      endAt: endAtRaw ? endAtRaw.toISOString() : null,
      timezone,
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
    // One round trip: events + images + creator + seat/waitlist counts + the
    // caller's reservation, aggregated in SQL (get_events_with_counts).
    const events = await rpc<Array<Record<string, any>>>("get_events_with_counts", { p_user_id: payload.id });

    const hydrated = (events ?? []).map((event) => ({
      ...event,
      myReservation: event.myReservation
        ? { ...event.myReservation, defaultDueAt: event.myReservation.paymentDueAt || paymentDueAtFrom() }
        : null,
    }));

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
      timezone: eventPayload.timezone,
      feeAmount: eventPayload.feeAmount,
      currency: eventPayload.currency,
      totalSeats: eventPayload.totalSeats,
      isMemberExclusive: eventPayload.isMemberExclusive,
      eventMode: eventPayload.eventMode,
      createdBy: payload.id,
    };

    const { data: event, error } = await supabaseAdmin
      .from("Events")
      .insert({
        ...baseInsert,
        virtualMeetingUrl: eventPayload.virtualMeetingUrl,
        virtualLinkSoon: eventPayload.virtualLinkSoon,
      })
      .select("*")
      .single();

    let createdEvent = event;
    if (error && /virtualMeetingUrl|virtualLinkSoon/.test(error.message || "")) {
      const retry = await supabaseAdmin.from("Events").insert(baseInsert).select("*").single();
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

      const { error: imagesError } = await supabaseAdmin.from("EventImages").insert(imageRows);
      if (imagesError) throw imagesError;
    }

    const { data: hydrated, error: hydratedError } = await supabaseAdmin
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
