import { z } from "zod";

export const userRolesPutSchema = z.object({
  roleKeys: z.array(z.string().trim().min(1)).min(1),
});
