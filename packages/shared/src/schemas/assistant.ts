import { z } from "zod";

export const assistantSchema = z.object({
  message: z.string().min(1),
  messages: z
    .array(z.object({ role: z.string(), content: z.string() }))
    .optional(),
});

export type AssistantRequest = z.infer<typeof assistantSchema>;
