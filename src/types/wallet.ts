export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
}

export interface CreateOrderResponse {
  paymentId: string;
  gatewayOrderId: string;
  /** Base top-up credited to the wallet, in micros. */
  baseAmountMicros: number;
  /** Razorpay platform fee passed to the customer, in micros. */
  convenienceFeeMicros: number;
  /** GST on the fee, in micros. */
  gstMicros: number;
  /** Total charged = base + fee + GST, in micros. */
  totalAmountMicros: number;
  /** Total charged in paise (smallest unit) for the Razorpay widget. */
  gatewayAmount: number;
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
