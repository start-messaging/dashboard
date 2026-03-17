import { apiGet } from "./api-client";
import type { DashboardStats } from "@/types";

export function getDashboardStats(
  startDate?: string,
  endDate?: string,
): Promise<DashboardStats> {
  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  const qs = params.toString();
  return apiGet<DashboardStats>(`/dashboard/stats${qs ? `?${qs}` : ""}`);
}

export function getDashboardTrends(days = 7): Promise<any[]> {
  return apiGet<any[]>(`/dashboard/trends?days=${days}`);
}
