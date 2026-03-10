export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
}

export interface CreateOrderResponse {
  paymentId: string;
  gatewayOrderId: string;
  amount: number;
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
  type: "credit" | "refund";
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceType: string;
  referenceId: string;
  description: string;
  createdAt: string;
}
