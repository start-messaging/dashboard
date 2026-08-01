import { useState } from "react";
import { ArrowLeft, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createPaymentOrder,
  getFeeQuote,
  verifyPayment,
} from "@/apis/payment.api";
import type { FeeQuote } from "@/types";
import { loadRazorpayScript, openRazorpayCheckout } from "@/lib/razorpay";
import { useWallet } from "@/hooks/useWallet";
import { useAuth } from "@/hooks/useAuth";
import { getApiErrorMessage } from "@/lib/api-error";

/** One formatter for every figure on screen, so they cannot disagree. */
function formatINR(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(value);
}

/**
 * Two steps: choose an amount, then confirm what it costs.
 *
 * The amount is deliberately not editable on the review step. Once the total
 * has been shown, changing the figure it was derived from in place would mean
 * the summary and the input could disagree for a frame — and the number the
 * customer agreed to is the one that should reach the gateway. Going back is
 * an explicit act.
 */
type Step = "amount" | "review";

type ButtonState = "idle" | "quoting" | "creating" | "paying" | "verifying";

export function AddMoneyDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<FeeQuote | null>(null);
  const [state, setState] = useState<ButtonState>("idle");
  const { refreshWallet } = useWallet();
  const { user } = useAuth();

  const minAmount = import.meta.env.DEV ? 10 : 1000;
  const numericAmount = Number(amount);
  const isValid = numericAmount >= minAmount;
  const busy = state !== "idle";

  // Derived from the quote rather than hardcoded, so the label cannot claim a
  // rate the server is not charging.
  const feePercent =
    quote && quote.convenienceFee > 0 && quote.amount > 0
      ? Number(((quote.convenienceFee / quote.amount) * 100).toFixed(2))
      : null;

  function reset() {
    setStep("amount");
    setAmount("");
    setQuote(null);
  }

  /** Step 1 → 2. The quote is fetched once, on commit, not while typing. */
  async function handleContinue() {
    if (!isValid || busy) return;
    try {
      setState("quoting");
      setQuote(await getFeeQuote(numericAmount));
      setStep("review");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setState("idle");
    }
  }

  async function handlePay() {
    if (!quote || busy) return;

    try {
      setState("creating");
      await loadRazorpayScript();
      const order = await createPaymentOrder(quote.amount);

      // Close before opening Razorpay: Radix keeps pointer-events trapped
      // inside the dialog otherwise.
      setOpen(false);
      setState("paying");

      openRazorpayCheckout({
        gatewayKey: order.gatewayKey,
        gatewayOrderId: order.gatewayOrderId,
        // The order was raised for the charged total, not the credited amount.
        // Opening checkout with the latter disagrees with the order Razorpay
        // holds the moment a convenience fee is in play.
        amount: order.chargedAmount,
        currency: order.currency,
        name: "StartMessaging",
        description:
          order.convenienceFee > 0
            ? `${formatINR(order.amount)} to wallet + ${formatINR(order.convenienceFee)} fee`
            : `Add ${formatINR(order.amount)} to wallet`,
        prefill: {
          email: user?.email,
          name: `${user?.firstName} ${user?.lastName}`.trim(),
          contact: user?.mobileNumber || undefined,
        },
        onSuccess: async (response) => {
          try {
            setState("verifying");
            await verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            toast.success("Payment successful! Wallet balance updated.");
            refreshWallet();
            reset();
          } catch (err) {
            toast.error(getApiErrorMessage(err));
            // Back to the review step so the same total can be retried.
            setOpen(true);
          } finally {
            setState("idle");
          }
        },
        onDismiss: () => {
          setState("idle");
          // Reopened on the review step: the customer abandoned the gateway,
          // not the amount they had already confirmed.
          setOpen(true);
        },
      });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
      setState("idle");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (busy) return;
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          Add Money
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {step === "amount" ? "Add Money to Wallet" : "Confirm your payment"}
          </DialogTitle>
          <DialogDescription>
            {step === "amount"
              ? `Minimum amount is ${formatINR(minAmount)}.`
              : "Review the total before continuing to payment."}
          </DialogDescription>
        </DialogHeader>

        {step === "amount" ? (
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              min={minAmount}
              step={1}
              autoFocus
              placeholder={String(minAmount)}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void handleContinue()}
              disabled={busy}
            />
            {amount && !isValid && (
              <p className="text-sm text-destructive">
                Minimum amount is {formatINR(minAmount)}
              </p>
            )}
          </div>
        ) : (
          quote && (
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Order summary
              </p>

              <dl className="space-y-1.5 text-sm">
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-muted-foreground">Wallet credit</dt>
                  <dd className="tabular-nums">{formatINR(quote.amount)}</dd>
                </div>

                {quote.convenienceFee > 0 && (
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-muted-foreground">
                      Payment processing fee
                      {feePercent !== null && (
                        <span className="ml-1 text-xs">({feePercent}%)</span>
                      )}
                    </dt>
                    <dd className="tabular-nums">
                      {formatINR(quote.convenienceFee)}
                    </dd>
                  </div>
                )}

                <div className="flex items-baseline justify-between gap-4 border-t pt-1.5 text-base font-semibold">
                  <dt>Total payable</dt>
                  <dd className="tabular-nums">
                    {formatINR(quote.chargedAmount)}
                  </dd>
                </div>
              </dl>

              {quote.convenienceFee > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  The fee covers what the payment gateway charges. Your wallet
                  is credited {formatINR(quote.amount)}.
                </p>
              )}
            </div>
          )
        )}

        <DialogFooter>
          {step === "amount" ? (
            <Button
              onClick={() => void handleContinue()}
              disabled={!isValid || busy}
              className="w-full"
            >
              {state === "quoting" && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Continue
            </Button>
          ) : (
            <div className="flex w-full gap-2">
              <Button
                variant="outline"
                onClick={() => setStep("amount")}
                disabled={busy}
              >
                <ArrowLeft className="size-4" />
                Back
              </Button>
              <Button
                onClick={() => void handlePay()}
                disabled={busy}
                className="flex-1"
              >
                {busy && <Loader2 className="mr-2 size-4 animate-spin" />}
                {state === "creating"
                  ? "Creating order..."
                  : state === "paying"
                    ? "Completing payment..."
                    : state === "verifying"
                      ? "Verifying..."
                      : `Pay ${formatINR(quote?.chargedAmount ?? 0)}`}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
