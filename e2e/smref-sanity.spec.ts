import { test, expect } from '@playwright/test';

/**
 * The cold-outreach links land visitors on any page with `?smref=<leadId>`.
 * This build has no VITE_POSTHOG_KEY, so posthog.init never runs — and
 * usePostHogLeadCapture must notice that (its `__loaded` guard) rather than
 * call identify() on an uninitialized client. A regression there would break
 * every outreach landing for environments without analytics.
 */
test('visiting /?smref=... with PostHog disabled renders without page errors', async ({
  page,
}) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', (error) => pageErrors.push(error));

  await page.goto('/?smref=demo1234');

  // The catch-all route bounces an unauthenticated visitor to the sign-in
  // page; reaching its heading proves the app booted, routed and rendered.
  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(
    page.getByRole('heading', { name: 'Welcome back' }),
  ).toBeVisible();

  expect(pageErrors).toEqual([]);
});
