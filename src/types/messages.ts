export interface StatusHistoryEntry {
  status: string;
  timestamp: string;
}

export interface Message {
  id: string;
  phoneNumber: string;
  apiKeyId: string | null;
  content: string;
  status: "initiated" | "queued" | "sent" | "delivered" | "failed" | "expired";
  statusHistory: StatusHistoryEntry[];
  costAmount: string;
  failureReason: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
}
