import { useState } from "react";
import { startOfDay, endOfDay, format } from "date-fns";
import {
  Activity,
  CheckCircle,
  XCircle,
  IndianRupee,
  MessageSquare,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DateRangePicker } from "@/components/date-range-picker";
import { formatINR } from "@/lib/utils";

export function DashboardPage() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState(() => ({
    from: startOfDay(new Date()),
    to: endOfDay(new Date()),
  }));

  const startDate = dateRange.from.toISOString();
  const endDate = dateRange.to.toISOString();
  const { data: stats, isLoading } = useDashboardStats(startDate, endDate);

  const isToday =
    format(dateRange.from, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd") &&
    format(dateRange.to, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

  const rangeLabel = isToday
    ? "Today"
    : format(dateRange.from, "yyyy-MM-dd") ===
        format(dateRange.to, "yyyy-MM-dd")
      ? format(dateRange.from, "MMM d, yyyy")
      : `${format(dateRange.from, "MMM d")} – ${format(dateRange.to, "MMM d, yyyy")}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">
          Welcome{user?.firstName ? `, ${user.firstName}` : ""}
        </h1>
        <DateRangePicker
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-muted-foreground">
          {rangeLabel}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Messages Requested"
            value={stats?.filtered.requested}
            icon={Activity}
            isLoading={isLoading}
          />
          <StatsCard
            title="Delivered"
            value={stats?.filtered.delivered}
            icon={CheckCircle}
            isLoading={isLoading}
          />
          <StatsCard
            title="Failed"
            value={stats?.filtered.failed}
            icon={XCircle}
            isLoading={isLoading}
          />
          <StatsCard
            title={`${rangeLabel} Cost`}
            value={stats?.filtered.cost}
            icon={IndianRupee}
            isLoading={isLoading}
            isCurrency
          />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-muted-foreground">
          All Time
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <StatsCard
            title="Total Messages"
            value={stats?.total.messages}
            icon={MessageSquare}
            isLoading={isLoading}
          />
          <StatsCard
            title="Total Spend"
            value={stats?.total.cost}
            icon={TrendingUp}
            isLoading={isLoading}
            isCurrency
          />
        </div>
      </div>
    </div>
  );
}

function StatsCard({
  title,
  value,
  icon: Icon,
  isLoading,
  isCurrency = false,
}: {
  title: string;
  value: number | undefined;
  icon: React.ElementType;
  isLoading: boolean;
  isCurrency?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-7 w-24" />
        ) : (
          <p className="text-2xl font-semibold">
            {isCurrency
              ? formatINR(value ?? 0)
              : (value ?? 0).toLocaleString("en-IN")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
