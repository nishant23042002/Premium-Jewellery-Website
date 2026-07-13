"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  ProductPicker,
  type PickedProduct,
} from "@/components/storefront/product-picker";
import { createReservation } from "@/features/reservations/reservation.actions";
import {
  reservationFormSchema,
  type ReservationFormInput,
} from "@/features/reservations/reservation.schema";
import { getProductBySlug } from "@/features/products/product.actions";
import { TIME_SLOTS } from "@/constants/reservation";
import { BRANCHES, DEFAULT_BRANCH_ID } from "@/constants/branches";
import { toast } from "@/lib/toast";

interface ReservationFormProps {
  /** Prefills the product picker when arriving from a product's "Reserve This Piece" button. */
  prefillProductSlug?: string;
}

export function ReservationForm({ prefillProductSlug }: ReservationFormProps) {
  const [products, setProducts] = useState<PickedProduct[]>([]);

  const form = useForm<ReservationFormInput>({
    resolver: zodResolver(reservationFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      preferredTimeSlot: "",
      branchId: DEFAULT_BRANCH_ID,
      productIds: [],
      message: "",
    },
  });

  useEffect(() => {
    if (!prefillProductSlug) return;
    getProductBySlug(prefillProductSlug).then((result) => {
      if (!result) return;
      setProducts([
        {
          id: result.product.id,
          name: result.product.name.en,
          slug: result.product.slug,
          imageUrl: result.product.images[0]?.url,
        },
      ]);
    });
  }, [prefillProductSlug]);

  async function onSubmit(values: ReservationFormInput) {
    try {
      const result = await createReservation({
        ...values,
        productIds: products.map((p) => p.id),
      });

      if (!result.success) {
        toast.error("Couldn't submit that", result.error);
        return;
      }

      toast.success(
        "Reservation requested",
        "We'll confirm your slot shortly — thank you!",
      );
      form.reset();
      setProducts([]);
    } catch {
      toast.error(
        "Couldn't submit that",
        "Please try again, or call the showroom directly.",
      );
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full name</FormLabel>
              <FormControl>
                <Input placeholder="Your name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone number</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="+91 98765 43210" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email (optional)</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="preferredDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preferred date</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    min={new Date().toISOString().slice(0, 10)}
                    {...field}
                    value={typeof field.value === "string" ? field.value : ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="preferredTimeSlot"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preferred time</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a slot" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TIME_SLOTS.map((slot) => (
                      <SelectItem key={slot.value} value={slot.value}>
                        {slot.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="branchId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Branch</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a branch" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {BRANCHES.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-1.5">
          <Label>Pieces you&apos;d like to see (optional)</Label>
          <ProductPicker selected={products} onChange={setProducts} />
        </div>

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message (optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Anything else we should know?"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          variant="gold"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting && (
            <Loader2 className="size-4 animate-spin" />
          )}
          Request Reservation
        </Button>
      </form>
    </Form>
  );
}
