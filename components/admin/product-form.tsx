"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { History, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
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
import { FormActionsBar } from "@/components/admin/form-actions-bar";
import { useFormAutosaveDraft } from "@/hooks/use-form-autosave-draft";
import {
  createProduct,
  updateProduct,
} from "@/features/products/product.actions";
import {
  productFormSchema,
  type ProductFormInput,
} from "@/features/products/product.schema";
import { calculatePrice, rateForMetalType } from "@/lib/pricing/calculate-price";
import { formatINR } from "@/lib/utils/format";
import { toast } from "@/lib/toast";
import { ROUTES } from "@/constants/routes";
import type { Category } from "@/features/categories/category.types";
import type { Product } from "@/features/products/product.types";
import type { CurrentRates } from "@/features/metal-rates/metal-rate.actions";

interface ProductFormProps {
  product?: Product;
  categories: Category[];
  currentRates: CurrentRates;
}

export function ProductForm({ product, categories, currentRates }: ProductFormProps) {
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
      stoneValue: product?.stoneValue ?? 0,
      certificationCost: product?.certificationCost ?? 0,
      customCharges: product?.customCharges ?? 0,
      priceOverride: product?.priceOverride ?? { locked: false },
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
      barcode: product?.barcode ?? "",
      metaTitle: product?.metaTitle ?? "",
      metaDescription: product?.metaDescription ?? "",
      canonicalUrl: product?.canonicalUrl ?? "",
      ogTitle: product?.ogTitle ?? "",
      ogDescription: product?.ogDescription ?? "",
      ogImageUrl: product?.ogImageUrl ?? "",
    },
  });

  const imageFields = useFieldArray({ control: form.control, name: "images" });
  const videoFields = useFieldArray({ control: form.control, name: "videos" });
  const availability = form.watch("availability");

  // Live "Preview Final Price" — pure client-side math against the rates
  // this page was rendered with (a snapshot, not re-fetched live; the admin
  // reloading the page after a rate change picks up the new one).
  const pricingWatch = form.watch([
    "metalType",
    "netWeightGrams",
    "makingChargeType",
    "makingChargeValue",
    "gstPercentage",
    "stoneValue",
    "certificationCost",
    "customCharges",
    "priceOverride",
  ]);
  const [
    watchedMetalType,
    watchedNetWeight,
    watchedMakingChargeType,
    watchedMakingChargeValue,
    watchedGst,
    watchedStoneValue,
    watchedCertificationCost,
    watchedCustomCharges,
    watchedPriceOverride,
  ] = pricingWatch;
  const priceOverrideLocked = watchedPriceOverride?.locked === true;

  const rate = rateForMetalType(watchedMetalType ?? "gold", currentRates);
  const pricePreview = calculatePrice({
    netWeightGrams: Number(watchedNetWeight) || 0,
    makingChargeType: watchedMakingChargeType ?? "percentage",
    makingChargeValue: Number(watchedMakingChargeValue) || 0,
    gstPercentage: Number(watchedGst) || 0,
    metalRatePerGram: rate?.ratePerGram ?? null,
    rateEffectiveDate: rate?.effectiveDate ?? null,
    stoneValue: Number(watchedStoneValue) || 0,
    certificationCost: Number(watchedCertificationCost) || 0,
    customCharges: Number(watchedCustomCharges) || 0,
    override:
      watchedPriceOverride && typeof watchedPriceOverride === "object"
        ? (watchedPriceOverride as { locked: boolean; fixedPrice?: number })
        : undefined,
  });

  const draftKey = `ambika-admin-draft-product-${product?.id ?? "new"}`;
  const watchedValues = form.watch();
  const { readDraft, clearDraft, lastSavedAt } = useFormAutosaveDraft(
    draftKey,
    watchedValues,
  );
  const [draftAvailable, setDraftAvailable] = useState(false);

  useEffect(() => {
    setDraftAvailable(readDraft() !== null);
    // Only check once, on mount — this is a "did we leave something behind
    // last time" check, not something that should re-fire as the user types.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function restoreDraft() {
    const draft = readDraft();
    if (draft) form.reset(draft);
    setDraftAvailable(false);
  }

  function discardDraft() {
    clearDraft();
    setDraftAvailable(false);
  }

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

    clearDraft();
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
        {draftAvailable && (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gold/30 bg-gold/5 px-4 py-3">
            <History className="size-4 shrink-0 text-gold-dark" />
            <p className="text-sm">
              We found unsaved changes from earlier on this{" "}
              {isEditing ? "product" : "new product"}.
            </p>
            <div className="ml-auto flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="gold"
                onClick={restoreDraft}
              >
                Restore draft
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={discardDraft}
              >
                Discard
              </Button>
            </div>
          </div>
        )}

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
              name="barcode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Barcode (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="8901234567890" {...field} />
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
                      <SelectItem value="platinum">Platinum</SelectItem>
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
            <CardTitle>Pricing Extras & Override</CardTitle>
            <p className="text-xs text-muted-foreground">
              Flat rupee add-ons on top of the metal + making charge formula
              — leave at 0 if not applicable.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="stoneValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stone value</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
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
                name="certificationCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Certification cost</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
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
                name="customCharges"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Other charges</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
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
            </div>

            <FormField
              control={form.control}
              name="priceOverride.locked"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <FormLabel>Lock price</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Bypass the formula entirely and show a fixed price
                      instead — for one-off promotions or negotiated pieces.
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            {priceOverrideLocked && (
              <FormField
                control={form.control}
                name="priceOverride.fixedPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fixed price (₹, final — GST inclusive)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
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
            )}

            <div className="rounded-lg border border-gold/30 bg-gold/5 p-3">
              <p className="text-xs text-muted-foreground">
                Preview final price {rate ? "" : "— no metal rate set yet"}
              </p>
              <p className="font-heading text-2xl">
                {pricePreview.isRatePending
                  ? "—"
                  : formatINR(pricePreview.total)}
              </p>
              {!pricePreview.isOverridden && !pricePreview.isRatePending && (
                <p className="text-xs text-muted-foreground">
                  Metal {formatINR(pricePreview.metalValue)} + Making{" "}
                  {formatINR(pricePreview.makingCharge)}
                  {pricePreview.stoneValue > 0 &&
                    ` + Stone ${formatINR(pricePreview.stoneValue)}`}
                  {pricePreview.certificationCost > 0 &&
                    ` + Certification ${formatINR(pricePreview.certificationCost)}`}
                  {pricePreview.customCharges > 0 &&
                    ` + Other ${formatINR(pricePreview.customCharges)}`}
                  {" + GST "}
                  {formatINR(pricePreview.gstAmount)}
                </p>
              )}
            </div>
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
                      alt={`Product photo ${index + 1}`}
                      fill
                      className="rounded-lg border border-border object-cover"
                      sizes="80px"
                    />
                    <button
                      type="button"
                      onClick={() => imageFields.remove(index)}
                      aria-label={`Remove photo ${index + 1}`}
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
                    aria-label={`Video ${index + 1} URL`}
                    {...form.register(`videos.${index}.url` as const)}
                  />
                  <Input
                    placeholder="Title (optional)"
                    aria-label={`Video ${index + 1} title`}
                    className="max-w-40"
                    {...form.register(`videos.${index}.title` as const)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    aria-label={`Remove video ${index + 1}`}
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
                    <Label id="production-time-label">Production time (days)</Label>
                    <div
                      className="flex items-center gap-2"
                      role="group"
                      aria-labelledby="production-time-label"
                    >
                      <Input
                        type="number"
                        min="0"
                        placeholder="Min"
                        aria-label="Minimum production time in days"
                        {...form.register("productionTimeDays.min")}
                      />
                      <span className="text-xs text-muted-foreground">to</span>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Max"
                        aria-label="Maximum production time in days"
                        {...form.register("productionTimeDays.max")}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label id="delivery-estimate-label">
                      Delivery estimate (days, after dispatch)
                    </Label>
                    <div
                      className="flex items-center gap-2"
                      role="group"
                      aria-labelledby="delivery-estimate-label"
                    >
                      <Input
                        type="number"
                        min="0"
                        placeholder="Min"
                        aria-label="Minimum delivery estimate in days"
                        {...form.register("deliveryEstimateDays.min")}
                      />
                      <span className="text-xs text-muted-foreground">to</span>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Max"
                        aria-label="Maximum delivery estimate in days"
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

        <Card>
          <CardHeader>
            <CardTitle>SEO (optional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Leave blank to fall back to the product name and description.
            </p>
            <FormField
              control={form.control}
              name="metaTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meta title</FormLabel>
                  <FormControl>
                    <Input placeholder={product?.name.en} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="metaDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meta description</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="canonicalUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Canonical URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="ogTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Social share title</FormLabel>
                    <FormControl>
                      <Input placeholder={product?.name.en} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ogImageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Social share image URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="ogDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Social share description</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <FormActionsBar
          isSubmitting={form.formState.isSubmitting}
          submitLabel={isEditing ? "Save Changes" : "Create Product"}
          onCancel={() => router.push(ROUTES.admin.products)}
          draftSavedAt={lastSavedAt}
        />
      </form>
    </Form>
  );
}
