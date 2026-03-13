import { Hono } from "hono";
import { createHmac, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import type { Db } from "@/db/client.js";
import type { Env } from "@/env.js";
import type { createAuth } from "@/auth.js";
import * as schema from "@/db/schema/index.js";
import { decryptApiKey } from "@/lib/api-key-crypto.js";
import { buildGatewayHeaders } from "@/lib/org-ai-config.js";
import { processChatTurn } from "@/routes/gateway-chat.js";
import type { ChatMessage } from "@/routes/gateway-chat/protocol.js";

type Auth = ReturnType<typeof createAuth>;

const SLACK_REPLAY_WINDOW_SEC = 300;

/** Verify Slack request signature using signing secret per Slack docs.
 *  Base string format: v0:{x-slack-request-timestamp}:{rawBody}
 */
function verifySlackSignature(
  rawBody: string,
  signature: string | undefined,
  timestamp: string | undefined,
  signingSecret: string,
): boolean {
  if (!signature?.startsWith("v0=")) return false;
  if (!timestamp) return false;

  // Replay protection: reject if timestamp is > 5 minutes old
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts)) return false;
  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - ts) > SLACK_REPLAY_WINDOW_SEC) return false;

  const basestring = `v0:${timestamp}:${rawBody}`;
  const computed = "v0=" + createHmac("sha256", signingSecret).update(basestring).digest("hex");
  try {
    return timingSafeEqual(
      Buffer.from(signature, "utf8"),
      Buffer.from(computed, "utf8"),
    );
  } catch {
    return false;
  }
}

function parseSlackEvent(rawBody: string): {
  type?: string;
  challenge?: string;
  event?: Record<string, unknown>;
  event_id?: string;
} {
  try {
    return JSON.parse(rawBody) as {
      type?: string;
      challenge?: string;
      event?: Record<string, unknown>;
      event_id?: string;
    };
  } catch {
    return {};
  }
}

/** Strip bot @mention from message text */
function stripMention(text: string): string {
  return text.replace(/<@[A-Z0-9]+>/g, "").trim();
}

export function createSlackEventsRoutes(db: Db, _auth: Auth, env: Env) {
  const app = new Hono();

  // Slack Events API: POST /api/slack/events
  // Must use raw body for signature verification — do NOT parse JSON before verifying
  app.post("/events", async (c) => {
    const rawBody = await c.req.text();
    const signature = c.req.header("x-slack-signature");
    const timestamp = c.req.header("x-slack-request-timestamp");

    const parsed = parseSlackEvent(rawBody);

    // Handle url_verification challenge (required for Slack Events API setup)
    if (parsed.type === "url_verification") {
      return c.json({ challenge: parsed.challenge ?? "" });
    }

    // Find the org config that matches this signing secret
    const allConfigs = await db.select().from(schema.orgAiConfig);
    let matchedConfig: (typeof allConfigs)[0] | null = null;
    for (const config of allConfigs) {
      if (
        config.slackSigningSecret &&
        verifySlackSignature(rawBody, signature, timestamp, config.slackSigningSecret)
      ) {
        matchedConfig = config;
        break;
      }
    }

    if (!matchedConfig) {
      return c.json({ error: "Invalid signature" }, 401);
    }

    if (parsed.type !== "event_callback") {
      return c.json({ ok: true });
    }

    const event = parsed.event as Record<string, unknown> | undefined;
    if (!event) return c.json({ ok: true });

    // Slack requires 200 within 3 seconds — acknowledge immediately, process async
    const eventType = event.type as string | undefined;
    if (eventType === "app_mention" || (eventType === "message" && event.thread_ts)) {
      // Skip bot's own messages (subtype "bot_message" or has bot_id)
      if (event.subtype === "bot_message" || event.bot_id) {
        return c.json({ ok: true });
      }
      void processSlackEvent(db, env, matchedConfig, event, parsed.event_id).catch(() => {});
    }

    return c.json({ ok: true });
  });

  return app;
}

async function processSlackEvent(
  db: Db,
  env: Env,
  orgConfig: (typeof schema.orgAiConfig.$inferSelect),
  event: Record<string, unknown>,
  _eventId?: string,
): Promise<void> {
  const { organizationId, slackBotTokenEnc } = orgConfig;
  if (!slackBotTokenEnc) return;

  const botToken = decryptApiKey(slackBotTokenEnc);
  if (!botToken) return;

  const messageText = stripMention((event.text as string | undefined) ?? "");
  if (!messageText) return;

  const channel = event.channel as string | undefined;
  const threadTs = (event.thread_ts ?? event.ts) as string | undefined;
  if (!channel) return;

  // Resolve the first admin CRM user for this org to run the chat turn
  const [crmUser] = await db
    .select()
    .from(schema.crmUsers)
    .where(eq(schema.crmUsers.organizationId, organizationId))
    .orderBy(schema.crmUsers.id)
    .limit(1);

  if (!crmUser) return;

  // Resolve org AI config for gateway headers
  const [aiConfig] = await db
    .select()
    .from(schema.orgAiConfig)
    .where(eq(schema.orgAiConfig.organizationId, organizationId))
    .limit(1);

  if (!aiConfig?.apiKeyEnc) return;
  const apiKey = decryptApiKey(aiConfig.apiKeyEnc);
  if (!apiKey) return;

  const gatewayHeaders = buildGatewayHeaders({
    keyType: "basicsos",
    apiKey,
    byokProvider: null,
  });

  const messages: ChatMessage[] = [{ role: "user", content: messageText }];

  let result;
  try {
    result = await processChatTurn(db, env, {
      crmUser,
      gatewayHeaders,
      gatewayUrl: env.BASICSOS_API_URL,
      messages,
      channel: "slack",
    });
  } catch {
    return;
  }

  // Post response back to Slack
  const responseText = result.finalContent;
  if (!responseText) return;

  await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${botToken}`,
    },
    body: JSON.stringify({
      channel,
      text: responseText,
      thread_ts: threadTs,
    }),
  });
}
