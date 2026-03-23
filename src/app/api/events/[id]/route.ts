import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { assertRole, ROLES, verifyToken } from "@/lib/auth";

function parseEventId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let payload;
  try {
    payload = verifyToken(request);
  } catch (res) {
    return res as NextResponse;
  }

  const { id } = await params;
  const eventId = parseEventId(id);
  if (!eventId) {
    return NextResponse.json({ message: "Invalid event id" }, { status: 400 });
  }

  try {
    const { data: event, error } = await supabase
      .from("Events")
      .select("*, EventImages(id, imageUrl, sortOrder)")
      .eq("id", eventId)
      .single();

    if (error || !event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    const { data: reservations, error: reservationsError } = await supabase
      .from("EventReservations")
      .select("eventId, status, userId, waitlistPosition, paymentDueAt, paymentStatus")
      .eq("eventId", eventId)
      .in("status", ["reserved", "paid", "waitlisted"]);

    if (reservationsError) throw reservationsError;

    let reservedCount = 0;
    let waitlistCount = 0;
    let myReservation: any = null;

    for (const row of reservations || []) {
      if (row.status === "reserved" || row.status === "paid") reservedCount += 1;
      if (row.status === "waitlisted") waitlistCount += 1;
      if (row.userId === payload.id) {
        myReservation = {
          status: row.status,
          waitlistPosition: row.waitlistPosition,
          paymentDueAt: row.paymentDueAt,
          paymentStatus: row.paymentStatus,
        };
      }
    }

    return NextResponse.json({
      event: {
        ...event,
        EventImages: (event.EventImages || []).sort(
          (a: any, b: any) => a.sortOrder - b.sortOrder
        ),
        seatsRemaining: Math.max(0, event.totalSeats - reservedCount),
        waitlistCount,
        myReservation,
      },
    });
  } catch (e: any) {
    console.error("GET /api/events/[id] failed:", e.message);
    return NextResponse.json(
      { message: "Failed to load event", error: e.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let payload;
  try {
    payload = verifyToken(request);
    assertRole(payload, ROLES.ADMIN);
  } catch (res) {
    return res as NextResponse;
  }

  const { id } = await params;
  const eventId = parseEventId(id);
  if (!eventId) {
    return NextResponse.json({ message: "Invalid event id" }, { status: 400 });
  }

  try {
    const body = await request.json();
    let existingEvent: {
      eventMode: string;
      virtualMeetingUrl: string | null;
      virtualLinkSoon: boolean;
    } | null = null;

    const { data: existingWithVirtual, error: existingWithVirtualError } = await supabase
      .from("Events")
      .select("eventMode, virtualMeetingUrl, virtualLinkSoon")
      .eq("id", eventId)
      .single();

    if (!existingWithVirtualError && existingWithVirtual) {
      existingEvent = existingWithVirtual;
    } else {
      const { data: existingFallback, error: existingFallbackError } = await supabase
        .from("Events")
        .select("eventMode")
        .eq("id", eventId)
        .single();

      if (existingFallbackError || !existingFallback) {
        return NextResponse.json({ message: "Event not found" }, { status: 404 });
      }

      existingEvent = {
        eventMode: existingFallback.eventMode || "in_person",
        virtualMeetingUrl: null,
        virtualLinkSoon: false,
      };
    }

    const images = Array.isArray(body.images)
      ? body.images.map((v: string) => v.trim()).filter(Boolean)
      : null;

    if (images && images.length > 1) {
      return NextResponse.json(
        { message: "An event can have only one image" },
        { status: 400 }
      );
    }

    const patch: Record<string, unknown> = {};
    const editableFields = [
      "title",
      "description",
      "location",
      "eventMode",
      "virtualMeetingUrl",
      "virtualLinkSoon",
      "startAt",
      "endAt",
      "feeAmount",
      "currency",
      "totalSeats",
      "isMemberExclusive",
    ];
    for (const key of editableFields) {
      if (key in body) patch[key] = body[key];
    }
    if (
      patch.eventMode &&
      !["virtual", "in_person", "hybrid"].includes(String(patch.eventMode))
    ) {
      return NextResponse.json(
        { message: "eventMode must be virtual, in_person, or hybrid" },
        { status: 400 }
      );
    }
    if (
      patch.currency &&
      !["MNT", "USD"].includes(String(patch.currency).toUpperCase())
    ) {
      return NextResponse.json(
        { message: "currency must be either MNT or USD" },
        { status: 400 }
      );
    }
    if (patch.virtualMeetingUrl !== undefined) {
      patch.virtualMeetingUrl =
        String(patch.virtualMeetingUrl || "").trim() || null;
    }
    const finalEventMode = String(patch.eventMode ?? existingEvent.eventMode);
    const finalVirtualLink = (patch.virtualMeetingUrl ??
      existingEvent.virtualMeetingUrl) as string | null;
    const finalVirtualSoon = Boolean(
      patch.virtualLinkSoon ?? existingEvent.virtualLinkSoon
    );
    if (finalEventMode === "virtual" && !finalVirtualLink && !finalVirtualSoon) {
      return NextResponse.json(
        {
          message:
            "For virtual events, provide meeting link or mark link as coming soon",
        },
        { status: 400 }
      );
    }

    if (patch.startAt && patch.endAt) {
      const start = new Date(String(patch.startAt));
      const end = new Date(String(patch.endAt));
      if (end <= start) {
        return NextResponse.json(
          { message: "endAt must be after startAt" },
          { status: 400 }
        );
      }
    }

    const { data: event, error } = await supabase
      .from("Events")
      .update(patch)
      .eq("id", eventId)
      .select("*")
      .single();
    let updatedEvent = event;
    if (error && String(error.message || "").includes("virtualLinkSoon")) {
      const fallbackPatch = { ...patch } as Record<string, unknown>;
      delete fallbackPatch.virtualLinkSoon;
      delete fallbackPatch.virtualMeetingUrl;
      const retry = await supabase
        .from("Events")
        .update(fallbackPatch)
        .eq("id", eventId)
        .select("*")
        .single();
      if (retry.error || !retry.data) {
        return NextResponse.json({ message: "Event not found" }, { status: 404 });
      }
      updatedEvent = retry.data;
    } else if (error || !event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    if (images) {
      const { error: deleteError } = await supabase
        .from("EventImages")
        .delete()
        .eq("eventId", eventId);
      if (deleteError) throw deleteError;

      if (images.length > 0) {
        const rows = images.map((imageUrl: string, index: number) => ({
          eventId,
          imageUrl,
          sortOrder: index,
        }));
        const { error: insertError } = await supabase.from("EventImages").insert(rows);
        if (insertError) throw insertError;
      }
    }

    const { data: hydrated, error: hydratedError } = await supabase
      .from("Events")
      .select("*, EventImages(id, imageUrl, sortOrder)")
      .eq("id", updatedEvent.id)
      .single();

    if (hydratedError) throw hydratedError;
    return NextResponse.json({ event: hydrated });
  } catch (e: any) {
    console.error("PUT /api/events/[id] failed:", e.message);
    return NextResponse.json(
      { message: "Failed to update event", error: e.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let payload;
  try {
    payload = verifyToken(request);
    assertRole(payload, ROLES.ADMIN);
  } catch (res) {
    return res as NextResponse;
  }

  const { id } = await params;
  const eventId = parseEventId(id);
  if (!eventId) {
    return NextResponse.json({ message: "Invalid event id" }, { status: 400 });
  }

  try {
    const { error } = await supabase.from("Events").delete().eq("id", eventId);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("DELETE /api/events/[id] failed:", e.message);
    return NextResponse.json(
      { message: "Failed to delete event", error: e.message },
      { status: 500 }
    );
  }
}
