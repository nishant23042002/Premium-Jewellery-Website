"use client";

import { useState } from "react";
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
import {
  ProductPicker,
  type PickedProduct,
} from "@/components/storefront/product-picker";
import {
  createCollection,
  updateCollection,
} from "@/features/collections/collection.actions";
import {
  collectionFormSchema,
  type CollectionFormInput,
} from "@/features/collections/collection.schema";
import { toast } from "@/lib/toast";
import { ROUTES } from "@/constants/routes";
import type { Collection } from "@/features/collections/collection.types";

interface CollectionFormProps {
  collection?: Collection;
  initialProducts?: PickedProduct[];
}

export function CollectionForm({
  collection,
  initialProducts = [],
}: CollectionFormProps) {
  const router = useRouter();
  const isEditing = !!collection;
  const [products, setProducts] = useState<PickedProduct[]>(initialProducts);

  const form = useForm<CollectionFormInput>({
    resolver: zodResolver(collectionFormSchema),
    defaultValues: {
      slug: collection?.slug ?? "",
      name: collection?.name ?? { en: "", hi: "", mr: "" },
      description: collection?.description ?? { en: "", hi: "", mr: "" },
      imageUrl: collection?.imageUrl ?? "",
      productIds: collection?.productIds ?? [],
      isFeatured: collection?.isFeatured ?? false,
      isPublished: collection?.isPublished ?? false,
      sortOrder: collection?.sortOrder ?? 0,
    },
  });

  async function onSubmit(values: CollectionFormInput) {
    const payload = { ...values, productIds: products.map((p) => p.id) };
    const result = isEditing
      ? await updateCollection(collection.id, payload)
      : await createCollection(payload);

    if (!result.success) {
      toast.error(
        `Couldn't ${isEditing ? "update" : "create"} collection`,
        result.error,
      );
      return;
    }

    toast.success(`Collection ${isEditing ? "updated" : "created"}`);
    router.push(ROUTES.admin.collections);
    router.refresh();
  }

  const imageUrl = form.watch("imageUrl");

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="max-w-2xl space-y-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name.en"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name (English)</FormLabel>
                <FormControl>
                  <Input placeholder="Bridal Edit" {...field} />
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
                  <Input placeholder="bridal-edit" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="name.hi"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name (Hindi)</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="name.mr"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name (Marathi)</FormLabel>
                <FormControl>
                  <Input {...field} />
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

        <div className="space-y-1.5">
          <Label>Cover image</Label>
          <div className="flex items-center gap-3">
            {imageUrl && (
              <Image
                src={imageUrl}
                alt=""
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

        <div className="space-y-1.5">
          <Label>Pieces in this collection</Label>
          <ProductPicker selected={products} onChange={setProducts} max={50} />
        </div>

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
          name="isFeatured"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-3">
              <div>
                <FormLabel>Featured</FormLabel>
                <p className="text-xs text-muted-foreground">
                  Highlighted on the homepage.
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
            {isEditing ? "Save Changes" : "Create Collection"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(ROUTES.admin.collections)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
