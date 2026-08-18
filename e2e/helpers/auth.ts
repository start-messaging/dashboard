import { request, type APIResponse, type Page } from '@playwright/test';
import { sql, unique } from './db';
import { API_URL } from './env';

/**
 * The localStorage key the app reads its JWT from — mirrors
 * STORAGE_KEYS.ACCESS_TOKEN in src/lib/constants.ts. Note it is
 * `sm_access_token`, not the admin panel's key: the two apps deliberately
 * use different names so a browser signed into one is not signed into the
 * other.
 */
export const ACCESS_TOKEN_KEY = 'sm_access_token';

export interface TestCustomer {
  id: string;
  email: string;
  password: string;
  accessToken: string;
}

/**
 * Unwraps the global response envelope.
 *
 * Every success response is `{ success, statusCode, requestId, timestamp,
 * data }`, so a test that reaches for `body.user` would silently read
 * undefined. This makes that a loud failure instead.
 */
async function payload<T>(res: APIResponse): Promise<T> {
  const text = await res.text();
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(`Expected JSON, got: ${text.slice(0, 300)}`);
  }
  if (
    typeof body === 'object' &&
    body !== null &&
    'data' in (body as Record<string, unknown>)
  ) {
    return (body as { data: T }).data;
  }
  return body as T;
}

/**
 * Mints a fully onboarded CUSTOMER through the real API plus one SQL nudge.
 *
 * Register → flip the onboarding columns → log in again for a fresh token.
 * The SQL step is unavoidable: the server's OnboardingGuard answers 403 to
 * every meaningful endpoint until `kycStatus` is approved, and completing
 * KYC for real needs a phone and a human reviewer. The re-login matters so
 * the token the tests carry was minted for the already-onboarded account.
 */
export async function createOnboardedCustomer(
  opts: { firstName?: string } = {},
): Promise<TestCustomer> {
  const email = `${unique('ui-cust')}@example.com`;
  const password = 'Password123!';
  const firstName = opts.firstName ?? 'Test';

  const api = await request.newContext({ baseURL: API_URL });
  try {
    const reg = await api.post('/auth/register', {
      data: { email, password, firstName, lastName: 'Customer' },
    });
    if (!reg.ok()) {
      throw new Error(`register failed: ${reg.status()} ${await reg.text()}`);
    }
    const registered = await payload<{ user: { id: string } }>(reg);

    await sql(
      `UPDATE "users"
          SET "mobileVerified" = true,
              "mobileNumber" = COALESCE("mobileNumber", '+919000000001'),
              "kycStatus" = 'approved',
              "hasCompletedOnboarding" = true
        WHERE "id" = $1`,
      [registered.user.id],
    );

    const login = await api.post('/auth/login', {
      data: { email, password },
    });
    if (!login.ok()) {
      throw new Error(`login failed: ${login.status()} ${await login.text()}`);
    }
    const session = await payload<{ accessToken: string }>(login);

    return {
      id: registered.user.id,
      email,
      password,
      accessToken: session.accessToken,
    };
  } finally {
    await api.dispose();
  }
}

/**
 * Puts the token where the app looks for it, before any app code runs.
 *
 * Sign-in in this UI is Google-only — there is no email/password form to
 * drive — so injecting a real API-minted JWT into localStorage is the only
 * headless path into the authenticated app. The init script runs on every
 * navigation before the bundle loads, which is exactly when the axios
 * interceptor and useAuth first read the key.
 */
export async function injectToken(page: Page, accessToken: string): Promise<void> {
  await page.addInitScript(
    ({ key, token }: { key: string; token: string }) => {
      window.localStorage.setItem(key, token);
    },
    { key: ACCESS_TOKEN_KEY, token: accessToken },
  );
}

/**
 * Creates an API key through the HTTP surface, as the app itself would.
 * Used by specs that need a key to exist but are not about the creation UI.
 */
export async function createApiKeyViaApi(
  accessToken: string,
  label: string,
): Promise<{ id: string; key: string; keyPrefix: string; label: string }> {
  const api = await request.newContext({ baseURL: API_URL });
  try {
    const res = await api.post('/api-keys', {
      data: { label },
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok()) {
      throw new Error(`api key create failed: ${res.status()} ${await res.text()}`);
    }
    return payload(res);
  } finally {
    await api.dispose();
  }
}
