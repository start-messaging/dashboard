export interface StatusHistoryEntry {
  status: string;
  timestamp: string;
}

export interface Message {
  id: string;
  phoneNumber: string;
  content: string;
  status: "QUEUED" | "SENT" | "DELIVERED" | "FAILED" | "EXPIRED";
  statusHistory: StatusHistoryEntry[];
  costAmount: string;
  failureReason: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
}
