import { useState } from "react";
import { Copy, Users, Wallet, TrendingUp, Gift } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatMicros } from "@/lib/money";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  usePartnerStats,
  useRequestPayout,
  useUpdatePayoutDetails,
  useReferrals,
  useCommissions,
  usePayouts,
} from "../hooks/use-partner-data";
import type { PayoutStatus, ReferralStatus, CommissionType } from "@/types";

const payoutTone: Record<PayoutStatus, string> = {
  requested:
    "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

function StatCard(props: {
  icon: React.ElementType;
  label: string;
  value: string;
  hint?: string;
}) {
  const Icon = props.icon;
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {props.label}
        </CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{props.value}</p>
        {props.hint && (
          <p className="text-xs text-muted-foreground">{props.hint}</p>
        )}
      </CardContent>
    </Card>
  );
}

function ReferralsTable() {
  const { data, isLoading } = useReferrals(1);
  if (isLoading) return <Skeleton className="h-40 w-full" />;
  const rows = data?.data ?? [];
  if (rows.length === 0)
    return <p className="text-sm text-muted-foreground">No referrals yet.</p>;
  const tone: Record<ReferralStatus, string> = {
    signed_up: "secondary",
    paid: "default",
  } as never;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Referred user</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Joined</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell>{r.referredUserEmail ?? "—"}</TableCell>
            <TableCell>
              <Badge variant={tone[r.status] as never}>{r.status}</Badge>
            </TableCell>
            <TableCell>{new Date(r.createdAt).toLocaleDateString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function CommissionsTable() {
  const { data, isLoading } = useCommissions(1);
  if (isLoading) return <Skeleton className="h-40 w-full" />;
  const rows = data?.data ?? [];
  if (rows.length === 0)
    return <p className="text-sm text-muted-foreground">No commissions yet.</p>;
  const sign: Record<CommissionType, string> = {
    earn: "+",
    reversal: "+",
    withdrawal: "−",
    adjustment: "",
  };
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Type</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Balance after</TableHead>
          <TableHead>Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((c) => (
          <TableRow key={c.id}>
            <TableCell className="capitalize">{c.type}</TableCell>
            <TableCell>
              {sign[c.type]}
              {formatMicros(c.amountMicros)}
            </TableCell>
            <TableCell>{formatMicros(c.balanceAfterMicros)}</TableCell>
            <TableCell>{new Date(c.createdAt).toLocaleDateString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function PayoutsTable() {
  const { data, isLoading } = usePayouts(1);
  if (isLoading) return <Skeleton className="h-40 w-full" />;
  const rows = data?.data ?? [];
  if (rows.length === 0)
    return <p className="text-sm text-muted-foreground">No payouts yet.</p>;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Window</TableHead>
          <TableHead>Requested</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((p) => (
          <TableRow key={p.id}>
            <TableCell>{formatMicros(p.amountMicros)}</TableCell>
            <TableCell>
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${payoutTone[p.status]}`}
              >
                {p.status}
              </span>
              {p.rejectionReason && (
                <p className="text-xs text-muted-foreground">
                  {p.rejectionReason}
                </p>
              )}
            </TableCell>
            <TableCell>{p.windowMonth}</TableCell>
            <TableCell>{new Date(p.createdAt).toLocaleDateString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function PartnerDashboardPage() {
  const { data: stats, isLoading, isError, refetch } = usePartnerStats();
  const payout = useRequestPayout();
  const saveDetails = useUpdatePayoutDetails();
  const [copied, setCopied] = useState(false);
  const [upi, setUpi] = useState("");

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="p-4">
        <Card className="mx-auto max-w-lg">
          <CardHeader>
            <CardTitle>Couldn't load your dashboard</CardTitle>
            <CardDescription>
              Something went wrong fetching your partner data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => void refetch()}>Try again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const el = stats.eligibility;
  const referralLink = `${window.location.origin}/sign-in?ref=${stats.profile.referralCode}`;
  const savedUpi = String(
    (stats.profile.payoutDetails as Record<string, unknown> | null)?.upiId ??
      "",
  );

  const reason = !el.withinWindow
    ? `Payouts open only between day ${stats.payoutWindow.startDay}–${stats.payoutWindow.endDay} of the month.`
    : !el.meetsPaidUsers
      ? `You need at least ${el.minPaidUsers} paid referrals (you have ${stats.paidUsersCount}).`
      : !el.meetsBalance
        ? `Minimum withdrawal is ${formatMicros(el.minWithdrawalMicros)}.`
        : null;

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-semibold">Affiliate Program</h1>
        <p className="text-sm text-muted-foreground">
          Earn {stats.profile.commissionPercent}% commission on your referrals'
          top-ups.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Your referral link</CardTitle>
          <CardDescription>
            Share this link — anyone who signs up through it is attributed to
            you.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row">
          <code className="flex-1 truncate rounded-md border bg-muted/40 px-3 py-2 text-sm">
            {referralLink}
          </code>
          <Button
            variant="outline"
            onClick={async () => {
              await navigator.clipboard.writeText(referralLink);
              setCopied(true);
              toast.success("Referral link copied");
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            <Copy className="size-4" />
            {copied ? "Copied" : "Copy"}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Wallet}
          label="Withdrawable balance"
          value={formatMicros(stats.earningsBalanceMicros)}
        />
        <StatCard
          icon={TrendingUp}
          label="Lifetime earned"
          value={formatMicros(stats.totalEarnedMicros)}
        />
        <StatCard
          icon={Gift}
          label="Paid referrals"
          value={`${stats.paidUsersCount} / ${el.minPaidUsers}`}
          hint="needed to withdraw"
        />
        <StatCard
          icon={Users}
          label="Total referred"
          value={String(stats.totalReferred)}
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Withdraw earnings</CardTitle>
          <CardDescription>
            Payouts are processed between day {stats.payoutWindow.startDay} and{" "}
            {stats.payoutWindow.endDay} each month once you meet the thresholds.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1 sm:max-w-xs">
            <Label htmlFor="payout-upi">Payout UPI id</Label>
            <Input
              id="payout-upi"
              placeholder={savedUpi || "yourname@bank"}
              value={upi}
              onChange={(e) => setUpi(e.target.value)}
            />
            {savedUpi && !upi && (
              <p className="text-xs text-muted-foreground">On file: {savedUpi}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={!el.canRequestPayout || payout.isPending}
              onClick={() =>
                payout.mutate(upi.trim() ? { upiId: upi.trim() } : undefined, {
                  onSuccess: () => {
                    toast.success("Payout requested");
                    setUpi("");
                  },
                  onError: (e) => toast.error(getApiErrorMessage(e)),
                })
              }
            >
              {payout.isPending
                ? "Requesting..."
                : `Request payout (${formatMicros(stats.earningsBalanceMicros)})`}
            </Button>
            <Button
              variant="outline"
              disabled={!upi.trim() || saveDetails.isPending}
              onClick={() =>
                saveDetails.mutate(
                  { upiId: upi.trim() },
                  {
                    onSuccess: () => {
                      toast.success("Payout details saved");
                      setUpi("");
                    },
                    onError: (e) => toast.error(getApiErrorMessage(e)),
                  },
                )
              }
            >
              {saveDetails.isPending ? "Saving..." : "Save UPI"}
            </Button>
          </div>
          {reason && <p className="text-sm text-muted-foreground">{reason}</p>}
        </CardContent>
      </Card>

      <Tabs defaultValue="referrals">
        <TabsList>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
        </TabsList>
        <TabsContent value="referrals" className="pt-4">
          <ReferralsTable />
        </TabsContent>
        <TabsContent value="commissions" className="pt-4">
          <CommissionsTable />
        </TabsContent>
        <TabsContent value="payouts" className="pt-4">
          <PayoutsTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
