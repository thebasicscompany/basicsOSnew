import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { Db } from "./db/client.js";

export function createAuth(db: Db, baseUrl: string, secret: string) {
  return betterAuth({
    database: drizzleAdapter(db, { provider: "pg" }),
    basePath: "/api/auth",
    baseURL: baseUrl,
    secret,
    emailAndPassword: {
      enabled: true,
    },
    session: {
      cookieCache: { enabled: true },
    },
  });
}
