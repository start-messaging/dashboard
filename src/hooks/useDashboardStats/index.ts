import { useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "@/apis/dashboard.api";
import type { DashboardStats } from "@/types";

export function useDashboardStats(startDate?: string, endDate?: string) {
  return useQuery<DashboardStats>({
    queryKey: ["dashboard", "stats", startDate, endDate],
    queryFn: () => getDashboardStats(startDate, endDate),
  });
}
