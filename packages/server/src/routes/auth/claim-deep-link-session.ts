/**
 * GET /api/auth/claim-deep-link-session
 *
 * Accepts a raw Better Auth session token (from basicsos.com hosted auth),
 * validates it, signs it with the server secret, and sets the session cookie.
 * Used by the Electron app when completing the deep-link auth flow.
 *
 * The Electron app validates the deep-link state before opening this URL.
 * This endpoint only validates the token and sets the correctly signed cookie.
 */
import { eq, and, gt } from "drizzle-orm";
import { createHMAC } from "@better-auth/utils/hmac";
import type { Context } from "hono";
import type { Db } from "@/db/client.js";
import type { Env } from "@/env.js";
import { session as sessionTable } from "@/db/schema/auth.js";

const COOKIE_PREFIX = "better-auth";
const SECURE_PREFIX = "__Secure-";

function buildSetCookieHeader(
  name: string,
  value: string,
  options: { maxAge: number; secure: boolean },
): string {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=None",
  ];
  if (options.secure) parts.push("Secure");
  parts.push(`Max-Age=${options.maxAge}`);
  return parts.join("; ");
}

export async function handleClaimDeepLinkSession(
  c: Context,
  db: Db,
  env: Env,
): Promise<Response> {
  const token = c.req.query("token");
  if (!token || token.length < 32) {
    return c.json({ error: "Missing or invalid token" }, 400);
  }

  const [sessionRow] = await db
    .select()
    .from(sessionTable)
    .where(
      and(eq(sessionTable.token, token), gt(sessionTable.expiresAt, new Date())),
    )
    .limit(1);

  if (!sessionRow) {
    return c.json({ error: "Invalid or expired session" }, 401);
  }

  const signedToken = await createHMAC("SHA-256", "base64urlnopad").sign(
    env.BETTER_AUTH_SECRET,
    token,
  );

  const baseUrl = env.BETTER_AUTH_URL;
  const isSecure = baseUrl.startsWith("https");
  const maxAge = Math.max(
    60,
    Math.floor(
      (sessionRow.expiresAt.getTime() - Date.now()) / 1000,
    ),
  );

  const plainName = `${COOKIE_PREFIX}.session_token`;
  const secureName = `${SECURE_PREFIX}${COOKIE_PREFIX}.session_token`;

  // Set both cookie name variants so the session is found regardless of client
  c.header(
    "Set-Cookie",
    buildSetCookieHeader(plainName, signedToken, { maxAge, secure: isSecure }),
  );
  if (isSecure) {
    c.header(
      "Set-Cookie",
      buildSetCookieHeader(secureName, signedToken, { maxAge, secure: true }),
      { append: true },
    );
  }

  // Return minimal HTML for the Electron webview — no scripts needed
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Signed in</title></head><body><p>Signed in successfully. You can close this window.</p></body></html>`;
  return c.html(html);
}
