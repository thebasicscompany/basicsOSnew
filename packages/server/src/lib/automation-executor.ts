import type { Db } from "../db/client.js";
import type { Env } from "../env.js";
import type { WorkflowDefinition } from "./automation-engine.js";
import { executeEmail } from "./automation-actions/email.js";
import { executeAI } from "./automation-actions/ai-task.js";
import { executeWebSearch } from "./automation-actions/web-search.js";
import { executeCrmAction } from "./automation-actions/crm-action.js";
import { executeSlack } from "./automation-actions/slack.js";
import { executeGmailRead } from "./automation-actions/gmail-read.js";
import { executeGmailSend } from "./automation-actions/gmail-send.js";
import { executeAIAgent } from "./automation-actions/ai-agent.js";

type SalesRow = { id: number; basicsApiKey?: string | null };

export async function executeWorkflow(
  workflowDef: WorkflowDefinition,
  triggerData: Record<string, unknown>,
  sales: SalesRow,
  db: Db,
  env: Env,
): Promise<Record<string, unknown>> {
  const { nodes, edges } = workflowDef;

  if (!nodes?.length) return { trigger_data: triggerData };

  // Build adjacency list and in-degree map for topological sort
  const adjacency = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const node of nodes) {
    adjacency.set(node.id, []);
    inDegree.set(node.id, 0);
  }

  for (const edge of edges ?? []) {
    adjacency.get(edge.source)?.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
  }

  // Kahn's topological sort
  const queue: string[] = [];
  for (const [nodeId, deg] of inDegree) {
    if (deg === 0) queue.push(nodeId);
  }

  const order: string[] = [];
  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    order.push(nodeId);
    for (const neighbor of adjacency.get(nodeId) ?? []) {
      const newDeg = (inDegree.get(neighbor) ?? 0) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) queue.push(neighbor);
    }
  }

  const context: Record<string, unknown> = {
    trigger_data: triggerData,
    sales_id: sales.id,
  };

  const apiKey = sales.basicsApiKey ?? "";

  for (const nodeId of order) {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) continue;

    const data = resolveTemplates(node.data, context);

    switch (node.type) {
      case "trigger_event":
      case "trigger_schedule":
        // Trigger nodes just initialize context
        break;

      case "action_email":
        await executeEmail(data, context, apiKey, env);
        break;

      case "action_ai": {
        const result = await executeAI(data, context, apiKey, env);
        context.ai_result = result;
        break;
      }

      case "action_web_search": {
        const results = await executeWebSearch(data, context, env, apiKey);
        context.web_results = results;
        break;
      }

      case "action_crm": {
        const crmResult = await executeCrmAction(data, context, db, sales.id);
        context.crm_result = crmResult.crm_result;
        break;
      }

      case "action_slack": {
        const slackResult = await executeSlack(data, context, apiKey, env);
        context.slack_result = slackResult;
        break;
      }

      case "action_gmail_read": {
        const gmailRead = await executeGmailRead(data, context, apiKey, env);
        context.gmail_messages = gmailRead.gmail_messages;
        break;
      }

      case "action_gmail_send":
        await executeGmailSend(data, context, apiKey, env);
        break;

      case "action_ai_agent": {
        const agentResult = await executeAIAgent(data, context, db, sales.id, apiKey, env);
        context.ai_agent_result = agentResult.ai_agent_result;
        break;
      }

      default:
        console.warn(`[automation-executor] unknown node type: ${node.type}`);
    }
  }

  return context;
}

function resolveValue(value: unknown, context: Record<string, unknown>): unknown {
  if (typeof value === "string") {
    return value.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_, varPath) => {
      const parts = varPath.split(".");
      let val: unknown = context;
      for (const part of parts) {
        if (val && typeof val === "object") {
          val = (val as Record<string, unknown>)[part];
        } else {
          val = undefined;
          break;
        }
      }
      if (val === undefined) return `{{${varPath}}}`;
      if (typeof val === "string") return val;
      return JSON.stringify(val);
    });
  }
  if (Array.isArray(value)) {
    return value.map((item) => resolveValue(item, context));
  }
  if (value !== null && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      result[k] = resolveValue(v, context);
    }
    return result;
  }
  return value;
}

function resolveTemplates(
  data: Record<string, unknown>,
  context: Record<string, unknown>,
): Record<string, unknown> {
  return resolveValue(data, context) as Record<string, unknown>;
}
