export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'sm_access_token',
  // Partner portal keeps its OWN session, separate from the customer app.
  PARTNER_ACCESS_TOKEN: 'sm_partner_access_token',
  PARTNER_REFRESH_TOKEN: 'sm_partner_refresh_token',
} as const;

export const ROUTES = {
  SIGN_IN: '/sign-in',
  ONBOARDING: '/onboarding',
  DASHBOARD: '/dashboard',
  TRANSACTIONS: '/transactions',
  MESSAGES: '/messages',
  API_KEYS: '/api-keys',
  API_DOCS: '/api-docs',
  TEMPLATES: '/templates',
  // Partner portal — separate auth + shell from the customer app.
  PARTNER: '/partner',
  PARTNER_LOGIN: '/partner/login',
  PARTNER_REGISTER: '/partner/register',
} as const;

export const SUPPORT = {
  whatsappNumber: '6376383348',
  whatsappUrl:
    'https://wa.me/916376383348?text=Hi%2C%20I%20need%20help%20with%20my%20StartMessaging%20account.',
} as const;
