import { apiGetPaginated, apiPost } from "./api-client";
import type { Message, PaginatedResponse } from "@/types";

export function getMessages(
  page: number,
  limit: number,
  startDate?: string,
  endDate?: string,
  status?: string,
  apiKeyId?: string,
): Promise<PaginatedResponse<Message>> {
  let url = `/messages?page=${page}&limit=${limit}`;
  if (startDate) url += `&startDate=${encodeURIComponent(startDate)}`;
  if (endDate) url += `&endDate=${encodeURIComponent(endDate)}`;
  if (status && status !== "all") url += `&status=${encodeURIComponent(status)}`;
  if (apiKeyId && apiKeyId !== "all") url += `&apiKeyId=${encodeURIComponent(apiKeyId)}`;
  return apiGetPaginated<Message>(url);
}

export function checkMessageStatus(id: string): Promise<Message> {
  return apiPost<Message>(`/messages/${id}/check-status`);
}
