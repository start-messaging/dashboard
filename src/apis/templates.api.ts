import {
  apiGet,
  apiPost,
  apiPatch,
  apiDelete,
  apiGetPaginated,
} from "./api-client";
import type {
  OtpTemplate,
  Channel,
  CreateTemplatePayload,
  PaginatedResponse,
} from "@/types";

export function listMyTemplates(
  page: number,
  limit = 10,
): Promise<PaginatedResponse<OtpTemplate>> {
  return apiGetPaginated<OtpTemplate>(`/templates?page=${page}&limit=${limit}`);
}

export function createTemplate(
  payload: CreateTemplatePayload,
): Promise<OtpTemplate> {
  return apiPost<OtpTemplate>("/templates", payload);
}

export function updateTemplate(
  id: string,
  payload: Partial<CreateTemplatePayload>,
): Promise<OtpTemplate> {
  return apiPatch<OtpTemplate>(`/templates/${id}`, payload);
}

export function submitTemplate(id: string): Promise<OtpTemplate> {
  return apiPost<OtpTemplate>(`/templates/${id}/submit`);
}

export function deleteTemplate(id: string): Promise<{ deleted: boolean }> {
  return apiDelete<{ deleted: boolean }>(`/templates/${id}`);
}

export function getChannels(): Promise<Channel[]> {
  return apiGet<Channel[]>("/channels");
}
