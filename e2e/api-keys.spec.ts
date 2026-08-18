import { createHash } from 'node:crypto';
import { test, expect } from '@playwright/test';
import { resetDb, closeDb, sql } from './helpers/db';
import { createOnboardedCustomer, injectToken } from './helpers/auth';

test.beforeEach(async () => {
  await resetDb();
});

test.afterAll(async () => {
  await closeDb();
});

test('creating a key shows the secret once and stores only its hash', async ({
  page,
}) => {
  const customer = await createOnboardedCustomer();
  await injectToken(page, customer.accessToken);

  await page.goto('/api-keys');
  await expect(
    page.getByText('No API keys yet. Create one to get started.'),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Create API Key' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByPlaceholder('e.g. Production Key').fill('CI Smoke Key');
  await dialog.getByRole('button', { name: 'Create Key' }).click();

  // The one-time reveal: the dialog opens with the full plaintext visible —
  // this is the only moment it is ever shown.
  await expect(dialog.getByText('API Key Created')).toBeVisible();
  await expect(
    dialog.getByText("Copy your key now. You won't be able to see it again."),
  ).toBeVisible();
  const code = dialog.locator('code');
  await expect(code).toContainText(/^sm_live_/);
  const plaintext = (await code.textContent()) ?? '';
  expect(plaintext).toMatch(/^sm_live_[0-9a-f]{40}$/);

  // The eye toggle hides it again: 12-char prefix stays, bullets replace the
  // secret. The button is icon-only (no accessible name — noted in the run
  // report), so it is located by its lucide icon (EyeOff while revealed).
  await dialog.locator('button:has(svg.lucide-eye-off)').click();
  const masked = (await code.textContent()) ?? '';
  expect(masked).toMatch(/^sm_live_[0-9a-f]{4}•+$/);

  await dialog.getByRole('button', { name: 'Done' }).click();
  await expect(dialog).toBeHidden();

  // The list now shows the key — label and prefix, never the secret.
  const row = page.getByRole('row').filter({ hasText: 'CI Smoke Key' });
  await expect(row).toBeVisible();
  await expect(row.getByText(`${plaintext.slice(0, 12)}...`)).toBeVisible();

  // DB truth: exactly one row for this user, holding the SHA-256 of the
  // secret. The plaintext itself must exist nowhere in the row.
  const rows = await sql<{
    label: string;
    keyPrefix: string;
    keyHash: string;
  }>(
    `SELECT "label", "keyPrefix", "keyHash" FROM "api_keys" WHERE "userId" = $1`,
    [customer.id],
  );
  expect(rows).toHaveLength(1);
  expect(rows[0].label).toBe('CI Smoke Key');
  expect(rows[0].keyPrefix).toBe(plaintext.slice(0, 12));
  expect(rows[0].keyHash).toBe(
    createHash('sha256').update(plaintext).digest('hex'),
  );
  expect(rows[0].keyHash).not.toContain(plaintext);
});
