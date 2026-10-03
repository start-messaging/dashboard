import { createHash } from 'node:crypto';
import { test, expect, request as apiRequest } from '@playwright/test';
import { resetDb, closeDb, sql } from './helpers/db';
import { API_URL } from './helpers/env';
import {
  createApiKeyViaApi,
  createOnboardedCustomer,
  injectToken,
} from './helpers/auth';

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

/**
 * The IP allow list, from the dashboard.
 *
 * The server has had `PATCH /api-keys/:id/ip-restrictions` and `GET
 * /api-keys/my-ip` the whole time, with enforcement and spoof-resistance
 * covered in server/tests/e2e/api-keys/ip-restrictions.spec.ts. What never
 * existed was any way to reach them: the shipped bundle contained no reference
 * to either route, so "restrict this key to my office IP" was an API-only
 * feature that no customer could use. These two specs are the half that was
 * missing — that the UI actually writes the column the guard reads.
 */

async function allowedIpsOf(userId: string): Promise<string[] | null> {
  const rows = await sql<{ allowedIps: string[] | null }>(
    `SELECT "allowedIps" FROM "api_keys" WHERE "userId" = $1`,
    [userId],
  );
  expect(rows).toHaveLength(1);
  return rows[0].allowedIps;
}

test('an existing key can be locked to an address and unlocked again', async ({
  page,
}) => {
  const customer = await createOnboardedCustomer();
  await injectToken(page, customer.accessToken);
  await createApiKeyViaApi(customer.accessToken, 'Locked Key');

  await page.goto('/api-keys');
  const row = page.getByRole('row').filter({ hasText: 'Locked Key' });
  // A key with no list reads as unrestricted, not as blank: the difference
  // between "any IP" and "none set yet" is the whole feature.
  await expect(row.getByText('Any IP')).toBeVisible();
  expect(await allowedIpsOf(customer.id)).toBeNull();

  await row.getByRole('button', { name: 'Edit IP restrictions' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('IP Restrictions')).toBeVisible();

  // A range is the first thing an ops team pastes and the server refuses it
  // with a 400. Saying so at the input is the difference between a one-line
  // correction and a failed save.
  const input = dialog.getByLabel('IP address');
  await input.fill('203.0.113.0/24');
  await dialog.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(
    dialog.getByText('Ranges are not supported — add each address on its own.'),
  ).toBeVisible();

  await input.fill('203.0.113.5');
  await dialog.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(dialog.getByRole('button', { name: 'Remove 203.0.113.5' })).toBeVisible();

  // Nothing is written until Save: the editor is a draft, so a cancelled edit
  // must not narrow a live key.
  expect(await allowedIpsOf(customer.id)).toBeNull();

  await dialog.getByRole('button', { name: 'Save Restrictions' }).click();
  await expect(dialog).toBeHidden();

  expect(await allowedIpsOf(customer.id)).toEqual(['203.0.113.5']);
  await expect(row.getByText('203.0.113.5')).toBeVisible();

  // And back: removing every address has to clear the column to NULL rather
  // than store an empty array, which would read as a restriction that admits
  // nobody while the guard treats it as no restriction at all.
  await row.getByRole('button', { name: 'Edit IP restrictions' }).click();
  await dialog.getByRole('button', { name: 'Remove 203.0.113.5' }).click();
  await expect(
    dialog.getByText('No restrictions — this key works from any IP address.'),
  ).toBeVisible();
  await dialog.getByRole('button', { name: 'Save Restrictions' }).click();
  await expect(dialog).toBeHidden();

  expect(await allowedIpsOf(customer.id)).toBeNull();
  await expect(row.getByText('Any IP')).toBeVisible();
});

test('a key can be created already restricted', async ({ page }) => {
  const customer = await createOnboardedCustomer();
  await injectToken(page, customer.accessToken);

  await page.goto('/api-keys');
  await page.getByRole('button', { name: 'Create API Key' }).click();
  const dialog = page.getByRole('dialog');

  await dialog.getByLabel('Label').fill('Born Restricted');
  await dialog.getByLabel('IP address').fill('198.51.100.7');
  await dialog.getByRole('button', { name: 'Add', exact: true }).click();
  await dialog.getByRole('button', { name: 'Create Key' }).click();

  await expect(dialog.getByText('API Key Created')).toBeVisible();
  await dialog.getByRole('button', { name: 'Done' }).click();

  // The restriction is on the row the moment the key exists — there is no
  // window where a key meant to be locked is live and unrestricted.
  expect(await allowedIpsOf(customer.id)).toEqual(['198.51.100.7']);
  const row = page.getByRole('row').filter({ hasText: 'Born Restricted' });
  await expect(row.getByText('198.51.100.7')).toBeVisible();
});

test('the allow list set in the UI is the one the guard enforces', async ({
  page,
}) => {
  // The two specs above prove the UI writes `allowedIps`. That is not the same
  // claim as "the restriction works": the column could be written and the key
  // still authenticate from anywhere, which is exactly the shape the feature
  // failed in before — a setting that looks applied and controls nothing. This
  // drives the whole loop instead, through the real UI and then the real API
  // with the real secret.
  const customer = await createOnboardedCustomer();
  await injectToken(page, customer.accessToken);

  await page.goto('/api-keys');
  await page.getByRole('button', { name: 'Create API Key' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Label').fill('Enforced Key');
  await dialog.getByRole('button', { name: 'Create Key' }).click();
  await expect(dialog.getByText('API Key Created')).toBeVisible();

  // The one-time reveal is the only place the plaintext exists, so it is taken
  // from the dialog rather than minted out of band — the key under test is the
  // one a customer would be holding.
  const secret = (await dialog.locator('code').textContent()) ?? '';
  expect(secret).toMatch(/^sm_live_[0-9a-f]{40}$/);
  await dialog.getByRole('button', { name: 'Done' }).click();
  await expect(dialog).toBeHidden();

  const api = await apiRequest.newContext({ baseURL: API_URL });
  try {
    const unrestricted = await api.get('/api-keys', {
      headers: { 'x-api-key': secret },
    });
    expect(unrestricted.status(), await unrestricted.text()).toBe(200);

    const row = page.getByRole('row').filter({ hasText: 'Enforced Key' });
    await row.getByRole('button', { name: 'Edit IP restrictions' }).click();
    await dialog.getByLabel('IP address').fill('203.0.113.5');
    await dialog.getByRole('button', { name: 'Add', exact: true }).click();
    await dialog.getByRole('button', { name: 'Save Restrictions' }).click();
    await expect(dialog).toBeHidden();

    // Refused now, and refused as a bare 401: the guard's 403 is discarded by
    // CombinedAuthGuard, so this is the answer the customer actually gets and
    // the reason the dialog warns about it in those words.
    const blocked = await api.get('/api-keys', {
      headers: { 'x-api-key': secret },
    });
    expect(
      blocked.status(),
      'the key still worked from an address the UI had excluded',
    ).toBe(401);

    // Widened to the address the API sees this caller as — read from the same
    // endpoint the dialog offers, so the UI's suggestion and the guard's check
    // are proven to agree rather than assumed to.
    const mine = await api.get('/api-keys/my-ip', {
      headers: { Authorization: `Bearer ${customer.accessToken}` },
    });
    expect(mine.status(), await mine.text()).toBe(200);
    const { ip } = ((await mine.json()) as { data: { ip: string } }).data;

    await row.getByRole('button', { name: 'Edit IP restrictions' }).click();
    await dialog.getByRole('button', { name: 'Remove 203.0.113.5' }).click();
    await dialog.getByLabel('IP address').fill(ip);
    await dialog.getByRole('button', { name: 'Add', exact: true }).click();
    await dialog.getByRole('button', { name: 'Save Restrictions' }).click();
    await expect(dialog).toBeHidden();

    const readmitted = await api.get('/api-keys', {
      headers: { 'x-api-key': secret },
    });
    expect(
      readmitted.status(),
      `the key was refused from ${ip}, the address the UI was told to allow`,
    ).toBe(200);
  } finally {
    await api.dispose();
  }
});
