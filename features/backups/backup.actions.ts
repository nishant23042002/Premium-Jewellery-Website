"use server";

import { connectToDatabase } from "@/lib/db/mongoose";
import { requirePermission } from "@/lib/auth/permissions";
import { DEFAULT_TENANT_ID } from "@/lib/db/schema-helpers";
import { ProductModel } from "@/features/products/product.model";
import { CategoryModel } from "@/features/categories/category.model";
import { CollectionModel } from "@/features/collections/collection.model";
import { OfferModel } from "@/features/offers/offer.model";
import { BlogPostModel } from "@/features/blog/blog-post.model";
import { FaqItemModel } from "@/features/faq/faq-item.model";
import { GalleryImageModel } from "@/features/gallery/gallery-image.model";
import { CmsPageModel } from "@/features/pages/page.model";
import { TestimonialModel } from "@/features/testimonials/testimonial.model";
import { EventModel } from "@/features/events/event.model";
import { ReservationModel } from "@/features/reservations/reservation.model";
import { EnquiryModel } from "@/features/enquiries/enquiry.model";
import { CustomerModel } from "@/features/customers/customer.model";
import { MetalRateModel } from "@/features/metal-rates/metal-rate.model";
import { logAudit } from "@/features/audit-logs/audit-log.actions";
import type { ActionResult } from "@/types/common";

export interface BackupPayload {
  generatedAt: string;
  tenantId: string;
  data: Record<string, unknown[]>;
}

/**
 * Snapshots the store's business content as JSON for a manual, local
 * download (PRD-adjacent "Backups" — no cloud storage wired up, mirrors the
 * stubbed-but-real pattern used elsewhere, e.g. email sending). Deliberately
 * excludes AdminUser/Role/AuditLog — system/security state, not business
 * content, and staff with backups access shouldn't be handed credential
 * data even hashed.
 */
export async function generateBackup(): Promise<ActionResult<BackupPayload>> {
  const session = await requirePermission("backups.manage");
  await connectToDatabase();

  const filter = { tenantId: DEFAULT_TENANT_ID };
  const [
    products,
    categories,
    collections,
    offers,
    blogPosts,
    faqItems,
    galleryImages,
    cmsPages,
    testimonials,
    events,
    reservations,
    enquiries,
    customers,
    metalRates,
  ] = await Promise.all([
    ProductModel.find(filter).lean(),
    CategoryModel.find(filter).lean(),
    CollectionModel.find(filter).lean(),
    OfferModel.find(filter).lean(),
    BlogPostModel.find(filter).lean(),
    FaqItemModel.find(filter).lean(),
    GalleryImageModel.find(filter).lean(),
    CmsPageModel.find(filter).lean(),
    TestimonialModel.find(filter).lean(),
    EventModel.find(filter).lean(),
    ReservationModel.find(filter).lean(),
    EnquiryModel.find(filter).lean(),
    CustomerModel.find(filter).lean(),
    MetalRateModel.find(filter).lean(),
  ]);

  logAudit(session, "generated", "backup");

  // Round-trip through JSON so ObjectId/Date instances become plain
  // strings before crossing the Server Action serialization boundary.
  const data = JSON.parse(
    JSON.stringify({
      products,
      categories,
      collections,
      offers,
      blogPosts,
      faqItems,
      galleryImages,
      cmsPages,
      testimonials,
      events,
      reservations,
      enquiries,
      customers,
      metalRates,
    }),
  );

  return {
    success: true,
    data: {
      generatedAt: new Date().toISOString(),
      tenantId: DEFAULT_TENANT_ID,
      data,
    },
  };
}
