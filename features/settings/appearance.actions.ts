"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/permissions";
import {
  getSiteSetting,
  setSiteSetting,
} from "@/features/site-settings/site-setting.actions";
import {
  appearanceFormSchema,
  type AppearanceFormInput,
} from "@/features/settings/appearance.schema";
import { logAudit } from "@/features/audit-logs/audit-log.actions";
import { ROUTES } from "@/constants/routes";
import type { ActionResult } from "@/types/common";
import {
  DEFAULT_APPEARANCE_CONFIG,
  type AppearanceConfig,
} from "@/features/settings/appearance.types";

const SETTING_KEY = "appearance_config";

export async function getAppearanceConfig(): Promise<AppearanceConfig> {
  const stored = await getSiteSetting<AppearanceConfig>(SETTING_KEY);
  return { ...DEFAULT_APPEARANCE_CONFIG, ...stored };
}

export async function updateAppearanceConfig(
  values: AppearanceFormInput,
): Promise<ActionResult<AppearanceConfig>> {
  const session = await requirePermission("settings.manage");

  const parsed = appearanceFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid appearance settings",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await setSiteSetting(SETTING_KEY, parsed.data);

  logAudit(session, "updated", "appearance_config");
  revalidatePath("/", "layout");
  revalidatePath(ROUTES.admin.settingsAppearance);
  return { success: true, data: parsed.data };
}
