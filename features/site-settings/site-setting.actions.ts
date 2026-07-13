import { connectToDatabase } from "@/lib/db/mongoose";
import { DEFAULT_TENANT_ID } from "@/lib/db/schema-helpers";
import { SiteSettingModel } from "@/features/site-settings/site-setting.model";

/**
 * Generic typed key/value read over the flexible SiteSetting collection —
 * every Phase 7 "Site"/"Settings" module (Homepage Builder, Announcement
 * Bar, Appearance, SEO) stores its config under its own key rather than
 * needing a dedicated Mongoose schema each.
 */
export async function getSiteSetting<T>(key: string): Promise<T | null> {
  await connectToDatabase();
  const doc = await SiteSettingModel.findOne({
    tenantId: DEFAULT_TENANT_ID,
    key,
  }).lean();
  return doc ? (doc.value as T) : null;
}

/**
 * Caller is responsible for its own permission check before writing — this
 * is a low-level primitive, not gated itself (every caller already does its
 * own `requirePermission` + Zod schema validation on `value`'s actual shape
 * before calling this). This is a defense-in-depth shape guard only — it
 * rejects clearly-wrong input (null/non-object) rather than re-validating
 * per-config-type business rules, which stay in each caller's own schema.
 */
export async function setSiteSetting<T>(key: string, value: T): Promise<void> {
  if (typeof key !== "string" || !key.trim()) {
    throw new Error("setSiteSetting: key must be a non-empty string");
  }
  if (value === null || typeof value !== "object") {
    throw new Error("setSiteSetting: value must be a plain object");
  }

  await connectToDatabase();
  await SiteSettingModel.findOneAndUpdate(
    { tenantId: DEFAULT_TENANT_ID, key },
    { value },
    { upsert: true },
  );
}
