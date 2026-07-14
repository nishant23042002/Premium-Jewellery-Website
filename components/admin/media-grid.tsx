"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Check, ImageOff, Loader2, Search, Tag, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ConfirmDeleteDialog } from "@/components/admin/confirm-delete-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  deleteMediaAsset,
  updateMediaAssetTags,
  uploadMediaAsset,
} from "@/features/media/media.actions";
import { toast } from "@/lib/toast";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import type { MediaAsset } from "@/features/media/media.types";

/** Thumbnails render at ~150-250px wide regardless of the source photo's real
 * resolution — passing the asset's full pixel dimensions straight into
 * `next/image` made it request (and re-encode) the image at its original
 * size for every tile in the grid, since Next bases its srcset candidates on
 * the given width. Scaling down to a fixed base width before handing it to
 * `next/image`, while keeping the same ratio, preserves the masonry layout's
 * aspect ratio exactly but keeps the actual requested files small. */
const THUMBNAIL_BASE_WIDTH = 400;
function thumbnailDimensions(asset: Pick<MediaAsset, "width" | "height">) {
  const ratio = asset.width > 0 ? asset.height / asset.width : 1;
  return {
    width: THUMBNAIL_BASE_WIDTH,
    height: Math.max(1, Math.round(THUMBNAIL_BASE_WIDTH * ratio)),
  };
}

function TagEditor({
  asset,
  onSaved,
}: {
  asset: MediaAsset;
  onSaved: (tags: string[]) => void;
}) {
  const [value, setValue] = useState(asset.tags.join(", "));
  const [isSaving, startSaving] = useTransition();

  function save() {
    const tags = value
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    startSaving(async () => {
      const result = await updateMediaAssetTags(asset.id, tags);
      if (!result.success) {
        toast.error("Couldn't update tags", result.error);
        return;
      }
      onSaved(tags);
    });
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium">Tags</p>
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="bridal, gold, banner"
        className="h-8"
      />
      <p className="text-[0.65rem] text-muted-foreground">
        Comma-separated — used to filter this library.
      </p>
      <Button
        type="button"
        size="sm"
        variant="gold"
        disabled={isSaving}
        onClick={save}
        className="w-full"
      >
        {isSaving && <Loader2 className="size-3.5 animate-spin" />}
        Save tags
      </Button>
    </div>
  );
}

export function MediaGrid({ initialAssets }: { initialAssets: MediaAsset[] }) {
  const [assets, setAssets] = useState(initialAssets);
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isUploading, startUpload] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<MediaAsset | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allTags = useMemo(
    () => Array.from(new Set(assets.flatMap((a) => a.tags))).sort(),
    [assets],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return assets.filter((asset) => {
      if (activeTag && !asset.tags.includes(activeTag)) return false;
      if (q && !(asset.fileName ?? "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [assets, activeTag, query]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleFilesChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    startUpload(async () => {
      let successCount = 0;
      let failureCount = 0;
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        const result = await uploadMediaAsset(formData);
        if (result.success) {
          successCount++;
          setAssets((prev) => [result.data, ...prev]);
        } else {
          failureCount++;
        }
      }
      if (failureCount === 0) {
        toast.success(
          `${successCount} image${successCount === 1 ? "" : "s"} uploaded`,
        );
      } else {
        toast.error(`Uploaded ${successCount}, ${failureCount} failed`);
      }
    });
  }

  function handleBulkDelete() {
    setIsBulkDeleting(true);
    const ids = Array.from(selectedIds);
    Promise.all(ids.map((id) => deleteMediaAsset(id)))
      .then((results) => {
        const succeededIds = new Set(
          ids.filter((_, i) => results[i]?.success),
        );
        setAssets((prev) => prev.filter((a) => !succeededIds.has(a.id)));
        const failureCount = ids.length - succeededIds.size;
        if (failureCount === 0) {
          toast.success(`${succeededIds.size} image${succeededIds.size === 1 ? "" : "s"} deleted`);
        } else {
          toast.error(`Deleted ${succeededIds.size}, ${failureCount} failed`);
        }
        setSelectedIds(new Set());
      })
      .finally(() => {
        setIsBulkDeleting(false);
        setBulkDeleteOpen(false);
      });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by file name..."
            className="h-8 w-56 pl-8"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {filtered.length} of {assets.length} image
          {assets.length === 1 ? "" : "s"}
        </p>

        <div className="ml-auto flex items-center gap-2">
          {selectedIds.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setBulkDeleteOpen(true)}
            >
              <Trash2 className="size-3.5" />
              Delete {selectedIds.size}
            </Button>
          )}
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
            Upload Images
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFilesChange}
          />
        </div>
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTag(null)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs capitalize transition-colors",
              activeTag === null
                ? "border-gold bg-gold/10 text-gold-dark"
                : "border-border text-muted-foreground hover:border-gold/40",
            )}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setActiveTag(tag === activeTag ? null : tag)}
              className={cn(
                "flex items-center gap-1 rounded-full border px-3 py-1 text-xs capitalize transition-colors",
                activeTag === tag
                  ? "border-gold bg-gold/10 text-gold-dark"
                  : "border-border text-muted-foreground hover:border-gold/40",
              )}
            >
              <Tag className="size-3" />
              {tag}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
          <ImageOff className="size-8 text-muted-foreground/50" strokeWidth={1.5} />
          <p className="text-sm font-medium">
            {assets.length === 0 ? "No media yet" : "No images match"}
          </p>
          <p className="max-w-xs text-xs text-muted-foreground">
            {assets.length === 0
              ? "Upload your first image to use across products, blog posts, and more."
              : "Try a different search term or tag filter."}
          </p>
        </div>
      ) : (
        <div className="columns-2 gap-3 sm:columns-3 md:columns-4 lg:columns-6">
          {filtered.map((asset) => {
            const selected = selectedIds.has(asset.id);
            const thumb = thumbnailDimensions(asset);
            return (
              <div
                key={asset.id}
                className={cn(
                  "group relative mb-3 break-inside-avoid overflow-hidden rounded-lg border",
                  selected ? "border-gold ring-2 ring-gold/40" : "border-border",
                )}
              >
                <Image
                  src={asset.url}
                  alt={asset.fileName ?? "Media asset"}
                  width={thumb.width}
                  height={thumb.height}
                  className="block h-auto w-full"
                  sizes="(min-width: 1024px) 16vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw"
                />

                <button
                  type="button"
                  onClick={() => toggleSelect(asset.id)}
                  aria-label={selected ? "Deselect image" : "Select image"}
                  className={cn(
                    "absolute top-2 left-2 flex size-5 items-center justify-center rounded-md border bg-background/90 transition-opacity",
                    selected
                      ? "border-gold opacity-100"
                      : "border-border opacity-0 group-hover:opacity-100",
                  )}
                >
                  <Checkbox
                    checked={selected}
                    onCheckedChange={() => toggleSelect(asset.id)}
                    className="pointer-events-none size-3.5 border-none"
                  />
                </button>

                <div className="absolute inset-0 flex flex-col justify-between bg-black/0 p-2 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
                  <div className="ml-auto flex gap-1">
                    <Popover>
                      <PopoverTrigger
                        render={
                          <Button
                            variant="secondary"
                            size="icon-sm"
                            aria-label={`Edit tags for ${asset.fileName ?? "this image"}`}
                          />
                        }
                      >
                        <Tag className="size-3.5" />
                      </PopoverTrigger>
                      <PopoverContent align="end">
                        <TagEditor
                          asset={asset}
                          onSaved={(tags) => {
                            setAssets((prev) =>
                              prev.map((a) =>
                                a.id === asset.id ? { ...a, tags } : a,
                              ),
                            );
                            toast.success("Tags updated");
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                    <Button
                      variant="destructive"
                      size="icon-sm"
                      aria-label={`Delete ${asset.fileName ?? "this image"}`}
                      onClick={() => setDeleteTarget(asset)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                  <div>
                    {asset.tags.length > 0 && (
                      <div className="mb-1 flex flex-wrap gap-1">
                        {asset.tags.slice(0, 2).map((tag) => (
                          <Badge
                            key={tag}
                            variant="gold"
                            className="h-4.5 w-auto px-1.5 text-[0.6rem]"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <p className="truncate text-[0.65rem] text-white">
                      {asset.width}×{asset.height} · {formatDate(asset.createdAt)}
                    </p>
                  </div>
                </div>

                {selected && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gold/10">
                    <Check className="size-6 text-gold-dark" />
                  </div>
                )}
              </div>
            );
          })}
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

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedIds.size} image{selectedIds.size === 1 ? "" : "s"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the selected images from Cloudinary
              and the media library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isBulkDeleting}
              onClick={handleBulkDelete}
            >
              {isBulkDeleting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Trash2 className="size-3.5" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
