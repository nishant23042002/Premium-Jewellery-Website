"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/admin/confirm-delete-dialog";
import {
  deleteMediaAsset,
  uploadMediaAsset,
} from "@/features/media/media.actions";
import { toast } from "@/lib/toast";
import { formatDate } from "@/lib/utils/format";
import type { MediaAsset } from "@/features/media/media.types";

export function MediaGrid({ initialAssets }: { initialAssets: MediaAsset[] }) {
  const [assets, setAssets] = useState(initialAssets);
  const [isUploading, startUpload] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<MediaAsset | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {assets.length} image{assets.length === 1 ? "" : "s"}
        </p>
        <Button
          variant="gold"
          size="sm"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Upload className="size-3.5" />
          )}
          Upload Image
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {assets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          No media yet — upload your first image to use across products, blog
          posts, and more.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="group relative aspect-square overflow-hidden rounded-lg border border-border"
            >
              <Image
                src={asset.url}
                alt={asset.fileName ?? "Media asset"}
                fill
                className="object-cover"
                sizes="200px"
              />
              <div className="absolute inset-0 flex flex-col justify-between bg-black/0 p-2 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
                <Button
                  variant="destructive"
                  size="icon-sm"
                  className="ml-auto"
                  onClick={() => setDeleteTarget(asset)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
                <p className="truncate text-[0.65rem] text-white">
                  {formatDate(asset.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDeleteDialog
        itemLabel="image"
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        description="This permanently removes the image from Cloudinary and the media library — it won't affect places that already reference this URL until you update them."
        onConfirm={async () => deleteMediaAsset(deleteTarget!.id)}
        onDeleted={() =>
          setAssets((prev) => prev.filter((a) => a.id !== deleteTarget?.id))
        }
      />
    </div>
  );
}
