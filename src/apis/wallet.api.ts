import { apiGet, apiGetPaginated } from "./api-client";
import type { Wallet, WalletTransaction, PaginatedResponse } from "@/types";

export function getWalletBalance(): Promise<Wallet> {
  return apiGet<Wallet>("/wallet");
}

export function getWalletTransactions(
  page: number,
  limit: number,
): Promise<PaginatedResponse<WalletTransaction>> {
  return apiGetPaginated<WalletTransaction>(
    `/wallet/transactions?page=${page}&limit=${limit}`,
  );
}
