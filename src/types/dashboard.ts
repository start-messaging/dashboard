export interface DashboardStats {
  filtered: {
    requested: number;
    delivered: number;
    failed: number;
    cost: number;
  };
  total: {
    messages: number;
    cost: number;
  };
}
