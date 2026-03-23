import "server-only";
import { supabase } from "@/lib/supabase";
import { paymentDueAtFrom } from "@/lib/events/logic";
import { buildEventEmailHtml, sendEventEmail } from "@/lib/email/resend";

type BasicEvent = {
  id: number;
  title: string;
  eventMode: "virtual" | "in_person" | "hybrid";
  virtualMeetingUrl: string | null;
  virtualLinkSoon: boolean;
  startAt: string;
  endAt: string;
  totalSeats: number;
  feeAmount: number;
  currency: string;
};

export async function getUserById(userId: number) {
  const { data: user, error } = await supabase
    .from("Users")
    .select("id, email, firstName, lastName, role")
    .eq("id", userId)
    .single();

  if (error || !user) {
    throw new Error("User not found");
  }
  return user;
}

export async function getEventById(eventId: number): Promise<BasicEvent> {
  const { data: event, error } = await supabase
    .from("Events")
    .select("id, title, eventMode, virtualMeetingUrl, virtualLinkSoon, startAt, endAt, totalSeats, feeAmount, currency")
    .eq("id", eventId)
    .single();

  if (!error && event) {
    return event;
  }

  // Backward-compatible fallback when new virtual columns are not migrated yet.
  const { data: fallbackEvent, error: fallbackError } = await supabase
    .from("Events")
    .select("id, title, startAt, endAt, totalSeats, feeAmount, currency")
    .eq("id", eventId)
    .single();

  if (fallbackError || !fallbackEvent) {
    throw new Error("Event not found");
  }

  return {
    ...fallbackEvent,
    eventMode: "in_person",
    virtualMeetingUrl: null,
    virtualLinkSoon: false,
  };
}

export async function getReservedCount(eventId: number): Promise<number> {
  const { data, error } = await supabase
    .from("EventReservations")
    .select("id")
    .eq("eventId", eventId)
    .in("status", ["reserved", "paid"]);

  if (error) throw error;
  return (data || []).length;
}

export async function getNextWaitlistPosition(eventId: number): Promise<number> {
  const { data, error } = await supabase
    .from("EventReservations")
    .select("waitlistPosition")
    .eq("eventId", eventId)
    .eq("status", "waitlisted")
    .order("waitlistPosition", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.waitlistPosition ? data.waitlistPosition + 1 : 1;
}

export async function normalizeWaitlistPositions(eventId: number): Promise<void> {
  const { data: waitlisted, error } = await supabase
    .from("EventReservations")
    .select("id")
    .eq("eventId", eventId)
    .eq("status", "waitlisted")
    .order("waitlistPosition", { ascending: true })
    .order("createdAt", { ascending: true });

  if (error) throw error;
  if (!waitlisted || waitlisted.length === 0) return;

  for (let i = 0; i < waitlisted.length; i += 1) {
    const row = waitlisted[i];
    const position = i + 1;
    const { error: updateError } = await supabase
      .from("EventReservations")
      .update({ waitlistPosition: position })
      .eq("id", row.id);
    if (updateError) throw updateError;
  }
}

export async function sendReservationConfirmationEmail(args: {
  eventId: number;
  userId: number;
  userEmail: string;
  eventTitle: string;
  paymentDueAt: string;
}) {
  const paymentPhone = process.env.EVENT_PAYMENT_PHONE || "AMSA payment phone";
  await sendEventEmail({
    eventId: args.eventId,
    userId: args.userId,
    userEmail: args.userEmail,
    templateKey: "reservation_confirmation",
    dedupeKey: `reservation_confirmation:${args.eventId}:${args.userId}:${args.paymentDueAt}`,
    subject: `Reservation confirmed for ${args.eventTitle}`,
    html: buildEventEmailHtml({
      title: "Reservation confirmed",
      body: `Your reservation for ${args.eventTitle} is confirmed. Please complete payment via phone transfer to ${paymentPhone} within 24 hours, before ${new Date(args.paymentDueAt).toLocaleString()}. An admin will manually verify your payment.`,
    }),
    metadata: { paymentDueAt: args.paymentDueAt },
  });
}

export async function sendWaitlistEmail(args: {
  eventId: number;
  userId: number;
  userEmail: string;
  eventTitle: string;
  waitlistPosition: number;
}) {
  await sendEventEmail({
    eventId: args.eventId,
    userId: args.userId,
    userEmail: args.userEmail,
    templateKey: "waitlist_placed",
    dedupeKey: `waitlist_placed:${args.eventId}:${args.userId}:${args.waitlistPosition}`,
    subject: `You are waitlisted for ${args.eventTitle}`,
    html: buildEventEmailHtml({
      title: "Added to waitlist",
      body: `You are currently #${args.waitlistPosition} on the waitlist for ${args.eventTitle}. We will email you if a seat opens up.`,
    }),
    metadata: { waitlistPosition: args.waitlistPosition },
  });
}

export async function sendWaitlistPromotedEmail(args: {
  eventId: number;
  userId: number;
  userEmail: string;
  eventTitle: string;
  paymentDueAt: string;
}) {
  const paymentPhone = process.env.EVENT_PAYMENT_PHONE || "AMSA payment phone";
  await sendEventEmail({
    eventId: args.eventId,
    userId: args.userId,
    userEmail: args.userEmail,
    templateKey: "waitlist_promoted",
    dedupeKey: `waitlist_promoted:${args.eventId}:${args.userId}:${args.paymentDueAt}`,
    subject: `A seat opened up for ${args.eventTitle}`,
    html: buildEventEmailHtml({
      title: "You have been promoted from waitlist",
      body: `A seat is now available for ${args.eventTitle}. Please pay via phone transfer to ${paymentPhone} within 24 hours, before ${new Date(args.paymentDueAt).toLocaleString()}. An admin will manually verify your payment.`,
    }),
    metadata: { paymentDueAt: args.paymentDueAt },
  });
}

export async function sendReservationExpiredEmail(args: {
  eventId: number;
  userId: number;
  userEmail: string;
  eventTitle: string;
}) {
  await sendEventEmail({
    eventId: args.eventId,
    userId: args.userId,
    userEmail: args.userEmail,
    templateKey: "reservation_expired",
    dedupeKey: `reservation_expired:${args.eventId}:${args.userId}:${new Date().toISOString().slice(0, 13)}`,
    subject: `Reservation window expired for ${args.eventTitle}`,
    html: buildEventEmailHtml({
      title: "Reservation expired",
      body: `Your 24-hour payment window for ${args.eventTitle} has expired, so your reservation was released and moved to the back of the waitlist.`,
    }),
  });
}

export async function promoteNextWaitlisted(eventId: number): Promise<{
  promotedUserId: number;
  paymentDueAt: string;
} | null> {
  const { data: nextWaitlisted, error } = await supabase
    .from("EventReservations")
    .select("id, userId")
    .eq("eventId", eventId)
    .eq("status", "waitlisted")
    .order("waitlistPosition", { ascending: true })
    .order("createdAt", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!nextWaitlisted) return null;

  const paymentDueAt = paymentDueAtFrom();
  const { error: promoteError } = await supabase
    .from("EventReservations")
    .update({
      status: "reserved",
      waitlistPosition: null,
      paymentDueAt,
      paymentStatus: "unpaid",
    })
    .eq("id", nextWaitlisted.id);

  if (promoteError) throw promoteError;
  await normalizeWaitlistPositions(eventId);

  return {
    promotedUserId: nextWaitlisted.userId,
    paymentDueAt,
  };
}
