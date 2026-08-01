import { apiPost } from "./api-client";
import { apiGet } from "./api-client";
import type {
  CreateOrderResponse,
  FeeQuote,
  VerifyPaymentPayload,
} from "@/types";

/**
 * What a top-up will cost, including any gateway surcharge.
 *
 * Asked of the server rather than worked out here: the gross-up is one
 * calculation and it lives on the server, so a copy in the client could only
 * ever drift away from what the customer is actually charged.
 */
export function getFeeQuote(amount: number): Promise<FeeQuote> {
  return apiGet<FeeQuote>(`/payments/fee-quote?amount=${amount}`);
}

export function createPaymentOrder(
  amount: number,
): Promise<CreateOrderResponse> {
  return apiPost<CreateOrderResponse>("/payments/create-order", { amount });
}

export function verifyPayment(
  payload: VerifyPaymentPayload,
): Promise<{ status: string; message: string }> {
  return apiPost<{ status: string; message: string }>(
    "/payments/verify",
    payload,
  );
}
