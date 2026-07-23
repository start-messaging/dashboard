import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { ROUTES } from "@/lib/constants";
import type { PartnerProfile } from "@/types";
import { partnerMe, partnerLogout } from "../api/partner-auth.api";
import {
  clearPartnerTokens,
  getPartnerAccessToken,
  setPartnerTokens,
} from "../api/partner-client";

const PARTNER_AUTH_KEY = ["partner", "me"] as const;

function hasToken() {
  return !!getPartnerAccessToken();
}

/**
 * The partner portal's own session hook — the analogue of the customer
 * `useAuth`, but backed by the partner token store and `/partner/auth/me`.
 */
export function usePartnerAuth() {
  const queryClient = useQueryClient();

  const { data: partner, isLoading } = useQuery<PartnerProfile>({
    queryKey: PARTNER_AUTH_KEY,
    queryFn: partnerMe,
    enabled: hasToken(),
    retry: false,
  });

  const authenticate = useCallback(
    (accessToken: string, refreshToken: string, profile: PartnerProfile) => {
      setPartnerTokens(accessToken, refreshToken);
      queryClient.setQueryData(PARTNER_AUTH_KEY, profile);
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    try {
      await partnerLogout();
    } finally {
      clearPartnerTokens();
      queryClient.removeQueries({ queryKey: ["partner"] });
      window.location.href = ROUTES.PARTNER_LOGIN;
    }
  }, [queryClient]);

  return {
    partner: partner ?? null,
    isLoading: hasToken() && isLoading,
    isAuthenticated: !!partner,
    authenticate,
    logout,
  };
}
