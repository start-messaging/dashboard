import { useQuery } from "@tanstack/react-query";
import { getDashboardStats, getDashboardTrends } from "@/apis/dashboard.api";
import type { DashboardStats } from "@/types";

export function useDashboardStats(startDate?: string, endDate?: string) {
  return useQuery<DashboardStats>({
    queryKey: ["dashboard", "stats", startDate, endDate],
    queryFn: () => getDashboardStats(startDate, endDate),
  });
}
export function useDashboardTrends(days = 7) {
  return useQuery({
    queryKey: ["dashboard", "trends", days],
    queryFn: () => getDashboardTrends(days),
  });
}
