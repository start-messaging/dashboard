import { apiGet, apiGetPaginated } from "./api-client";
import { buildQueryString, omitNeutral } from "@/lib/query-string";
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
    // `type` is a select; `search` is free text and must reach the API even
    // when the user typed the same word the select uses for "no filter".
    `/wallet/transactions${buildQueryString({
      ...params,
      type: omitNeutral(params.type),
    })}`,
  );
}
