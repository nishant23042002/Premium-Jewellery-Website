"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  createProduct,
  updateProduct,
} from "@/features/products/product.actions";
import {
  productFormSchema,
  type ProductFormInput,
} from "@/features/products/product.schema";
import { toast } from "@/lib/toast";
import { ROUTES } from "@/constants/routes";
import type { Category } from "@/features/categories/category.types";
import type { Product } from "@/features/products/product.types";

interface ProductFormProps {
  product?: Product;
  categories: Category[];
}

export function ProductForm({ product, categories }: ProductFormProps) {
  const router = useRouter();
  const isEditing = !!product;

  const form = useForm<ProductFormInput>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      categoryId: product?.categoryId ?? "",
      slug: product?.slug ?? "",
      skuCode: product?.skuCode ?? "",
      name: product?.name ?? { en: "", hi: "", mr: "" },
      description: product?.description ?? { en: "", hi: "", mr: "" },
      metalType: product?.metalType ?? "gold",
      purity: product?.purity ?? "22K",
      grossWeightGrams: product?.grossWeightGrams ?? 0,
      netWeightGrams: product?.netWeightGrams ?? 0,
      makingChargeType: product?.makingChargeType ?? "percentage",
      makingChargeValue: product?.makingChargeValue ?? 0,
      gstPercentage: product?.gstPercentage ?? 3,
      quantity: product?.quantity ?? 0,
      images: product?.images ?? [],
      videos: product?.videos ?? [],
      availability: product?.availability ?? "in_showroom",
      productionTimeDays: product?.productionTimeDays,
      dispatchNote: product?.dispatchNote ?? "",
      deliveryEstimateDays: product?.deliveryEstimateDays,
      isFeatured: product?.isFeatured ?? false,
      isPublished: product?.isPublished ?? false,
      tags: product?.tags ?? [],
    },
  });

  const imageFields = useFieldArray({ control: form.control, name: "images" });
  const videoFields = useFieldArray({ control: form.control, name: "videos" });
  const availability = form.watch("availability");

  async function onSubmit(values: ProductFormInput) {
    const result = isEditing
      ? await updateProduct(product.id, values)
      : await createProduct(values);

    if (!result.success) {
      toast.error(
        `Couldn't ${isEditing ? "update" : "create"} product`,
        result.error,
      );
      return;
    }

    toast.success(`Product ${isEditing ? "updated" : "created"}`);
    router.push(ROUTES.admin.products);
    router.refresh();
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="max-w-3xl space-y-6"
      >
        <Card>
          <CardHeader>
            <CardTitle>Basic Info</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="name.en"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name (English)</FormLabel>
                  <FormControl>
                    <Input placeholder="Antique Temple Necklace" {...field} />
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
                    <Input placeholder="antique-temple-necklace" {...field} />
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
            <FormField
              control={form.control}
              name="skuCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU code</FormLabel>
                  <FormControl>
                    <Input placeholder="AJ-NK-0142" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name.en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description.en"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Description (English)</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metal & Pricing</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="metalType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Metal type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="gold">Gold</SelectItem>
                      <SelectItem value="silver">Silver</SelectItem>
                      <SelectItem value="diamond">Diamond</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="purity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purity</FormLabel>
                  <FormControl>
                    <Input placeholder="22K" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gstPercentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GST %</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      {...field}
                      value={
                        typeof field.value === "number" ||
                        typeof field.value === "string"
                          ? field.value
                          : 3
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="grossWeightGrams"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gross weight (g)</FormLabel>
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
              name="netWeightGrams"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Net weight (g)</FormLabel>
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
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock quantity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="1"
                      min="0"
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
              name="makingChargeType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Making charge type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="percentage">
                        Percentage of metal value
                      </SelectItem>
                      <SelectItem value="per_gram">Per gram</SelectItem>
                      <SelectItem value="flat">Flat amount</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="makingChargeValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Making charge value</FormLabel>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Photos & Video</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Photos</Label>
              <div className="flex flex-wrap gap-3">
                {imageFields.fields.map((field, index) => (
                  <div key={field.id} className="relative size-20">
                    <Image
                      src={field.url}
                      alt=""
                      fill
                      className="rounded-lg border border-border object-cover"
                      sizes="80px"
                    />
                    <button
                      type="button"
                      onClick={() => imageFields.remove(index)}
                      className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
                <div className="flex size-20 items-center justify-center rounded-lg border border-dashed border-border">
                  <MediaPicker
                    triggerLabel="Add"
                    onSelect={(asset) =>
                      imageFields.append({
                        url: asset.url,
                        publicId: asset.publicId,
                        sortOrder: imageFields.fields.length,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Videos (optional — paste a hosted video URL)</Label>
              {videoFields.fields.map((field, index) => (
                <div key={field.id} className="flex gap-2">
                  <Input
                    placeholder="https://..."
                    {...form.register(`videos.${index}.url` as const)}
                  />
                  <Input
                    placeholder="Title (optional)"
                    className="max-w-40"
                    {...form.register(`videos.${index}.title` as const)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    onClick={() => videoFields.remove(index)}
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  videoFields.append({
                    url: "",
                    publicId: `video-${Date.now()}`,
                    title: "",
                  })
                }
              >
                Add video
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="availability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Availability</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="in_showroom">In showroom</SelectItem>
                        <SelectItem value="made_to_order">
                          Made to order
                        </SelectItem>
                        <SelectItem value="reserved">Reserved</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags (comma-separated)</FormLabel>
                    <FormControl>
                      <Input
                        value={(field.value ?? []).join(", ")}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              .split(",")
                              .map((t) => t.trim())
                              .filter(Boolean),
                          )
                        }
                        placeholder="bridal, temple, antique"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {availability === "made_to_order" && (
              <div className="space-y-4 rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">
                  Shown to customers on the product page and product cards
                  wherever this piece appears — replaces stock messaging with a
                  production/delivery estimate.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Production time (days)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        placeholder="Min"
                        {...form.register("productionTimeDays.min")}
                      />
                      <span className="text-xs text-muted-foreground">to</span>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Max"
                        {...form.register("productionTimeDays.max")}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Delivery estimate (days, after dispatch)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        placeholder="Min"
                        {...form.register("deliveryEstimateDays.min")}
                      />
                      <span className="text-xs text-muted-foreground">to</span>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Max"
                        {...form.register("deliveryEstimateDays.max")}
                      />
                    </div>
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name="dispatchNote"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dispatch note (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Dispatched immediately after production"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="isFeatured"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <FormLabel>Featured</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Shown in featured rails on the storefront.
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
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button
            type="submit"
            variant="gold"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting && (
              <Loader2 className="size-4 animate-spin" />
            )}
            {isEditing ? "Save Changes" : "Create Product"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(ROUTES.admin.products)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
