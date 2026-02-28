import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.js";
import type { Db } from "../db/client.js";
import type { Env } from "../env.js";
import type { createAuth } from "../auth.js";
import * as schema from "../db/schema/index.js";
import { eq } from "drizzle-orm";
import { buildCrmSummary, retrieveRelevantContext } from "../lib/context.js";

type BetterAuthInstance = ReturnType<typeof createAuth>;

const BASE_SYSTEM_PROMPT =
  "You are an AI assistant for a CRM. Help the user manage contacts, deals, companies, tasks, and notes. Be concise and helpful.\n\nIMPORTANT: You have tools to query live CRM data. ALWAYS use tools when the user asks about specific records, lists, or details — even if you have some summary context. The summary context is only aggregates; tools return the actual records.";

// CRM tool definitions sent to gateway (OpenAI function format)
const CRM_TOOLS = [
  {
    type: "function",
    function: {
      name: "search_contacts",
      description:
        "Search and list contacts by name, email, or company name.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Free-text search" },
          limit: { type: "number", description: "Max results (default 25)" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_contact",
      description: "Fetch a single contact by ID.",
      parameters: {
        type: "object",
        properties: { id: { type: "number" } },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_contact",
      description: "Create a new contact.",
      parameters: {
        type: "object",
        properties: {
          first_name: { type: "string" },
          last_name: { type: "string" },
          email: { type: "string" },
          status: { type: "string" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_deals",
      description: "Search and list deals.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
          stage: { type: "string" },
          limit: { type: "number" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_companies",
      description: "Search and list companies.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
          limit: { type: "number" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_tasks",
      description: "List tasks for a contact.",
      parameters: {
        type: "object",
        properties: {
          contact_id: { type: "number" },
          limit: { type: "number" },
        },
        required: ["contact_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_task",
      description: "Create a task linked to a contact.",
      parameters: {
        type: "object",
        properties: {
          contact_id: { type: "number" },
          text: { type: "string" },
          type: { type: "string" },
          due_date: { type: "string" },
        },
        required: ["contact_id", "text"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_notes",
      description: "List notes for a contact.",
      parameters: {
        type: "object",
        properties: {
          contact_id: { type: "number" },
          limit: { type: "number" },
        },
        required: ["contact_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_note",
      description: "Add a note to a contact.",
      parameters: {
        type: "object",
        properties: {
          contact_id: { type: "number" },
          text: { type: "string" },
        },
        required: ["contact_id", "text"],
      },
    },
  },
];

// AI SDK v4 data stream protocol codes:
// 0: text delta
// b: tool_call_streaming_start {toolCallId, toolName}
// c: tool_call_delta {toolCallId, argsTextDelta}
// 9: tool_call (complete) {toolCallId, toolName, args}
// a: tool_result {toolCallId, result}
// e: finish_step {finishReason, usage, isContinued}
// d: finish_message {finishReason, usage?}
// 3: error
function sdkPart(code: string, value: unknown): string {
  return `${code}:${JSON.stringify(value)}\n`;
}

// Convert @ai-sdk/react UIMessage[] → OpenAI ChatCompletionMessageParam[]
function toOpenAIMessages(
  uiMessages: unknown[]
): Array<Record<string, unknown>> {
  const out: Array<Record<string, unknown>> = [];

  for (const raw of uiMessages) {
    const msg = raw as {
      role: string;
      content?: unknown;
      parts?: Array<{ type: string; text?: string; toolInvocation?: unknown }>;
    };

    if (msg.role === "user") {
      const text =
        typeof msg.content === "string"
          ? msg.content
          : (
              (msg.parts ?? []) as Array<{ type: string; text?: string }>
            )
              .filter((p) => p.type === "text")
              .map((p) => p.text ?? "")
              .join("");
      out.push({ role: "user", content: text });
    } else if (msg.role === "assistant") {
      const parts = (msg.parts ?? []) as Array<{
        type: string;
        text?: string;
        toolInvocation?: {
          toolCallId: string;
          toolName: string;
          args: unknown;
          state: string;
          result?: unknown;
        };
      }>;

      const toolInvocations = parts.filter((p) => p.type === "tool-invocation");

      if (toolInvocations.length > 0) {
        // Assistant message with tool calls
        out.push({
          role: "assistant",
          content: "",
          tool_calls: toolInvocations.map((p) => ({
            id: p.toolInvocation!.toolCallId,
            type: "function",
            function: {
              name: p.toolInvocation!.toolName,
              arguments: JSON.stringify(p.toolInvocation!.args ?? {}),
            },
          })),
        });

        // Tool result messages (one per invocation that has a result)
        for (const p of toolInvocations) {
          const inv = p.toolInvocation!;
          if (inv.state === "result") {
            out.push({
              role: "tool",
              tool_call_id: inv.toolCallId,
              content: JSON.stringify(inv.result ?? null),
            });
          }
        }
      } else {
        // Plain text assistant message
        const text = parts
          .filter((p) => p.type === "text")
          .map((p) => p.text ?? "")
          .join("");
        if (text || typeof msg.content === "string") {
          out.push({ role: "assistant", content: text || msg.content });
        }
      }
    }
  }

  return out;
}

export function createGatewayChatRoutes(
  db: Db,
  auth: BetterAuthInstance,
  env: Env
) {
  const app = new Hono();

  app.post("/", authMiddleware(auth), async (c) => {
    const session = c.get("session") as { user?: { id: string } };
    const salesRow = await db
      .select()
      .from(schema.sales)
      .where(eq(schema.sales.userId, session.user!.id))
      .limit(1);

    const sale = salesRow[0];
    if (!sale) {
      return c.json({ error: "User not found in CRM" }, 404);
    }

    const apiKey =
      c.req.header("X-Basics-API-Key")?.trim() || sale.basicsApiKey;
    if (!apiKey) {
      return c.json(
        { error: "Basics API key not configured. Add your key in Settings." },
        400
      );
    }

    let body: { messages?: unknown[] };
    try {
      body = (await c.req.json()) as { messages?: unknown[] };
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400);
    }

    const uiMessages = body.messages;
    if (!Array.isArray(uiMessages)) {
      return c.json({ error: "messages array required" }, 400);
    }

    // Convert UIMessage[] → OpenAI format
    const openAIMessages = toOpenAIMessages(uiMessages);

    // Extract last user message text for RAG query
    const lastUserMsg = [...uiMessages]
      .reverse()
      .find((m: unknown) => (m as { role: string }).role === "user");
    const queryText =
      typeof (lastUserMsg as { content?: unknown } | undefined)?.content === "string"
        ? ((lastUserMsg as { content: string }).content as string)
        : "";

    // Build context in parallel — both degrade gracefully on failure
    const [crmSummary, ragContext] = await Promise.all([
      buildCrmSummary(db, sale.id),
      retrieveRelevantContext(db, env.BASICOS_API_URL, apiKey, sale.id, queryText),
    ]);

    // Compose system prompt with live CRM context
    let systemPrompt = BASE_SYSTEM_PROMPT;
    systemPrompt += `\n\n## Your CRM\n${crmSummary}`;
    if (ragContext) {
      systemPrompt += `\n\n## Relevant context\n${ragContext}`;
    }

    let gatewayRes: Response;
    try {
      gatewayRes = await fetch(
        `${env.BASICOS_API_URL}/v1/chat/completions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "basics-chat-smart",
            messages: [
              { role: "system", content: systemPrompt },
              ...openAIMessages,
            ],
            tools: CRM_TOOLS,
            tool_choice: "auto",
            stream: true,
          }),
        }
      );
    } catch (err) {
      console.error("[gateway-chat] fetch error:", err);
      return c.json({ error: "Failed to reach AI gateway" }, 502);
    }

    if (!gatewayRes.ok || !gatewayRes.body) {
      const errText = await gatewayRes.text().catch(() => "");
      console.error(
        "[gateway-chat] gateway error:",
        gatewayRes.status,
        errText
      );
      return c.json({ error: `Gateway error ${gatewayRes.status}` }, 502);
    }

    // Convert raw OpenAI SSE → AI SDK v4 data stream protocol
    const encoder = new TextEncoder();
    const body_ = gatewayRes.body;

    const outStream = new ReadableStream({
      async start(controller) {
        const reader = body_.getReader();
        const decoder = new TextDecoder();
        let buf = "";

        // Accumulate tool call arguments across SSE chunks (keyed by index)
        const toolCallMap: Record<
          number,
          { id: string; name: string; args: string }
        > = {};

        const emit = (s: string) => controller.enqueue(encoder.encode(s));

        try {
          loop: while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buf += decoder.decode(value, { stream: true });
            const lines = buf.split("\n");
            buf = lines.pop() ?? "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const data = line.slice(6).trim();

              if (data === "[DONE]") {
                emit(sdkPart("d", { finishReason: "stop" }));
                break loop;
              }

              let chunk: {
                choices?: Array<{
                  delta?: {
                    content?: string | null;
                    tool_calls?: Array<{
                      index: number;
                      id?: string;
                      function?: { name?: string; arguments?: string };
                    }>;
                  };
                  finish_reason?: string | null;
                }>;
              };
              try {
                chunk = JSON.parse(data);
              } catch {
                continue;
              }

              const choice = chunk.choices?.[0];
              if (!choice) continue;
              const delta = choice.delta;

              // Text content
              if (delta?.content) {
                emit(sdkPart("0", delta.content));
              }

              // Tool call streaming
              if (delta?.tool_calls) {
                for (const tc of delta.tool_calls) {
                  const idx = tc.index;
                  if (tc.id && tc.function?.name) {
                    toolCallMap[idx] = {
                      id: tc.id,
                      name: tc.function.name,
                      args: "",
                    };
                    // Signal new tool call starting
                    emit(
                      sdkPart("b", {
                        toolCallId: tc.id,
                        toolName: tc.function.name,
                      })
                    );
                  }
                  if (tc.function?.arguments && toolCallMap[idx]) {
                    toolCallMap[idx].args += tc.function.arguments;
                    emit(
                      sdkPart("c", {
                        toolCallId: toolCallMap[idx].id,
                        argsTextDelta: tc.function.arguments,
                      })
                    );
                  }
                }
              }

              // Finish reasons
              if (choice.finish_reason === "tool_calls") {
                // Emit complete tool_call parts so client's onToolCall fires
                for (const tc of Object.values(toolCallMap)) {
                  let args: unknown = {};
                  try {
                    args = JSON.parse(tc.args);
                  } catch {}
                  emit(
                    sdkPart("9", {
                      toolCallId: tc.id,
                      toolName: tc.name,
                      args,
                    })
                  );
                }
                emit(
                  sdkPart("e", {
                    finishReason: "tool-calls",
                    usage: { promptTokens: 0, completionTokens: 0 },
                    isContinued: false,
                  })
                );
                emit(sdkPart("d", { finishReason: "tool-calls" }));
                break loop;
              } else if (choice.finish_reason === "stop") {
                emit(sdkPart("d", { finishReason: "stop" }));
                break loop;
              }
            }
          }
        } catch (err) {
          console.error("[gateway-chat] stream read error:", err);
          try {
            emit(sdkPart("3", String(err)));
          } catch {}
        } finally {
          try {
            controller.close();
          } catch {}
        }
      },
    });

    return new Response(outStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Vercel-AI-Data-Stream": "v1",
        "Cache-Control": "no-cache",
      },
    });
  });

  return app;
}
