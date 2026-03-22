import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { Db } from "@/db/client.js";
import type { Env } from "@/env.js";
import { createSendResetPassword } from "./lib/send-reset-password.js";
import { isTrustedOrigin, isElectronUserAgent } from "./lib/trusted-origins.js";

export function createAuth(
  db: Db,
  baseUrl: string,
  secret: string,
  allowedOrigins: string[],
  env: Env,
) {
  const allowedSet = new Set(
    allowedOrigins.map((o) => o.trim()).filter(Boolean),
  );
  const sendResetPasswordFn = createSendResetPassword(db, env);

  return betterAuth({
    database: drizzleAdapter(db, { provider: "pg" }),
    basePath: "/api/auth",
    baseURL: baseUrl,
    secret,
    // Localhost (dev) + ALLOWED_ORIGINS (production)
    // Return origins valid for both CORS and redirectURL validation. When basicsos.com
    // (or localhost:3000 dev) calls forget-password with redirectTo to basicsos.com,
    // that redirect URL's origin must be in this list or we get INVALID_REDIRECTURL.
    trustedOrigins: async (req) => {
      const origin = req?.headers?.get("origin") ?? undefined;
      const userAgent = req?.headers?.get("user-agent");
      // Electron may send no Origin; treat as "null" so sign-out/auth works (avoids 403)
      const effectiveOrigin = origin !== undefined && origin !== "" ? origin : (isElectronUserAgent(userAgent) ? "null" : undefined);
      const origins: string[] = [];
      if (effectiveOrigin && isTrustedOrigin(effectiveOrigin, allowedSet, userAgent)) {
        origins.push(effectiveOrigin);
      }
      // Always allow basicsos.com for redirectTo (hosted auth). When dev runs on
      // localhost:3000, the request origin is localhost but redirectTo points to basicsos.com.
      origins.push("https://basicsos.com");
      // Allow localhost for redirectTo when testing basicsos.com dev locally
      origins.push("http://localhost:3000");
      origins.push("http://127.0.0.1:3000");
      return [...new Set(origins)];
    },
    emailAndPassword: {
      enabled: true,
      sendResetPassword: async ({ user, url }) => {
        void sendResetPasswordFn(user.email, url, user.id);
      },
    },
    session: {
      cookieCache: { enabled: true },
    },
    // Cross-origin (Electron/localhost -> Railway): cookies must use SameSite=None
    ...(baseUrl.startsWith("https")
      ? {
          advanced: {
            defaultCookieAttributes: {
              sameSite: "none" as const,
              secure: true,
            },
          },
        }
      : {}),
  });
}
