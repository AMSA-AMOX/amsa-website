import { NextResponse } from "next/server";
import { verifyToken, ROLES } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import {
  getEventById,
  getUserById,
  normalizeWaitlistPositions,
  promoteNextWaitlisted,
  sendWaitlistPromotedEmail,
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
    const body = await request.json().catch(() => ({}));
    const requestedUserId = Number(body.userId || payload.id);
    const isAdmin = payload.role === ROLES.ADMIN;
    const targetUserId = isAdmin ? requestedUserId : payload.id;

    const { data: reservation, error: reservationError } = await supabase
      .from("EventReservations")
      .select("id, status")
      .eq("eventId", eventId)
      .eq("userId", targetUserId)
      .in("status", ["reserved", "waitlisted", "paid"])
      .maybeSingle();

    if (reservationError) throw reservationError;
    if (!reservation) {
      return NextResponse.json(
        { message: "No active reservation found" },
        { status: 404 }
      );
    }

    const { error: cancelError } = await supabase
      .from("EventReservations")
      .update({
        status: "cancelled",
        waitlistPosition: null,
        paymentStatus: "cancelled",
      })
      .eq("id", reservation.id);

    if (cancelError) throw cancelError;

    let promotedUserId: number | null = null;
    if (reservation.status === "waitlisted") {
      await normalizeWaitlistPositions(eventId);
    } else if (reservation.status === "reserved" || reservation.status === "paid") {
      const promoted = await promoteNextWaitlisted(eventId);
      if (promoted) {
        promotedUserId = promoted.promotedUserId;
        const [event, promotedUser] = await Promise.all([
          getEventById(eventId),
          getUserById(promoted.promotedUserId),
        ]);

        await sendWaitlistPromotedEmail({
          eventId,
          userId: promoted.promotedUserId,
          userEmail: promotedUser.email,
          eventTitle: event.title,
          paymentDueAt: promoted.paymentDueAt,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      promotedUserId,
    });
  } catch (e: any) {
    console.error("POST /api/events/[id]/cancel failed:", e.message);
    return NextResponse.json(
      { message: "Failed to cancel reservation", error: e.message },
      { status: 500 }
    );
  }
}
