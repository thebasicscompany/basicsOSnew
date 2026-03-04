import type { Hono } from "hono";
import { eq } from "drizzle-orm";
import type { Db } from "../../db/client.js";
import type { createAuth } from "../../auth.js";
import * as schema from "../../db/schema/index.js";
import {
  getPermissionSetForUser,
  hasPermission,
  PERMISSIONS,
} from "../../lib/rbac.js";
import {
  encryptApiKey,
  hashApiKey,
  hasApiKeyEncryptionConfigured,
} from "../../lib/api-key-crypto.js";
import { writeAuditLogSafe } from "../../lib/audit-log.js";
import { authMiddleware } from "../../middleware/auth.js";

export function registerMeSettingsRoutes(
  app: Hono,
  db: Db,
  auth: ReturnType<typeof createAuth>,
): void {
  app.get("/me", authMiddleware(auth, db), async (c) => {
    const session = c.get("session");
    const userId = session?.user?.id;
    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const crmUserRows = await db
      .select()
      .from(schema.crmUsers)
      .where(eq(schema.crmUsers.userId, userId))
      .limit(1);

    const crmUser = crmUserRows[0];
    if (!crmUser) {
      return c.json({ error: "User not found in CRM" }, 404);
    }
    const permissions = await getPermissionSetForUser(db, crmUser);

    return c.json({
      id: crmUser.id,
      fullName: `${crmUser.firstName} ${crmUser.lastName}`,
      firstName: crmUser.firstName,
      lastName: crmUser.lastName,
      email: crmUser.email,
      avatar: crmUser.avatar,
      administrator: hasPermission(permissions, PERMISSIONS.rbacManage),
      hasApiKey: Boolean(
        crmUser.basicsApiKeyEnc?.trim() || crmUser.basicsApiKey?.trim(),
      ),
    });
  });

  app.patch("/me", authMiddleware(auth, db), async (c) => {
    const session = c.get("session");
    const userId = session?.user?.id;
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const body = await c.req.json<{ firstName?: string; lastName?: string }>();
    const updates: Partial<{ firstName: string; lastName: string }> = {};
    if (typeof body.firstName === "string" && body.firstName.trim())
      updates.firstName = body.firstName.trim();
    if (typeof body.lastName === "string" && body.lastName.trim())
      updates.lastName = body.lastName.trim();

    if (Object.keys(updates).length === 0)
      return c.json({ error: "No valid fields to update" }, 400);

    await db
      .update(schema.crmUsers)
      .set(updates)
      .where(eq(schema.crmUsers.userId, userId));

    return c.json({ ok: true });
  });

  app.patch("/settings", authMiddleware(auth, db), async (c) => {
    const session = c.get("session");
    const userId = session?.user?.id;
    if (!userId) return c.json({ error: "Unauthorized" }, 401);

    const body = await c.req.json<{ basicsApiKey?: string | null }>();
    const key = body.basicsApiKey?.trim() || null;

    if (key && !hasApiKeyEncryptionConfigured()) {
      return c.json(
        { error: "API key encryption is not configured on server" },
        500,
      );
    }

    const encrypted = key ? encryptApiKey(key) : null;
    const keyHash = key ? hashApiKey(key) : null;

    await db
      .update(schema.crmUsers)
      .set({
        basicsApiKey: null,
        basicsApiKeyEnc: encrypted,
        basicsApiKeyHash: keyHash,
      })
      .where(eq(schema.crmUsers.userId, userId));

    const [crmUser] = await db
      .select({
        id: schema.crmUsers.id,
        organizationId: schema.crmUsers.organizationId,
      })
      .from(schema.crmUsers)
      .where(eq(schema.crmUsers.userId, userId))
      .limit(1);
    if (crmUser) {
      await writeAuditLogSafe(db, {
        crmUserId: crmUser.id,
        organizationId: crmUser.organizationId,
        action: "auth.settings.api_key.updated",
        entityType: "crm_user",
        entityId: crmUser.id,
        metadata: { hasKey: Boolean(key) },
      });
    }

    return c.json({ ok: true });
  });
}
