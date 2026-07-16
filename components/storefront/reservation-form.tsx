"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { t } from "@/lib/i18n/dictionary";
import type { Locale } from "@/types/common";

const LOCAL_TEXT = {
  couldntSubmitThat: {
    en: "Couldn't submit that",
    hi: "उसे सबमिट नहीं किया जा सका",
    mr: "ते सबमिट करता आले नाही",
  },
  reservationRequested: {
    en: "Reservation requested",
    hi: "आरक्षण का अनुरोध किया गया",
    mr: "आरक्षणाची विनंती केली",
  },
  confirmSlotShortly: {
    en: "We'll confirm your slot shortly — thank you!",
    hi: "हम जल्द ही आपका स्लॉट कन्फ़र्म करेंगे — धन्यवाद!",
    mr: "आम्ही लवकरच तुमचा स्लॉट कन्फर्म करू — धन्यवाद!",
  },
  tryAgainOrCall: {
    en: "Please try again, or call the showroom directly.",
    hi: "कृपया पुनः प्रयास करें, या सीधे शोरूम पर कॉल करें।",
    mr: "कृपया पुन्हा प्रयत्न करा, किंवा थेट शोरूमला कॉल करा.",
  },
  anythingElse: {
    en: "Anything else we should know?",
    hi: "क्या हमें कुछ और जानना चाहिए?",
    mr: "आम्हाला आणखी काही सांगायचे आहे का?",
  },
} as const;

interface ReservationFormProps {
  /** Prefills the product picker when arriving from a product's "Reserve This Piece" button. */
  prefillProductSlug?: string;
  /** Prefills name/phone/email when the visitor is signed in — saves them re-typing details we already have. */
  prefillCustomer?: { name: string; phone?: string; email: string };
  /** Called after a successful submit, once the form has reset — lets an embedding page (e.g. My Reservations) refresh its own data instead of relying on navigation. */
  onSuccess?: () => void;
  /**
   * Navigates here after a successful submit (e.g. /account/reservations
   * from the standalone Book a Visit page). Only pass this when the visitor
   * is signed in — a guest reservation has no account to redirect to, so
   * omitting it there keeps today's toast-only confirmation.
   */
  redirectTo?: string;
  locale?: Locale;
}

export function ReservationForm({
  prefillProductSlug,
  prefillCustomer,
  onSuccess,
  redirectTo,
  locale = "en",
}: ReservationFormProps) {
  const router = useRouter();
  const [products, setProducts] = useState<PickedProduct[]>([]);

  const form = useForm<ReservationFormInput>({
    resolver: zodResolver(reservationFormSchema),
    defaultValues: {
      name: prefillCustomer?.name ?? "",
      phone: prefillCustomer?.phone ?? "",
      email: prefillCustomer?.email ?? "",
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
        toast.error(LOCAL_TEXT.couldntSubmitThat[locale], result.error);
        return;
      }

      toast.success(
        LOCAL_TEXT.reservationRequested[locale],
        LOCAL_TEXT.confirmSlotShortly[locale],
      );
      form.reset();
      setProducts([]);
      onSuccess?.();
      if (redirectTo) router.push(redirectTo);
    } catch {
      toast.error(
        LOCAL_TEXT.couldntSubmitThat[locale],
        LOCAL_TEXT.tryAgainOrCall[locale],
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
              <FormLabel>{t("fullNameLabel", locale)}</FormLabel>
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
                <FormLabel>{t("phoneNumber", locale)}</FormLabel>
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
                <FormLabel>{t("emailOptional", locale)}</FormLabel>
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
                <FormLabel>{t("preferredDate", locale)}</FormLabel>
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
                <FormLabel>{t("preferredTime", locale)}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("chooseASlot", locale)} />
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
              <FormLabel>{t("branch", locale)}</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("chooseABranch", locale)} />
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
          <Label>{t("piecesYoudLikeToSee", locale)}</Label>
          <ProductPicker selected={products} onChange={setProducts} />
        </div>

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("messageOptional", locale)}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={LOCAL_TEXT.anythingElse[locale]}
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
          {t("requestReservation", locale)}
        </Button>
      </form>
    </Form>
  );
}
