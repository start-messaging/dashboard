export interface OtpTemplate {
  id: string;
  name: string;
  body: string;
  status: string;
  language: string;
  createdAt: string;
}

export interface SendOtpPayload {
  phoneNumber: string;
  templateId?: string;
  variables: Record<string, string>;
}

export interface SendOtpResponse {
  otpRequestId: string;
  messageId: string;
  status: string;
}
