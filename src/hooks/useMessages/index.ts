import { useMemo } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { getMessages, checkMessageStatus } from "@/apis/messages.api";
import {
  enumParam,
  numberParam,
  stringParam,
  useUrlFilters,
} from "@/hooks/useUrlFilters";
import type { Message, PaginatedResponse } from "@/types";

export const MESSAGE_STATUS_OPTIONS = [
  "all",
  "initiated",
  "queued",
  "sent",
  "delivered",
  "failed",
  "expired",
] as const;

export type MessageStatusFilter = (typeof MESSAGE_STATUS_OPTIONS)[number];

export const MESSAGE_SORT_OPTIONS = [
  "created_at",
  "sent_at",
  "delivered_at",
  "status",
  "cost",
] as const;

const DEFAULT_LIMIT = 20;

/**
 * Declared at module level and never rebuilt: `useUrlFilters` memoises on this
 * object's identity, so constructing it inside the hook would invalidate the
 * memo on every render.
 */
const MESSAGE_FILTER_SCHEMA = {
  page: numberParam(1),
  limit: numberParam(DEFAULT_LIMIT),
  status: enumParam(MESSAGE_STATUS_OPTIONS, "all"),
  apiKeyId: stringParam("all"),
  from: stringParam(""),
  to: stringParam(""),
  sortBy: enumParam(MESSAGE_SORT_OPTIONS, "created_at"),
  sortOrder: enumParam(["ASC", "DESC"] as const, "DESC"),
} as const;

/** Parses an ISO string from the URL, tolerating a hand-edited value. */
function parseDate(iso: string): Date | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function useMessages() {
  const queryClient = useQueryClient();
  const { filters, setFilters, resetFilters, hasActiveFilters } =
    useUrlFilters(MESSAGE_FILTER_SCHEMA);

  const dateRange = useMemo(() => {
    const from = parseDate(filters.from);
    const to = parseDate(filters.to);
    return from && to ? { from, to } : null;
  }, [filters.from, filters.to]);

  const { data, isLoading, isPlaceholderData, refetch, isFetching } = useQuery<
    PaginatedResponse<Message>
  >({
    // Every filter is part of the key, so React Query caches each distinct
    // view separately and `keepPreviousData` can hold the previous page on
    // screen while the next one loads instead of flashing a skeleton.
    queryKey: ["messages", filters],
    queryFn: () =>
      getMessages({
        page: filters.page,
        limit: filters.limit,
        startDate: filters.from || undefined,
        endDate: filters.to || undefined,
        status: filters.status,
        apiKeyId: filters.apiKeyId,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      }),
    placeholderData: keepPreviousData,
  });

  const checkStatusMutation = useMutation({
    mutationFn: (id: string) => checkMessageStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });

  return {
    messages: data?.data ?? [],
    pagination: data?.pagination ?? null,
    isLoading,
    isPlaceholderData,
    isFetching,

    page: filters.page,
    limit: filters.limit,
    status: filters.status,
    apiKeyId: filters.apiKeyId,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
    dateRange,
    hasActiveFilters,

    setPage: (page: number) => setFilters({ page }, { keepPage: true }),
    setLimit: (limit: number) => setFilters({ limit }),
    setStatus: (status: (typeof MESSAGE_STATUS_OPTIONS)[number]) =>
      setFilters({ status }),
    setApiKeyId: (apiKeyId: string) => setFilters({ apiKeyId }),
    setSort: (
      sortBy: (typeof MESSAGE_SORT_OPTIONS)[number],
      sortOrder: "ASC" | "DESC",
    ) => setFilters({ sortBy, sortOrder }),
    onDateRangeChange: (range: { from: Date; to: Date } | null) =>
      setFilters({
        from: range ? range.from.toISOString() : "",
        to: range ? range.to.toISOString() : "",
      }),
    resetFilters,

    refetch,
    refresh: refetch,
    checkStatus: checkStatusMutation.mutate,
    isCheckingStatus: checkStatusMutation.isPending,
    checkingStatusId: checkStatusMutation.variables,
  };
}
