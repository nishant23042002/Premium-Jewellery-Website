"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { setDailyRates } from "@/features/metal-rates/metal-rate.actions";
import {
  dailyRatesFormSchema,
  type DailyRatesFormInput,
} from "@/features/metal-rates/metal-rate.schema";
import { toast } from "@/lib/toast";
import type { CurrentRates } from "@/features/metal-rates/metal-rate.actions";

export function RatesForm({ currentRates }: { currentRates: CurrentRates }) {
  const router = useRouter();

  const form = useForm<DailyRatesFormInput>({
    resolver: zodResolver(dailyRatesFormSchema),
    defaultValues: {
      goldRatePerGram: currentRates.gold?.ratePerGram ?? 0,
      silverRatePerGram: currentRates.silver?.ratePerGram ?? 0,
    },
  });

  async function onSubmit(values: DailyRatesFormInput) {
    const result = await setDailyRates(values);
    if (!result.success) {
      toast.error("Couldn't update rates", result.error);
      return;
    }
    toast.success(
      "Today's rates are live",
      "Every product price on the site now reflects this.",
    );
    router.refresh();
  }

  return (
    <Card className="max-w-lg border-gold/30 ring-1 ring-gold/10">
      <CardHeader>
        <CardTitle>Update Today&apos;s Rate</CardTitle>
        <p className="text-xs text-muted-foreground">
          Two numbers, one save — every product price on the site updates
          instantly.
        </p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="goldRatePerGram"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gold (22K) ₹/gram</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        value={
                          typeof field.value === "number" ||
                          typeof field.value === "string"
                            ? field.value
                            : ""
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="silverRatePerGram"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Silver (999) ₹/gram</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        value={
                          typeof field.value === "number" ||
                          typeof field.value === "string"
                            ? field.value
                            : ""
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button
              type="submit"
              variant="gold"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Save Today&apos;s Rate
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
