"use server";

import { revalidatePath } from "next/cache";
import type { Model } from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { requirePermission } from "@/lib/auth/permissions";
import { DEFAULT_TENANT_ID } from "@/lib/db/schema-helpers";
import {
  deleteImage,
  deleteVideo,
  publicIdFromUrl,
} from "@/lib/cloudinary/upload";
import { logger } from "@/lib/logger";
import { ProductModel } from "@/features/products/product.model";
import { CategoryModel } from "@/features/categories/category.model";
import { CollectionModel } from "@/features/collections/collection.model";
import { OfferModel } from "@/features/offers/offer.model";
import { BlogPostModel } from "@/features/blog/blog-post.model";
import { FaqItemModel } from "@/features/faq/faq-item.model";
import { GalleryImageModel } from "@/features/gallery/gallery-image.model";
import { StylingStoryModel } from "@/features/styling-stories/styling-story.model";
import { HeroSlideModel } from "@/features/hero-slides/hero-slide.model";
import { CmsPageModel } from "@/features/pages/page.model";
import { TestimonialModel } from "@/features/testimonials/testimonial.model";
import { EventModel } from "@/features/events/event.model";
import { logAudit } from "@/features/audit-logs/audit-log.actions";
import { ROUTES } from "@/constants/routes";
import type { ActionResult } from "@/types/common";
import type { RecycleBinItem } from "@/features/recycle-bin/recycle-bin.types";

interface RecycleDoc {
  _id: unknown;
  deletedAt?: Date | null;
  name?: { en?: string };
  title?: { en?: string };
  question?: { en?: string };
  slug?: string;
  skuCode?: string;
  authorName?: string;
  caption?: { en?: string };
  imageUrl?: string;
  coverImageUrl?: string;
  coverVideoUrl?: string;
  mobileImageUrl?: string;
  desktopImageUrl?: string;
  images?: { publicId: string }[];
}

/** Extracts Cloudinary public_ids to clean up on permanent delete — either a direct `publicId` field (Product) or derived from stored delivery URLs. */
function imagePublicIdsOf(doc: RecycleDoc): string[] {
  const ids: string[] = [];
  if (doc.images) ids.push(...doc.images.map((img) => img.publicId));
  const urls = [
    doc.imageUrl,
    doc.coverImageUrl,
    doc.mobileImageUrl,
    doc.desktopImageUrl,
  ].filter((url): url is string => Boolean(url));
  for (const url of urls) {
    const derived = publicIdFromUrl(url);
    if (derived) ids.push(derived);
  }
  return ids;
}

/** Cover videos (Styling Story) are a separate Cloudinary resource type — deleted through `deleteVideo`, not `deleteImage`. */
function videoPublicIdsOf(doc: RecycleDoc): string[] {
  if (!doc.coverVideoUrl) return [];
  const derived = publicIdFromUrl(doc.coverVideoUrl);
  return derived ? [derived] : [];
}

/** Static registry (not dynamic runtime registration) so every entry survives independent Server Action bundling in Next.js. */
const RECYCLE_BIN_ADAPTERS: {
  resource: string;
  resourceLabel: string;
  model: Model<unknown>;
  labelOf: (doc: RecycleDoc) => string;
}[] = [
  {
    resource: "product",
    resourceLabel: "Product",
    model: ProductModel as Model<unknown>,
    labelOf: (d) => d.name?.en || d.skuCode || "Product",
  },
  {
    resource: "category",
    resourceLabel: "Category",
    model: CategoryModel as Model<unknown>,
    labelOf: (d) => d.name?.en || d.slug || "Category",
  },
  {
    resource: "collection",
    resourceLabel: "Collection",
    model: CollectionModel as Model<unknown>,
    labelOf: (d) => d.name?.en || d.slug || "Collection",
  },
  {
    resource: "offer",
    resourceLabel: "Offer",
    model: OfferModel as Model<unknown>,
    labelOf: (d) => d.title?.en || "Offer",
  },
  {
    resource: "blog_post",
    resourceLabel: "Blog Post",
    model: BlogPostModel as Model<unknown>,
    labelOf: (d) => d.title?.en || d.slug || "Blog Post",
  },
  {
    resource: "faq_item",
    resourceLabel: "FAQ Item",
    model: FaqItemModel as Model<unknown>,
    labelOf: (d) => d.question?.en || "FAQ Item",
  },
  {
    resource: "gallery_image",
    resourceLabel: "Gallery Image",
    model: GalleryImageModel as Model<unknown>,
    labelOf: (d) => d.caption?.en || "Gallery Image",
  },
  {
    resource: "styling_story",
    resourceLabel: "Styling Story",
    model: StylingStoryModel as Model<unknown>,
    labelOf: (d) => d.title?.en || "Styling Story",
  },
  {
    resource: "hero_slide",
    resourceLabel: "Hero Slide",
    model: HeroSlideModel as Model<unknown>,
    labelOf: () => "Hero Slide",
  },
  {
    resource: "cms_page",
    resourceLabel: "Page",
    model: CmsPageModel as Model<unknown>,
    labelOf: (d) => d.title?.en || d.slug || "Page",
  },
  {
    resource: "testimonial",
    resourceLabel: "Testimonial",
    model: TestimonialModel as Model<unknown>,
    labelOf: (d) => d.authorName || "Testimonial",
  },
  {
    resource: "event",
    resourceLabel: "Event",
    model: EventModel as Model<unknown>,
    labelOf: (d) => d.title?.en || d.slug || "Event",
  },
];

export async function listRecycleBinItems(): Promise<RecycleBinItem[]> {
  await requirePermission("recycle_bin.manage");
  await connectToDatabase();

  const results = await Promise.all(
    RECYCLE_BIN_ADAPTERS.map(async (adapter) => {
      const docs = await adapter.model
        .find({ tenantId: DEFAULT_TENANT_ID, deletedAt: { $ne: null } })
        .sort({ deletedAt: -1 })
        .lean();
      return (docs as RecycleDoc[]).map((doc) => ({
        id: String(doc._id),
        resource: adapter.resource,
        resourceLabel: adapter.resourceLabel,
        label: adapter.labelOf(doc),
        deletedAt: doc.deletedAt ? doc.deletedAt.toISOString() : "",
      }));
    }),
  );

  return results.flat().sort((a, b) => b.deletedAt.localeCompare(a.deletedAt));
}

export async function restoreRecycleBinItem(
  resource: string,
  id: string,
): Promise<ActionResult> {
  const session = await requirePermission("recycle_bin.manage");
  const adapter = RECYCLE_BIN_ADAPTERS.find((a) => a.resource === resource);
  if (!adapter) return { success: false, error: "Unknown item type" };

  await connectToDatabase();
  const result = await adapter.model.updateOne(
    { _id: id, tenantId: DEFAULT_TENANT_ID },
    { deletedAt: null },
  );

  if (result.matchedCount === 0) {
    return { success: false, error: "Item not found" };
  }

  logAudit(session, "restored", resource, id);
  revalidatePath(ROUTES.admin.recycleBin);
  return { success: true, data: undefined };
}

export async function permanentlyDeleteRecycleBinItem(
  resource: string,
  id: string,
): Promise<ActionResult> {
  const session = await requirePermission("recycle_bin.manage");
  const adapter = RECYCLE_BIN_ADAPTERS.find((a) => a.resource === resource);
  if (!adapter) return { success: false, error: "Unknown item type" };

  await connectToDatabase();

  const doc = (await adapter.model
    .findOne({ _id: id, tenantId: DEFAULT_TENANT_ID, deletedAt: { $ne: null } })
    .lean()) as RecycleDoc | null;

  const result = await adapter.model.deleteOne({
    _id: id,
    tenantId: DEFAULT_TENANT_ID,
    deletedAt: { $ne: null },
  });

  if (result.deletedCount === 0) {
    return { success: false, error: "Item not found" };
  }

  // Best-effort: the DB record is already gone, so a Cloudinary failure
  // here shouldn't be reported as the delete having failed — just logged
  // so an orphaned asset can be cleaned up manually if this ever fires.
  if (doc) {
    const publicIds = imagePublicIdsOf(doc);
    const videoPublicIds = videoPublicIdsOf(doc);
    await Promise.all([
      ...publicIds.map((publicId) =>
        deleteImage(publicId).catch((error) =>
          logger.error(
            "permanentlyDeleteRecycleBinItem",
            "Cloudinary delete failed",
            {
              error,
              resource,
              publicId,
            },
          ),
        ),
      ),
      ...videoPublicIds.map((publicId) =>
        deleteVideo(publicId).catch((error) =>
          logger.error(
            "permanentlyDeleteRecycleBinItem",
            "Cloudinary video delete failed",
            {
              error,
              resource,
              publicId,
            },
          ),
        ),
      ),
    ]);
  }

  logAudit(session, "permanently_deleted", resource, id);
  revalidatePath(ROUTES.admin.recycleBin);
  return { success: true, data: undefined };
}
