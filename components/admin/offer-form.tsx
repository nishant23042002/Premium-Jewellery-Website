"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { MediaPicker } from "@/components/admin/media-picker";
import { createOffer, updateOffer } from "@/features/offers/offer.actions";
import {
  offerFormSchema,
  type OfferFormInput,
} from "@/features/offers/offer.schema";
import { toast } from "@/lib/toast";
import { ROUTES } from "@/constants/routes";
import type { Offer } from "@/features/offers/offer.types";

export function OfferForm({ offer }: { offer?: Offer }) {
  const router = useRouter();
  const isEditing = !!offer;

  const form = useForm<OfferFormInput>({
    resolver: zodResolver(offerFormSchema),
    defaultValues: {
      slug: offer?.slug ?? "",
      title: offer?.title ?? { en: "", hi: "", mr: "" },
      description: offer?.description ?? { en: "", hi: "", mr: "" },
      terms: offer?.terms ?? { en: "", hi: "", mr: "" },
      validUntil: offer ? new Date(offer.validUntil) : new Date(),
      imageUrl: offer?.imageUrl ?? "",
      isPublished: offer?.isPublished ?? false,
      sortOrder: offer?.sortOrder ?? 0,
    },
  });

  async function onSubmit(values: OfferFormInput) {
    const result = isEditing
      ? await updateOffer(offer.id, values)
      : await createOffer(values);

    if (!result.success) {
      toast.error(
        `Couldn't ${isEditing ? "update" : "create"} offer`,
        result.error,
      );
      return;
    }

    toast.success(`Offer ${isEditing ? "updated" : "created"}`);
    router.push(ROUTES.admin.offers);
    router.refresh();
  }

  const imageUrl = form.watch("imageUrl");
  const validUntilValue = form.watch("validUntil");

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="max-w-2xl space-y-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="title.en"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title (English)</FormLabel>
                <FormControl>
                  <Input placeholder="Making Charge Waiver" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Slug</FormLabel>
                <FormControl>
                  <Input placeholder="making-charge-waiver" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description.en"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (English)</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="terms.en"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Terms (optional)</FormLabel>
              <FormControl>
                <Textarea rows={2} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="validUntil"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valid until</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    onChange={(e) => field.onChange(e.target.value)}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    value={
                      validUntilValue instanceof Date
                        ? validUntilValue.toISOString().slice(0, 10)
                        : typeof validUntilValue === "string"
                          ? validUntilValue
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
            name="sortOrder"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sort order</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    value={
                      typeof field.value === "number" ||
                      typeof field.value === "string"
                        ? field.value
                        : 0
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Image (optional)</Label>
          <div className="flex items-center gap-3">
            {imageUrl && (
              <Image
                src={imageUrl}
                alt="Current offer image"
                width={56}
                height={56}
                className="size-14 rounded-lg border border-border object-cover"
              />
            )}
            <MediaPicker
              value={imageUrl}
              onSelect={(asset) =>
                form.setValue("imageUrl", asset.url, { shouldDirty: true })
              }
              triggerLabel={imageUrl ? "Change image" : "Choose image"}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="isPublished"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-3">
              <div>
                <FormLabel>Published</FormLabel>
                <p className="text-xs text-muted-foreground">
                  Visible on the storefront once on.
                </p>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex gap-2">
          <Button
            type="submit"
            variant="gold"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting && (
              <Loader2 className="size-4 animate-spin" />
            )}
            {isEditing ? "Save Changes" : "Create Offer"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(ROUTES.admin.offers)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
