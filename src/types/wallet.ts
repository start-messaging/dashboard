export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
}

export interface FeeQuote {
  /** What the wallet will be credited. */
  amount: number;
  /** Gateway surcharge added on top. Zero when the business absorbs it. */
  convenienceFee: number;
  /** What the card is actually charged. */
  chargedAmount: number;
}

export interface CreateOrderResponse extends FeeQuote {
  paymentId: string;
  gatewayOrderId: string;
  currency: string;
  gatewayKey: string;
}

export interface VerifyPaymentPayload {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: "credit" | "refund" | "debit";
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceType: string;
  referenceId: string;
  description: string;
  createdAt: string;
}
