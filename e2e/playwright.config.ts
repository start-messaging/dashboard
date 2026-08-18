import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from '@playwright/test';
import { API_ENV, API_URL, APP_URL, PREVIEW_PORT } from './helpers/env';

/**
 * Browser-level suite: the built dashboard served by `vite preview` talking
 * to the real compiled API over HTTP, with Playwright driving Chromium.
 *
 * Both servers, the database and the Redis logical DB are dedicated to this
 * suite — see helpers/env.ts for the port/name map and the guards.
 */

const E2E_DIR = path.dirname(fileURLToPath(import.meta.url));
const DASHBOARD_ROOT = path.resolve(E2E_DIR, '..');
// The sibling server repo's compiled artifact — the same file a deploy runs.
const SERVER_MAIN = path.resolve(DASHBOARD_ROOT, '..', 'server', 'dist', 'main.js');

export default defineConfig({
  testDir: E2E_DIR,
  // Runs before the webServer entries below: it refuses a stale ../server/dist
  // (this suite never builds it) and clears leftover BullMQ jobs while no
  // worker is attached. See the file for why that sweep is safe only here.
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',
  // Serial: every spec resets the shared database, so parallel workers would
  // truncate each other's fixtures by construction.
  workers: 1,
  fullyParallel: false,
  retries: 0,
  reporter: [['line']],
  timeout: 30_000,
  expect: { timeout: 10_000 },
  // Keep artifacts at the repo root, where .gitignore expects them.
  outputDir: path.join(DASHBOARD_ROOT, 'test-results'),

  use: {
    baseURL: APP_URL,
    trace: 'retain-on-failure',
  },

  webServer: [
    {
      command: `node ${SERVER_MAIN}`,
      // /health rather than the bare port: the port opens before Nest has
      // finished wiring guards and routes, and the first test's registration
      // must not race the boot.
      url: `${API_URL}/health`,
      reuseExistingServer: false,
      timeout: 120_000,
      // Anywhere but the server repo: the server's ConfigModule reads ./.env
      // from its cwd, and server/.env points at the real database. From here
      // there is no .env to pick up, so API_ENV is the whole environment
      // story.
      cwd: E2E_DIR,
      env: API_ENV,
    },
    {
      // The build is part of the command so the served bundle always carries
      // this suite's VITE_* values (see build:e2e in package.json) rather
      // than whatever a previous `npm run build` left in dist/.
      command: `npm run build:e2e && npx vite preview --port ${PREVIEW_PORT} --strictPort`,
      url: APP_URL,
      reuseExistingServer: false,
      // Generous: the timeout covers the full vite build, not just startup.
      timeout: 300_000,
      cwd: DASHBOARD_ROOT,
    },
  ],
});
