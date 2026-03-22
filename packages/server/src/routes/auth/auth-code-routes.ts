import type { Hono } from "hono";
import { randomBytes } from "node:crypto";
import type { Db } from "@/db/client.js";
import type { createAuth } from "@/auth.js";
import { authMiddleware } from "@/middleware/auth.js";

const AUTH_COOKIE_NAMES = [
  "__Secure-better-auth.session_token",
  "better-auth.session_token",
];

/** In-memory store for one-time auth codes. Maps code → signed cookie value + metadata. */
const pendingCodes = new Map<
  string,
  { signedCookieValue: string; cookieName: string; userId: string; expiresAt: number }
>();

/**
 * Registers auth-code endpoints used by the hosted basicsos.com auth flow.
 *
 * Flow:
 *  1. basicsos.com signs the user in → server sets a signed session cookie on the browser
 *  2. basicsos.com calls POST /api/auth-code (with that cookie) → gets a one-time code
 *  3. basicsos.com passes the code via deep link to the Electron app
 *  4. Electron calls POST /api/auth-code/exchange → gets the signed cookie value back
 *  5. Electron injects the signed cookie into its cookie store
 */
export function registerAuthCodeRoutes(
  app: Hono,
  db: Db,
  auth: ReturnType<typeof createAuth>,
): void {
  // Create a one-time auth code. Requires a valid session (signed cookie).
  app.post("/auth-code", authMiddleware(auth, db), async (c) => {
    const session = c.get("session") as { user?: { id?: string } } | null;
    if (!session?.user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Extract the signed session cookie value from the request
    const cookieHeader = c.req.header("Cookie") ?? "";
    let signedCookieValue = "";
    let cookieName = "";
    for (const name of AUTH_COOKIE_NAMES) {
      const match = new RegExp(`(?:^|;\\s*)${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]+)`).exec(cookieHeader);
      if (match?.[1]) {
        signedCookieValue = match[1];
        cookieName = name;
        break;
      }
    }

    if (!signedCookieValue) {
      return c.json({ error: "No session cookie found" }, 400);
    }

    const code = randomBytes(32).toString("hex");
    pendingCodes.set(code, {
      signedCookieValue,
      cookieName,
      userId: session.user.id,
      expiresAt: Date.now() + 2 * 60 * 1000, // 2-minute window
    });

    // Cleanup expired codes
    for (const [k, v] of pendingCodes) {
      if (Date.now() > v.expiresAt) pendingCodes.delete(k);
    }

    return c.json({ code });
  });

  // Exchange a one-time code for the signed cookie value.
  app.post("/auth-code/exchange", async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "Invalid JSON" }, 400);
    }
    const { code } = body as { code?: string };
    if (!code) {
      return c.json({ error: "Code is required" }, 400);
    }

    const entry = pendingCodes.get(code);
    if (!entry) {
      return c.json({ error: "Invalid or expired code" }, 400);
    }
    if (Date.now() > entry.expiresAt) {
      pendingCodes.delete(code);
      return c.json({ error: "Code expired" }, 400);
    }
    pendingCodes.delete(code);

    return c.json({
      cookieName: entry.cookieName,
      cookieValue: entry.signedCookieValue,
    });
  });
}
