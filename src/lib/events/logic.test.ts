import test from "node:test";
import assert from "node:assert/strict";
import {
  PAYMENT_WINDOW_HOURS,
  hasSeatAvailable,
  nextWaitlistPosition,
  paymentDueAtFrom,
  shouldExpireReservation,
} from "@/lib/events/logic";

test("paymentDueAtFrom adds 24 hours window", () => {
  const base = new Date("2026-03-22T10:00:00.000Z");
  const dueAt = new Date(paymentDueAtFrom(base));
  const diffHours = (dueAt.getTime() - base.getTime()) / (1000 * 60 * 60);
  assert.equal(diffHours, PAYMENT_WINDOW_HOURS);
});

test("nextWaitlistPosition increments from max position", () => {
  assert.equal(nextWaitlistPosition([]), 1);
  assert.equal(nextWaitlistPosition([1, 2, 5]), 6);
});

test("hasSeatAvailable compares active seats to capacity", () => {
  assert.equal(hasSeatAvailable(10, 9), true);
  assert.equal(hasSeatAvailable(10, 10), false);
});

test("shouldExpireReservation returns true only for overdue unpaid reserved status", () => {
  const now = new Date("2026-03-22T12:00:00.000Z");

  assert.equal(
    shouldExpireReservation("reserved", "unpaid", "2026-03-22T11:59:59.000Z", now),
    true
  );
  assert.equal(
    shouldExpireReservation("reserved", "paid", "2026-03-22T11:59:59.000Z", now),
    false
  );
  assert.equal(
    shouldExpireReservation("waitlisted", "unpaid", "2026-03-22T11:59:59.000Z", now),
    false
  );
  assert.equal(shouldExpireReservation("reserved", "unpaid", null, now), false);
});
