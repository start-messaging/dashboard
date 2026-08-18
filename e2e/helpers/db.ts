import { Client } from 'pg';
import { Redis } from 'ioredis';
import { DATABASE, REDIS_KEY_PREFIX, REDIS_URL } from './env';

/**
 * Direct database access for the E2E suite.
 *
 * Tests assert against the rows as well as against what the browser shows,
 * because the defects a UI suite exists to catch include the ones where the
 * page looks right and the stored data does not (an API key whose plaintext
 * ended up in a column, a balance the ledger doesn't back).
 */

let client: Client | null = null;

export async function db(): Promise<Client> {
  if (client) return client;

  const name = DATABASE.name;
  // A guard, not a formality. Every reset in this file truncates, and `sm_db`
  // on the same Postgres is the development database, holding real users,
  // messages and leads. Only a name that reads as a test database passes.
  if (!name || !/e2e|test/i.test(name)) {
    throw new Error(
      `Refusing to run UI E2E tests against database "${name}". ` +
        `The suite truncates tables; point helpers/env.ts at the ` +
        `sm_test database.`,
    );
  }

  client = new Client({
    host: DATABASE.host,
    port: DATABASE.port,
    database: name,
    user: DATABASE.username,
    password: DATABASE.password,
  });
  await client.connect();
  return client;
}

export async function closeDb(): Promise<void> {
  await client?.end();
  client = null;
}

export async function sql<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const c = await db();
  const res = await c.query(text, params);
  return res.rows as T[];
}

/**
 * Clears the suite's own Redis keys — everything except the queues.
 *
 * Rate-limit counters live there and are keyed on IP: /auth/register allows
 * five per minute, so without this a rerun within a minute would 429 on
 * registration and every later assertion would fail for a reason unrelated
 * to what it tests.
 *
 * BullMQ's namespace is deliberately spared. This used to be a FLUSHDB, and it
 * was survivable only because BullMQ dropped the `/N` from REDIS_URL and put
 * every queue on logical DB 0 — /11 never held a queue key, so the suite was
 * never clearing its own queues in the first place. Now that the connection
 * honours the path the queues sit in this DB, and deleting them under a
 * running worker leaves that worker blocked on a read against a stream that no
 * longer exists: jobs stop moving and the next test times out waiting on work
 * that will never be picked up. Sparing them keeps the behaviour the suite has
 * always had.
 */
export async function flushRedis(): Promise<void> {
  const url = new URL(REDIS_URL);

  // Same guard as the database: never flush a Redis DB that is not the
  // suite's own. `redis://host:port/N` — anything without an explicit
  // non-zero logical DB is refused.
  const dbIndex = url.pathname.replace('/', '');
  if (!dbIndex || dbIndex === '0') {
    throw new Error(
      `Refusing to flush Redis at "${REDIS_URL}": the E2E suite needs its own logical DB (e.g. /11).`,
    );
  }

  // The prefix is the only thing scoping the deletion below, so an empty one
  // would turn this back into the FLUSHDB it replaced — and a prefix carrying
  // a glob metacharacter is the same hazard wearing a disguise: a `*` or `?`
  // in the MATCH pattern reaches past the suite's own keys into whatever else
  // shares the logical DB. Same character class the server validates
  // REDIS_KEY_PREFIX against, minus the empty case.
  if (!/^[A-Za-z0-9_-]+$/.test(REDIS_KEY_PREFIX)) {
    throw new Error(
      `Refusing to clear Redis with REDIS_KEY_PREFIX "${REDIS_KEY_PREFIX}": an ` +
        'unscoped or glob-bearing sweep would delete keys outside the suite, ' +
        'queues included. Use [A-Za-z0-9_-] only.',
    );
  }

  const redis = new Redis(REDIS_URL, {
    // Was maxRetriesPerRequest: null. Against a Redis that is not running that
    // queues the SCAN forever instead of failing it, so the suite hangs in the
    // fixture and Playwright reports a timeout that names the test rather than
    // the dead dependency.
    retryStrategy: () => null,
    maxRetriesPerRequest: 1,
  });
  // ioredis emits 'error' as well as rejecting the command; unhandled, that
  // event takes the whole Playwright worker down instead of failing one test.
  redis.on('error', () => {});
  try {
    const queues = `${REDIS_KEY_PREFIX}:bull`;
    let cursor = '0';
    do {
      // SCAN, not KEYS: the dev API may be pointed at this Redis too, and a
      // KEYS sweep blocks the server for every one of its clients.
      const [next, keys] = await redis.scan(
        cursor,
        'MATCH',
        `${REDIS_KEY_PREFIX}:*`,
        'COUNT',
        500,
      );
      cursor = next;
      const doomed = keys.filter(
        (k) => k !== queues && !k.startsWith(`${queues}:`),
      );
      if (doomed.length) await redis.unlink(...doomed);
    } while (cursor !== '0');
  } finally {
    // disconnect(), not quit(): quit() on a connection that never came up
    // rejects and would mask the SCAN error that got us here.
    redis.disconnect();
  }
}

/**
 * Tables the suite owns, ordered so truncation never trips a foreign key
 * (children before parents). Copied from the server suite's helper and
 * filtered against pg_tables, so a migration adding or dropping a table
 * doesn't break the reset.
 */
const TABLES = [
  'lead_outreach_events',
  'lead_ingest_runs',
  'leads',
  'outreach_suppressions',
  'partner_commissions',
  'partner_payouts',
  'referral_clicks',
  'referrals',
  'partners',
  'messages',
  'wallet_transaction_duplicate_debits',
  'wallet_transactions',
  'payments',
  'wallets',
  'otp_requests',
  'mobile_otps',
  'api_keys',
  'onboarding_reminders',
  'user_tags',
  'users',
];

/**
 * Returns the database and Redis to a known state.
 *
 * Unlike the server suite this one leaves `affiliate_settings` alone: the
 * dashboard under test never reads or writes it, and it is a self-healing
 * singleton the API maintains on its own.
 */
export async function resetDb(): Promise<void> {
  await flushRedis();
  const c = await db();
  const existing = await sql<{ tablename: string }>(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`,
  );
  const present = new Set(existing.map((r) => r.tablename));
  const targets = TABLES.filter((t) => present.has(t));

  await c.query(
    `TRUNCATE TABLE ${targets.map((t) => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE`,
  );
}

let counter = 0;
/** Unique per call so a re-run never collides on a unique constraint. */
export function unique(prefix: string): string {
  counter += 1;
  return `${prefix}-${process.pid}-${counter}`;
}

/**
 * Inserts a message directly.
 *
 * Column shape copied from the server suite's seedDeliveredMessage: real
 * sends go through the OTP pipeline, which a browser test cannot drive
 * without a phone. `deliveredAt` is only set when the status warrants it.
 */
export async function seedDeliveredMessage(
  userId: string,
  opts: {
    status?: string;
    costAmount?: number;
    phoneNumber?: string;
    apiKeyId?: string | null;
    failureReason?: string | null;
  } = {},
): Promise<string> {
  const status = opts.status ?? 'delivered';
  const when = new Date();
  const [row] = await sql<{ id: string }>(
    `INSERT INTO "messages"
       ("userId", "apiKeyId", "phoneNumber", "content", "provider", "status",
        "costAmount", "failureReason", "deliveredAt", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, 'OTP 123456', 'console', $4, $5, $6, $7, $8, $8)
     RETURNING "id"`,
    [
      userId,
      opts.apiKeyId ?? null,
      opts.phoneNumber ?? '+919000000000',
      status,
      opts.costAmount ?? 0.25,
      opts.failureReason ?? null,
      status === 'delivered' ? when : null,
      when,
    ],
  );
  return row.id;
}

interface EntryFields {
  description?: string;
  referenceType?: string;
  referenceId?: string;
  createdAt?: Date;
}

/** One money move: an explicit delta, or the balance to land on. */
export type LedgerEntry =
  | ({ delta: number; to?: never } & EntryFields)
  | ({ to: number; delta?: never } & EntryFields);

/** The columns are numeric(12,4); anything finer is rounded before it is sent. */
const paise = (n: number): number => Math.round(n * 1e4) / 1e4;

/**
 * The one way a UI E2E fixture is allowed to move money.
 *
 * A deliberate cross-package copy of
 * server/tests/e2e/helpers/wallet.ts — `dashboard/` and `server/` are separate
 * npm projects with no workspace root and their own `pg` clients, so nothing
 * here can import that file. Keep the two in step: the WHY, the column list,
 * the version bump and the rounding all belong to the server copy, which
 * carries the full note on why a hand-written ledger row that production
 * cannot produce is a test asserting against a state that cannot occur.
 * seedDeliveredMessage above is copied from that suite for the same reason.
 *
 * In short, and only what is needed to read the code below:
 *  - WalletService writes one wallet_transactions row per move, bracketed by
 *    its own balanceBefore/balanceAfter, and saves the wallet once — which
 *    writes balance, bumps the @VersionColumn and touches updatedAt. A bare
 *    `SET "balance"` writes one of those three.
 *  - The sign of the move picks the type; a credit for a negative amount is a
 *    row production cannot produce, and platform revenue is
 *    `SUM(amount) WHERE type='debit'`.
 *  - `wallets` and `wallet_transactions` have no CHECK constraint and no
 *    trigger, so an incoherent fixture is accepted in silence.
 *
 * Returns the closing balance.
 */
export async function seedLedger(
  userId: string,
  first: LedgerEntry | LedgerEntry[],
  ...rest: LedgerEntry[]
): Promise<number> {
  const entries = [...(Array.isArray(first) ? first : [first]), ...rest];
  if (entries.length === 0) {
    throw new Error(`seedLedger(${userId}) was given no entries to file`);
  }

  // Registration already creates the wallet (the ₹10 welcome credit), so this
  // usually finds one; the ON CONFLICT insert covers users seeded without
  // going through /auth/register, and matches WalletService.lockWallet.
  await sql(
    `INSERT INTO "wallets" ("userId") VALUES ($1)
     ON CONFLICT ("userId") DO NOTHING`,
    [userId],
  );
  const [wallet] = await sql<{ id: string; balance: string }>(
    `SELECT "id", "balance" FROM "wallets" WHERE "userId" = $1`,
    [userId],
  );
  let balance = paise(Number(wallet.balance));

  for (const entry of entries) {
    const before = balance;
    // Split rather than folded into one expression so `to` narrows the union:
    // a target is rounded first and the move derived from it, a delta is
    // rounded first and the target derived from it.
    let delta: number;
    let after: number;
    if (entry.to !== undefined) {
      after = paise(entry.to);
      delta = paise(after - before);
    } else {
      delta = paise(entry.delta);
      after = paise(before + delta);
    }

    // A zero-value row is one production cannot write — AdminTopupDto is
    // @Min(0.01) — so a target the wallet is already on files nothing.
    if (delta === 0) continue;

    balance = after;
    if (balance < 0) {
      throw new Error(
        `seedLedger would leave ${userId} holding ${balance}, which no ` +
          `production path reaches: the service refuses a debit larger than ` +
          `the balance. File the credit that pays for these debits first.`,
      );
    }

    await sql(
      `INSERT INTO "wallet_transactions"
         ("walletId", "type", "amount", "balanceBefore", "balanceAfter",
          "referenceType", "referenceId", "description", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9::timestamptz, now()))`,
      [
        wallet.id,
        delta > 0 ? 'credit' : 'debit',
        Math.abs(delta),
        before,
        balance,
        entry.referenceType ?? null,
        entry.referenceId ?? null,
        entry.description ?? 'e2e ledger entry',
        entry.createdAt ?? null,
      ],
    );

    // One save per entry, the three columns together.
    await sql(
      `UPDATE "wallets"
          SET "balance"   = $2,
              "version"   = "version" + 1,
              "updatedAt" = now()
        WHERE "id" = $1`,
      [wallet.id, balance],
    );
  }

  return balance;
}
