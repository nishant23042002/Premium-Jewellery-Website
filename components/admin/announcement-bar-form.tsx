"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FieldHelp } from "@/components/admin/field-help";
import { updateAnnouncementBar } from "@/features/announcement-bar/announcement-bar.actions";
import {
  announcementBarFormSchema,
  type AnnouncementBarFormInput,
} from "@/features/announcement-bar/announcement-bar.schema";
import { toast } from "@/lib/toast";
import type { AnnouncementBarConfig } from "@/features/announcement-bar/announcement-bar.types";

export function AnnouncementBarForm({
  config,
}: {
  config: AnnouncementBarConfig;
}) {
  const router = useRouter();

  const form = useForm<AnnouncementBarFormInput>({
    resolver: zodResolver(announcementBarFormSchema),
    defaultValues: {
      isActive: config.isActive,
      message: config.message,
      linkLabel: config.linkLabel ?? "",
      linkHref: config.linkHref ?? "",
    },
  });

  async function onSubmit(values: AnnouncementBarFormInput) {
    const result = await updateAnnouncementBar(values);
    if (!result.success) {
      toast.error("Couldn't save", result.error);
      return;
    }
    toast.success("Announcement bar updated");
    router.refresh();
  }

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
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <FormLabel className="inline-flex items-center gap-1.5">
                      Show announcement bar
                      <FieldHelp helpKey="announcementBar.enabled" />
                    </FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Appears above the gold-rate ticker on every page.
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
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="inline-flex items-center gap-1.5">
                    Message
                    <FieldHelp helpKey="announcementBar.message" />
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Akshaya Tritiya offers now live in-store"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="linkLabel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link label (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="See offers" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="linkHref"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link URL (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="/offers" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
