import { z } from "zod";

export const customerNotesFormSchema = z.object({
  notes: z.string().max(2000).optional(),
  tags: z.array(z.string()).default([]),
});

export type CustomerNotesFormValues = z.infer<typeof customerNotesFormSchema>;
export type CustomerNotesFormInput = z.input<typeof customerNotesFormSchema>;
