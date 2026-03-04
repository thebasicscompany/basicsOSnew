import { z } from "zod";

export const mergeContactsBodySchema = z.object({
  loserId: z.number().int().positive(),
  winnerId: z.number().int().positive(),
});

export type MergeContactsBody = z.infer<typeof mergeContactsBodySchema>;
