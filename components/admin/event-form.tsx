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
import { createEvent, updateEvent } from "@/features/events/event.actions";
import {
  eventFormSchema,
  type EventFormInput,
} from "@/features/events/event.schema";
import { toast } from "@/lib/toast";
import { ROUTES } from "@/constants/routes";
import type { StoreEvent } from "@/features/events/event.types";

export function EventForm({ event }: { event?: StoreEvent }) {
  const router = useRouter();
  const isEditing = !!event;

  const form = useForm<EventFormInput>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      slug: event?.slug ?? "",
      title: event?.title ?? { en: "", hi: "", mr: "" },
      description: event?.description ?? { en: "", hi: "", mr: "" },
      date: event ? new Date(event.date) : new Date(),
      location: event?.location ?? "",
      imageUrl: event?.imageUrl ?? "",
      isPublished: event?.isPublished ?? false,
    },
  });

  async function onSubmit(values: EventFormInput) {
    const result = isEditing
      ? await updateEvent(event.id, values)
      : await createEvent(values);

    if (!result.success) {
      toast.error(
        `Couldn't ${isEditing ? "update" : "create"} event`,
        result.error,
      );
      return;
    }

    toast.success(`Event ${isEditing ? "updated" : "created"}`);
    router.push(ROUTES.admin.events);
    router.refresh();
  }

  const imageUrl = form.watch("imageUrl");
  const dateValue = form.watch("date");

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
                  <Input {...field} />
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

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    onChange={(e) => field.onChange(e.target.value)}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    value={
                      dateValue instanceof Date
                        ? dateValue.toISOString().slice(0, 10)
                        : typeof dateValue === "string"
                          ? dateValue
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
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Image (optional)</Label>
          <div className="flex items-center gap-3">
            {imageUrl && (
              <Image
                src={imageUrl}
                alt="Current event image"
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
            {isEditing ? "Save Changes" : "Create Event"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(ROUTES.admin.events)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
