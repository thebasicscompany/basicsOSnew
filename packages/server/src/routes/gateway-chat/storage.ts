import { and, eq } from "drizzle-orm";
import type { Db } from "@/db/client.js";
import * as schema from "@/db/schema/index.js";

export async function ensureThread(
  db: Db,
  crmUser: typeof schema.crmUsers.$inferSelect,
  threadIdRaw?: string,
  channelRaw?: string,
): Promise<string> {
  if (!crmUser.organizationId) throw new Error("Organization not found");
  const channel =
    channelRaw === "voice" || channelRaw === "automation" ? channelRaw : "chat";

  if (threadIdRaw?.trim()) {
    const id = threadIdRaw.trim();
    const existing = await db
      .select({ id: schema.aiThreads.id })
      .from(schema.aiThreads)
      .where(
        and(
          eq(schema.aiThreads.id, id),
          eq(schema.aiThreads.crmUserId, crmUser.id),
        ),
      )
      .limit(1);
    if (existing[0]) return id;
  }

  const [inserted] = await db
    .insert(schema.aiThreads)
    .values({
      crmUserId: crmUser.id,
      organizationId: crmUser.organizationId,
      channel,
    })
    .returning({ id: schema.aiThreads.id });

  if (!inserted) throw new Error("Failed to create thread");
  return inserted.id;
}

export async function persistMessage(
  db: Db,
  threadId: string,
  role: "user" | "assistant" | "tool",
  content: string,
  opts?: { toolName?: string; toolArgs?: unknown; toolResult?: unknown },
): Promise<void> {
  await db.insert(schema.aiMessages).values({
    threadId,
    role,
    content,
    toolName: opts?.toolName ?? null,
    toolArgs: opts?.toolArgs ?? null,
    toolResult: opts?.toolResult ?? null,
  });
}
