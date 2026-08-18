/**
 * Single source of truth for the suite's dedicated infrastructure.
 *
 * The Redis logical DB (/11) and the ports (API on 3021, vite preview on 4173)
 * are provisioned exclusively for the dashboard e2e suite. The neighbouring
 * ports — 3000/3005/3010/3020/5173/5174/5175/4174 — belong to other
 * environments (dev servers, the server repo's own e2e suite, the admin and
 * partner panels), so nothing in this suite may ever point at them.
 *
 * The database is no longer exclusive: `sm_test` is shared with the server API
 * e2e suite and the admin-panel e2e suite. All three truncate it, so they
 * cannot run concurrently — run one suite at a time.
 */

export const API_PORT = 3021;
export const API_URL = `http://localhost:${API_PORT}`;

export const PREVIEW_PORT = 4173;
export const APP_URL = `http://localhost:${PREVIEW_PORT}`;

export const DATABASE = {
  host: '127.0.0.1',
  port: 5432,
  /**
   * Must keep a name that reads as a test database: helpers/db.ts refuses to
   * connect to anything else, because resetDb() truncates freely and `sm_db`
   * on the same Postgres is the development database, holding real users,
   * messages and leads.
   */
  name: 'sm_test',
  username: 'postgres',
  password: 'postgres',
} as const;

/** Logical DB 11 — the suite's own. flushRedis() refuses /0 or no index. */
export const REDIS_URL = 'redis://127.0.0.1:6379/11';

/**
 * Namespaces every key the API under test writes: the throttler counters, the
 * cached values, and BullMQ's queues. Without it BullMQ writes to the bare
 * `bull:*` keyspace shared with the developer's dev API and the two runs pull
 * each other's jobs off the queues.
 *
 * Exported rather than inlined into API_ENV because helpers/db.ts scopes its
 * deletion to this prefix — the two have to be the same string or the reset
 * either misses the suite's keys or reaches outside them.
 */
export const REDIS_KEY_PREFIX = 'uidash';

/**
 * The environment the API boots with. Console providers everywhere so no
 * real SMS or email leaves the machine; schedulers off so background sweeps
 * cannot write rows between a seed and its assertion.
 */
export const API_ENV: Record<string, string> = {
  NODE_ENV: 'test',
  PORT: String(API_PORT),
  DATABASE_HOST: DATABASE.host,
  DATABASE_PORT: String(DATABASE.port),
  DATABASE_NAME: DATABASE.name,
  DATABASE_USERNAME: DATABASE.username,
  DATABASE_PASSWORD: DATABASE.password,
  DATABASE_SSL: 'false',
  REDIS_URL,
  REDIS_KEY_PREFIX,
  JWT_SECRET: 'ui-dash-jwt-secret-000',
  // Must differ from JWT_SECRET — the server refuses to boot otherwise.
  PARTNER_JWT_SECRET: 'ui-dash-partner-secret-111',
  BCRYPT_ROUNDS: '4',
  SMS_CONSOLE_PROVIDER: 'true',
  OUTREACH_CONSOLE_PROVIDER: 'true',
  POSTHOG_API_KEY: '',
  SENTRY_DSN: '',
  MAILGUN_API_KEY: 'ui-disabled',
  MAILGUN_DOMAIN: 'ui.invalid',
  // The preview origin is NOT in the server's default CORS list (that list
  // only carries the dev-server ports), so without this every browser call
  // from the built app would fail preflight.
  CORS_ORIGINS: APP_URL,
  AFFILIATE_SCHEDULER_ENABLED: 'false',
  SMS_RECONCILE_ENABLED: 'false',
};
