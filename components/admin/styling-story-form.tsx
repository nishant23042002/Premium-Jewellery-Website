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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { MediaPicker } from "@/components/admin/media-picker";
import { VideoUploadField } from "@/components/admin/video-upload-field";
import {
  createStylingStory,
  updateStylingStory,
} from "@/features/styling-stories/styling-story.actions";
import {
  stylingStoryFormSchema,
  type StylingStoryFormInput,
} from "@/features/styling-stories/styling-story.schema";
import { toast } from "@/lib/toast";
import { ROUTES } from "@/constants/routes";
import type { StylingStory } from "@/features/styling-stories/styling-story.types";

export function StylingStoryForm({ story }: { story?: StylingStory }) {
  const router = useRouter();
  const isEditing = !!story;

  const form = useForm<StylingStoryFormInput>({
    resolver: zodResolver(stylingStoryFormSchema),
    defaultValues: {
      title: story?.title ?? { en: "", hi: "", mr: "" },
      subtitle: story?.subtitle ?? { en: "", hi: "", mr: "" },
      coverImageUrl: story?.coverImageUrl ?? "",
      videoUrl: story?.videoUrl ?? "",
      sortOrder: story?.sortOrder ?? 0,
      isPublished: story?.isPublished ?? false,
    },
  });

  async function onSubmit(values: StylingStoryFormInput) {
    const result = isEditing
      ? await updateStylingStory(story.id, values)
      : await createStylingStory(values);

    if (!result.success) {
      toast.error(
        `Couldn't ${isEditing ? "update" : "create"} story`,
        result.error,
      );
      return;
    }

    toast.success(`Story ${isEditing ? "updated" : "added"}`);
    router.push(ROUTES.admin.stylingStories);
    router.refresh();
  }

  const coverImageUrl = form.watch("coverImageUrl");
  const videoUrl = form.watch("videoUrl");

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="max-w-2xl space-y-6"
      >
        <div className="space-y-1.5">
          <Label>Cover Image</Label>
          <p className="text-xs text-muted-foreground">
            Shown on the story card in the homepage section. Stays as the
            fallback/poster image even if a video is added below.
          </p>
          <div className="flex items-center gap-3">
            {coverImageUrl && (
              <Image
                src={coverImageUrl}
                alt="Current cover image"
                width={80}
                height={80}
                className="size-20 rounded-lg border border-border object-cover"
              />
            )}
            <MediaPicker
              value={coverImageUrl}
              onSelect={(asset) =>
                form.setValue("coverImageUrl", asset.url, { shouldDirty: true })
              }
              triggerLabel={coverImageUrl ? "Change cover" : "Choose cover"}
            />
          </div>
          {form.formState.errors.coverImageUrl && (
            <p className="text-xs font-medium text-destructive">
              {form.formState.errors.coverImageUrl.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Cover Video (optional)</Label>
          <p className="text-xs text-muted-foreground">
            Upload the actual video file (MP4/WebM/MOV — e.g. exported from an
            Instagram Reel, not a link to the Instagram post itself). When
            set, this plays automatically on the card instead of the cover
            image.
          </p>
          {videoUrl && (
            <video
              src={videoUrl}
              className="aspect-video w-48 rounded-lg border border-border object-cover"
              muted
              playsInline
              controls
            />
          )}
          <VideoUploadField
            value={videoUrl || undefined}
            onChange={(url) =>
              form.setValue("videoUrl", url, { shouldDirty: true })
            }
          />
          {form.formState.errors.videoUrl && (
            <p className="text-xs font-medium text-destructive">
              {form.formState.errors.videoUrl.message}
            </p>
          )}
        </div>

        <FormField
          control={form.control}
          name="title.en"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Styling 101 With Diamonds" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="subtitle.en"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subtitle (optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Trendsetting diamond jewellery suited for every occasion"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
                  Visible on the homepage once on.
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
            {isEditing ? "Save Changes" : "Add Story"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(ROUTES.admin.stylingStories)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
