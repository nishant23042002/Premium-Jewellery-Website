"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Check, ImagePlus, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  listMediaAssets,
  uploadMediaAsset,
} from "@/features/media/media.actions";
import { toast } from "@/lib/toast";
import type { MediaAsset } from "@/features/media/media.types";

interface MediaPickerProps {
  value?: string;
  onSelect: (asset: MediaAsset) => void;
  triggerLabel?: string;
}

/**
 * Single-select image picker backed by the Media Library — pick an existing
 * upload or add a new one in the same dialog. Reused across every admin
 * form that needs one image (Category, Collection, Offer, Blog cover,
 * Gallery item, Testimonial photo, Appearance logo/favicon).
 */
export function MediaPicker({
  value,
  onSelect,
  triggerLabel = "Choose image",
}: MediaPickerProps) {
  const [open, setOpen] = useState(false);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [isUploading, startUpload] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadAssets() {
    setLoading(true);
    try {
      const result = await listMediaAssets({ pageSize: 60 });
      setAssets(result.items);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next && assets.length === 0) loadAssets();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    startUpload(async () => {
      const result = await uploadMediaAsset(formData);
      if (!result.success) {
        toast.error("Upload failed", result.error);
        return;
      }
      toast.success("Image uploaded");
      setAssets((prev) => [result.data, ...prev]);
      onSelect(result.data);
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={<Button type="button" variant="outline" size="sm" />}
      >
        <ImagePlus className="size-3.5" />
        {triggerLabel}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Media Library</DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Pick an existing image, or upload a new one (JPG, PNG, WebP — up to
            10MB).
          </p>
          <Button
            type="button"
            size="sm"
            variant="gold"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Upload className="size-3.5" />
            )}
            Upload
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <div className="grid max-h-96 grid-cols-4 gap-2 overflow-y-auto">
          {loading ? (
            <p className="col-span-4 py-8 text-center text-sm text-muted-foreground">
              Loading…
            </p>
          ) : assets.length === 0 ? (
            <p className="col-span-4 py-8 text-center text-sm text-muted-foreground">
              No media yet — upload your first image.
            </p>
          ) : (
            assets.map((asset) => (
              <button
                key={asset.id}
                type="button"
                onClick={() => {
                  onSelect(asset);
                  setOpen(false);
                }}
                className="relative aspect-square overflow-hidden rounded-lg border border-border hover:ring-2 hover:ring-gold"
              >
                <Image
                  src={asset.url}
                  alt={asset.fileName ?? "Media asset"}
                  fill
                  className="object-cover"
                  sizes="120px"
                />
                {value === asset.url && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Check className="size-5 text-white" />
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
