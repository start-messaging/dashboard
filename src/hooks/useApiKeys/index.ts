import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getApiKeys,
  createApiKey,
  deleteApiKey,
  getMyIp,
  getUsageGuide,
  updateApiKeyIps,
} from "@/apis/api-keys.api";
import type { CreateApiKeyPayload } from "@/types/api-keys";

const API_KEYS_QUERY_KEY = ["api-keys"] as const;
const USAGE_GUIDE_QUERY_KEY = ["usage-guide"] as const;
const MY_IP_QUERY_KEY = ["my-ip"] as const;

export function useApiKeys() {
  return useQuery({
    queryKey: API_KEYS_QUERY_KEY,
    queryFn: getApiKeys,
  });
}

export function useCreateApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateApiKeyPayload) => createApiKey(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: API_KEYS_QUERY_KEY });
    },
  });
}

export function useUpdateApiKeyIps() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      allowedIps,
    }: {
      id: string;
      allowedIps: string[] | null;
    }) => updateApiKeyIps(id, allowedIps),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: API_KEYS_QUERY_KEY });
    },
  });
}

/**
 * Only fetched while a restrictions editor is open (`enabled`), because the
 * answer is a property of the current connection rather than of the account —
 * caching it across a network change would hand the customer a stale address to
 * paste into an allow list, which is the one mistake that locks a key out.
 */
export function useMyIp(enabled = true) {
  return useQuery({
    queryKey: MY_IP_QUERY_KEY,
    queryFn: getMyIp,
    enabled,
    staleTime: 0,
    gcTime: 0,
  });
}

export function useDeleteApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteApiKey(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: API_KEYS_QUERY_KEY });
    },
  });
}

export function useUsageGuide() {
  return useQuery({
    queryKey: USAGE_GUIDE_QUERY_KEY,
    queryFn: getUsageGuide,
  });
}
