import { useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { getMessages, checkMessageStatus } from "@/apis/messages.api";
import type { Message, PaginatedResponse } from "@/types";

const MESSAGES_LIMIT = 20;

export function useMessages() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("all");
  const [apiKeyId, setApiKeyId] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  } | null>(null);

  const startDate = dateRange?.from.toISOString();
  const endDate = dateRange?.to.toISOString();

  const { data, isLoading, isPlaceholderData, refetch, isFetching } =
    useQuery<PaginatedResponse<Message>>({
      queryKey: ["messages", page, MESSAGES_LIMIT, startDate, endDate, status, apiKeyId],
      queryFn: () => getMessages(page, MESSAGES_LIMIT, startDate, endDate, status, apiKeyId),
      placeholderData: keepPreviousData,
    });

  const checkStatusMutation = useMutation({
    mutationFn: (id: string) => checkMessageStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });

  const onDateRangeChange = (range: { from: Date; to: Date } | null) => {
    setDateRange(range);
    setPage(1);
  };

  const goToNextPage = () => {
    if (data?.pagination.hasNextPage) {
      setPage((p) => p + 1);
    }
  };

  const goToPreviousPage = () => {
    if (data?.pagination.hasPreviousPage) {
      setPage((p) => p - 1);
    }
  };

  return {
    messages: data?.data ?? [],
    pagination: data?.pagination ?? null,
    isLoading,
    isPlaceholderData,
    page,
    setPage,
    status,
    setStatus: (s: string) => { setStatus(s); setPage(1); },
    apiKeyId,
    setApiKeyId: (id: string) => { setApiKeyId(id); setPage(1); },
    goToNextPage,
    goToPreviousPage,
    dateRange,
    onDateRangeChange,
    refetch,
    refresh: refetch,
    isFetching,
    checkStatus: checkStatusMutation.mutate,
    isCheckingStatus: checkStatusMutation.isPending,
    checkingStatusId: checkStatusMutation.variables,
  };
}
