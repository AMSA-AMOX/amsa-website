import { NextResponse } from "next/server";
import { assertRole, ROLES, verifyToken } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

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
    const body = await request.json().catch(() => ({}));
    const userId = Number(body.userId);
    if (!Number.isInteger(userId) || userId <= 0) {
      return NextResponse.json({ message: "Invalid userId" }, { status: 400 });
    }

    const { data: reservation, error } = await supabase
      .from("EventReservations")
      .select("id, status, paymentStatus")
      .eq("eventId", eventId)
      .eq("userId", userId)
      .in("status", ["reserved", "paid"])
      .maybeSingle();

    if (error) throw error;
    if (!reservation) {
      return NextResponse.json(
        { message: "No reservable record found for this user/event" },
        { status: 404 }
      );
    }

    if (reservation.paymentStatus === "paid" && reservation.status === "paid") {
      return NextResponse.json({ ok: true, alreadyPaid: true });
    }

    const { data: updated, error: updateError } = await supabase
      .from("EventReservations")
      .update({
        status: "paid",
        paymentStatus: "paid",
      })
      .eq("id", reservation.id)
      .select("*")
      .single();

    if (updateError) throw updateError;
    return NextResponse.json({ ok: true, reservation: updated });
  } catch (e: any) {
    console.error("POST /api/events/[id]/mark-paid failed:", e.message);
    return NextResponse.json(
      { message: "Failed to mark reservation paid", error: e.message },
      { status: 500 }
    );
  }
}
