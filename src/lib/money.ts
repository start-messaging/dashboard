/**
 * Money helpers. The server stores and returns every amount as an integer
 * number of **micros** (1 rupee = 1,000,000 micros). These convert between
 * micros and human/display values. Never do money math on floats.
 */
export const MICROS_PER_UNIT = 1_000_000;

/** Micros → major-unit number (rupees). */
export function fromMicros(micros: number | string | null | undefined): number {
  if (micros === null || micros === undefined || micros === "") return 0;
  return Number(micros) / MICROS_PER_UNIT;
}

/** Major-unit (rupees) → integer micros. */
export function toMicros(amount: number): number {
  return Math.round(amount * MICROS_PER_UNIT);
}

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
});

/** Format an integer micros value as ₹ currency. */
export function formatMicros(
  micros: number | string | null | undefined,
): string {
  return inrFormatter.format(fromMicros(micros));
}
