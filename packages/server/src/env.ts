import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url().default("http://localhost:5173"),
  BASICOS_API_URL: z.string().url().default("https://api.basicsos.com"),
  NOCODB_BASE_URL: z.string().url().default("http://localhost:8080"),
  NOCODB_API_TOKEN: z.string().default(""),
  NOCODB_BASE_ID: z.string().default(""),
  NOCODB_WEBHOOK_SECRET: z.string().default(""),
});

export type Env = z.infer<typeof envSchema>;

export function getEnv(): Env {
  return envSchema.parse(process.env);
}
