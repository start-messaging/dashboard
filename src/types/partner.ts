export type PartnerStatus = "active" | "suspended";
export type ReferralStatus = "signed_up" | "paid";
export type PayoutStatus = "requested" | "paid" | "rejected";
export type CommissionType = "earn" | "withdrawal" | "reversal" | "adjustment";

export interface PartnerProfile {
  id: string;
  referralCode: string;
  status: PartnerStatus;
  commissionPercent: number;
  earningsBalanceMicros: number;
  totalEarnedMicros: number;
  paidUsersCount: number;
  payoutDetails: Record<string, unknown> | null;
  createdAt: string;
}

export interface PartnerEligibility {
  minPaidUsers: number;
  meetsPaidUsers: boolean;
  minWithdrawalMicros: number;
  meetsBalance: boolean;
  withinWindow: boolean;
  canRequestPayout: boolean;
}

export interface PartnerStats {
  profile: {
    referralCode: string;
    status: PartnerStatus;
    commissionPercent: number;
    payoutDetails: Record<string, unknown> | null;
  };
  totalReferred: number;
  paidUsersCount: number;
  earningsBalanceMicros: number;
  totalEarnedMicros: number;
  eligibility: PartnerEligibility;
  payoutWindow: { startDay: number; endDay: number };
}

export interface Referral {
  id: string;
  referredUserEmail: string | null;
  status: ReferralStatus;
  firstPaidAt: string | null;
  createdAt: string;
}

export interface Commission {
  id: string;
  type: CommissionType;
  amountMicros: number;
  balanceAfterMicros: number;
  referredUserId: string | null;
  paymentId: string | null;
  payoutId: string | null;
  description: string;
  createdAt: string;
}

export interface Payout {
  id: string;
  amountMicros: number;
  currency: string;
  status: PayoutStatus;
  windowMonth: string;
  payoutRef: string | null;
  rejectionReason: string | null;
  processedAt: string | null;
  createdAt: string;
}

export interface PayoutDetailsInput {
  upiId?: string;
  accountNumber?: string;
  ifsc?: string;
  accountHolder?: string;
}
