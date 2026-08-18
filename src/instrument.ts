import * as Sentry from '@sentry/react';

/**
 * Error reporting only. Tracing and session replay are deliberately off —
 * PostHog owns session replay here, and running both recorders would double
 * the payload on every page for no extra signal.
 *
 * With no DSN configured this module is a no-op and the bundle behaves
 * exactly as it did before Sentry existed.
 */
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
  });
}
