import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getWalletTransactions } from "@/apis/wallet.api";
import type { PaginatedResponse, WalletTransaction } from "@/types";

const TRANSACTIONS_LIMIT = 10;

export function useTransactions() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isPlaceholderData } =
    useQuery<PaginatedResponse<WalletTransaction>>({
      queryKey: ["transactions", page, TRANSACTIONS_LIMIT],
      queryFn: () => getWalletTransactions(page, TRANSACTIONS_LIMIT),
      placeholderData: keepPreviousData,
    });

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
    transactions: data?.data ?? [],
    pagination: data?.pagination ?? null,
    isLoading,
    isPlaceholderData,
    page,
    setPage,
    goToNextPage,
    goToPreviousPage,
  };
}
