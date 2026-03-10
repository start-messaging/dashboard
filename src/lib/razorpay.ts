let scriptLoaded = false;

export function loadRazorpayScript(): Promise<void> {
  if (scriptLoaded) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => {
      scriptLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
    document.body.appendChild(script);
  });
}

interface RazorpayCheckoutOptions {
  gatewayKey: string;
  gatewayOrderId: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill?: { email?: string; contact?: string };
  onSuccess: (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  onDismiss?: () => void;
}

export function openRazorpayCheckout(opts: RazorpayCheckoutOptions) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rzp = new (window as any).Razorpay({
    key: opts.gatewayKey,
    amount: opts.amount * 100, // Razorpay expects paise
    currency: opts.currency,
    name: opts.name,
    description: opts.description,
    order_id: opts.gatewayOrderId,
    prefill: opts.prefill,
    handler: opts.onSuccess,
    modal: {
      ondismiss: opts.onDismiss,
    },
  });
  rzp.open();
}
