"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { updateAppearanceConfig } from "@/features/settings/appearance.actions";
import {
  appearanceFormSchema,
  type AppearanceFormInput,
} from "@/features/settings/appearance.schema";
import { toast } from "@/lib/toast";
import type { AppearanceConfig } from "@/features/settings/appearance.types";

export function AppearanceForm({ config }: { config: AppearanceConfig }) {
  const router = useRouter();

  const form = useForm<AppearanceFormInput>({
    resolver: zodResolver(appearanceFormSchema),
    defaultValues: {
      logoUrl: config.logoUrl ?? "",
      faviconUrl: config.faviconUrl ?? "",
      accentColor: config.accentColor ?? "",
    },
  });

  async function onSubmit(values: AppearanceFormInput) {
    const result = await updateAppearanceConfig(values);
    if (!result.success) {
      toast.error("Couldn't save", result.error);
      return;
    }
    toast.success("Appearance updated");
    router.refresh();
  }

  const logoUrl = form.watch("logoUrl");
  const faviconUrl = form.watch("faviconUrl");

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="max-w-xl space-y-6"
      >
        <Card>
          <CardContent className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="inline-flex items-center gap-1.5">
                Logo (optional)
                <FieldHelp helpKey="appearance.logoUrl" />
              </Label>
              <div className="flex items-center gap-3">
                {logoUrl && (
                  <Image
                    src={logoUrl}
                    alt="Current logo"
                    width={56}
                    height={56}
                    className="size-14 rounded-lg border border-border object-contain"
                  />
                )}
                <MediaPicker
                  value={logoUrl}
                  onSelect={(asset) =>
                    form.setValue("logoUrl", asset.url, { shouldDirty: true })
                  }
                  triggerLabel={logoUrl ? "Change logo" : "Choose logo"}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="inline-flex items-center gap-1.5">
                Favicon (optional)
                <FieldHelp helpKey="appearance.faviconUrl" />
              </Label>
              <div className="flex items-center gap-3">
                {faviconUrl && (
                  <Image
                    src={faviconUrl}
                    alt="Current favicon"
                    width={32}
                    height={32}
                    className="size-8 rounded border border-border object-contain"
                  />
                )}
                <MediaPicker
                  value={faviconUrl}
                  onSelect={(asset) =>
                    form.setValue("faviconUrl", asset.url, {
                      shouldDirty: true,
                    })
                  }
                  triggerLabel={
                    faviconUrl ? "Change favicon" : "Choose favicon"
                  }
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="accentColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Accent color (optional)</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        className="h-9 w-14 p-1"
                        value={field.value || "#c6a567"}
                        onChange={field.onChange}
                      />
                      <Input
                        placeholder="#C6A567"
                        {...field}
                        className="max-w-32"
                      />
                    </div>
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Replaces the gold accent used throughout the site.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
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
