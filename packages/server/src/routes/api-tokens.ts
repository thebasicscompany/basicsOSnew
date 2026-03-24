import { Hono } from "hono";
import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { authMiddleware } from "@/middleware/auth.js";
import type { Db } from "@/db/client.js";
import type { Env } from "@/env.js";
import type { createAuth } from "@/auth.js";
import * as schema from "@/db/schema/index.js";
import {
  getPermissionSetForUser,
  hasPermission,
  PERMISSIONS,
} from "@/lib/rbac.js";
import { generateCrmApiToken } from "@/lib/crm-api-token-crypto.js";

const createBodySchema = z.object({
  name: z.string().trim().min(1).max(255),
});

type BetterAuthInstance = ReturnType<typeof createAuth>;

export function createApiTokensRoutes(db: Db, auth: BetterAuthInstance, _env: Env) {
  const app = new Hono();

  app.use("*", authMiddleware(auth, db));

  app.get("/", async (c) => {
    const session = c.get("session") as { user?: { id?: string } } | undefined;
    const userId = session?.user?.id;
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const [crmUser] = await db
      .select()
      .from(schema.crmUsers)
      .where(eq(schema.crmUsers.userId, userId))
      .limit(1);
    if (!crmUser) return c.json({ error: "User not found in CRM" }, 404);

    const permissions = await getPermissionSetForUser(db, crmUser);
    if (!hasPermission(permissions, PERMISSIONS.recordsWrite)) {
      return c.json({ error: "Forbidden" }, 403);
    }

    const rows = await db
      .select({
        id: schema.crmApiTokens.id,
        name: schema.crmApiTokens.name,
        tokenPrefix: schema.crmApiTokens.tokenPrefix,
        createdAt: schema.crmApiTokens.createdAt,
        lastUsedAt: schema.crmApiTokens.lastUsedAt,
      })
      .from(schema.crmApiTokens)
      .where(
        and(
          eq(schema.crmApiTokens.crmUserId, crmUser.id),
          isNull(schema.crmApiTokens.revokedAt),
        ),
      )
      .orderBy(desc(schema.crmApiTokens.createdAt));

    return c.json({ tokens: rows });
  });

  app.post("/", async (c) => {
    const session = c.get("session") as { user?: { id?: string } } | undefined;
    const userId = session?.user?.id;
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const [crmUser] = await db
      .select()
      .from(schema.crmUsers)
      .where(eq(schema.crmUsers.userId, userId))
      .limit(1);
    if (!crmUser) return c.json({ error: "User not found in CRM" }, 404);
    if (!crmUser.organizationId) {
      return c.json({ error: "Organization not found" }, 404);
    }

    const permissions = await getPermissionSetForUser(db, crmUser);
    if (!hasPermission(permissions, PERMISSIONS.recordsWrite)) {
      return c.json({ error: "Forbidden" }, 403);
    }

    let rawBody: unknown;
    try {
      rawBody = await c.req.json();
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400);
    }
    const parsed = createBodySchema.safeParse(rawBody);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Validation failed";
      return c.json({ error: msg }, 400);
    }

    const { fullToken, tokenPrefix, hash } = generateCrmApiToken();

    const [inserted] = await db
      .insert(schema.crmApiTokens)
      .values({
        crmUserId: crmUser.id,
        organizationId: crmUser.organizationId,
        name: parsed.data.name,
        tokenPrefix,
        tokenHash: hash,
      })
      .returning({
        id: schema.crmApiTokens.id,
        name: schema.crmApiTokens.name,
        tokenPrefix: schema.crmApiTokens.tokenPrefix,
        createdAt: schema.crmApiTokens.createdAt,
      });

    if (!inserted) {
      return c.json({ error: "Failed to create token" }, 500);
    }

    return c.json(
      {
        token: fullToken,
        id: inserted.id,
        name: inserted.name,
        tokenPrefix: inserted.tokenPrefix,
        createdAt: inserted.createdAt,
      },
      201,
    );
  });

  app.delete("/:id", async (c) => {
    const session = c.get("session") as { user?: { id?: string } } | undefined;
    const userId = session?.user?.id;
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const [crmUser] = await db
      .select()
      .from(schema.crmUsers)
      .where(eq(schema.crmUsers.userId, userId))
      .limit(1);
    if (!crmUser) return c.json({ error: "User not found in CRM" }, 404);

    const permissions = await getPermissionSetForUser(db, crmUser);
    if (!hasPermission(permissions, PERMISSIONS.recordsWrite)) {
      return c.json({ error: "Forbidden" }, 403);
    }

    const id = c.req.param("id");
    const result = await db
      .update(schema.crmApiTokens)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(schema.crmApiTokens.id, id),
          eq(schema.crmApiTokens.crmUserId, crmUser.id),
          isNull(schema.crmApiTokens.revokedAt),
        ),
      )
      .returning({ id: schema.crmApiTokens.id });

    if (result.length === 0) {
      return c.json({ error: "Not found" }, 404);
    }

    return c.json({ ok: true });
  });

  return app;
}
