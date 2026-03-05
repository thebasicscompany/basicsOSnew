import { z } from "zod";

export const customFieldCreateSchema = z.object({
  resource: z.string().trim().min(1),
  name: z.string().trim().min(1),
  label: z.string().trim().min(1),
  fieldType: z.string().trim().min(1),
  options: z.array(z.string()).optional(),
});
