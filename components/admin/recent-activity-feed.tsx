import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  DatabaseBackup,
  FileUp,
  MessageSquarePlus,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate, formatRelativeTime } from "@/lib/utils/format";
import { ROUTES } from "@/constants/routes";
import type { AuditLogEntry } from "@/features/audit-logs/audit-log.types";

const ACTION_STYLE: Record<string, { icon: LucideIcon; className: string }> = {
  created: { icon: Plus, className: "bg-success/10 text-success" },
  updated: { icon: Pencil, className: "bg-gold/10 text-gold-dark" },
  deleted: { icon: Trash2, className: "bg-destructive/10 text-destructive" },
  status_changed: { icon: RefreshCw, className: "bg-warning/10 text-warning" },
  note_added: {
    icon: MessageSquarePlus,
    className: "bg-gold/10 text-gold-dark",
  },
  uploaded: { icon: Upload, className: "bg-gold/10 text-gold-dark" },
  imported: { icon: FileUp, className: "bg-gold/10 text-gold-dark" },
  generated: { icon: DatabaseBackup, className: "bg-muted text-muted-foreground" },
};
const DEFAULT_ACTION_STYLE: { icon: LucideIcon; className: string } = {
  icon: Activity,
  className: "bg-muted text-muted-foreground",
};

/** Only resources with a real per-item admin edit page get linked — the rest (settings singletons, etc.) render as plain text. */
const RESOURCE_HREF: Record<string, (id: string) => string> = {
  product: ROUTES.admin.product,
  collection: ROUTES.admin.collection,
  category: ROUTES.admin.category,
  offer: ROUTES.admin.offer,
  blog_post: ROUTES.admin.blogPost,
  hero_slide: ROUTES.admin.heroSlidesItem,
  testimonial: ROUTES.admin.testimonial,
  styling_story: ROUTES.admin.stylingStoriesItem,
  event: ROUTES.admin.event,
  faq_item: ROUTES.admin.faqItem,
  gallery_image: ROUTES.admin.galleryItem,
  cms_page: ROUTES.admin.page,
  staff: ROUTES.admin.staffMember,
  role: ROUTES.admin.role,
  reservation: ROUTES.admin.reservation,
  customer: ROUTES.admin.customer,
};

const RESOURCE_LABEL: Record<string, string> = {
  product: "product",
  collection: "collection",
  category: "category",
  offer: "offer",
  blog_post: "blog post",
  hero_slide: "hero slide",
  testimonial: "testimonial",
  styling_story: "styling story",
  event: "event",
  faq_item: "FAQ item",
  gallery_image: "gallery image",
  cms_page: "page",
  staff: "staff account",
  role: "role",
  reservation: "reservation",
  enquiry: "enquiry",
  customer: "customer",
  media: "media asset",
  backup: "backup",
  homepage_config: "homepage config",
  metal_rate: "metal rate",
  seo_config: "SEO settings",
  appearance_config: "appearance settings",
  announcement_bar: "announcement bar",
};

/** Dashboard's "what just happened" feed — a real timeline (icon per action, actor, linked resource, relative time) instead of a flat text list. */
export function RecentActivityFeed({ entries }: { entries: AuditLogEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Nothing recorded yet.
      </p>
    );
  }

  return (
    <ul className="relative">
      <span
        className="absolute top-4 bottom-4 left-[22px] w-px bg-border"
        aria-hidden
      />
      {entries.map((entry) => {
        const style = ACTION_STYLE[entry.action] ?? DEFAULT_ACTION_STYLE;
        const Icon = style.icon;
        const hrefBuilder = entry.resourceId
          ? RESOURCE_HREF[entry.resource]
          : undefined;
        const href =
          hrefBuilder && entry.resourceId
            ? hrefBuilder(entry.resourceId)
            : undefined;
        const resourceLabel =
          RESOURCE_LABEL[entry.resource] ?? entry.resource.replace(/_/g, " ");

        return (
          <li
            key={entry.id}
            className="group relative flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/60"
          >
            <span
              className={cn(
                "relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full",
                style.className,
              )}
            >
              <Icon className="size-3.5" />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-sm leading-snug">
                <span className="font-medium">
                  {entry.actorEmail.split("@")[0]}
                </span>{" "}
                <span className="text-muted-foreground">
                  {entry.action.replace(/_/g, " ")}
                </span>{" "}
                <span className="text-muted-foreground">{resourceLabel}</span>
                {entry.resourceLabel &&
                  (href ? (
                    <>
                      {" "}
                      <Link
                        href={href}
                        className="font-medium hover:text-gold-dark hover:underline"
                      >
                        {entry.resourceLabel}
                      </Link>
                    </>
                  ) : (
                    <span className="font-medium"> — {entry.resourceLabel}</span>
                  ))}
              </p>
              <p
                className="mt-0.5 text-xs text-muted-foreground"
                title={formatDate(entry.at)}
              >
                {formatRelativeTime(entry.at)}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
