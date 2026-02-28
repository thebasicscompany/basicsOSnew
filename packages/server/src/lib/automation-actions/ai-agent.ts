import { generateText, tool } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import type { Db } from "../../db/client.js";
import * as schema from "../../db/schema/index.js";
import { eq, like, or } from "drizzle-orm";

export async function executeAIAgent(
  config: Record<string, unknown>,
  _context: Record<string, unknown>,
  db: Db,
  salesId: number,
  apiKey: string,
  env: { BASICOS_API_URL: string },
): Promise<Record<string, unknown>> {
  const {
    objective = "",
    model = "basics-chat-smart",
    maxSteps = 6,
  } = config as {
    objective?: string;
    model?: string;
    maxSteps?: number;
  };

  const openai = createOpenAI({
    baseURL: `${env.BASICOS_API_URL}/v1`,
    apiKey,
  });

  const { text } = await generateText({
    model: openai(model),
    maxSteps,
    system:
      "You are a CRM automation agent. You have access to CRM data and can perform actions on behalf of the user.",
    prompt: objective,
    tools: {
      getContacts: tool({
        description: "Search CRM contacts by name or email",
        parameters: z.object({
          query: z.string().describe("Search query (name or email)"),
        }),
        execute: async ({ query }) => {
          return db
            .select()
            .from(schema.contacts)
            .where(
              or(
                like(schema.contacts.firstName, `%${query}%`),
                like(schema.contacts.lastName, `%${query}%`),
                like(schema.contacts.email, `%${query}%`),
              ),
            )
            .limit(10);
        },
      }),
      getDeals: tool({
        description: "Search CRM deals by name",
        parameters: z.object({
          query: z.string().describe("Search query"),
        }),
        execute: async ({ query }) => {
          return db
            .select()
            .from(schema.deals)
            .where(like(schema.deals.name, `%${query}%`))
            .limit(10);
        },
      }),
      createTask: tool({
        description: "Create a task in the CRM for a contact",
        parameters: z.object({
          text: z.string().describe("Task description"),
          contactId: z.number().describe("Contact ID to associate task with"),
          type: z.string().default("task").describe("Task type"),
        }),
        execute: async ({ text, contactId, type }) => {
          const [task] = await db
            .insert(schema.tasks)
            .values({ salesId, text, contactId, type })
            .returning();
          return task;
        },
      }),
      updateDeal: tool({
        description: "Update a deal's stage",
        parameters: z.object({
          dealId: z.number().describe("Deal ID"),
          stage: z.string().describe("New stage value"),
        }),
        execute: async ({ dealId, stage }) => {
          const [deal] = await db
            .update(schema.deals)
            .set({ stage })
            .where(eq(schema.deals.id, dealId))
            .returning();
          return deal;
        },
      }),
    },
  });

  return { ai_agent_result: text };
}
