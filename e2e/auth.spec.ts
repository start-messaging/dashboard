import { test, expect } from '@playwright/test';
import { resetDb, closeDb } from './helpers/db';
import { createOnboardedCustomer, injectToken } from './helpers/auth';

test.beforeEach(async () => {
  await resetDb();
});

test.afterAll(async () => {
  await closeDb();
});

test('unauthenticated visit to /dashboard lands on the sign-in page', async ({
  page,
}) => {
  await page.goto('/dashboard');

  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(
    page.getByRole('heading', { name: 'Welcome back' }),
  ).toBeVisible();

  // The Google button itself is an iframe rendered by the GSI script from
  // accounts.google.com. When that script loads, the iframe appears; if the
  // network denies it, the page shows its explicit loading placeholder in
  // the same slot. Either proves the guard delivered us to the Google-only
  // sign-in surface rather than a broken page.
  const googleButton = page.locator('iframe[src*="accounts.google.com"]');
  const loadingPlaceholder = page.getByText('Connecting to Google Identity');
  await expect(googleButton.or(loadingPlaceholder).first()).toBeVisible();
  await expect(page.getByText('One-Tap Login')).toBeVisible();
});

test('with an injected token the dashboard home renders the account name and stats', async ({
  page,
}) => {
  const customer = await createOnboardedCustomer({ firstName: 'Priya' });
  await injectToken(page, customer.accessToken);

  await page.goto('/dashboard');

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByRole('heading', { name: 'Welcome, Priya' }),
  ).toBeVisible();

  // Stats cards render with real API data (a fresh account has zeroes).
  const requestedCard = page
    .locator('[data-slot="card"]')
    .filter({ hasText: 'Messages Requested' });
  await expect(requestedCard).toContainText('0');
  await expect(page.getByText('Total Messages')).toBeVisible();

  // The header wallet badge shows the ₹10 welcome credit that registration
  // grants — real balance from the real API, not a placeholder.
  await expect(page.locator('header').getByText('₹10.00')).toBeVisible();
});
