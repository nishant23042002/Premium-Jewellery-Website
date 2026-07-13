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
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { MediaPicker } from "@/components/admin/media-picker";
import { FieldHelp } from "@/components/admin/field-help";
import { updateSeoConfig } from "@/features/settings/seo.actions";
import {
  seoFormSchema,
  type SeoFormInput,
} from "@/features/settings/seo.schema";
import { toast } from "@/lib/toast";
import type { SeoConfig } from "@/features/settings/seo.types";

export function SeoForm({ config }: { config: SeoConfig }) {
  const router = useRouter();

  const form = useForm<SeoFormInput>({
    resolver: zodResolver(seoFormSchema),
    defaultValues: {
      defaultTitle: config.defaultTitle ?? "",
      defaultDescription: config.defaultDescription ?? "",
      ogImageUrl: config.ogImageUrl ?? "",
    },
  });

  async function onSubmit(values: SeoFormInput) {
    const result = await updateSeoConfig(values);
    if (!result.success) {
      toast.error("Couldn't save", result.error);
      return;
    }
    toast.success("SEO settings updated");
    router.refresh();
  }

  const ogImageUrl = form.watch("ogImageUrl");

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="max-w-xl space-y-6"
      >
        <Card>
          <CardContent className="space-y-4 pt-2">
            <FormField
              control={form.control}
              name="defaultTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="inline-flex items-center gap-1.5">
                    Default page title (optional)
                    <FieldHelp helpKey="seo.defaultTitle" />
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Shree Ambika Jewellers" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="defaultDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="inline-flex items-center gap-1.5">
                    Default meta description (optional)
                    <FieldHelp helpKey="seo.defaultDescription" />
                  </FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-1.5">
              <Label className="inline-flex items-center gap-1.5">
                Social share image (optional)
                <FieldHelp helpKey="seo.ogImageUrl" />
              </Label>
              <div className="flex items-center gap-3">
                {ogImageUrl && (
                  <Image
                    src={ogImageUrl}
                    alt=""
                    width={80}
                    height={45}
                    className="h-11 w-20 rounded border border-border object-cover"
                  />
                )}
                <MediaPicker
                  value={ogImageUrl}
                  onSelect={(asset) =>
                    form.setValue("ogImageUrl", asset.url, {
                      shouldDirty: true,
                    })
                  }
                  triggerLabel={ogImageUrl ? "Change image" : "Choose image"}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          variant="gold"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting && (
            <Loader2 className="size-4 animate-spin" />
          )}
          Save
        </Button>
      </form>
    </Form>
  );
}
