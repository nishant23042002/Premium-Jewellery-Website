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
import {
  createTestimonial,
  updateTestimonial,
} from "@/features/testimonials/testimonial.actions";
import {
  testimonialFormSchema,
  type TestimonialFormInput,
} from "@/features/testimonials/testimonial.schema";
import { toast } from "@/lib/toast";
import { ROUTES } from "@/constants/routes";
import type { Testimonial } from "@/features/testimonials/testimonial.types";

export function TestimonialForm({
  testimonial,
}: {
  testimonial?: Testimonial;
}) {
  const router = useRouter();
  const isEditing = !!testimonial;

  const form = useForm<TestimonialFormInput>({
    resolver: zodResolver(testimonialFormSchema),
    defaultValues: {
      name: testimonial?.name ?? "",
      location: testimonial?.location ?? "",
      rating: testimonial?.rating ?? 5,
      quote: testimonial?.quote ?? "",
      sortOrder: testimonial?.sortOrder ?? 0,
      isPublished: testimonial?.isPublished ?? false,
    },
  });

  async function onSubmit(values: TestimonialFormInput) {
    const result = isEditing
      ? await updateTestimonial(testimonial.id, values)
      : await createTestimonial(values);

    if (!result.success) {
      toast.error(
        `Couldn't ${isEditing ? "update" : "create"} testimonial`,
        result.error,
      );
      return;
    }

    toast.success(`Testimonial ${isEditing ? "updated" : "created"}`);
    router.push(ROUTES.admin.testimonials);
    router.refresh();
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="max-w-xl space-y-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer name</FormLabel>
                <FormControl>
                  <Input placeholder="Anita D." {...field} />
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
                  <Input placeholder="Roha" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="quote"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quote</FormLabel>
              <FormControl>
                <Textarea rows={4} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="rating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rating</FormLabel>
                <Select
                  value={String(field.value ?? 5)}
                  onValueChange={(v) => field.onChange(Number(v))}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {[5, 4, 3, 2, 1].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} star{n === 1 ? "" : "s"}
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
            {isEditing ? "Save Changes" : "Create Testimonial"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(ROUTES.admin.testimonials)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
