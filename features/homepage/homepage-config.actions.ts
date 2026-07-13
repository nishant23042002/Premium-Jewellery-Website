"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/permissions";
import {
  getSiteSetting,
  setSiteSetting,
} from "@/features/site-settings/site-setting.actions";
import {
  homepageConfigFormSchema,
  type HomepageConfigFormInput,
} from "@/features/homepage/homepage-config.schema";
import { logAudit } from "@/features/audit-logs/audit-log.actions";
import { ROUTES } from "@/constants/routes";
import type { ActionResult } from "@/types/common";
import {
  DEFAULT_HOMEPAGE_CONFIG,
  type HomepageConfig,
} from "@/features/homepage/homepage-config.types";

const SETTING_KEY = "homepage_config";

export async function getHomepageConfig(): Promise<HomepageConfig> {
  const stored = await getSiteSetting<HomepageConfig>(SETTING_KEY);
  return { ...DEFAULT_HOMEPAGE_CONFIG, ...stored };
}

export async function updateHomepageConfig(
  values: HomepageConfigFormInput,
): Promise<ActionResult<HomepageConfig>> {
  const session = await requirePermission("homepage.manage");

  const parsed = homepageConfigFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid homepage configuration",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await setSiteSetting(SETTING_KEY, parsed.data);

  logAudit(session, "updated", "homepage_config");
  revalidatePath("/", "layout");
  revalidatePath(ROUTES.admin.homepageBuilder);
  return { success: true, data: parsed.data };
}
