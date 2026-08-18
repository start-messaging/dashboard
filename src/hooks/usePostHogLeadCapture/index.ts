import { useEffect } from 'react';
import posthog from 'posthog-js';

/**
 * Identifies cold-email prospects in PostHog. Outreach links carry
 * `?smref=<leadId>`; the visitor becomes PostHog person `lead_<leadId>` so
 * everything they do before signing up — pageviews, replays — is attributed
 * to the lead that was emailed.
 *
 * Deliberately does NOT touch the URL: useReferralCapture strips its own
 * `ref`/`code` params, but `smref` stays put so PostHog's campaign-param
 * capture (custom_campaign_params in main.tsx) also sees it, and so a
 * reloaded page re-identifies after cleared storage.
 *
 * The _isIdentified() guard is load-bearing: a signed-in customer who
 * clicks an outreach link (their own forwarded email, a colleague's) is
 * already identified as user_<id>, and identifying them again as
 * lead_<leadId> would try to merge a real customer into a prospect person.
 * It also dedupes StrictMode's double effect run in dev — after the first
 * pass the visitor is identified, so the second pass is a no-op.
 */
export function usePostHogLeadCapture(): void {
  useEffect(() => {
    if (!posthog.__loaded) return;

    const smref = new URLSearchParams(window.location.search).get('smref');
    if (!smref) return;

    // Lead ids are UUIDs; anything outside a uuid-ish shape is someone
    // playing with the URL and is ignored rather than minted into a person.
    if (!/^[a-zA-Z0-9-]{4,64}$/.test(smref)) return;

    if (posthog._isIdentified()) return;

    posthog.identify(`lead_${smref}`, {}, { initial_lead_id: smref });
    posthog.capture('outreach_link_visited', {
      lead_id: smref,
      landing_path: window.location.pathname,
    });
  }, []);
}
