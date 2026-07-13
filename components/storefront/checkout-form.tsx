"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RazorpayCheckoutButton } from "@/components/storefront/razorpay-checkout-button";
import { addressSnapshotSchema } from "@/features/orders/order.schema";
import { formatINR } from "@/lib/utils/format";
import type { CustomerAccount } from "@/features/customer-auth/customer-account.types";
import type { CartSummary } from "@/features/cart/cart.types";

const checkoutFormSchema = z.object({
  shipping: addressSnapshotSchema,
  billing: addressSnapshotSchema,
});
type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

function AddressFields({
  prefix,
  form,
}: {
  prefix: "shipping" | "billing";
  form: UseFormReturn<CheckoutFormValues>;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField
        control={form.control}
        name={`${prefix}.line1`}
        render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel>Address line 1</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={`${prefix}.line2`}
        render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel>Address line 2 (optional)</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={`${prefix}.city`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>City</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={`${prefix}.state`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>State</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={`${prefix}.pincode`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Pincode</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={`${prefix}.phone`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Phone</FormLabel>
            <FormControl>
              <Input type="tel" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

interface CheckoutFormProps {
  customer: CustomerAccount;
  summary: CartSummary;
}

export function CheckoutForm({ customer, summary }: CheckoutFormProps) {
  const defaultAddress =
    customer.addresses.find((a) => a.isDefault) ?? customer.addresses[0];
  const [sameAsShipping, setSameAsShipping] = useState(true);

  const baseAddress = {
    label: defaultAddress?.label ?? "Home",
    line1: defaultAddress?.line1 ?? "",
    line2: defaultAddress?.line2 ?? "",
    city: defaultAddress?.city ?? "",
    state: defaultAddress?.state ?? "",
    pincode: defaultAddress?.pincode ?? "",
    phone: customer.phone ?? "",
  };

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: { shipping: baseAddress, billing: baseAddress },
  });

  const shippingValues = form.watch("shipping");
  const billingValues = form.watch("billing");

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
      <Form {...form}>
        <div className="space-y-8">
          <div>
            <h2 className="mb-4 font-heading text-lg">Shipping Address</h2>
            <Card className="border-border/60">
              <CardContent className="pt-2">
                <AddressFields prefix="shipping" form={form} />
              </CardContent>
            </Card>
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-heading text-lg">Billing Address</h2>
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="same-as-shipping"
                  className="text-sm text-muted-foreground"
                >
                  Same as shipping
                </Label>
                <Switch
                  id="same-as-shipping"
                  checked={sameAsShipping}
                  onCheckedChange={setSameAsShipping}
                />
              </div>
            </div>
            {!sameAsShipping && (
              <Card className="border-border/60">
                <CardContent className="pt-2">
                  <AddressFields prefix="billing" form={form} />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </Form>

      <div className="h-fit space-y-4 rounded-2xl border border-border p-5">
        <h2 className="font-heading text-lg">Order Summary</h2>
        <div className="space-y-2 text-sm">
          {summary.lines.map((line) => (
            <div key={line.product.id} className="flex justify-between">
              <span className="text-muted-foreground">
                {line.product.name.en} × {line.quantity}
              </span>
              <span>{formatINR(line.lineTotal)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-border pt-2">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatINR(summary.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span>
              {summary.shipping === 0 ? "Free" : formatINR(summary.shipping)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">GST</span>
            <span>{formatINR(summary.tax)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
            <span>Grand Total</span>
            <span>{formatINR(summary.grandTotal)}</span>
          </div>
        </div>
        <RazorpayCheckoutButton
          email={customer.email}
          name={customer.name}
          phone={customer.phone}
          shippingAddress={sameAsShipping ? shippingValues : shippingValues}
          billingAddress={sameAsShipping ? shippingValues : billingValues}
        />
      </div>
    </div>
  );
}
