import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiPost } from "@/apis/api-client";

/** Guards against re-posting the same code on every render or remount. */
const SESSION_KEY = "sm_ref_seen";

/**
 * Captures `?ref=CODE` from the landing URL and hands it to the server.
 *
 * Everything about the affiliate programme is invisible here by design:
 *
 *  - The code is posted to the server, which sets an **HttpOnly** cookie. It is
 *    never written to localStorage or a readable cookie, so the visitor cannot
 *    see who referred them and cannot forge or edit the attribution.
 *  - The parameter is stripped from the address bar immediately, so the link
 *    they were sent does not look like a tracking link and does not get shared
 *    onward with someone else's code attached.
 *  - Nothing is rendered and no state is exposed. There is deliberately no
 *    "you were referred by…" anywhere in the customer UI.
 *
 * Failures are swallowed: attribution is our bookkeeping, and it must never
 * stop somebody using the product.
 */
export function useReferralCapture(): void {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get("code") || params.get("ref");
    if (!code) return;

    // Strip both parameters, so a failed request cannot leave the code
    // sitting in the URL to be shared or re-fired.
    params.delete("code");
    params.delete("ref");
    const search = params.toString();
    navigate(
      { pathname: location.pathname, search: search ? `?${search}` : "" },
      { replace: true },
    );

    const normalized = code.trim().toUpperCase();
    if (!/^[A-Z0-9]{4,32}$/.test(normalized)) return;

    // The server cookie is the real record; this only stops a duplicate POST
    // within the same tab.
    if (sessionStorage.getItem(SESSION_KEY) === normalized) return;
    sessionStorage.setItem(SESSION_KEY, normalized);

    void apiPost("/affiliate/track", {
      code: normalized,
      landingPath: location.pathname,
    }).catch(() => {
      // Deliberately silent — see above.
    });
  }, [location.pathname, location.search, navigate]);
}
