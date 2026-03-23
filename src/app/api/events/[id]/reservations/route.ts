import { NextResponse } from "next/server";
import { assertRole, ROLES, verifyToken } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

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
    const url = new URL(request.url);
    const includeHistory = url.searchParams.get("includeHistory") === "true";
    const activeStatuses = ["reserved", "paid", "waitlisted"];

    let query = supabase
      .from("EventReservations")
      .select(
        "id, userId, status, waitlistPosition, paymentStatus, paymentDueAt, checkedIn, checkedInAt, createdAt, Users!EventReservations_userId_fkey(id, firstName, lastName, email, phoneNumber)"
      )
      .eq("eventId", eventId);

    if (!includeHistory) {
      query = query.in("status", activeStatuses);
    }

    const { data, error } = await query.order("createdAt", { ascending: true });

    if (error) throw error;
    return NextResponse.json({ reservations: data || [] });
  } catch (e: any) {
    console.error("GET /api/events/[id]/reservations failed:", e.message);
    return NextResponse.json(
      { message: "Failed to load reservations", error: e.message },
      { status: 500 }
    );
  }
}
