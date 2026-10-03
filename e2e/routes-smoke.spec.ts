import { test, expect } from '@playwright/test';
import { resetDb, closeDb } from './helpers/db';
import {
  createApiKeyViaApi,
  createOnboardedCustomer,
  injectToken,
} from './helpers/auth';

/**
 * Every authed route renders.
 *
 * The rest of this suite is deep and narrow — a handful of pages asserted in
 * detail — so a change to something shared could break a page nothing opens and
 * the run would stay green. `useApiKeys` alone is read by both /messages and
 * /api-keys, and /api-docs had no coverage of any kind.
 *
 * Deliberately shallow: a heading, and no pageerror or console.error. It is a
 * tripwire for "this route no longer renders", not a substitute for asserting
 * what a page does.
 */

test.beforeEach(async () => {
  await resetDb();
});
test.afterAll(async () => {
  await closeDb();
});

const ROUTES = [
  '/dashboard',
  '/messages',
  '/api-keys',
  '/api-docs',
  '/transactions',
];

test('every authed route still renders without a page error', async ({
  page,
}) => {
  const customer = await createOnboardedCustomer();
  await injectToken(page, customer.accessToken);
  await createApiKeyViaApi(customer.accessToken, 'Smoke Key');

  const failures: string[] = [];
  page.on('pageerror', (e) => failures.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') failures.push(`console.error: ${m.text()}`);
  });

  for (const route of ROUTES) {
    const before = failures.length;
    const res = await page.goto(route);
    expect(res?.status(), `${route} did not serve`).toBeLessThan(400);
    await expect(page).toHaveURL(new RegExp(`${route}$`));
    // Something from the shell plus something from the page body: a route that
    // threw during render would leave the chrome up and the content missing.
    await expect(page.getByRole('heading').first()).toBeVisible();
    await page.waitForLoadState('networkidle');
    expect(
      failures.slice(before),
      `${route} produced errors`,
    ).toEqual([]);
  }
});
