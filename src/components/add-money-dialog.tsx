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

type ButtonState = "idle" | "creating" | "paying" | "verifying";

export function AddMoneyDialog() {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [state, setState] = useState<ButtonState>("idle");
  const { refreshWallet } = useWallet();
  const { user } = useAuth();

  const minAmount = import.meta.env.DEV ? 10 : 1000;
  const numericAmount = Number(amount);
  const isValid = numericAmount >= minAmount;

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
      const order = await createPaymentOrder(numericAmount);

      // Close dialog before opening Razorpay to avoid Radix's pointer-events blocking
      setOpen(false);
      setState("paying");

      openRazorpayCheckout({
        gatewayKey: order.gatewayKey,
        gatewayOrderId: order.gatewayOrderId,
        amount: order.amount,
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
            Minimum amount is ₹{minAmount.toLocaleString("en-IN")}. Payment processing fees apply.
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
            <p className="text-sm text-destructive">Minimum amount is ₹{minAmount.toLocaleString("en-IN")}</p>
          )}
        </div>
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
