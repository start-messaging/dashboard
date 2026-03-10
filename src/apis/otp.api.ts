import { apiGet, apiPost } from "./api-client";
import type { OtpTemplate, SendOtpPayload, SendOtpResponse } from "@/types";

export function getTemplates(): Promise<OtpTemplate[]> {
  return apiGet<OtpTemplate[]>("/templates");
}

export function sendTestOtp(data: SendOtpPayload): Promise<SendOtpResponse> {
  return apiPost<SendOtpResponse>("/otp/send", data);
}
