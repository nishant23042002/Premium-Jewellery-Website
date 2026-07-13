"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/permissions";
import {
  getSiteSetting,
  setSiteSetting,
} from "@/features/site-settings/site-setting.actions";
import {
  announcementBarFormSchema,
  type AnnouncementBarFormInput,
} from "@/features/announcement-bar/announcement-bar.schema";
import { logAudit } from "@/features/audit-logs/audit-log.actions";
import { ROUTES } from "@/constants/routes";
import type { ActionResult } from "@/types/common";
import {
  DEFAULT_ANNOUNCEMENT_BAR,
  type AnnouncementBarConfig,
} from "@/features/announcement-bar/announcement-bar.types";

const SETTING_KEY = "announcement_bar";

export async function getAnnouncementBar(): Promise<AnnouncementBarConfig> {
  const stored = await getSiteSetting<AnnouncementBarConfig>(SETTING_KEY);
  return { ...DEFAULT_ANNOUNCEMENT_BAR, ...stored };
}

export async function updateAnnouncementBar(
  values: AnnouncementBarFormInput,
): Promise<ActionResult<AnnouncementBarConfig>> {
  const session = await requirePermission("announcement.manage");

  const parsed = announcementBarFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid announcement bar configuration",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await setSiteSetting(SETTING_KEY, parsed.data);

  logAudit(session, "updated", "announcement_bar");
  revalidatePath("/", "layout");
  revalidatePath(ROUTES.admin.announcementBar);
  return { success: true, data: parsed.data };
}
