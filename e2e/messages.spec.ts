import { test, expect } from '@playwright/test';
import { resetDb, closeDb, seedDeliveredMessage } from './helpers/db';
import {
  createOnboardedCustomer,
  createApiKeyViaApi,
  injectToken,
  type TestCustomer,
} from './helpers/auth';

const DELIVERED_NUMBER = '+919876543210';
const FAILED_NUMBER = '+918888877777';

let customer: TestCustomer;
let apiKeyId: string;

test.beforeEach(async ({ page }) => {
  await resetDb();
  customer = await createOnboardedCustomer();
  const apiKey = await createApiKeyViaApi(customer.accessToken, 'Checkout Service');
  apiKeyId = apiKey.id;

  await seedDeliveredMessage(customer.id, {
    phoneNumber: DELIVERED_NUMBER,
    apiKeyId,
  });
  await seedDeliveredMessage(customer.id, {
    status: 'failed',
    phoneNumber: FAILED_NUMBER,
    failureReason: 'Recipient number blocked',
  });

  await injectToken(page, customer.accessToken);
});

test.afterAll(async () => {
  await closeDb();
});

test('lists the seeded delivered message with badge, recipient and key label', async ({
  page,
}) => {
  await page.goto('/messages');

  const row = page.getByRole('row').filter({ hasText: DELIVERED_NUMBER });
  await expect(row).toBeVisible();
  // The customer's own traffic is shown unmasked — the full number, exactly
  // as the API returns it.
  await expect(row.getByText('Delivered')).toBeVisible();
  await expect(row.getByText('Checkout Service')).toBeVisible();
  // costAmount is rendered verbatim from the API's decimal string — four
  // trailing places and all. Pinning the current behaviour; see the run
  // report about the formatting.
  await expect(row.getByText('₹0.2500')).toBeVisible();

  // The message sent without a key shows the platform fallback label.
  const failedRow = page.getByRole('row').filter({ hasText: FAILED_NUMBER });
  await expect(failedRow.getByText('Failed')).toBeVisible();
  await expect(failedRow.getByText('Platform')).toBeVisible();
});

test('status filter updates the URL and the table, and survives a reload', async ({
  page,
}) => {
  await page.goto('/messages');
  await expect(
    page.getByRole('row').filter({ hasText: DELIVERED_NUMBER }),
  ).toBeVisible();

  // Filter to delivered: the URL owns the state.
  await page.getByRole('combobox').filter({ hasText: 'All Statuses' }).click();
  await page.getByRole('option', { name: 'Delivered' }).click();
  await expect(page).toHaveURL(/[?&]status=delivered/);
  await expect(
    page.getByRole('row').filter({ hasText: DELIVERED_NUMBER }),
  ).toBeVisible();
  await expect(
    page.getByRole('row').filter({ hasText: FAILED_NUMBER }),
  ).toHaveCount(0);

  // Switch to failed.
  await page.getByRole('combobox').filter({ hasText: 'Delivered' }).click();
  await page.getByRole('option', { name: 'Failed' }).click();
  await expect(page).toHaveURL(/[?&]status=failed/);
  await expect(
    page.getByRole('row').filter({ hasText: FAILED_NUMBER }),
  ).toBeVisible();
  await expect(
    page.getByRole('row').filter({ hasText: DELIVERED_NUMBER }),
  ).toHaveCount(0);

  // URL-owned state means a reload reconstructs the same filtered view.
  await page.reload();
  await expect(page).toHaveURL(/[?&]status=failed/);
  await expect(
    page.getByRole('row').filter({ hasText: FAILED_NUMBER }),
  ).toBeVisible();
  await expect(
    page.getByRole('row').filter({ hasText: DELIVERED_NUMBER }),
  ).toHaveCount(0);
});

test('API key filter updates the URL and the table', async ({ page }) => {
  await page.goto('/messages');
  await expect(
    page.getByRole('row').filter({ hasText: FAILED_NUMBER }),
  ).toBeVisible();

  await page.getByRole('combobox').filter({ hasText: 'All API Keys' }).click();
  await page.getByRole('option', { name: /Checkout Service/ }).click();

  await expect(page).toHaveURL(new RegExp(`[?&]apiKeyId=${apiKeyId}`));
  // Only the message sent with that key remains.
  await expect(
    page.getByRole('row').filter({ hasText: DELIVERED_NUMBER }),
  ).toBeVisible();
  await expect(
    page.getByRole('row').filter({ hasText: FAILED_NUMBER }),
  ).toHaveCount(0);
});
