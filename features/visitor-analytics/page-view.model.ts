import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { tenantField } from "@/lib/db/schema-helpers";

const pageViewSchema = new Schema(
  {
    tenantId: tenantField,
    // Anonymous first-party id from a long-lived cookie — never tied to a
    // real identity. "New vs returning" is derived by checking whether this
    // id has any event before the queried period, not from a session cookie.
    visitorId: { type: String, required: true },
    path: { type: String, required: true },
    // Simplified to a referring domain (or "Direct"/"Internal") before
    // storage — see referrerLabel() in page-view.actions.ts.
    referrer: { type: String, default: "Direct" },
    device: {
      type: String,
      enum: ["mobile", "tablet", "desktop"],
      default: "desktop",
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

pageViewSchema.index({ tenantId: 1, createdAt: -1 });
pageViewSchema.index({ tenantId: 1, visitorId: 1, createdAt: 1 });
pageViewSchema.index({ tenantId: 1, path: 1 });

export type PageViewDocument = InferSchemaType<typeof pageViewSchema>;

export const PageViewModel: Model<PageViewDocument> =
  models.PageView ?? model<PageViewDocument>("PageView", pageViewSchema);
