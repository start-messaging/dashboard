export type TemplateStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "rejected";

export interface OtpTemplate {
  id: string;
  name: string;
  body: string;
  status: TemplateStatus;
  language: string | null;
  channelId?: string;
  userId?: string | null;
  rejectionReason?: string | null;
  submittedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface Channel {
  id: string;
  name: string;
  displayName: string;
  isActive: boolean;
}

export interface CreateTemplatePayload {
  name: string;
  body: string;
  channelId: string;
  language?: string;
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
