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
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  } | null>(null);

  const startDate = dateRange?.from.toISOString();
  const endDate = dateRange?.to.toISOString();

  const { data, isLoading, isPlaceholderData } =
    useQuery<PaginatedResponse<Message>>({
      queryKey: ["messages", page, MESSAGES_LIMIT, startDate, endDate],
      queryFn: () => getMessages(page, MESSAGES_LIMIT, startDate, endDate),
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
    goToNextPage,
    goToPreviousPage,
    dateRange,
    onDateRangeChange,
    checkStatus: checkStatusMutation.mutate,
    isCheckingStatus: checkStatusMutation.isPending,
    checkingStatusId: checkStatusMutation.variables,
  };
}
