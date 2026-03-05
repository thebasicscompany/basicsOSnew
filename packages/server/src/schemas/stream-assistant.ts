import { z } from "zod";

export const streamAssistantPostSchema = z.object({
  message: z.string().trim().min(1),
  history: z
    .array(
      z.object({
        role: z.string(),
        content: z.string(),
      }),
    )
    .optional()
    .default([]),
});
