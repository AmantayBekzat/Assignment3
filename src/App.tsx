import { useMemo, useState } from "react";
import {
  Clock,
  DoorOpen,
  CheckCircle2,
  XCircle,
  CalendarClock,
  Info,
  AlertTriangle,
  MapPin,
} from "lucide-react";
import {
  checkAvailability,
  formatRange,
  toHHMM,
  MINUTES_PER_DAY,
  type Booking,
} from "@/availability";

// ---- Fixed fictional data (no backend) ----
const NOW = 540; // 9:00 AM in minutes from midnight
const BLOCKED = false; // AC3: if true, room is unavailable
const EXISTING_BOOKINGS: (Booking & { label: string })[] = [
  { start: 600, end: 660, label: "Existing booking" }, // 10:00–11:00 AM
];
const ROOM_NAME = "Library Study Room A-204";
const ROOM_CAPACITY = 8;
const DAY_LABEL = "Today";

type Status = "idle" | "available" | "unavailable";

// Parse an HH:MM time input. For the END field only, "00:00" means midnight
// end (1440), since HTML time inputs cannot represent 24:00.
const minsFromTimeInput = (value: string, isEnd: boolean): number | null => {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const h = Number(match[1]);
  const mm = Number(match[2]);
  if (h > 23 || mm > 59) return null;
  const mins = h * 60 + mm;
  return isEnd && mins === 0 ? MINUTES_PER_DAY : mins;
};

export default function App() {
  const [startTime, setStartTime] = useState(toHHMM(NOW + 15)); // default 9:15 AM
  const [endTime, setEndTime] = useState(toHHMM(NOW + 15 + 60)); // default 10:15 AM
  const [status, setStatus] = useState<Status>("idle");
  const [checked, setChecked] = useState(false);

  const startMin = minsFromTimeInput(startTime, false);
  const endMin = minsFromTimeInput(endTime, true);
  const duration =
    startMin !== null && endMin !== null ? endMin - startMin : null;

  const result = useMemo(() => {
    if (startMin === null || endMin === null) return null;
    return checkAvailability(
      startMin,
      endMin,
      NOW,
      BLOCKED,
      EXISTING_BOOKINGS,
    );
  }, [startMin, endMin]);

  const errors = result?.errors ?? [];
  const conflictingBooking = result?.conflictingBooking ?? null;

  const handleCheck = () => {
    setChecked(true);
    if (!result) {
      setStatus("unavailable");
      return;
    }
    setStatus(result.status);
  };

  const handleReset = () => {
    setStatus("idle");
    setChecked(false);
  };

  const canShowResult = checked && status !== "idle";

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        {/* Header */}
        <header className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-600 text-white shadow-sm">
            <DoorOpen className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              Smart Campus Room Availability
            </h1>
            <p className="text-sm text-slate-500">
              Check a room's availability before booking.
            </p>
          </div>
        </header>

        {/* Room card */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 text-sky-600" />
              <div>
                <h2 className="text-lg font-semibold">{ROOM_NAME}</h2>
                <p className="text-sm text-slate-500">
                  Capacity: {ROOM_CAPACITY} people · {DAY_LABEL}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600">
              <Clock className="h-4 w-4" />
              Current time: {toHHMM(NOW)}
            </div>
          </div>

          {/* Existing bookings chips */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Existing bookings
            </span>
            {EXISTING_BOOKINGS.map((b, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800 ring-1 ring-amber-200"
              >
                <CalendarClock className="h-3.5 w-3.5" />
                {formatRange(b.start, b.end)}
              </span>
            ))}
          </div>

          {/* Timeline */}
          <Timeline
            now={NOW}
            bookings={EXISTING_BOOKINGS}
            proposedStart={startMin}
            proposedEnd={endMin}
            canShow={checked}
            isAvailable={status === "available"}
          />
        </section>

        {/* Controls */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-base font-semibold">Propose a booking</h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="start-time"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Start time
              </label>
              <input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  setChecked(false);
                  setStatus("idle");
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
              />
              <p className="mt-1 text-xs text-slate-400">
                Must be after {toHHMM(NOW)}.
              </p>
            </div>

            <div>
              <label
                htmlFor="end-time"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                End time
              </label>
              <input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => {
                  setEndTime(e.target.value);
                  setChecked(false);
                  setStatus("idle");
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
              />
              <p className="mt-1 text-xs text-slate-400">
                Maximum duration is 120 minutes. Enter 00:00 to end at midnight.
              </p>
            </div>
          </div>

          {startMin !== null && endMin !== null && (
            <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-100">
              Proposed slot:{" "}
              <span className="font-semibold text-slate-900">
                {formatRange(startMin, endMin)}
              </span>{" "}
              {duration !== null && duration > 0
                ? `(${duration} min)`
                : ""}
              {endMin > 1440 && (
                <span className="ml-1 font-medium text-red-600">
                  · ends after midnight
                </span>
              )}
            </div>
          )}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleCheck}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-300 active:scale-[0.99]"
            >
              <CheckCircle2 className="h-5 w-5" />
              Check availability
            </button>
            <button
              onClick={handleReset}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 active:scale-[0.99]"
            >
              Reset
            </button>
          </div>
        </section>

        {/* Validation feedback */}
        {checked && errors.length > 0 && (
          <section className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
              <div>
                <h4 className="font-semibold text-amber-900">
                  Please fix the following
                </h4>
                <ul className="mt-2 space-y-1 text-sm text-amber-800">
                  {errors.map((e, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-amber-500" />
                      {e}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* Result */}
        {canShowResult && (
          <ResultCard
            status={status}
            blocked={BLOCKED}
            conflictingBooking={conflictingBooking}
            startMin={startMin}
            endMin={endMin}
          />
        )}

        {/* Footer note */}
        <p className="mt-8 flex items-start gap-2 text-xs text-slate-400">
          <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          This checker only reads availability. It does not create or modify any
          bookings. Touching booking endpoints (e.g. ending exactly when another
          starts) is allowed.
        </p>
      </div>
    </div>
  );
}

function Timeline({
  now,
  bookings,
  proposedStart,
  proposedEnd,
  canShow,
  isAvailable,
}: {
  now: number;
  bookings: { start: number; end: number; label: string }[];
  proposedStart: number | null;
  proposedEnd: number | null;
  canShow: boolean;
  isAvailable: boolean;
}) {
  const ticks = useMemo(() => {
    const t: number[] = [];
    for (let h = 0; h <= 24; h += 3) t.push(h * 60);
    return t;
  }, []);

  const showProposed =
    canShow &&
    proposedStart !== null &&
    proposedEnd !== null &&
    proposedStart >= 0 &&
    proposedEnd <= 1440;

  return (
    <div className="mt-5">
      <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
        <span>00:00</span>
        <span>Day timeline</span>
        <span>24:00</span>
      </div>
      <div className="relative h-12 w-full overflow-hidden rounded-lg bg-slate-100 ring-1 ring-inset ring-slate-200">
        {/* now marker */}
        <div
          className="absolute top-0 bottom-0 w-px bg-slate-400"
          style={{ left: `${(now / 1440) * 100}%` }}
          title={`Now ${toHHMM(now)}`}
        />
        <div
          className="absolute -top-0 text-[10px] font-semibold text-slate-500"
          style={{
            left: `${Math.min((now / 1440) * 100, 96)}%`,
            transform: "translateX(-50%)",
          }}
        >
          now
        </div>

        {/* existing bookings */}
        {bookings.map((b, i) => (
          <div
            key={i}
            className="absolute top-1 bottom-1 rounded bg-amber-400/90"
            style={{
              left: `${(b.start / 1440) * 100}%`,
              width: `${((b.end - b.start) / 1440) * 100}%`,
            }}
            title={`${b.label}: ${formatRange(b.start, b.end)}`}
          />
        ))}

        {/* proposed slot */}
        {showProposed &&
          proposedStart !== null &&
          proposedEnd !== null &&
          proposedStart < proposedEnd && (
            <div
              className={`absolute top-1 bottom-1 rounded ring-2 ${
                isAvailable
                  ? "bg-emerald-400/80 ring-emerald-600"
                  : "bg-rose-400/80 ring-rose-600"
              }`}
              style={{
                left: `${(proposedStart / 1440) * 100}%`,
                width: `${((proposedEnd - proposedStart) / 1440) * 100}%`,
              }}
              title={`Proposed: ${formatRange(proposedStart, proposedEnd)}`}
            />
          )}
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-slate-400">
        {ticks.map((t) => (
          <span key={t}>{toHHMM(t)}</span>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
        <Legend color="bg-amber-400" label="Existing booking" />
        {showProposed && (
          <Legend
            color={isAvailable ? "bg-emerald-400" : "bg-rose-400"}
            label="Your proposed slot"
          />
        )}
        <Legend color="bg-slate-400" label="Current time" />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-sm ${color}`} />
      {label}
    </span>
  );
}

function ResultCard({
  status,
  blocked,
  conflictingBooking,
  startMin,
  endMin,
}: {
  status: Status;
  blocked: boolean;
  conflictingBooking: Booking | null;
  startMin: number | null;
  endMin: number | null;
}) {
  if (status === "available") {
    return (
      <section
        className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm"
        role="status"
      >
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-6 w-6 flex-shrink-0 text-emerald-600" />
          <div>
            <h3 className="text-lg font-bold text-emerald-900">Available</h3>
            <p className="mt-1 text-sm text-emerald-800">
              {startMin !== null && endMin !== null && (
                <>
                  The room is available for{" "}
                  <span className="font-semibold">
                    {formatRange(startMin, endMin)}
                  </span>
                  . No conflicts with existing bookings.
                </>
              )}
            </p>
          </div>
        </div>
      </section>
    );
  }

  // unavailable
  let reason = "This time slot is not available.";
  if (blocked) {
    reason = "This room is currently blocked and cannot be booked.";
  } else if (conflictingBooking && startMin !== null && endMin !== null) {
    reason = `This slot overlaps with an existing booking (${formatRange(
      conflictingBooking.start,
      conflictingBooking.end,
    )}). Touching endpoints are allowed — try starting at or after ${toHHMM(
      conflictingBooking.end,
    )}, or ending by ${toHHMM(conflictingBooking.start)}.`;
  }

  return (
    <section
      className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm"
      role="status"
    >
      <div className="flex items-start gap-3">
        <XCircle className="mt-0.5 h-6 w-6 flex-shrink-0 text-rose-600" />
        <div>
          <h3 className="text-lg font-bold text-rose-900">Unavailable</h3>
          <p className="mt-1 text-sm text-rose-800">{reason}</p>
        </div>
      </div>
    </section>
  );
}
