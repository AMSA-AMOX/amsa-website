import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { hasSeatAvailable, paymentDueAtFrom } from "@/lib/events/logic";
import {
  getEventById,
  getNextWaitlistPosition,
  getReservedCount,
  getUserById,
  sendReservationConfirmationEmail,
  sendWaitlistEmail,
} from "@/lib/events/server";

function parseEventId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function POST(
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
    const [user, event] = await Promise.all([
      getUserById(payload.id),
      getEventById(eventId),
    ]);
    if (event.eventMode === "virtual") {
      return NextResponse.json(
        {
          message:
            "Virtual events do not require reservation. Use the meeting link instead.",
        },
        { status: 400 }
      );
    }

    const { data: existingActive, error: existingError } = await supabase
      .from("EventReservations")
      .select("id, status, waitlistPosition, paymentDueAt, paymentStatus")
      .eq("eventId", eventId)
      .eq("userId", payload.id)
      .in("status", ["reserved", "waitlisted", "paid"])
      .maybeSingle();

    if (existingError) throw existingError;

    if (existingActive) {
      return NextResponse.json(
        {
          reservation: existingActive,
          message: "You already have an active reservation status for this event",
        },
        { status: 200 }
      );
    }

    const reservedCount = await getReservedCount(eventId);
    if (hasSeatAvailable(event.totalSeats, reservedCount)) {
      const paymentDueAt = paymentDueAtFrom();
      const { data: reserved, error: reserveError } = await supabase
        .from("EventReservations")
        .insert({
          eventId,
          userId: payload.id,
          status: "reserved",
          waitlistPosition: null,
          paymentDueAt,
          paymentStatus: "unpaid",
        })
        .select("*")
        .single();

      if (reserveError) throw reserveError;

      await sendReservationConfirmationEmail({
        eventId,
        userId: payload.id,
        userEmail: user.email,
        eventTitle: event.title,
        paymentDueAt,
      });

      return NextResponse.json(
        {
          reservation: reserved,
          seatsRemaining: Math.max(0, event.totalSeats - (reservedCount + 1)),
        },
        { status: 201 }
      );
    }

    const waitlistPosition = await getNextWaitlistPosition(eventId);
    const { data: waitlisted, error: waitlistError } = await supabase
      .from("EventReservations")
      .insert({
        eventId,
        userId: payload.id,
        status: "waitlisted",
        waitlistPosition,
        paymentDueAt: null,
        paymentStatus: "unpaid",
      })
      .select("*")
      .single();

    if (waitlistError) throw waitlistError;

    await sendWaitlistEmail({
      eventId,
      userId: payload.id,
      userEmail: user.email,
      eventTitle: event.title,
      waitlistPosition,
    });

    return NextResponse.json(
      {
        reservation: waitlisted,
        waitlistPosition,
        message: "Event is full. You have been added to waitlist.",
      },
      { status: 201 }
    );
  } catch (e: any) {
    if (String(e?.message || "") === "Event not found") {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }
    console.error("POST /api/events/[id]/reserve failed:", e.message);
    return NextResponse.json(
      { message: "Failed to reserve spot", error: e.message },
      { status: 500 }
    );
  }
}
