import { Hono } from "hono";
import { z } from "zod";
import type { ContextDbAdapter } from "../adapters/types.js";
import type { Env } from "../env.js";

const assistantSchema = z.object({
  message: z.string().min(1),
  messages: z.array(z.object({ role: z.string(), content: z.string() })).optional(),
});

export function createAssistantRoutes(
  db: ContextDbAdapter,
  env: Env
) {
  const app = new Hono();
  const basicosApiUrl = env.BASICOS_API_URL;

  app.post("/", async (c) => {
    const authHeader = c.req.header("Authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : null;

    if (!token) {
      return c.json({ error: "Missing or invalid Authorization header" }, 401);
    }

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400);
    }

    const parsed = assistantSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: "Invalid request", details: parsed.error.flatten() }, 400);
    }

    const { message, messages: history = [] } = parsed.data;

    // Resolve user from Supabase JWT
    const userId = await resolveUserIdFromJwt(token, env);
    if (!userId) {
      return c.json({ error: "Invalid or expired token" }, 401);
    }

    const salesInfo = await db.getSalesByUserId(userId);
    if (!salesInfo) {
      return c.json({ error: "User not found in CRM" }, 404);
    }
    if (!salesInfo.apiKey) {
      return c.json(
        { error: "Basics API key not configured. Add your key in Settings." },
        400
      );
    }

    // 1. Embed the query
    const queryEmbedding = await embedQuery(basicosApiUrl, salesInfo.apiKey, message);
    if (!queryEmbedding) {
      return c.json({ error: "Failed to embed query" }, 502);
    }

    // 2. Similarity search
    const chunks = await db.similaritySearch(salesInfo.salesId, queryEmbedding, 5);
    const contextText =
      chunks.length > 0
        ? chunks.map((ch) => ch.chunk_text).join("\n\n---\n\n")
        : "(No relevant context found in your CRM.)";

    // 3. Build messages for chat
    const systemPrompt = `You are an AI assistant for a CRM. Answer the user's question using the following context from their CRM when relevant. If the context doesn't contain relevant information, say so.

Context from CRM:
${contextText}`;

    const chatMessages = [
      { role: "system" as const, content: systemPrompt },
      ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      { role: "user" as const, content: message },
    ];

    // 4. Stream chat from basicsAdmin
    const streamRes = await fetch(`${basicosApiUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${salesInfo.apiKey}`,
      },
      body: JSON.stringify({
        model: "basics-chat-smart",
        messages: chatMessages,
        stream: true,
      }),
    });

    if (!streamRes.ok) {
      const errText = await streamRes.text();
      console.error("[assistant] basicsAdmin error:", streamRes.status, errText);
      return c.json(
        { error: "AI service error", details: errText.slice(0, 200) },
        502
      );
    }

    return new Response(streamRes.body, {
      headers: {
        "Content-Type": streamRes.headers.get("Content-Type") ?? "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  });

  return app;
}

async function resolveUserIdFromJwt(
  token: string,
  env: Env
): Promise<string | null> {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user.id;
}

async function embedQuery(
  basicosApiUrl: string,
  apiKey: string,
  text: string
): Promise<number[] | null> {
  const res = await fetch(`${basicosApiUrl}/v1/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text,
    }),
  });

  if (!res.ok) return null;
  const json = (await res.json()) as { data?: Array<{ embedding?: number[] }> };
  const embedding = json.data?.[0]?.embedding;
  return embedding ?? null;
}
