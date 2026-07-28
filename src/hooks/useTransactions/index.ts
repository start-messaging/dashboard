import { useMemo } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getWalletTransactions } from "@/apis/wallet.api";
import {
  enumParam,
  numberParam,
  stringParam,
  useUrlFilters,
} from "@/hooks/useUrlFilters";
import type { PaginatedResponse, WalletTransaction } from "@/types";

export const TRANSACTION_TYPE_OPTIONS = [
  "all",
  "credit",
  "debit",
  "refund",
] as const;

export type TransactionTypeFilter = (typeof TRANSACTION_TYPE_OPTIONS)[number];

export const TRANSACTION_SORT_OPTIONS = [
  "created_at",
  "amount",
  "type",
  "balance_after",
] as const;

const DEFAULT_LIMIT = 10;

/** Module-level so `useUrlFilters` can memoise on a stable identity. */
const TRANSACTION_FILTER_SCHEMA = {
  page: numberParam(1),
  limit: numberParam(DEFAULT_LIMIT),
  type: enumParam(TRANSACTION_TYPE_OPTIONS, "all"),
  from: stringParam(""),
  to: stringParam(""),
  search: stringParam(""),
  sortBy: enumParam(TRANSACTION_SORT_OPTIONS, "created_at"),
  sortOrder: enumParam(["ASC", "DESC"] as const, "DESC"),
} as const;

function parseDate(iso: string): Date | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function useTransactions() {
  const { filters, setFilters, resetFilters, hasActiveFilters } = useUrlFilters(
    TRANSACTION_FILTER_SCHEMA,
  );

  const dateRange = useMemo(() => {
    const from = parseDate(filters.from);
    const to = parseDate(filters.to);
    return from && to ? { from, to } : null;
  }, [filters.from, filters.to]);

  const { data, isLoading, isPlaceholderData, isFetching } = useQuery<
    PaginatedResponse<WalletTransaction>
  >({
    queryKey: ["transactions", filters],
    queryFn: () =>
      getWalletTransactions({
        page: filters.page,
        limit: filters.limit,
        type: filters.type,
        startDate: filters.from || undefined,
        endDate: filters.to || undefined,
        search: filters.search || undefined,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      }),
    placeholderData: keepPreviousData,
  });

  return {
    transactions: data?.data ?? [],
    pagination: data?.pagination ?? null,
    isLoading,
    isPlaceholderData,
    isFetching,

    page: filters.page,
    limit: filters.limit,
    type: filters.type,
    search: filters.search,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
    dateRange,
    hasActiveFilters,

    setPage: (page: number) => setFilters({ page }, { keepPage: true }),
    setLimit: (limit: number) => setFilters({ limit }),
    setType: (type: (typeof TRANSACTION_TYPE_OPTIONS)[number]) =>
      setFilters({ type }),
    // Replaces the history entry: typing a search should not bury the previous
    // page under one back-button step per keystroke.
    setSearch: (search: string) => setFilters({ search }, { replace: true }),
    setSort: (
      sortBy: (typeof TRANSACTION_SORT_OPTIONS)[number],
      sortOrder: "ASC" | "DESC",
    ) => setFilters({ sortBy, sortOrder }),
    setDateRange: (range: { from: Date; to: Date } | null) =>
      setFilters({
        from: range ? range.from.toISOString() : "",
        to: range ? range.to.toISOString() : "",
      }),
    resetFilters,
  };
}
