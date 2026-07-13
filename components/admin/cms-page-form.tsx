"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { createCmsPage, updateCmsPage } from "@/features/pages/page.actions";
import {
  cmsPageFormSchema,
  type CmsPageFormInput,
} from "@/features/pages/page.schema";
import { toast } from "@/lib/toast";
import { ROUTES } from "@/constants/routes";
import type { CmsPage } from "@/features/pages/page.types";

export function CmsPageForm({ page }: { page?: CmsPage }) {
  const router = useRouter();
  const isEditing = !!page;

  const form = useForm<CmsPageFormInput>({
    resolver: zodResolver(cmsPageFormSchema),
    defaultValues: {
      slug: page?.slug ?? "",
      title: page?.title ?? { en: "", hi: "", mr: "" },
      content: page?.content ?? { en: "", hi: "", mr: "" },
      isPublished: page?.isPublished ?? false,
    },
  });

  async function onSubmit(values: CmsPageFormInput) {
    const result = isEditing
      ? await updateCmsPage(page.id, values)
      : await createCmsPage(values);

    if (!result.success) {
      toast.error(
        `Couldn't ${isEditing ? "update" : "create"} page`,
        result.error,
      );
      return;
    }

    toast.success(`Page ${isEditing ? "updated" : "created"}`);
    router.push(ROUTES.admin.pages);
    router.refresh();
  }

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
                  <Input placeholder="Shipping Policy" {...field} />
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
                  <Input placeholder="shipping-policy" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="content.en"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content (English)</FormLabel>
              <FormControl>
                <Textarea
                  rows={12}
                  placeholder="Separate paragraphs with a blank line."
                  {...field}
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
                  Visible at /pages/{form.watch("slug") || "..."} once on.
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
            {isEditing ? "Save Changes" : "Create Page"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(ROUTES.admin.pages)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
