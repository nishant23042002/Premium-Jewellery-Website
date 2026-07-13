import Link from "next/link";
import type { AnnouncementBarConfig } from "@/features/announcement-bar/announcement-bar.types";

interface AnnouncementBarProps {
  config: AnnouncementBarConfig;
  /** This bar is how the site surfaces offers — auto-hide it once there's nothing current to promote, rather than relying on an admin to remember to toggle it off by hand. */
  hasCurrentOffers: boolean;
}

/** Optional thin banner above the gold-rate ticker — off by default until an admin turns it on. */
export function AnnouncementBar({
  config,
  hasCurrentOffers,
}: AnnouncementBarProps) {
  if (!config.isActive || !config.message || !hasCurrentOffers) return null;

  return (
    <div className="flex h-8 items-center justify-center gap-2 bg-gold-dark px-4 text-xs text-white">
      <span>{config.message}</span>
      {config.linkHref && config.linkLabel && (
        <Link
          href={config.linkHref}
          className="underline underline-offset-2 hover:opacity-80"
        >
          {config.linkLabel}
        </Link>
      )}
    </div>
  );
}
