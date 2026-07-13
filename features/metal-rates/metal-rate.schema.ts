import { z } from "zod";

export const metalRateFormSchema = z.object({
  metalType: z.enum(["gold", "silver"]),
  purity: z.string().min(1, "Purity is required (e.g. 22K, 999)"),
  ratePerGram: z.coerce.number().positive("Rate must be greater than 0"),
});

export type MetalRateFormValues = z.infer<typeof metalRateFormSchema>;

/** Shape of the "Update Today's Rate" dashboard form (PRD §21) — gold + silver together. */
export const dailyRatesFormSchema = z.object({
  goldRatePerGram: z.coerce
    .number()
    .positive("Gold rate must be greater than 0"),
  silverRatePerGram: z.coerce
    .number()
    .positive("Silver rate must be greater than 0"),
});

export type DailyRatesFormValues = z.infer<typeof dailyRatesFormSchema>;
/** z.coerce fields report as `unknown` pre-parse — this is what react-hook-form actually holds before submit. */
export type DailyRatesFormInput = z.input<typeof dailyRatesFormSchema>;
