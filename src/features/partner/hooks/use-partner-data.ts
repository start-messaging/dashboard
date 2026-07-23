import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPartnerStats,
  listCommissions,
  listPayouts,
  listReferrals,
  requestPayout,
  updatePayoutDetails,
} from "../api/partner.api";

const PARTNER_KEY = ["partner"] as const;

export function usePartnerStats() {
  return useQuery({
    queryKey: [...PARTNER_KEY, "stats"],
    queryFn: getPartnerStats,
    retry: false,
  });
}

export function useRequestPayout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: requestPayout,
    onSuccess: () => qc.invalidateQueries({ queryKey: PARTNER_KEY }),
  });
}

export function useUpdatePayoutDetails() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updatePayoutDetails,
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
