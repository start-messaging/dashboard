import { test, expect } from '@playwright/test';
import { resetDb, closeDb, seedLedger, sql, unique } from './helpers/db';
import { createOnboardedCustomer, injectToken } from './helpers/auth';

test.beforeEach(async () => {
  await resetDb();
});

test.afterAll(async () => {
  await closeDb();
});

test('transactions page shows the wallet balance and the seeded credit', async ({
  page,
}) => {
  const customer = await createOnboardedCustomer();
  // Registration granted ₹10 (welcome credit); this tops the wallet up to
  // ₹250.50 with a second, distinctly named credit row.
  // referenceType 'seed' is a value no production row carries — kept from the
  // fixture this replaced so the rendered row is byte-identical, and named at
  // the call site rather than buried in the helper because the transactions
  // page renders a badge per type and could one day branch on it.
  const balanceAfter = await seedLedger(customer.id, {
    delta: 240.5,
    description: 'E2E manual top-up',
    referenceType: 'seed',
    referenceId: unique('seed'),
  });
  expect(balanceAfter).toBe(250.5);

  await injectToken(page, customer.accessToken);
  await page.goto('/transactions');

  // The layout header's wallet badge shows the seeded balance.
  await expect(page.locator('header').getByText('₹250.50')).toBeVisible();

  // The seeded credit renders as a row: description, type badge, signed
  // amount and the running balance after it.
  const row = page.getByRole('row').filter({ hasText: 'E2E manual top-up' });
  await expect(row).toBeVisible();
  await expect(row.getByText('Credit')).toBeVisible();
  await expect(row.getByText('+₹240.50')).toBeVisible();
  await expect(row.getByText('₹250.50')).toBeVisible();

  // The welcome credit is real history and must still be listed.
  await expect(
    page.getByRole('row').filter({ hasText: 'Welcome credit' }),
  ).toBeVisible();

  // DB truth: the cached balance matches the last ledger row.
  const [wallet] = await sql<{ balance: string }>(
    `SELECT "balance" FROM "wallets" WHERE "userId" = $1`,
    [customer.id],
  );
  expect(Number(wallet.balance)).toBe(250.5);
});
