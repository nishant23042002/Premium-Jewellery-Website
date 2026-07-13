"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { updateTrackingInfo } from "@/features/orders/order.actions";
import {
  updateTrackingSchema,
  type UpdateTrackingInput,
} from "@/features/orders/order.schema";
import { toast } from "@/lib/toast";

export function OrderTrackingForm({
  orderId,
  trackingNumber,
  courier,
}: {
  orderId: string;
  trackingNumber?: string;
  courier?: string;
}) {
  const router = useRouter();

  const form = useForm<UpdateTrackingInput>({
    resolver: zodResolver(updateTrackingSchema),
    defaultValues: {
      trackingNumber: trackingNumber ?? "",
      courier: courier ?? "",
    },
  });

  async function onSubmit(values: UpdateTrackingInput) {
    const result = await updateTrackingInfo(orderId, values);
    if (!result.success) {
      toast.error("Couldn't update tracking", result.error);
      return;
    }
    toast.success("Tracking updated");
    router.refresh();
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-wrap items-end gap-3"
      >
        <FormField
          control={form.control}
          name="courier"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Courier</FormLabel>
              <FormControl>
                <Input placeholder="Bluedart" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="trackingNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tracking Number</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting && (
            <Loader2 className="size-3.5 animate-spin" />
          )}
          Save
        </Button>
      </form>
    </Form>
  );
}
