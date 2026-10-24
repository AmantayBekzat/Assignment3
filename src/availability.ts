// Pure availability logic, shared by the UI and automated tests.
// No React, no I/O — just the AC1–AC6 rules.

export const MINUTES_PER_DAY = 1440;
export const MAX_DURATION = 120;

export type Booking = { start: number; end: number };

export type AvailabilityResult = {
  status: "available" | "unavailable";
  errors: string[];
  conflictingBooking: Booking | null;
};

// Touching endpoints are allowed: [aStart, aEnd) vs [bStart, bEnd).
export function overlaps(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && aEnd > bStart;
}

const pad = (n: number) => n.toString().padStart(2, "0");

export function toHHMM(mins: number): string {
  const m = ((mins % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}

export function formatRange(start: number, end: number): string {
  return `${toHHMM(start)} – ${toHHMM(end)}`;
}

/**
 * Evaluate a proposed booking against AC1–AC6.
 *
 * AC1: 0 <= start < end <= 1440 and start must be strictly after now.
 * AC2: Duration must not exceed 120 minutes (exactly 120 allowed).
 * AC3: If the room is blocked, show Unavailable.
 * AC4: Reject overlap with any existing booking; touching endpoints allowed.
 * AC5: Show Available or Unavailable; never modify existing bookings.
 */
export function checkAvailability(
  start: number,
  end: number,
  now: number,
  blocked: boolean,
  bookings: Booking[],
): AvailabilityResult {
  const errors: string[] = [];

  // AC1: bounds and ordering
  if (start < 0 || start >= MINUTES_PER_DAY) {
    errors.push("Start time must be within the same day (00:00–23:59).");
  }
  if (end < 0 || end > MINUTES_PER_DAY) {
    errors.push("End time must be by 24:00 (midnight).");
  }
  if (start <= now) {
    errors.push(`Start time must be after the current time (${toHHMM(now)}).`);
  }
  if (start >= end) {
    errors.push("End time must be later than start time.");
  }

  // AC2: duration (only meaningful once start < end)
  const duration = end - start;
  if (duration <= 0) {
    errors.push("Duration must be greater than 0 minutes.");
  } else if (duration > MAX_DURATION) {
    errors.push("Duration must not exceed 120 minutes.");
  }

  if (errors.length > 0) {
    return { status: "unavailable", errors, conflictingBooking: null };
  }

  // AC3: blocked room
  if (blocked) {
    return {
      status: "unavailable",
      errors: [],
      conflictingBooking: null,
    };
  }

  // AC4: overlap with any existing booking
  const conflicting =
    bookings.find((b) => overlaps(start, end, b.start, b.end)) ?? null;
  if (conflicting) {
    return {
      status: "unavailable",
      errors: [],
      conflictingBooking: conflicting,
    };
  }

  // AC5: available
  return { status: "available", errors, conflictingBooking: null };
}
