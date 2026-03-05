import { z } from "zod";

export const runPostSchema = z.object({
  ruleId: z.number().int().positive(),
});

export const runsListQuerySchema = z.object({
  ruleId: z.string().min(1),
  limit: z
    .string()
    .optional()
    .transform((s) =>
      Math.min(Math.max(parseInt(s || "20", 10) || 20, 1), 100),
    ),
});
