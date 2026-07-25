import { useState } from "react";
import { Plus } from "lucide-react";
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
import { createPaymentOrder, verifyPayment } from "@/apis/payment.api";
import { loadRazorpayScript, openRazorpayCheckout } from "@/lib/razorpay";
import { useWallet } from "@/hooks/useWallet";
import { useAuth } from "@/hooks/useAuth";
import { getApiErrorMessage } from "@/lib/api-error";
import { toMicros } from "@/lib/money";
import { formatINR } from "@/lib/utils";

type ButtonState = "idle" | "creating" | "paying" | "verifying";

// Must mirror the server defaults (RAZORPAY_FEE_PERCENT / RAZORPAY_GST_PERCENT);
// this is only an on-screen estimate — the server computes the authoritative
// charge and returns it as gatewayAmount.
const FEE_PERCENT = 2;
const GST_PERCENT = 18;

export function AddMoneyDialog() {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [state, setState] = useState<ButtonState>("idle");
  const { refreshWallet } = useWallet();
  const { user } = useAuth();

  const minAmount = import.meta.env.DEV ? 10 : 1000;
  const numericAmount = Number(amount);
  const isValid = numericAmount >= minAmount;

  const convenienceFee = isValid ? (numericAmount * FEE_PERCENT) / 100 : 0;
  const gst = (convenienceFee * GST_PERCENT) / 100;
  const totalPayable = numericAmount + convenienceFee + gst;

  const buttonLabel: Record<ButtonState, string> = {
    idle: "Proceed to Pay",
    creating: "Creating order...",
    paying: "Completing payment...",
    verifying: "Verifying...",
  };

  async function handlePay() {
    if (!isValid) return;

    try {
      setState("creating");
      await loadRazorpayScript();
      // Send the BASE top-up in micros; the server adds fee + GST on top.
      const order = await createPaymentOrder(toMicros(numericAmount));

      // Close dialog before opening Razorpay to avoid Radix's pointer-events blocking
      setOpen(false);
      setState("paying");

      openRazorpayCheckout({
        gatewayKey: order.gatewayKey,
        gatewayOrderId: order.gatewayOrderId,
        amountPaise: order.gatewayAmount,
        currency: order.currency,
        name: "StartMessaging",
        description: `Add ₹${numericAmount.toLocaleString("en-IN")} to wallet`,
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
            // Dialog is already closed, reset amount
            setAmount("");
          } catch (err) {
            toast.error(getApiErrorMessage(err));
            // Re-open dialog so user can see error or try again
            setOpen(true);
          } finally {
            setState("idle");
          }
        },
        onDismiss: () => {
          setState("idle");
          // Re-open dialog when dismissed
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
        if (state !== "idle") return;
        setOpen(v);
        if (!v) setAmount("");
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
          <DialogTitle>Add Money to Wallet</DialogTitle>
          <DialogDescription>
            Minimum amount is ₹{minAmount.toLocaleString("en-IN")}. Payment
            processing fees apply.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (₹)</Label>
          <Input
            id="amount"
            type="number"
            min={minAmount}
            step={1}
            placeholder={String(minAmount)}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={state !== "idle"}
          />
          {amount && !isValid && (
            <p className="text-sm text-destructive">
              Minimum amount is ₹{minAmount.toLocaleString("en-IN")}
            </p>
          )}
        </div>
        {isValid && (
          <div className="rounded-md border bg-muted/40 p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Wallet credit</span>
              <span>{formatINR(numericAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Convenience fee ({FEE_PERCENT}%)
              </span>
              <span>{formatINR(convenienceFee)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                GST ({GST_PERCENT}%)
              </span>
              <span>{formatINR(gst)}</span>
            </div>
            <div className="flex justify-between border-t pt-1 font-medium">
              <span>You pay</span>
              <span>{formatINR(totalPayable)}</span>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button
            onClick={handlePay}
            disabled={!isValid || state !== "idle"}
            className="w-full"
          >
            {buttonLabel[state]}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
