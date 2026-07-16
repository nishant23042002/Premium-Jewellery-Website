"use client";

import { useRef, useTransition } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadStylingStoryVideo } from "@/features/styling-stories/styling-story.actions";
import { toast } from "@/lib/toast";

interface VideoUploadFieldProps {
  value?: string;
  onChange: (url: string) => void;
}

/**
 * Direct-upload control for the styling story cover video — no "library" to
 * browse (unlike `MediaPicker`) since videos are large, story-specific
 * assets rather than reusable media.
 */
export function VideoUploadField({ value, onChange }: VideoUploadFieldProps) {
  const [isUploading, startUpload] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    startUpload(async () => {
      try {
        const result = await uploadStylingStoryVideo(formData);
        if (!result.success) {
          toast.error("Upload failed", result.error);
          return;
        }
        toast.success("Video uploaded");
        onChange(result.data.url);
      } catch {
        // A large video upload can genuinely fail at the network level
        // (dropped connection, dev-server restart mid-upload) rather than
        // returning a normal ActionResult — without this catch, that
        // rejection propagated uncaught out of the transition and crashed
        // to a raw "[object Event]" error screen instead of a toast.
        toast.error(
          "Upload failed",
          "The connection dropped partway through. Please try again.",
        );
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isUploading}
        onClick={() => fileInputRef.current?.click()}
      >
        {isUploading ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Upload className="size-3.5" />
        )}
        {value ? "Change video" : "Upload video"}
      </Button>
      {value && !isUploading && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange("")}
        >
          <X className="size-3.5" />
          Remove
        </Button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
