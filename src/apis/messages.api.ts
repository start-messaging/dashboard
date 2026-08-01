import { apiGetPaginated, apiPost } from "./api-client";
import { buildQueryString, omitNeutral } from "@/lib/query-string";
import type { Message, PaginatedResponse } from "@/types";

export interface MessageListParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
  apiKeyId?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export function getMessages(
  params: MessageListParams,
): Promise<PaginatedResponse<Message>> {
  return apiGetPaginated<Message>(
    `/messages${buildQueryString({
      ...params,
      status: omitNeutral(params.status),
      apiKeyId: omitNeutral(params.apiKeyId),
    })}`,
  );
}

export function checkMessageStatus(id: string): Promise<Message> {
  return apiPost<Message>(`/messages/${id}/check-status`);
}
