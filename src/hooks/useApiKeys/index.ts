import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getApiKeys,
  createApiKey,
  deleteApiKey,
  getUsageGuide,
} from "@/apis/api-keys.api";

const API_KEYS_QUERY_KEY = ["api-keys"] as const;
const USAGE_GUIDE_QUERY_KEY = ["usage-guide"] as const;

export function useApiKeys() {
  return useQuery({
    queryKey: API_KEYS_QUERY_KEY,
    queryFn: getApiKeys,
  });
}

export function useCreateApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (label: string) => createApiKey(label),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: API_KEYS_QUERY_KEY });
    },
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
