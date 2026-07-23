import {
  partnerGet,
  partnerPost,
  partnerPatch,
  partnerGetPaginated,
} from "./partner-client";
import type {
  PartnerProfile,
  PartnerStats,
  Referral,
  Commission,
  Payout,
  PayoutDetailsInput,
  PaginatedResponse,
} from "@/types";

export function getPartnerStats(): Promise<PartnerStats> {
  return partnerGet<PartnerStats>("/partner/stats");
}

export function updatePayoutDetails(
  payoutDetails: PayoutDetailsInput,
): Promise<PartnerProfile> {
  return partnerPatch<PartnerProfile>("/partner/payout-details", {
    payoutDetails,
  });
}

export function requestPayout(
  payoutDetails?: PayoutDetailsInput,
): Promise<Payout> {
  return partnerPost<Payout>("/partner/payouts", { payoutDetails });
}

export function listReferrals(
  page: number,
  limit = 10,
): Promise<PaginatedResponse<Referral>> {
  return partnerGetPaginated<Referral>(
    `/partner/referrals?page=${page}&limit=${limit}`,
  );
}

export function listCommissions(
  page: number,
  limit = 10,
): Promise<PaginatedResponse<Commission>> {
  return partnerGetPaginated<Commission>(
    `/partner/commissions?page=${page}&limit=${limit}`,
  );
}

export function listPayouts(
  page: number,
  limit = 10,
): Promise<PaginatedResponse<Payout>> {
  return partnerGetPaginated<Payout>(
    `/partner/payouts?page=${page}&limit=${limit}`,
  );
}
