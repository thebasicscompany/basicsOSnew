import { z } from "zod";

export const transcriptionsPostSchema = z.object({
  audio: z.string().min(1),
  mime_type: z.string().optional().default("audio/webm"),
});

export const speechPostSchema = z.object({
  text: z.string().trim().min(1),
});
