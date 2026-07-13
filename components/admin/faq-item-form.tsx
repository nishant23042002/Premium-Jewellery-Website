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
import { createFaqItem, updateFaqItem } from "@/features/faq/faq-item.actions";
import {
  faqItemFormSchema,
  type FaqItemFormInput,
} from "@/features/faq/faq-item.schema";
import { toast } from "@/lib/toast";
import { ROUTES } from "@/constants/routes";
import type { FaqItem } from "@/features/faq/faq-item.types";

export function FaqItemForm({ item }: { item?: FaqItem }) {
  const router = useRouter();
  const isEditing = !!item;

  const form = useForm<FaqItemFormInput>({
    resolver: zodResolver(faqItemFormSchema),
    defaultValues: {
      question: item?.question ?? { en: "", hi: "", mr: "" },
      answer: item?.answer ?? { en: "", hi: "", mr: "" },
      sortOrder: item?.sortOrder ?? 0,
      isPublished: item?.isPublished ?? false,
    },
  });

  async function onSubmit(values: FaqItemFormInput) {
    const result = isEditing
      ? await updateFaqItem(item.id, values)
      : await createFaqItem(values);

    if (!result.success) {
      toast.error(
        `Couldn't ${isEditing ? "update" : "create"} FAQ item`,
        result.error,
      );
      return;
    }

    toast.success(`FAQ item ${isEditing ? "updated" : "created"}`);
    router.push(ROUTES.admin.faq);
    router.refresh();
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="max-w-2xl space-y-6"
      >
        <FormField
          control={form.control}
          name="question.en"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Question (English)</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="answer.en"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Answer (English)</FormLabel>
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
            name="question.hi"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Question (Hindi)</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="question.mr"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Question (Marathi)</FormLabel>
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
            {isEditing ? "Save Changes" : "Create FAQ Item"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(ROUTES.admin.faq)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
