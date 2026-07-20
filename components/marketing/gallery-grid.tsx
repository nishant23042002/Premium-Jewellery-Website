import { Gem } from "lucide-react";
import { Grid } from "@/components/common/grid";
import { ImageWithFallback } from "@/components/common/image-with-fallback";
import { PlaceholderImage } from "@/components/common/placeholder-image";
import { ImageReveal } from "@/components/motion/image-reveal";

export interface GalleryItem {
  id: string;
  caption?: string;
  imageUrl?: string;
}

/** Showroom photo grid (Phase 4 "Store Gallery"). Wipe-reveals each tile as it scrolls in. */
export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  return (
    <Grid cols={{ base: 2, sm: 3, lg: 4 }} gap="md">
      {items.map((item) => (
        <ImageReveal
          key={item.id}
          className="relative aspect-square rounded-xl"
        >
          {item.imageUrl ? (
            <ImageWithFallback
              src={item.imageUrl}
              alt={item.caption ?? ""}
              fill
              sizes="(min-width: 1024px) 25vw, 50vw"
              className="object-cover"
            />
          ) : (
            <PlaceholderImage
              seed={item.id}
              icon={Gem}
              className="h-full w-full"
              label={item.caption}
            />
          )}
        </ImageReveal>
      ))}
    </Grid>
  );
}
