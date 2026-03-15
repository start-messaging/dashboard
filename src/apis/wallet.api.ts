import { apiGet, apiGetPaginated } from "./api-client";
import type { Wallet, WalletTransaction, PaginatedResponse } from "@/types";

export function getWalletBalance(): Promise<Wallet> {
  return apiGet<Wallet>("/wallet");
}

export function getWalletTransactions(
  page: number,
  limit: number,
  type?: string,
  startDate?: string,
  endDate?: string,
): Promise<PaginatedResponse<WalletTransaction>> {
  let url = `/wallet/transactions?page=${page}&limit=${limit}`;
  if (type && type !== "all") url += `&type=${type}`;
  if (startDate) url += `&startDate=${startDate}`;
  if (endDate) url += `&endDate=${endDate}`;
  
  return apiGetPaginated<WalletTransaction>(url);
}
