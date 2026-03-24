import type { Context, Next } from "hono";
import { and, eq, isNull } from "drizzle-orm";
import type { Db } from "@/db/client.js";
import * as schema from "@/db/schema/index.js";
import {
  hashCrmApiToken,
  isCrmApiTokenFormat,
} from "@/lib/crm-api-token-crypto.js";

type AuthWithApi = {
  handler: (req: Request) => Promise<Response>;
  api: {
    getSession: (opts: { headers: Headers }) => Promise<{
      user?: { id?: string };
      session?: { id?: string; token?: string };
    } | null>;
  };
};

/**
 * Supports cookie-based auth (web), Bearer Better Auth session (pill overlay),
 * and Bearer `bos_crm_*` personal API tokens (programmatic CRM access).
 */
export function authMiddleware(auth: AuthWithApi, db: Db) {
  return async (c: Context, next: Next) => {
    const authHeader = c.req.header("Authorization");
    const cookieHeader = c.req.header("Cookie") ?? "";

    if (authHeader?.startsWith("Bearer ")) {
      const bearer = authHeader.slice(7).trim();
      if (bearer && isCrmApiTokenFormat(bearer)) {
        const h = hashCrmApiToken(bearer);
        const [row] = await db
          .select({
            userId: schema.crmUsers.userId,
            disabled: schema.crmUsers.disabled,
            tokenId: schema.crmApiTokens.id,
          })
          .from(schema.crmApiTokens)
          .innerJoin(
            schema.crmUsers,
            eq(schema.crmApiTokens.crmUserId, schema.crmUsers.id),
          )
          .where(
            and(
              eq(schema.crmApiTokens.tokenHash, h),
              isNull(schema.crmApiTokens.revokedAt),
            ),
          )
          .limit(1);

        if (!row || row.disabled) {
          return c.json({ error: "Unauthorized" }, 401);
        }

        void db
          .update(schema.crmApiTokens)
          .set({ lastUsedAt: new Date() })
          .where(eq(schema.crmApiTokens.id, row.tokenId));

        c.set("session", {
          user: { id: row.userId },
          session: { token: bearer },
        });
        await next();
        return;
      }
    }

    let headers = c.req.raw.headers;
    if (
      authHeader?.startsWith("Bearer ") &&
      !cookieHeader.includes("better-auth.session_token") &&
      !cookieHeader.includes("__Secure-better-auth.session_token")
    ) {
      const token = authHeader.slice(7).trim();
      if (token && !isCrmApiTokenFormat(token)) {
        headers = new Headers(headers);
        headers.set(
          "Cookie",
          [
            `better-auth.session_token=${token}`,
            `__Secure-better-auth.session_token=${token}`,
          ].join("; "),
        );
      }
    }
    const session = await auth.api.getSession({ headers });
    if (!session?.user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const userId = session.user?.id;
    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const [crmUser] = await db
      .select({ disabled: schema.crmUsers.disabled })
      .from(schema.crmUsers)
      .where(eq(schema.crmUsers.userId, userId))
      .limit(1);

    if (!crmUser) {
      return c.json({ error: "User not found in CRM" }, 404);
    }
    if (crmUser.disabled) {
      return c.json({ error: "Account disabled" }, 403);
    }

    c.set("session", session);
    await next();
  };
}
