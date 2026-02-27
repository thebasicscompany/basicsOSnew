import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { Db } from "./db/client.js";

export function createAuth(db: Db, baseUrl: string, secret: string) {
  return betterAuth({
    database: drizzleAdapter(db, { provider: "pg" }),
    basePath: "/api/auth",
    baseURL: baseUrl,
    secret,
    // Allow any localhost port (web + Electron dev servers)
    trustedOrigins: async (req) => {
      const origin = req?.headers?.get("origin");
      if (!origin) return [];
      try {
        const url = new URL(origin);
        const isLocal =
          (url.hostname === "localhost" || url.hostname === "127.0.0.1") &&
          (url.protocol === "http:" || url.protocol === "https:");
        return isLocal ? [origin] : [];
      } catch {
        return [];
      }
    },
    emailAndPassword: {
      enabled: true,
    },
    session: {
      cookieCache: { enabled: true },
    },
  });
}
