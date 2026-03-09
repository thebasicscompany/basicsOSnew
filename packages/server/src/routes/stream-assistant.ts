/**
 * Stream assistant - voice pill overlay.
 * Voice is transcribed to text first; then the same chat flow as gateway-chat is used.
 * POST /stream/assistant { message, history, threadId? } -> SSE data: {token}, data: [DONE]
 */

import { Hono } from "hono";
import { authMiddleware } from "@/middleware/auth.js";
import type { Db } from "@/db/client.js";
import type { Env } from "@/env.js";
import type { createAuth } from "@/auth.js";
import { resolveOrgAiConfig, buildGatewayHeaders } from "@/lib/org-ai-config.js";
import { writeUsageLogSafe } from "@/lib/usage-log.js";
import { PERMISSIONS, requirePermission } from "@/lib/rbac.js";
import {
  processChatTurn,
  type ProcessChatTurnResult,
} from "@/routes/gateway-chat.js";
import { streamAssistantPostSchema } from "@/schemas/stream-assistant.js";

type BetterAuthInstance = ReturnType<typeof createAuth>;

export function createStreamAssistantRoutes(
  db: Db,
  auth: BetterAuthInstance,
  env: Env,
) {
  const app = new Hono();

  app.post("/assistant", authMiddleware(auth, db), async (c) => {
    const authz = await requirePermission(c, db, PERMISSIONS.recordsWrite);
    if (!authz.ok) return authz.response;

    const aiResult = await resolveOrgAiConfig(c, db, env);
    if (!aiResult.ok) return aiResult.response;
    const { crmUser, aiConfig } = aiResult.data;
    const gatewayHeaders = buildGatewayHeaders(aiConfig);

    let rawBody: unknown;
    try {
      rawBody = await c.req.json();
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400);
    }
    const parsed = streamAssistantPostSchema.safeParse(rawBody);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Validation failed";
      return c.json({ error: msg }, 400);
    }
    const { message, history, threadId: threadIdRaw } = parsed.data;

    // Same input shape as chat: messages array + threadId + channel.
    const messages = [
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: "user" as const, content: message },
    ];

    const requestStart = Date.now();
    let result: ProcessChatTurnResult;
    try {
      result = await processChatTurn(db, env, {
        crmUser,
        gatewayHeaders,
        gatewayUrl: env.BASICSOS_API_URL,
        messages,
        threadId: threadIdRaw?.trim() || undefined,
        channel: "voice",
      });
    } catch (err) {
      const status = (err as { status?: number })?.status;
      const details = (err as { details?: string })?.details;
      if (status === 502) {
        return c.json(
          {
            error: (err as Error).message,
            ...(details && { details }),
          },
          502,
        );
      }
      if ((err as Error).message === "No user message found") {
        return c.json({ error: "No user message found" }, 400);
      }
      if ((err as Error).message === "Organization not found") {
        return c.json({ error: "Organization not found" }, 404);
      }
      throw err;
    }

    writeUsageLogSafe(db, {
      organizationId: crmUser.organizationId ?? "",
      crmUserId: crmUser.id,
      feature: "assistant",
      model: "basics-chat-smart",
      inputTokens: 0,
      outputTokens: 0,
      durationMs: Date.now() - requestStart,
    });

    const encoder = new TextEncoder();
    const outStream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ token: result.finalContent })}\n\n`,
          ),
        );
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(outStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Thread-Id": result.threadId,
        "Access-Control-Expose-Headers": "X-Thread-Id",
      },
    });
  });

  return app;
}
