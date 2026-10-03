/**
 * Whether `value` is a single IP address the API will accept in an API key's
 * allow list.
 *
 * This mirrors `@IsIP()` on the server closely enough to catch the three things
 * people actually paste — a CIDR range, a hostname, and an address with spaces
 * around it — without a round trip. It is an affordance, not a gate: the server
 * validates again and its answer is the one that counts, so a disagreement here
 * surfaces as a 400 the dialog renders rather than as a silently dropped entry.
 *
 * Ranges are rejected rather than expanded. `203.0.113.0/24` is the first thing
 * an ops team reaches for and the server refuses it, so saying so at the input
 * is the difference between a one-line correction and a failed save.
 */

const IPV4 =
  /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

function isIpV6(value: string): boolean {
  if (!value.includes(":")) return false;
  try {
    // The URL parser already implements the IPv6 literal grammar, including the
    // compressed `::` forms and embedded IPv4 tails. Hand-rolling that as a
    // regex is where this kind of helper usually goes wrong, so it is borrowed
    // rather than rewritten.
    return new URL(`http://[${value}]`).hostname.startsWith("[");
  } catch {
    return false;
  }
}

export function isIpAddress(value: string): boolean {
  return IPV4.test(value) || isIpV6(value);
}

/** The cap the server enforces with `@ArrayMaxSize(20)`. */
export const MAX_ALLOWED_IPS = 20;
