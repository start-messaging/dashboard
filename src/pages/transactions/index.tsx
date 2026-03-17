import { 
  ArrowLeftRight, 
  ChevronLeft, 
  ChevronRight, 
  Inbox, 
  X 
} from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatINR } from "@/lib/utils";
import { DateRangePicker } from "@/components/date-range-picker";

export function TransactionsPage() {
  const {
    transactions,
    pagination,
    isLoading,
    isPlaceholderData,
    type,
    setType,
    dateRange,
    setDateRange,
    setPage,
    goToNextPage,
    goToPreviousPage,
  } = useTransactions();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="size-5" />
          <h1 className="text-2xl font-bold">Transactions</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              Filter by type:
            </span>
            <select
              className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Types</option>
              <option value="credit">Credit</option>
              <option value="debit">Debit</option>
              <option value="refund">Refund</option>
            </select>
          </div>

          <DateRangePicker
            dateRange={dateRange ?? { from: new Date(), to: new Date() }}
            onDateRangeChange={(range) => {
              if (range?.from && range?.to) {
                setDateRange({ from: range.from, to: range.to });
              } else {
                setDateRange(null);
              }
              setPage(1);
            }}
          />

          {(type !== "all" || dateRange) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setType("all");
                setDateRange(null);
                setPage(1);
              }}
              className="h-9 text-muted-foreground"
            >
              <X className="mr-1 size-4" />
              Reset
            </Button>
          )}
        </div>
      </div>

      <div
        className={
          isPlaceholderData ? "opacity-50 transition-opacity" : undefined
        }
      >
        {isLoading ? (
          <LoadingSkeleton />
        ) : transactions.length === 0 ? (
          <EmptyState />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Balance After</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="text-muted-foreground">
                    <div className="flex flex-col">
                      <span>
                        {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <span className="text-xs opacity-70">
                        {new Date(tx.createdAt).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{tx.description}</TableCell>
                  <TableCell>
                    <TypeBadge type={tx.type as any} />
                  </TableCell>
                  <TableCell
                    className={`text-right font-medium ${
                      tx.type === "debit"
                        ? "text-red-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {tx.type === "debit" ? "-" : "+"}
                    {formatINR(tx.amount)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatINR(tx.balanceAfter)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousPage}
              disabled={!pagination.hasPreviousPage || isPlaceholderData}
            >
              <ChevronLeft className="mr-1 size-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={!pagination.hasNextPage || isPlaceholderData}
            >
              Next
              <ChevronRight className="ml-1 size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function TypeBadge({ type }: { type: "credit" | "refund" | "debit" }) {
  if (type === "debit") {
    return (
      <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
        Debit
      </Badge>
    );
  }
  if (type === "credit") {
    return (
      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
        Credit
      </Badge>
    );
  }
  return (
    <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
      Refund
    </Badge>
  );
}

function LoadingSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="text-right">Balance After</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-32" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-16" />
            </TableCell>
            <TableCell className="text-right">
              <Skeleton className="ml-auto h-4 w-16" />
            </TableCell>
            <TableCell className="text-right">
              <Skeleton className="ml-auto h-4 w-16" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
      <Inbox className="size-10" />
      <p className="text-sm">No transactions yet</p>
    </div>
  );
}
