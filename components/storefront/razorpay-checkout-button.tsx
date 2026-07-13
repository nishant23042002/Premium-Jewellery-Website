"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { clientEnv } from "@/config/env";
import { ROUTES } from "@/constants/routes";
import { SITE } from "@/constants/site";
import type { AddressSnapshot } from "@/features/orders/order.types";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void };
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: { ondismiss?: () => void };
}

interface RazorpayCheckoutButtonProps {
  email: string;
  name: string;
  phone?: string;
  shippingAddress: AddressSnapshot;
  billingAddress: AddressSnapshot;
}

/**
 * Loads Razorpay's hosted `checkout.js` and drives the full flow: create a
 * Razorpay order (amount computed server-side from the live cart), open the
 * widget, and on the client-reported success POST the payment IDs + a
 * signature to /api/razorpay/verify — which is the ONLY place that actually
 * verifies the payment and creates the Order. This component never treats
 * a successful Razorpay callback as a completed purchase on its own.
 */
export function RazorpayCheckoutButton({
  email,
  name,
  phone,
  shippingAddress,
  billingAddress,
}: RazorpayCheckoutButtonProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);

  async function handlePlaceOrder() {
    setIsProcessing(true);
    try {
      const createRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shippingAddress, billingAddress, email }),
      });
      const createData = await createRes.json();

      if (!createRes.ok) {
        toast.error("Couldn't start payment", createData.error);
        setIsProcessing(false);
        return;
      }

      const razorpay = new window.Razorpay({
        key: clientEnv.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: createData.amount,
        currency: createData.currency,
        name: SITE.name,
        order_id: createData.razorpayOrderId,
        prefill: { name, email, contact: phone },
        theme: { color: "#a3773f" },
        handler: async (response) => {
          const verifyRes = await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...response,
              shippingAddress,
              billingAddress,
            }),
          });
          const verifyData = await verifyRes.json();

          if (!verifyRes.ok) {
            toast.error("Payment couldn't be confirmed", verifyData.error);
            setIsProcessing(false);
            return;
          }

          router.push(ROUTES.orderConfirmation(verifyData.orderId));
        },
        modal: {
          ondismiss: () => setIsProcessing(false),
        },
      });

      razorpay.open();
    } catch {
      toast.error("Couldn't start payment", "Please try again.");
      setIsProcessing(false);
    }
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onReady={() => setScriptReady(true)}
      />
      <Button
        variant="gold"
        className="w-full"
        disabled={isProcessing || !scriptReady}
        onClick={handlePlaceOrder}
      >
        {isProcessing && <Loader2 className="size-4 animate-spin" />}
        Place Order
      </Button>
    </>
  );
}
