import {
  ChevronLeft,
  ChevronRight,
  Inbox,
  Loader2,
  MessageSquare,
  RefreshCw,
  X,
} from "lucide-react";
import { useMessages } from "@/hooks/useMessages";
import { DateRangePicker } from "@/components/date-range-picker";
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
import type { Message } from "@/types";

export function MessagesPage() {
  const {
    messages,
    pagination,
    isLoading,
    isPlaceholderData,
    goToNextPage,
    goToPreviousPage,
    dateRange,
    onDateRangeChange,
    checkStatus,
    isCheckingStatus,
    checkingStatusId,
  } = useMessages();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-5" />
          <h1 className="text-2xl font-bold">Message History</h1>
        </div>
        <div className="flex items-center gap-2">
          {dateRange && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDateRangeChange(null)}
            >
              <X className="mr-1 size-4" />
              Clear
            </Button>
          )}
          <DateRangePicker
            dateRange={dateRange ?? { from: new Date(), to: new Date() }}
            onDateRangeChange={onDateRangeChange}
          />
        </div>
      </div>

      <div
        className={
          isPlaceholderData ? "opacity-50 transition-opacity" : undefined
        }
      >
        {isLoading ? (
          <LoadingSkeleton />
        ) : messages.length === 0 ? (
          <EmptyState />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.map((msg) => (
                <TableRow key={msg.id}>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {new Date(msg.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </TableCell>
                  <TableCell className="font-mono">{msg.phoneNumber}</TableCell>
                  <TableCell
                    className="max-w-[200px] truncate"
                    title={msg.content}
                  >
                    {msg.content}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={msg.status} />
                      {isNonTerminal(msg.status) && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="size-6"
                          onClick={() => checkStatus(msg.id)}
                          disabled={
                            isCheckingStatus && checkingStatusId === msg.id
                          }
                          title="Check delivery status"
                        >
                          {isCheckingStatus && checkingStatusId === msg.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="size-3.5" />
                          )}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ₹{msg.costAmount}
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

function isNonTerminal(status: Message["status"]) {
  return status === "QUEUED" || status === "SENT";
}

function StatusBadge({ status }: { status: Message["status"] }) {
  switch (status) {
    case "DELIVERED":
      return (
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          Delivered
        </Badge>
      );
    case "SENT":
      return (
        <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
          Sent
        </Badge>
      );
    case "QUEUED":
      return (
        <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
          Queued
        </Badge>
      );
    case "FAILED":
      return (
        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
          Failed
        </Badge>
      );
    case "EXPIRED":
      return (
        <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400">
          Expired
        </Badge>
      );
  }
}

function LoadingSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Phone Number</TableHead>
          <TableHead>Message</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Cost</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell>
              <Skeleton className="h-4 w-28" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-40" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-16" />
            </TableCell>
            <TableCell className="text-right">
              <Skeleton className="ml-auto h-4 w-12" />
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
      <p className="text-sm">No messages sent yet</p>
    </div>
  );
}
