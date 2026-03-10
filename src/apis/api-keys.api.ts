import { apiGet, apiPost, apiDelete } from "./api-client";
import type {
  ApiKey,
  CreateApiKeyResponse,
  UsageGuideResponse,
} from "@/types/api-keys";

export function getApiKeys(): Promise<ApiKey[]> {
  return apiGet<ApiKey[]>("/api-keys");
}

export function createApiKey(label: string): Promise<CreateApiKeyResponse> {
  return apiPost<CreateApiKeyResponse>("/api-keys", { label });
}

export function deleteApiKey(id: string): Promise<void> {
  return apiDelete<void>(`/api-keys/${id}`);
}

export function getUsageGuide(): Promise<UsageGuideResponse> {
  return apiGet<UsageGuideResponse>("/dashboard/usage-guide");
}
