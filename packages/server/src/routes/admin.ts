import { Hono } from "hono";
import { eq, and, gte, sql, desc } from "drizzle-orm";
import { z } from "zod";
import { authMiddleware } from "@/middleware/auth.js";
import type { Db } from "@/db/client.js";
import type { Env } from "@/env.js";
import type { createAuth } from "@/auth.js";
import * as schema from "@/db/schema/index.js";
import { PERMISSIONS, requirePermission } from "@/lib/rbac.js";
import {
  encryptApiKey,
  hashApiKey,
  hasApiKeyEncryptionConfigured,
} from "@/lib/api-key-crypto.js";
import { writeAuditLogSafe } from "@/lib/audit-log.js";

type BetterAuthInstance = ReturnType<typeof createAuth>;

const aiConfigPutSchema = z.object({
  keyType: z.enum(["basicsos", "byok"]),
  byokProvider: z.enum(["openai", "anthropic", "gemini"]).optional().nullable(),
  apiKey: z.string().min(1),
});

const smtpConfigPutSchema = z.object({
  host: z.string().min(1, "Host is required"),
  port: z.coerce.number().int().min(1).max(65535),
  user: z.string().min(1, "User is required"),
  password: z.string().optional(),
  fromEmail: z
    .string()
    .min(1, "From address is required")
    .refine(
      (v) => /@/.test(v) || /<[^>]+@[^>]+>/.test(v),
      "Must contain a valid email address",
    ),
});

export function createAdminRoutes(
  db: Db,
  auth: BetterAuthInstance,
  env: Env,
) {
  const app = new Hono();

  app.get("/ai-config", authMiddleware(auth, db), async (c) => {
    const authz = await requirePermission(c, db, PERMISSIONS.rbacManage);
    if (!authz.ok) return authz.response;
    const { crmUser } = authz;

    if (!crmUser.organizationId) {
      return c.json({ error: "Organization not found" }, 404);
    }

    const [config] = await db
      .select({
        keyType: schema.orgAiConfig.keyType,
        byokProvider: schema.orgAiConfig.byokProvider,
        hasKey: sql<boolean>`${schema.orgAiConfig.apiKeyEnc} IS NOT NULL`,
        updatedAt: schema.orgAiConfig.updatedAt,
        hasTranscriptionKey: sql<boolean>`${schema.orgAiConfig.transcriptionApiKeyEnc} IS NOT NULL`,
        transcriptionByokProvider: schema.orgAiConfig.transcriptionByokProvider,
      })
      .from(schema.orgAiConfig)
      .where(eq(schema.orgAiConfig.organizationId, crmUser.organizationId))
      .limit(1);

    const hasEnvKey = Boolean(
      env.SERVER_BASICS_API_KEY ||
      (env.SERVER_BYOK_PROVIDER && env.SERVER_BYOK_API_KEY),
    );

    return c.json({
      config: config
        ? {
            keyType: config.keyType,
            byokProvider: config.byokProvider,
            hasKey: config.hasKey,
            updatedAt: config.updatedAt,
            hasTranscriptionKey: config.hasTranscriptionKey ?? false,
            transcriptionByokProvider: config.transcriptionByokProvider,
          }
        : null,
      hasEnvFallback: hasEnvKey,
      envFallbackType: env.SERVER_BASICS_API_KEY
        ? "basicsos"
        : env.SERVER_BYOK_PROVIDER
          ? "byok"
          : null,
      envByokProvider: env.SERVER_BYOK_PROVIDER ?? null,
    });
  });

  app.put("/ai-config", authMiddleware(auth, db), async (c) => {
    const authz = await requirePermission(c, db, PERMISSIONS.rbacManage);
    if (!authz.ok) return authz.response;
    const { crmUser } = authz;

    if (!crmUser.organizationId) {
      return c.json({ error: "Organization not found" }, 404);
    }

    let rawBody: unknown;
    try {
      rawBody = await c.req.json();
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400);
    }

    const parsed = aiConfigPutSchema.safeParse(rawBody);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Validation failed";
      return c.json({ error: msg }, 400);
    }

    const { keyType, byokProvider, apiKey } = parsed.data;

    if (keyType === "byok" && !byokProvider) {
      return c.json(
        { error: "byokProvider is required when keyType is 'byok'" },
        400,
      );
    }

    if (!hasApiKeyEncryptionConfigured()) {
      return c.json(
        { error: "API key encryption is not configured on server" },
        500,
      );
    }

    const encrypted = encryptApiKey(apiKey);
    const keyHash = hashApiKey(apiKey);

    const existing = await db
      .select({ id: schema.orgAiConfig.id })
      .from(schema.orgAiConfig)
      .where(eq(schema.orgAiConfig.organizationId, crmUser.organizationId))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(schema.orgAiConfig)
        .set({
          keyType,
          byokProvider: keyType === "byok" ? byokProvider : null,
          apiKeyEnc: encrypted,
          apiKeyHash: keyHash,
          configuredBy: crmUser.id,
          updatedAt: new Date(),
        })
        .where(eq(schema.orgAiConfig.organizationId, crmUser.organizationId));
    } else {
      await db.insert(schema.orgAiConfig).values({
        organizationId: crmUser.organizationId,
        keyType,
        byokProvider: keyType === "byok" ? byokProvider : null,
        apiKeyEnc: encrypted,
        apiKeyHash: keyHash,
        configuredBy: crmUser.id,
      });
    }

    await writeAuditLogSafe(db, {
      crmUserId: crmUser.id,
      organizationId: crmUser.organizationId,
      action: "admin.ai_config.updated",
      entityType: "org_ai_config",
      metadata: { keyType, byokProvider: byokProvider ?? null },
    });

    return c.json({ ok: true });
  });

  const transcriptionByokPatchSchema = z.object({
    provider: z.enum(["deepgram"]).nullable(),
    apiKey: z.string(),
  });

  app.patch("/ai-config/transcription", authMiddleware(auth, db), async (c) => {
    const authz = await requirePermission(c, db, PERMISSIONS.rbacManage);
    if (!authz.ok) return authz.response;
    const { crmUser } = authz;

    if (!crmUser.organizationId) {
      return c.json({ error: "Organization not found" }, 404);
    }

    let rawBody: unknown;
    try {
      rawBody = await c.req.json();
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400);
    }

    const parsed = transcriptionByokPatchSchema.safeParse(rawBody);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Validation failed";
      return c.json({ error: msg }, 400);
    }

    const { provider, apiKey } = parsed.data;

    if (!provider || !apiKey.trim()) {
      const [existing] = await db
        .select({ id: schema.orgAiConfig.id })
        .from(schema.orgAiConfig)
        .where(eq(schema.orgAiConfig.organizationId, crmUser.organizationId))
        .limit(1);
      if (existing) {
        await db
          .update(schema.orgAiConfig)
          .set({
            transcriptionByokProvider: null,
            transcriptionApiKeyEnc: null,
            updatedAt: new Date(),
          })
          .where(eq(schema.orgAiConfig.organizationId, crmUser.organizationId));
      }
      return c.json({ ok: true });
    }

    if (!hasApiKeyEncryptionConfigured()) {
      return c.json(
        { error: "API key encryption is not configured on server" },
        500,
      );
    }

    const encrypted = encryptApiKey(apiKey.trim());
    const existing = await db
      .select({ id: schema.orgAiConfig.id })
      .from(schema.orgAiConfig)
      .where(eq(schema.orgAiConfig.organizationId, crmUser.organizationId))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(schema.orgAiConfig)
        .set({
          transcriptionByokProvider: provider,
          transcriptionApiKeyEnc: encrypted,
          updatedAt: new Date(),
        })
        .where(eq(schema.orgAiConfig.organizationId, crmUser.organizationId));
    } else {
      return c.json(
        {
          error:
            "Set main AI key first. Transcription BYOK requires an existing AI config.",
        },
        400,
      );
    }

    await writeAuditLogSafe(db, {
      crmUserId: crmUser.id,
      organizationId: crmUser.organizationId,
      action: "admin.ai_config.transcription_updated",
      entityType: "org_ai_config",
      metadata: { transcriptionByokProvider: provider },
    });

    return c.json({ ok: true });
  });

  app.get("/smtp-config", authMiddleware(auth, db), async (c) => {
    const authz = await requirePermission(c, db, PERMISSIONS.rbacManage);
    if (!authz.ok) return authz.response;
    const { crmUser } = authz;

    if (!crmUser.organizationId) {
      return c.json({ error: "Organization not found" }, 404);
    }

    const [config] = await db
      .select({
        host: schema.orgSmtpConfig.host,
        port: schema.orgSmtpConfig.port,
        user: schema.orgSmtpConfig.user,
        hasPassword: sql<boolean>`${schema.orgSmtpConfig.passwordEnc} IS NOT NULL`,
        fromEmail: schema.orgSmtpConfig.fromEmail,
        updatedAt: schema.orgSmtpConfig.updatedAt,
      })
      .from(schema.orgSmtpConfig)
      .where(eq(schema.orgSmtpConfig.organizationId, crmUser.organizationId))
      .limit(1);

    const hasEnvSmtp = Boolean(
      env.MAIL_HOST &&
        env.MAIL_PORT != null &&
        env.MAIL_USER &&
        env.MAIL_PASS &&
        env.MAIL_FROM,
    );
    const hasEnvBasicsos = Boolean(env.SERVER_BASICS_API_KEY);

    return c.json({
      config: config
        ? {
            host: config.host,
            port: config.port,
            user: config.user,
            hasPassword: config.hasPassword ?? false,
            fromEmail: config.fromEmail,
            updatedAt: config.updatedAt,
          }
        : null,
      hasEnvFallback: hasEnvSmtp || hasEnvBasicsos,
      hasEnvSmtp,
      hasEnvBasicsos,
    });
  });

  app.put("/smtp-config", authMiddleware(auth, db), async (c) => {
    const authz = await requirePermission(c, db, PERMISSIONS.rbacManage);
    if (!authz.ok) return authz.response;
    const { crmUser } = authz;

    if (!crmUser.organizationId) {
      return c.json({ error: "Organization not found" }, 404);
    }

    let rawBody: unknown;
    try {
      rawBody = await c.req.json();
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400);
    }

    const parsed = smtpConfigPutSchema.safeParse(rawBody);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Validation failed";
      return c.json({ error: msg }, 400);
    }

    const { host, port, user, password, fromEmail } = parsed.data;

    if (!hasApiKeyEncryptionConfigured()) {
      return c.json(
        { error: "API key encryption is not configured on server" },
        500,
      );
    }

    const existing = await db
      .select({ id: schema.orgSmtpConfig.id })
      .from(schema.orgSmtpConfig)
      .where(eq(schema.orgSmtpConfig.organizationId, crmUser.organizationId))
      .limit(1);

    const passwordEnc =
      password && password.trim().length > 0
        ? encryptApiKey(password.trim())
        : undefined;

    if (existing.length > 0) {
      await db
        .update(schema.orgSmtpConfig)
        .set({
          host,
          port,
          user,
          fromEmail,
          configuredBy: crmUser.id,
          updatedAt: new Date(),
          ...(passwordEnc !== undefined && { passwordEnc }),
        })
        .where(
          eq(schema.orgSmtpConfig.organizationId, crmUser.organizationId),
        );
    } else {
      if (!passwordEnc) {
        return c.json({ error: "Password is required for new SMTP config" }, 400);
      }
      await db.insert(schema.orgSmtpConfig).values({
        organizationId: crmUser.organizationId,
        host,
        port,
        user,
        passwordEnc,
        fromEmail,
        configuredBy: crmUser.id,
      });
    }

    await writeAuditLogSafe(db, {
      crmUserId: crmUser.id,
      organizationId: crmUser.organizationId,
      action: "admin.smtp_config.updated",
      entityType: "org_smtp_config",
      metadata: { host, port },
    });

    return c.json({ ok: true });
  });

  app.delete("/smtp-config", authMiddleware(auth, db), async (c) => {
    const authz = await requirePermission(c, db, PERMISSIONS.rbacManage);
    if (!authz.ok) return authz.response;
    const { crmUser } = authz;

    if (!crmUser.organizationId) {
      return c.json({ error: "Organization not found" }, 404);
    }

    await db
      .delete(schema.orgSmtpConfig)
      .where(eq(schema.orgSmtpConfig.organizationId, crmUser.organizationId));

    await writeAuditLogSafe(db, {
      crmUserId: crmUser.id,
      organizationId: crmUser.organizationId,
      action: "admin.smtp_config.cleared",
      entityType: "org_smtp_config",
    });

    return c.json({ ok: true });
  });

  app.delete("/ai-config", authMiddleware(auth, db), async (c) => {
    const authz = await requirePermission(c, db, PERMISSIONS.rbacManage);
    if (!authz.ok) return authz.response;
    const { crmUser } = authz;

    if (!crmUser.organizationId) {
      return c.json({ error: "Organization not found" }, 404);
    }

    await db
      .delete(schema.orgAiConfig)
      .where(eq(schema.orgAiConfig.organizationId, crmUser.organizationId));

    await writeAuditLogSafe(db, {
      crmUserId: crmUser.id,
      organizationId: crmUser.organizationId,
      action: "admin.ai_config.cleared",
      entityType: "org_ai_config",
    });

    return c.json({ ok: true });
  });

  // Per-request usage logs with pagination
  app.get("/usage", authMiddleware(auth, db), async (c) => {
    const authz = await requirePermission(c, db, PERMISSIONS.rbacManage);
    if (!authz.ok) return authz.response;
    const { crmUser } = authz;

    if (!crmUser.organizationId) {
      return c.json({ error: "Organization not found" }, 404);
    }

    const days = Number(c.req.query("days") ?? "30");
    const limit = Math.min(Number(c.req.query("limit") ?? "100"), 500);
    const offset = Number(c.req.query("offset") ?? "0");
    const since = new Date(Date.now() - days * 86400000);

    const rows = await db
      .select({
        id: schema.aiUsageLogs.id,
        crmUserId: schema.aiUsageLogs.crmUserId,
        userName: sql<string>`${schema.crmUsers.firstName} || ' ' || ${schema.crmUsers.lastName}`,
        feature: schema.aiUsageLogs.feature,
        model: schema.aiUsageLogs.model,
        inputTokens: schema.aiUsageLogs.inputTokens,
        outputTokens: schema.aiUsageLogs.outputTokens,
        durationMs: schema.aiUsageLogs.durationMs,
        createdAt: schema.aiUsageLogs.createdAt,
      })
      .from(schema.aiUsageLogs)
      .innerJoin(
        schema.crmUsers,
        eq(schema.aiUsageLogs.crmUserId, schema.crmUsers.id),
      )
      .where(
        and(
          eq(schema.aiUsageLogs.organizationId, crmUser.organizationId),
          gte(schema.aiUsageLogs.createdAt, since),
        ),
      )
      .orderBy(desc(schema.aiUsageLogs.createdAt))
      .limit(limit)
      .offset(offset);

    return c.json({ logs: rows });
  });

  // Daily summary aggregated from usage logs
  app.get("/usage/summary", authMiddleware(auth, db), async (c) => {
    const authz = await requirePermission(c, db, PERMISSIONS.rbacManage);
    if (!authz.ok) return authz.response;
    const { crmUser } = authz;

    if (!crmUser.organizationId) {
      return c.json({ error: "Organization not found" }, 404);
    }

    const days = Number(c.req.query("days") ?? "30");
    const since = new Date(Date.now() - days * 86400000);

    const byUser = await db
      .select({
        crmUserId: schema.aiUsageLogs.crmUserId,
        userName: sql<string>`${schema.crmUsers.firstName} || ' ' || ${schema.crmUsers.lastName}`,
        feature: schema.aiUsageLogs.feature,
        requestCount: sql<number>`count(*)::int`,
        totalInputTokens: sql<number>`coalesce(sum(${schema.aiUsageLogs.inputTokens}), 0)::int`,
        totalOutputTokens: sql<number>`coalesce(sum(${schema.aiUsageLogs.outputTokens}), 0)::int`,
        totalDurationMs: sql<
          number | null
        >`sum(${schema.aiUsageLogs.durationMs})::int`,
      })
      .from(schema.aiUsageLogs)
      .innerJoin(
        schema.crmUsers,
        eq(schema.aiUsageLogs.crmUserId, schema.crmUsers.id),
      )
      .where(
        and(
          eq(schema.aiUsageLogs.organizationId, crmUser.organizationId),
          gte(schema.aiUsageLogs.createdAt, since),
        ),
      )
      .groupBy(
        schema.aiUsageLogs.crmUserId,
        schema.crmUsers.firstName,
        schema.crmUsers.lastName,
        schema.aiUsageLogs.feature,
      );

    const byDay = await db
      .select({
        date: sql<string>`to_char(${schema.aiUsageLogs.createdAt}::date, 'YYYY-MM-DD')`,
        feature: schema.aiUsageLogs.feature,
        requestCount: sql<number>`count(*)::int`,
        totalInputTokens: sql<number>`coalesce(sum(${schema.aiUsageLogs.inputTokens}), 0)::int`,
        totalOutputTokens: sql<number>`coalesce(sum(${schema.aiUsageLogs.outputTokens}), 0)::int`,
        totalDurationMs: sql<
          number | null
        >`sum(${schema.aiUsageLogs.durationMs})::int`,
      })
      .from(schema.aiUsageLogs)
      .where(
        and(
          eq(schema.aiUsageLogs.organizationId, crmUser.organizationId),
          gte(schema.aiUsageLogs.createdAt, since),
        ),
      )
      .groupBy(
        sql`${schema.aiUsageLogs.createdAt}::date`,
        schema.aiUsageLogs.feature,
      )
      .orderBy(sql`${schema.aiUsageLogs.createdAt}::date`);

    const totals = await db
      .select({
        requestCount: sql<number>`count(*)::int`,
        totalInputTokens: sql<number>`coalesce(sum(${schema.aiUsageLogs.inputTokens}), 0)::int`,
        totalOutputTokens: sql<number>`coalesce(sum(${schema.aiUsageLogs.outputTokens}), 0)::int`,
      })
      .from(schema.aiUsageLogs)
      .where(
        and(
          eq(schema.aiUsageLogs.organizationId, crmUser.organizationId),
          gte(schema.aiUsageLogs.createdAt, since),
        ),
      );

    return c.json({
      byUser,
      byDay,
      totals: totals[0] ?? {
        requestCount: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
      },
      days,
    });
  });

  // Slack bot config: save bot token + signing secret + team ID
  app.patch("/slack-bot", authMiddleware(auth, db), async (c) => {
    const authz = await requirePermission(c, db, PERMISSIONS.rbacManage);
    if (!authz.ok) return authz.response;
    const { crmUser } = authz;

    if (!crmUser.organizationId) {
      return c.json({ error: "Organization not found" }, 404);
    }

    let rawBody: unknown;
    try {
      rawBody = await c.req.json();
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400);
    }

    const slackBotSchema = z.object({
      botToken: z.string().min(1).optional().nullable(),
      signingSecret: z.string().min(1).optional().nullable(),
      teamId: z.string().optional().nullable(),
    });

    const parsed = slackBotSchema.safeParse(rawBody);
    if (!parsed.success) {
      return c.json({ error: parsed.error.issues[0]?.message ?? "Validation failed" }, 400);
    }

    if (!hasApiKeyEncryptionConfigured()) {
      return c.json({ error: "Server encryption not configured" }, 500);
    }

    const updates: Partial<{
      slackBotTokenEnc: string | null;
      slackSigningSecret: string | null;
      slackTeamId: string | null;
    }> = {};

    if (parsed.data.botToken !== undefined) {
      updates.slackBotTokenEnc = parsed.data.botToken
        ? encryptApiKey(parsed.data.botToken)
        : null;
    }
    if (parsed.data.signingSecret !== undefined) {
      updates.slackSigningSecret = parsed.data.signingSecret ?? null;
    }
    if (parsed.data.teamId !== undefined) {
      updates.slackTeamId = parsed.data.teamId ?? null;
    }

    if (Object.keys(updates).length === 0) {
      return c.json({ ok: true });
    }

    // Upsert org AI config
    const [existing] = await db
      .select({ id: schema.orgAiConfig.id })
      .from(schema.orgAiConfig)
      .where(eq(schema.orgAiConfig.organizationId, crmUser.organizationId))
      .limit(1);

    if (existing) {
      await db
        .update(schema.orgAiConfig)
        .set(updates)
        .where(eq(schema.orgAiConfig.organizationId, crmUser.organizationId));
    } else {
      await db.insert(schema.orgAiConfig).values({
        organizationId: crmUser.organizationId,
        ...updates,
      });
    }

    return c.json({ ok: true });
  });

  // Slack bot config: get current status (no secrets returned)
  app.get("/slack-bot", authMiddleware(auth, db), async (c) => {
    const authz = await requirePermission(c, db, PERMISSIONS.rbacManage);
    if (!authz.ok) return authz.response;
    const { crmUser } = authz;

    if (!crmUser.organizationId) return c.json({ configured: false });

    const [config] = await db
      .select({
        hasBotToken: schema.orgAiConfig.slackBotTokenEnc,
        signingSecret: schema.orgAiConfig.slackSigningSecret,
        teamId: schema.orgAiConfig.slackTeamId,
      })
      .from(schema.orgAiConfig)
      .where(eq(schema.orgAiConfig.organizationId, crmUser.organizationId))
      .limit(1);

    return c.json({
      configured: Boolean(config?.hasBotToken && config?.signingSecret),
      hasToken: Boolean(config?.hasBotToken),
      hasSigningSecret: Boolean(config?.signingSecret),
      teamId: config?.teamId ?? null,
    });
  });

  return app;
}
