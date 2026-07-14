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
  createCategory,
  updateCategory,
} from "@/features/categories/category.actions";
import {
  categoryFormSchema,
  type CategoryFormInput,
} from "@/features/categories/category.schema";
import { toast } from "@/lib/toast";
import { ROUTES } from "@/constants/routes";
import type { Category } from "@/features/categories/category.types";

interface CategoryFormProps {
  category?: Category;
  categories: Category[];
}

export function CategoryForm({ category, categories }: CategoryFormProps) {
  const router = useRouter();
  const isEditing = !!category;

  const form = useForm<CategoryFormInput>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      slug: category?.slug ?? "",
      name: category?.name ?? { en: "", hi: "", mr: "" },
      imageUrl: category?.imageUrl ?? "",
      sortOrder: category?.sortOrder ?? 0,
      parentId: category?.parentId ?? null,
      isPublished: category?.isPublished ?? false,
    },
  });

  async function onSubmit(values: CategoryFormInput) {
    const result = isEditing
      ? await updateCategory(category.id, values)
      : await createCategory(values);

    if (!result.success) {
      toast.error(
        `Couldn't ${isEditing ? "update" : "create"} category`,
        result.error,
      );
      return;
    }

    toast.success(`Category ${isEditing ? "updated" : "created"}`);
    router.push(ROUTES.admin.categories);
    router.refresh();
  }

  const otherCategories = categories.filter((c) => c.id !== category?.id);
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
                  <Input placeholder="Bridal Gold" {...field} />
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
                  <Input placeholder="bridal-gold" {...field} />
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
                  <Input placeholder="ब्राइडल गोल्ड" {...field} />
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
                  <Input placeholder="ब्रायडल गोल्ड" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Image</Label>
          <div className="flex items-center gap-3">
            {imageUrl && (
              <Image
                src={imageUrl}
                alt="Current category image"
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

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="parentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parent category (optional)</FormLabel>
                <Select
                  value={field.value ?? "none"}
                  onValueChange={(value) =>
                    field.onChange(value === "none" ? null : value)
                  }
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">None (top-level)</SelectItem>
                    {otherCategories.map((c) => (
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
            {isEditing ? "Save Changes" : "Create Category"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(ROUTES.admin.categories)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
