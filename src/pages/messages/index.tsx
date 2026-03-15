import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Inbox,
  Loader2,
  MessageSquare,
  RefreshCw,
  X,
  Eye,
  Filter,
} from "lucide-react";
import { useMessages } from "@/hooks/useMessages";
import { useApiKeys } from "@/hooks/useApiKeys";
import { DateRangePicker } from "@/components/date-range-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
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
    status,
    setStatus,
    apiKeyId,
    setApiKeyId,
    refresh,
    isFetching,
  } = useMessages();

  const { data: apiKeys } = useApiKeys();
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-5 text-primary" />
          <h1 className="text-2xl font-bold">Message History</h1>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
            onClick={() => refresh()}
            disabled={isFetching}
            title="Refresh messages"
          >
            <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-8 w-[130px] border-none bg-transparent focus:ring-0">
                <Filter className="mr-2 size-3.5 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="initiated">Initiated</SelectItem>
                <SelectItem value="queued">Queued</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>

            <Separator orientation="vertical" className="h-4 bg-border/50" />

            <Select value={apiKeyId} onValueChange={setApiKeyId}>
              <SelectTrigger className="h-8 w-[160px] border-none bg-transparent focus:ring-0">
                <SelectValue placeholder="All API Keys" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All API Keys</SelectItem>
                {apiKeys?.map((key) => (
                  <SelectItem key={key.id} value={key.id}>
                    {key.label} ({key.keyPrefix}...)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DateRangePicker
            dateRange={dateRange ?? { from: new Date(), to: new Date() }}
            onDateRangeChange={onDateRangeChange}
          />

          {(dateRange || status !== "all" || apiKeyId !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onDateRangeChange(null);
                setStatus("all");
                setApiKeyId("all");
              }}
              className="h-8 text-muted-foreground"
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
        ) : messages.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>API Key</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map((msg) => (
                  <TableRow key={msg.id} className="group transition-colors hover:bg-muted/30">
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm">
                          {new Date(msg.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <span className="text-[10px] opacity-70">
                          {new Date(msg.createdAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{msg.phoneNumber}</TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                        {apiKeys?.find((k) => k.id === msg.apiKeyId)?.label || "Platform"}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={msg.status} />
                        {isNonTerminal(msg.status) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              checkStatus(msg.id);
                            }}
                            disabled={isCheckingStatus && checkingStatusId === msg.id}
                          >
                            {isCheckingStatus && checkingStatusId === msg.id ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <RefreshCw className="size-3" />
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium text-xs">
                      ₹{msg.costAmount}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="size-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setSelectedMessage(msg)}
                      >
                        <Eye className="size-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
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

      <MessageDetailsDialog
        message={selectedMessage}
        open={!!selectedMessage}
        onOpenChange={(open) => !open && setSelectedMessage(null)}
        apiKey={apiKeys?.find((k) => k.id === selectedMessage?.apiKeyId)}
      />
    </div>
  );
}

function MessageDetailsDialog({
  message,
  open,
  onOpenChange,
  apiKey,
}: {
  message: Message | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiKey?: any;
}) {
  if (!message) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between mb-2">
            <StatusBadge status={message.status} />
            <span className="text-[10px] text-muted-foreground font-mono">{message.id}</span>
          </div>
          <DialogTitle>Message Details</DialogTitle>
          <DialogDescription>
            Sent on {new Date(message.createdAt).toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-1">
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Recipient
            </label>
            <p className="font-mono text-sm">{message.phoneNumber}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                API Key
              </label>
              <p className="text-sm truncate" title={apiKey?.label || "Platform"}>
                {apiKey?.label || "Platform"}
              </p>
            </div>
            <div className="space-y-1 text-right">
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Cost
              </label>
              <p className="text-sm font-semibold">₹{message.costAmount}</p>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Content Preview
            </label>
            <div className="rounded-md bg-muted p-2.5 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {message.content || "OTP sent"}
            </div>
          </div>

          {message.failureReason && (
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-red-500 uppercase tracking-wider">
                Failure Reason
              </label>
              <div className="rounded-md bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 p-2.5 text-xs text-red-700 dark:text-red-400">
                {message.failureReason}
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Status History
            </label>
            <div className="relative pl-3 space-y-3 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[1px] before:bg-border">
              {message.statusHistory?.map((entry, idx) => (
                <div key={idx} className="relative flex items-start gap-2">
                  <div className="absolute -left-[14.5px] top-1.5 size-2 rounded-full border bg-background" />
                  <div className="flex-1">
                    <p className="text-[11px] font-medium capitalize leading-none">
                      {entry.status}
                    </p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function isNonTerminal(status: Message["status"]) {
  return status === "initiated" || status === "queued" || status === "sent";
}

function StatusBadge({ status }: { status: Message["status"] }) {
  switch (status) {
    case "delivered":
      return (
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          Delivered
        </Badge>
      );
    case "sent":
    case "queued":
      return (
        <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
          {status === "sent" ? "Sent" : "Queued"}
        </Badge>
      );
    case "initiated":
      return (
        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          Initiated
        </Badge>
      );
    case "failed":
      return (
        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
          Failed
        </Badge>
      );
    case "expired":
      return (
        <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400">
          Expired
        </Badge>
      );
    default:
      return null;
  }
}

function LoadingSkeleton() {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Recipient</TableHead>
            <TableHead>API Key</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Cost</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-28" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-16" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="ml-auto h-4 w-10" />
              </TableCell>
              <TableCell>
                <Skeleton className="size-7 rounded-sm" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground border rounded-lg border-dashed">
      <Inbox className="size-10 opacity-20" />
      <p className="text-sm">No messages match your filters</p>
    </div>
  );
}
