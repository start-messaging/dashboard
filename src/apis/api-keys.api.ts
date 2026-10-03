import { apiGet, apiPost, apiPatch, apiDelete } from "./api-client";
import type {
  ApiKey,
  CreateApiKeyPayload,
  CreateApiKeyResponse,
  MyIpResponse,
  UsageGuideResponse,
} from "@/types/api-keys";

export function getApiKeys(): Promise<ApiKey[]> {
  return apiGet<ApiKey[]>("/api-keys");
}

export function createApiKey(
  payload: CreateApiKeyPayload,
): Promise<CreateApiKeyResponse> {
  return apiPost<CreateApiKeyResponse>("/api-keys", payload);
}

/**
 * Replaces a key's allow list outright — the server does not merge.
 *
 * `null` is sent for "no restrictions" rather than `[]`, and the field is always
 * sent: `allowedIps` is `@IsOptional` on the server and an omitted field reaches
 * the service as `undefined`, which it normalises to NULL exactly like an
 * explicit null. So a PATCH that means to change nothing would instead clear the
 * list. Nothing here omits it.
 */
export function updateApiKeyIps(
  id: string,
  allowedIps: string[] | null,
): Promise<ApiKey> {
  return apiPatch<ApiKey>(`/api-keys/${id}/ip-restrictions`, {
    allowedIps: allowedIps && allowedIps.length > 0 ? allowedIps : null,
  });
}

/**
 * The address the API sees this browser as.
 *
 * Read through the API rather than a third-party echo service so it is resolved
 * by the same `req.ip` the allow-list guard checks — including the `trust proxy`
 * handling, which is what makes the two agree.
 */
export function getMyIp(): Promise<MyIpResponse> {
  return apiGet<MyIpResponse>("/api-keys/my-ip");
}

export function deleteApiKey(id: string): Promise<void> {
  return apiDelete<void>(`/api-keys/${id}`);
}

export function getUsageGuide(): Promise<UsageGuideResponse> {
  return apiGet<UsageGuideResponse>("/dashboard/usage-guide");
}
