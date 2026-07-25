import { apiPost } from "./api-client";
import type { CreateOrderResponse, VerifyPaymentPayload } from "@/types";

export function createPaymentOrder(
  amountMicros: number,
): Promise<CreateOrderResponse> {
  return apiPost<CreateOrderResponse>("/payments/create-order", {
    amountMicros,
  });
}

export function verifyPayment(
  payload: VerifyPaymentPayload,
): Promise<{ status: string; message: string }> {
  return apiPost<{ status: string; message: string }>(
    "/payments/verify",
    payload,
  );
}
