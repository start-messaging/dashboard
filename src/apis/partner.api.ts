import { apiGet, apiPost, apiGetPaginated } from "./api-client";
import type {
  PartnerProfile,
  PartnerStats,
  Referral,
  Commission,
  Payout,
  PayoutDetailsInput,
  PaginatedResponse,
} from "@/types";

export function joinPartner(
  payoutDetails?: PayoutDetailsInput,
): Promise<PartnerProfile> {
  return apiPost<PartnerProfile>("/partner/join", { payoutDetails });
}

export function getPartnerStats(): Promise<PartnerStats> {
  return apiGet<PartnerStats>("/partner/stats");
}

export function listReferrals(
  page: number,
  limit = 10,
): Promise<PaginatedResponse<Referral>> {
  return apiGetPaginated<Referral>(
    `/partner/referrals?page=${page}&limit=${limit}`,
  );
}

export function listCommissions(
  page: number,
  limit = 10,
): Promise<PaginatedResponse<Commission>> {
  return apiGetPaginated<Commission>(
    `/partner/commissions?page=${page}&limit=${limit}`,
  );
}

export function requestPayout(
  payoutDetails?: PayoutDetailsInput,
): Promise<Payout> {
  return apiPost<Payout>("/partner/payouts", { payoutDetails });
}

export function listPayouts(
  page: number,
  limit = 10,
): Promise<PaginatedResponse<Payout>> {
  return apiGetPaginated<Payout>(
    `/partner/payouts?page=${page}&limit=${limit}`,
  );
}
