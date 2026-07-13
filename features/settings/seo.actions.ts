"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/permissions";
import {
  getSiteSetting,
  setSiteSetting,
} from "@/features/site-settings/site-setting.actions";
import {
  seoFormSchema,
  type SeoFormInput,
} from "@/features/settings/seo.schema";
import { logAudit } from "@/features/audit-logs/audit-log.actions";
import { ROUTES } from "@/constants/routes";
import type { ActionResult } from "@/types/common";
import {
  DEFAULT_SEO_CONFIG,
  type SeoConfig,
} from "@/features/settings/seo.types";

const SETTING_KEY = "seo_config";

export async function getSeoConfig(): Promise<SeoConfig> {
  const stored = await getSiteSetting<SeoConfig>(SETTING_KEY);
  return { ...DEFAULT_SEO_CONFIG, ...stored };
}

export async function updateSeoConfig(
  values: SeoFormInput,
): Promise<ActionResult<SeoConfig>> {
  const session = await requirePermission("settings.manage");

  const parsed = seoFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid SEO settings",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await setSiteSetting(SETTING_KEY, parsed.data);

  logAudit(session, "updated", "seo_config");
  revalidatePath("/", "layout");
  revalidatePath(ROUTES.admin.settingsSeo);
  return { success: true, data: parsed.data };
}
