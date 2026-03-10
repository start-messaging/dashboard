import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { getWalletBalance } from "@/apis/wallet.api";
import type { Wallet } from "@/types";

const WALLET_QUERY_KEY = ["wallet"] as const;

export function useWallet() {
  const queryClient = useQueryClient();

  const { data: wallet, isLoading } = useQuery<Wallet>({
    queryKey: WALLET_QUERY_KEY,
    queryFn: getWalletBalance,
  });

  const refreshWallet = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: WALLET_QUERY_KEY });
  }, [queryClient]);

  return {
    wallet: wallet ?? null,
    balance: wallet?.balance ?? 0,
    currency: wallet?.currency ?? "INR",
    isLoading,
    refreshWallet,
  };
}
