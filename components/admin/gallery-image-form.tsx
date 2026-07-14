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
  createGalleryImage,
  updateGalleryImage,
} from "@/features/gallery/gallery-image.actions";
import {
  galleryImageFormSchema,
  type GalleryImageFormInput,
} from "@/features/gallery/gallery-image.schema";
import { toast } from "@/lib/toast";
import { ROUTES } from "@/constants/routes";
import type { GalleryImage } from "@/features/gallery/gallery-image.types";

export function GalleryImageForm({ image }: { image?: GalleryImage }) {
  const router = useRouter();
  const isEditing = !!image;

  const form = useForm<GalleryImageFormInput>({
    resolver: zodResolver(galleryImageFormSchema),
    defaultValues: {
      imageUrl: image?.imageUrl ?? "",
      caption: image?.caption ?? { en: "", hi: "", mr: "" },
      sortOrder: image?.sortOrder ?? 0,
      isPublished: image?.isPublished ?? false,
    },
  });

  async function onSubmit(values: GalleryImageFormInput) {
    const result = isEditing
      ? await updateGalleryImage(image.id, values)
      : await createGalleryImage(values);

    if (!result.success) {
      toast.error(
        `Couldn't ${isEditing ? "update" : "create"} image`,
        result.error,
      );
      return;
    }

    toast.success(`Image ${isEditing ? "updated" : "added"}`);
    router.push(ROUTES.admin.gallery);
    router.refresh();
  }

  const imageUrl = form.watch("imageUrl");

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="max-w-xl space-y-6"
      >
        <div className="space-y-1.5">
          <Label>Image</Label>
          <div className="flex items-center gap-3">
            {imageUrl && (
              <Image
                src={imageUrl}
                alt="Current gallery image"
                width={80}
                height={80}
                className="size-20 rounded-lg border border-border object-cover"
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
          {form.formState.errors.imageUrl && (
            <p className="text-xs font-medium text-destructive">
              {form.formState.errors.imageUrl.message}
            </p>
          )}
        </div>

        <FormField
          control={form.control}
          name="caption.en"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Caption (optional)</FormLabel>
              <FormControl>
                <Input placeholder="Bridal Display" {...field} />
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
                  Visible in the storefront gallery once on.
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
            {isEditing ? "Save Changes" : "Add Image"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(ROUTES.admin.gallery)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
