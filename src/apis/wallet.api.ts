import { apiGet, apiGetPaginated } from "./api-client";
import { buildQueryString } from "@/lib/query-string";
import type { Wallet, WalletTransaction, PaginatedResponse } from "@/types";

export interface TransactionListParams {
  page?: number;
  limit?: number;
  type?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export function getWalletBalance(): Promise<Wallet> {
  return apiGet<Wallet>("/wallet");
}

export function getWalletTransactions(
  params: TransactionListParams,
): Promise<PaginatedResponse<WalletTransaction>> {
  return apiGetPaginated<WalletTransaction>(
    `/wallet/transactions${buildQueryString(params)}`,
  );
}
