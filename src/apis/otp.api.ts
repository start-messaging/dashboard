import { apiGet, apiPost } from "./api-client";
import type { OtpTemplate, SendOtpPayload, SendOtpResponse } from "@/types";

/** Templates the user can send with: their own approved + system templates. */
export function getTemplates(): Promise<OtpTemplate[]> {
  return apiGet<OtpTemplate[]>("/templates/available");
}

export function sendTestOtp(data: SendOtpPayload): Promise<SendOtpResponse> {
  return apiPost<SendOtpResponse>("/otp/send", data);
}
