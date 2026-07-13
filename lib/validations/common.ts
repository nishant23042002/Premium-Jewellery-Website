import { z } from "zod";
import { LOCALES } from "@/types/common";

/** Every locale required — used where content must be fully translated to publish. */
export const localizedTextSchema = z.object({
  en: z.string().min(1, "English text is required"),
  hi: z.string().min(1, "Hindi text is required"),
  mr: z.string().min(1, "Marathi text is required"),
});

/**
 * At least one locale required — matches the PRD's admin UX rule (§21) that
 * staff can save a draft in whichever language they're comfortable with and
 * fill the rest in later.
 */
export const partialLocalizedTextSchema = z
  .object({
    en: z.string().optional(),
    hi: z.string().optional(),
    mr: z.string().optional(),
  })
  .refine((val) => LOCALES.some((locale) => val[locale]?.trim()), {
    message: "At least one language must be filled in",
  });

export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

export const slugSchema = z
  .string()
  .min(1)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug must be lowercase, alphanumeric, and hyphen-separated",
  );

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
