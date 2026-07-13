"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { createEnquiry } from "@/features/enquiries/enquiry.actions";
import {
  enquiryFormSchema,
  type EnquiryFormInput,
} from "@/features/enquiries/enquiry.schema";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

interface EnquiryFormProps {
  productId?: string;
  /** Adds a preferred-date input (Reservation page) — folded into the message text on submit since Enquiry has no dedicated date field yet. */
  showDateField?: boolean;
  submitLabel?: string;
  className?: string;
  onSuccess?: () => void;
}

/**
 * Shared enquiry/reservation form — Contact, Reservation, and the product
 * detail "Enquire" CTA all submit through the same `createEnquiry` Server
 * Action (PRD §31), so every lead lands in one admin inbox regardless of
 * which page it came from.
 */
export function EnquiryForm({
  productId,
  showDateField = false,
  submitLabel = "Send Enquiry",
  className,
  onSuccess,
}: EnquiryFormProps) {
  const [preferredDate, setPreferredDate] = useState("");

  // Typed against zod's *input* shape (source optional, pre-`.default()`)
  // — that's what react-hook-form actually holds pre-submit, and what
  // zodResolver's Resolver type expects. Using the output type here would
  // fight the resolver's typing.
  const form = useForm<EnquiryFormInput>({
    resolver: zodResolver(enquiryFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      message: "",
      source: "form",
      productId,
    },
  });

  async function onSubmit(values: EnquiryFormInput) {
    const message = preferredDate
      ? `Preferred visit date: ${preferredDate}\n\n${values.message ?? ""}`.trim()
      : values.message;

    // createEnquiry can reject outright (DB unreachable, etc.), not just
    // return { success: false } — without this try/catch that left the
    // user with no feedback at all and an unhandled rejection in the
    // console instead of a toast.
    try {
      const result = await createEnquiry({
        ...values,
        message,
        source: "form",
      });

      if (!result.success) {
        toast.error("Couldn't send that", result.error);
        return;
      }

      toast.success("Thank you — we'll be in touch shortly.");
      form.reset();
      setPreferredDate("");
      onSuccess?.();
    } catch {
      toast.error(
        "Couldn't send that",
        "Please try again, or call the showroom directly.",
      );
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("space-y-4", className)}
      >
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

        {showDateField && (
          // Plain local state, not an RHF-registered field (folded into the
          // message on submit — see the schema note above), so this uses
          // <Label> directly rather than <FormLabel>/<FormControl>, which
          // require a <FormField>/<FormItem> context this isn't part of.
          <div className="space-y-1.5">
            <Label htmlFor="preferredDate">Preferred visit date</Label>
            <Input
              id="preferredDate"
              type="date"
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
            />
          </div>
        )}

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message (optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us what you're looking for..."
                  rows={4}
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
          {submitLabel}
        </Button>
      </form>
    </Form>
  );
}
