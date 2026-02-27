import { Hono } from "hono";
import { createClient } from "@supabase/supabase-js";
import { assistantSchema } from "@basics-os/shared/schemas";
import type { ContextDbAdapter } from "../adapters/types.js";
import type { Env } from "../env.js";
import {
  ASSISTANT_TOOLS,
  executeAssistantTool,
} from "../assistant/tools.js";

type ChatMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: Array<{ id: string; type: "function"; function: { name: string; arguments: string } }> }
  | { role: "tool"; tool_call_id: string; content: string };

export function createAssistantRoutes(
  db: ContextDbAdapter,
  env: Env
) {
  const app = new Hono();
  const basicosApiUrl = env.BASICOS_API_URL;
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

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

You have access to tools: create_task (add a task for a contact), add_note (add a note to a contact or deal), update_deal (update a deal's stage). Use these when the user asks you to perform actions like "create a task for John" or "add a note to this deal". When using tools, you must have the correct entity IDs from the context.

Context from CRM:
${contextText}`;

    let chatMessages: ChatMessage[] = [
      { role: "system" as const, content: systemPrompt },
      ...history.map((m: { role: string; content: string }) => ({ role: m.role as "user" | "assistant", content: m.content })),
      { role: "user" as const, content: message },
    ];

    // 4. Chat loop: handle tool calls (use stream: false to parse tool_calls)
    let finalContent = "";
    let iterations = 0;
    const maxIterations = 5;

    while (iterations < maxIterations) {
      iterations++;
      const res = await fetch(`${basicosApiUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${salesInfo.apiKey}`,
        },
        body: JSON.stringify({
          model: "basics-chat-smart",
          messages: chatMessages,
          tools: ASSISTANT_TOOLS,
          stream: false,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("[assistant] basicsAdmin error:", res.status, errText);
        return c.json(
          { error: "AI service error", details: errText.slice(0, 200) },
          502
        );
      }

      const json = (await res.json()) as {
        choices?: Array<{
          message?: {
            content?: string | null;
            tool_calls?: Array<{
              id: string;
              type: "function";
              function: { name: string; arguments: string };
            }>;
          };
        }>;
      };

      const choice = json.choices?.[0];
      const msg = choice?.message;
      const toolCalls = msg?.tool_calls;

      if (toolCalls && toolCalls.length > 0) {
        chatMessages.push({
          role: "assistant",
          content: msg?.content ?? null,
          tool_calls: toolCalls,
        });

        for (const tc of toolCalls) {
          let args: Record<string, unknown> = {};
          try {
            args = JSON.parse(tc.function.arguments || "{}");
          } catch {
            // ignore
          }
          const result = await executeAssistantTool(
            supabase,
            salesInfo.salesId,
            tc.function.name,
            args
          );
          chatMessages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: result,
          });
        }
        continue;
      }

      finalContent = msg?.content ?? "";
      break;
    }

    return new Response(createStreamChunk(finalContent), {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  });

  return app;
}

function createStreamChunk(content: string): ReadableStream {
  const data = JSON.stringify({
    id: "chatcmpl-" + Date.now(),
    choices: [{ delta: { content }, index: 0 }],
  });
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
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
