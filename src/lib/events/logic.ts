export const PAYMENT_WINDOW_HOURS = 24;

export type ReservationStatus =
  | "reserved"
  | "waitlisted"
  | "cancelled"
  | "expired"
  | "paid";

export function paymentDueAtFrom(baseDate = new Date()): string {
  const due = new Date(baseDate);
  due.setHours(due.getHours() + PAYMENT_WINDOW_HOURS);
  return due.toISOString();
}

export function nextWaitlistPosition(existingPositions: number[]): number {
  if (existingPositions.length === 0) return 1;
  return Math.max(...existingPositions) + 1;
}

export function hasSeatAvailable(totalSeats: number, activeSeatCount: number): boolean {
  return activeSeatCount < totalSeats;
}

/** An event with no end time never counts as ended. */
export function hasEventEnded(endAt: string | null | undefined, now = new Date()): boolean {
  if (!endAt) return false;
  return new Date(endAt).getTime() < now.getTime();
}

export function shouldExpireReservation(
  status: ReservationStatus,
  paymentStatus: string,
  paymentDueAt: string | null,
  now = new Date()
): boolean {
  if (status !== "reserved") return false;
  if (paymentStatus === "paid") return false;
  if (!paymentDueAt) return false;
  return new Date(paymentDueAt).getTime() <= now.getTime();
}
