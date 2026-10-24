import { checkAvailability, type Booking } from "../src/availability";

const NOW = 540; // 09:00
const BLOCKED = false;
const BOOKINGS: Booking[] = [{ start: 600, end: 660 }]; // 10:00–11:00

type Case = {
  label: string;
  start: number;
  end: number;
  expected: "available" | "unavailable";
};

const CASES: Case[] = [
  { label: "1. 11:00–12:00", start: 660, end: 720, expected: "available" },
  { label: "2. 10:30–11:30", start: 630, end: 690, expected: "unavailable" },
  { label: "3. 12:00–14:00", start: 720, end: 840, expected: "available" },
  { label: "4. 12:00–14:01", start: 720, end: 841, expected: "unavailable" },
  { label: "5. 09:00–09:30", start: 540, end: 570, expected: "unavailable" },
  { label: "6. 13:00–12:00", start: 780, end: 720, expected: "unavailable" },
  { label: "7. 09:15–10:00", start: 555, end: 600, expected: "available" },
  { label: "8. 23:00–24:00", start: 1380, end: 1440, expected: "available" },
];

let passed = 0;
let failed = 0;

for (const c of CASES) {
  const result = checkAvailability(c.start, c.end, NOW, BLOCKED, BOOKINGS);
  const ok = result.status === c.expected;
  if (ok) {
    passed++;
    console.log(`PASS  ${c.label}  -> ${result.status}`);
  } else {
    failed++;
    console.log(`FAIL  ${c.label}  -> got ${result.status}, expected ${c.expected}`);
    if (result.errors.length > 0) {
      for (const e of result.errors) console.log(`        reason: ${e}`);
    }
  }
}

console.log(`\n${passed}/${CASES.length} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
