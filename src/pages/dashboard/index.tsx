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
import { useDashboardStats, useDashboardTrends } from "@/hooks/useDashboardStats";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DateRangePicker } from "@/components/date-range-picker";
import { formatINR } from "@/lib/utils";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

export function DashboardPage() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState(() => ({
    from: startOfDay(new Date()),
    to: endOfDay(new Date()),
  }));

  const startDate = dateRange.from.toISOString();
  const endDate = dateRange.to.toISOString();
  const { data: stats, isLoading } = useDashboardStats(startDate, endDate);
  const { data: trends, isLoading: isLoadingTrends } = useDashboardTrends(30);

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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Message Trends</CardTitle>
            <CardDescription className="text-xs">Last 30 days of message requests</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px] pr-2">
             {isLoadingTrends ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trends}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.1} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10 }}
                    minTickGap={30}
                    tickFormatter={(val) => format(new Date(val), 'MMM d')}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      borderColor: 'hsl(var(--border))',
                      fontSize: '12px',
                      borderRadius: '8px'
                    }}
                    labelFormatter={(val) => format(new Date(val), 'MMMM d, yyyy')}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Delivery Ratio</CardTitle>
            <CardDescription className="text-xs">Success vs Failure trends</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px] pr-2">
            {isLoadingTrends ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trends}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.1} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10 }}
                    minTickGap={30}
                    tickFormatter={(val) => format(new Date(val), 'MMM d')}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      borderColor: 'hsl(var(--border))',
                      fontSize: '12px',
                      borderRadius: '8px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="delivered"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.1}
                    strokeWidth={2}
                    stackId="1"
                  />
                  <Area
                    type="monotone"
                    dataKey="failed"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.1}
                    strokeWidth={2}
                    stackId="1"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
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
