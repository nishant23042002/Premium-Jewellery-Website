import type { LucideIcon } from "lucide-react";
import { Gem } from "lucide-react";
import { cn } from "@/lib/utils";

const PALETTES = [
  "from-[oklch(0.9_0.03_75)] via-[oklch(0.82_0.05_75)] to-[oklch(0.72_0.08_70)]",
  "from-[oklch(0.92_0.02_50)] via-[oklch(0.85_0.03_45)] to-[oklch(0.75_0.05_40)]",
  "from-[oklch(0.88_0.03_90)] via-[oklch(0.8_0.05_85)] to-[oklch(0.68_0.08_75)]",
];

function hashToIndex(seed: string, mod: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++)
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return hash % mod;
}

interface PlaceholderImageProps {
  seed: string;
  icon?: LucideIcon;
  className?: string;
  label?: string;
}

/**
 * Tasteful stand-in for real photography (gallery/blog/events/testimonial
 * imagery doesn't exist yet — no product photos have been shot, and we
 * don't hotlink third-party stock images). Deterministic gold-toned
 * gradient chosen from `seed` so the same item always renders the same
 * placeholder, with a centered icon and honest "photo pending" label.
 */
export function PlaceholderImage({
  seed,
  icon: Icon = Gem,
  className,
  label,
}: PlaceholderImageProps) {
  const palette = PALETTES[hashToIndex(seed, PALETTES.length)];

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-gradient-to-br",
        palette,
        className,
      )}
    >
      <Icon
        className="size-8 text-foreground/25"
        strokeWidth={1.25}
        aria-hidden
      />
      {label && (
        <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] tracking-wide text-foreground/40 uppercase">
          {label}
        </span>
      )}
    </div>
  );
}
