"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  createHeroSlide,
  updateHeroSlide,
} from "@/features/hero-slides/hero-slide.actions";
import {
  heroSlideFormSchema,
  type HeroSlideFormInput,
} from "@/features/hero-slides/hero-slide.schema";
import { toast } from "@/lib/toast";
import { ROUTES } from "@/constants/routes";
import type { HeroSlide } from "@/features/hero-slides/hero-slide.types";

export function HeroSlideForm({ slide }: { slide?: HeroSlide }) {
  const router = useRouter();
  const isEditing = !!slide;

  const form = useForm<HeroSlideFormInput>({
    resolver: zodResolver(heroSlideFormSchema),
    defaultValues: {
      mobileImageUrl: slide?.mobileImageUrl ?? "",
      desktopImageUrl: slide?.desktopImageUrl ?? "",
      altText: slide?.altText ?? "",
      sortOrder: slide?.sortOrder ?? 0,
      isPublished: slide?.isPublished ?? false,
    },
  });

  async function onSubmit(values: HeroSlideFormInput) {
    const result = isEditing
      ? await updateHeroSlide(slide.id, values)
      : await createHeroSlide(values);

    if (!result.success) {
      toast.error(
        `Couldn't ${isEditing ? "update" : "create"} slide`,
        result.error,
      );
      return;
    }

    toast.success(`Slide ${isEditing ? "updated" : "added"}`);
    router.push(ROUTES.admin.heroSlides);
    router.refresh();
  }

  const mobileImageUrl = form.watch("mobileImageUrl");
  const desktopImageUrl = form.watch("desktopImageUrl");

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="max-w-2xl space-y-6"
      >
        <p className="text-xs text-muted-foreground">
          Each slide is a complete, pre-designed banner image (with any
          text/branding baked in) — one crop for mobile screens, one for
          desktop. The storefront shows whichever fits the visitor&rsquo;s
          screen.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Mobile Banner</Label>
            <p className="text-xs text-muted-foreground">
              Portrait — shown below the sm breakpoint.
            </p>
            {mobileImageUrl && (
              <div className="relative aspect-4/5 w-full max-w-40 overflow-hidden rounded-lg border border-border bg-muted">
                <Image
                  src={mobileImageUrl}
                  alt=""
                  fill
                  sizes="160px"
                  className="object-cover"
                />
              </div>
            )}
            <MediaPicker
              value={mobileImageUrl}
              onSelect={(asset) =>
                form.setValue("mobileImageUrl", asset.url, {
                  shouldDirty: true,
                })
              }
              triggerLabel={
                mobileImageUrl ? "Change mobile image" : "Choose mobile image"
              }
            />
            {form.formState.errors.mobileImageUrl && (
              <p className="text-xs font-medium text-destructive">
                {form.formState.errors.mobileImageUrl.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Desktop Banner</Label>
            <p className="text-xs text-muted-foreground">
              Wide — shown from the sm breakpoint up.
            </p>
            {desktopImageUrl && (
              <div className="relative aspect-8/3 w-full overflow-hidden rounded-lg border border-border bg-muted">
                <Image
                  src={desktopImageUrl}
                  alt=""
                  fill
                  sizes="320px"
                  className="object-cover"
                />
              </div>
            )}
            <MediaPicker
              value={desktopImageUrl}
              onSelect={(asset) =>
                form.setValue("desktopImageUrl", asset.url, {
                  shouldDirty: true,
                })
              }
              triggerLabel={
                desktopImageUrl
                  ? "Change desktop image"
                  : "Choose desktop image"
              }
            />
            {form.formState.errors.desktopImageUrl && (
              <p className="text-xs font-medium text-destructive">
                {form.formState.errors.desktopImageUrl.message}
              </p>
            )}
          </div>
        </div>

        <FormField
          control={form.control}
          name="altText"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alt text (optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Describe the banner for screen readers"
                  {...field}
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
            <FormItem className="max-w-40">
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

        <FormField
          control={form.control}
          name="isPublished"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-3">
              <div>
                <FormLabel>Published</FormLabel>
                <p className="text-xs text-muted-foreground">
                  Visible in the homepage banner once on.
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
            {isEditing ? "Save Changes" : "Add Slide"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(ROUTES.admin.heroSlides)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
