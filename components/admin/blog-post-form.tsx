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
import {
  createBlogPost,
  updateBlogPost,
} from "@/features/blog/blog-post.actions";
import {
  blogPostFormSchema,
  type BlogPostFormInput,
} from "@/features/blog/blog-post.schema";
import { toast } from "@/lib/toast";
import { ROUTES } from "@/constants/routes";
import type { BlogPost } from "@/features/blog/blog-post.types";

export function BlogPostForm({ post }: { post?: BlogPost }) {
  const router = useRouter();
  const isEditing = !!post;

  const form = useForm<BlogPostFormInput>({
    resolver: zodResolver(blogPostFormSchema),
    defaultValues: {
      slug: post?.slug ?? "",
      title: post?.title ?? { en: "", hi: "", mr: "" },
      excerpt: post?.excerpt ?? { en: "", hi: "", mr: "" },
      content: post?.content ?? { en: "", hi: "", mr: "" },
      category: post?.category ?? "Guides",
      coverImageUrl: post?.coverImageUrl ?? "",
      author: post?.author ?? "Shree Ambika Jewellers",
      tags: post?.tags ?? [],
      isPublished: post?.isPublished ?? false,
      publishedAt: post ? new Date(post.publishedAt) : new Date(),
    },
  });

  async function onSubmit(values: BlogPostFormInput) {
    const result = isEditing
      ? await updateBlogPost(post.id, values)
      : await createBlogPost(values);

    if (!result.success) {
      toast.error(
        `Couldn't ${isEditing ? "update" : "create"} post`,
        result.error,
      );
      return;
    }

    toast.success(`Post ${isEditing ? "updated" : "created"}`);
    router.push(ROUTES.admin.blog);
    router.refresh();
  }

  const coverImageUrl = form.watch("coverImageUrl");
  const publishedAtValue = form.watch("publishedAt");

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
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Input placeholder="Guides" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="author"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Author</FormLabel>
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
          name="excerpt.en"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Excerpt (English)</FormLabel>
              <FormControl>
                <Textarea rows={2} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content.en"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content (English)</FormLabel>
              <FormControl>
                <Textarea
                  rows={10}
                  placeholder="Separate paragraphs with a blank line."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-1.5">
          <Label>Cover image</Label>
          <div className="flex items-center gap-3">
            {coverImageUrl && (
              <Image
                src={coverImageUrl}
                alt="Current cover image"
                width={56}
                height={56}
                className="size-14 rounded-lg border border-border object-cover"
              />
            )}
            <MediaPicker
              value={coverImageUrl}
              onSelect={(asset) =>
                form.setValue("coverImageUrl", asset.url, { shouldDirty: true })
              }
              triggerLabel={coverImageUrl ? "Change image" : "Choose image"}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="publishedAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Published date</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    onChange={(e) => field.onChange(e.target.value)}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    value={
                      publishedAtValue instanceof Date
                        ? publishedAtValue.toISOString().slice(0, 10)
                        : typeof publishedAtValue === "string"
                          ? publishedAtValue
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
            {isEditing ? "Save Changes" : "Create Post"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(ROUTES.admin.blog)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
