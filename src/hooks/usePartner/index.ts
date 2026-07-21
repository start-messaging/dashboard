import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPartnerStats,
  joinPartner,
  listCommissions,
  listPayouts,
  listReferrals,
  requestPayout,
} from "@/apis/partner.api";

const PARTNER_KEY = ["partner"] as const;

/**
 * Partner stats. A 404 (NOT_A_PARTNER) means the user hasn't joined yet — the
 * page renders a join CTA in that case, so we don't retry.
 */
export function usePartnerStats() {
  return useQuery({
    queryKey: [...PARTNER_KEY, "stats"],
    queryFn: getPartnerStats,
    retry: false,
  });
}

export function useJoinPartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: joinPartner,
    onSuccess: () => qc.invalidateQueries({ queryKey: PARTNER_KEY }),
  });
}

export function useRequestPayout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: requestPayout,
    onSuccess: () => qc.invalidateQueries({ queryKey: PARTNER_KEY }),
  });
}

export function useReferrals(page: number) {
  return useQuery({
    queryKey: [...PARTNER_KEY, "referrals", page],
    queryFn: () => listReferrals(page),
  });
}

export function useCommissions(page: number) {
  return useQuery({
    queryKey: [...PARTNER_KEY, "commissions", page],
    queryFn: () => listCommissions(page),
  });
}

export function usePayouts(page: number) {
  return useQuery({
    queryKey: [...PARTNER_KEY, "payouts", page],
    queryFn: () => listPayouts(page),
  });
}
