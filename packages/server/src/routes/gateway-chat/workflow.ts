import { z } from "zod";

const TOOL_NAMES = [
  "search_contacts",
  "get_contact",
  "create_contact",
  "update_contact",
  "search_companies",
  "get_company",
  "create_company",
  "update_company",
  "search_deals",
  "get_deal",
  "create_deal",
  "update_deal",
  "search_tasks",
  "list_tasks",
  "create_task",
  "complete_task",
  "list_notes",
  "create_note",
  "add_note",
] as const;

const LOOKUP_TOOLS = new Set([
  "search_contacts",
  "get_contact",
  "search_companies",
  "get_company",
  "search_deals",
  "get_deal",
  "search_tasks",
]);

const toolNameSchema = z.enum(TOOL_NAMES);

const workflowStepSchema = z.object({
  tool: toolNameSchema,
  args: z.record(z.unknown()).default({}),
  deferred: z.boolean().default(false),
});

const workflowPlanSchema = z.object({
  mode: z.enum(["none", "single_tool", "multi_tool"]),
  steps: z.array(workflowStepSchema).max(8).default([]),
});

const resolvedStepSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("tool"),
    tool: toolNameSchema,
    args: z.record(z.unknown()),
  }),
  z.object({
    mode: z.literal("blocked"),
    message: z.string().min(1),
  }),
]);

type WorkflowStep = {
  tool: (typeof TOOL_NAMES)[number];
  args: Record<string, unknown>;
  deferred: boolean;
};

export type WorkflowPlan = {
  mode: "none" | "single_tool" | "multi_tool";
  steps: WorkflowStep[];
};

export type ResolvedWorkflowStep =
  | {
      mode: "tool";
      tool: (typeof TOOL_NAMES)[number];
      args: Record<string, unknown>;
    }
  | { mode: "blocked"; message: string };

type LookupCandidate = {
  id: number;
  name: string;
};

function extractStructuredText(text: string): string {
  const trimmed = text.trim();
  const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed);
  if (fenced?.[1]) return fenced[1].trim();
  return trimmed;
}

function parseJsonWithSchema<T>(text: string, schema: z.ZodType<T>): T | null {
  const candidate = extractStructuredText(text);
  if (!candidate) return null;
  try {
    const parsed = JSON.parse(candidate);
    const validated = schema.safeParse(parsed);
    return validated.success ? validated.data : null;
  } catch {
    return null;
  }
}

export function shouldPlanToolWorkflow(queryText: string): boolean {
  const lower = queryText.toLowerCase();
  const isUpdate = /\b(update|rename|change|edit|set|move|bump|mark)\b/.test(lower);
  const isTask = /\b(task|reminder|follow-up|follow up|todo)\b/.test(lower);
  const isNote = /\bnotes?\b/.test(lower);
  const isCreateContact =
    /\b(create|add|make)\b/.test(lower) &&
    /\b(contact|person|lead)\b/.test(lower) &&
    /\bcompany|companies|organization\b/.test(lower);
  const isCreateDeal =
    /\b(create|add|make)\b/.test(lower) &&
    /\b(deal|opportunity|deals|opportunities)\b/.test(lower);
  const isBulk =
    /\b(and also|and then|also|too)\b|,/.test(lower) &&
    /\b(create|add|make|update|complete|added)\b/.test(lower);
  const isMultiAction =
    /\b(create|add|make)\b.*\b(create|add|make)\b/.test(lower) ||
    /\b(update|change|move)\b.*\b(create|add)\b/.test(lower) ||
    /\b(create|add)\b.*\b(update|change|move)\b/.test(lower);
  const isBulkContactCreate =
    /\b(create|add|make)\b/.test(lower) &&
    /\b(contact|person|lead|contacts|people)\b/.test(lower) &&
    /\bat\b/.test(lower);

  return (
    isUpdate ||
    isBulk ||
    isMultiAction ||
    isBulkContactCreate ||
    isTask ||
    isNote ||
    isCreateContact ||
    isCreateDeal
  );
}

export function isLookupTool(toolName: string): boolean {
  return LOOKUP_TOOLS.has(toolName);
}

export function isLookupFailure(result: unknown): boolean {
  if (typeof result !== "string") return false;
  return /^(No .* found\.?|Not found\.?|Error:)/i.test(result.trim());
}

function cleanLookupQuery(text: string): string {
  return text
    .trim()
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/[.?!]+$/g, "")
    .trim();
}

function inferLookupQueryFromUserRequest(
  userQuery: string,
  lookupTool: string,
): string | undefined {
  const lower = userQuery.toLowerCase();
  const entityWord =
    lookupTool === "search_companies"
      ? "company"
      : lookupTool === "search_contacts"
        ? "(?:contact|person|lead)"
        : lookupTool === "search_deals"
          ? "(?:deal|opportunity)"
          : lookupTool === "search_tasks"
            ? "(?:task|todo|reminder|follow-up)"
            : null;
  if (!entityWord) return undefined;

  const betweenEntityAndTo = new RegExp(
    `\\b${entityWord}\\b\\s+(.+?)\\s+\\bto\\b`,
    "i",
  ).exec(userQuery);
  if (betweenEntityAndTo?.[1]) {
    const cleaned = cleanLookupQuery(betweenEntityAndTo[1]);
    if (cleaned) return cleaned;
  }

  if (/\b(update|rename|change|edit|set)\b/.test(lower)) {
    const ofEntity = new RegExp(
      `\\bof\\s+${entityWord}\\b\\s+(.+?)\\s+\\bto\\b`,
      "i",
    ).exec(userQuery);
    if (ofEntity?.[1]) {
      const cleaned = cleanLookupQuery(ofEntity[1]);
      if (cleaned) return cleaned;
    }
  }

  return undefined;
}

function normalizeLookupStepArgs(
  userQuery: string,
  tool: string,
  rawArgs: Record<string, unknown>,
): Record<string, unknown> {
  if (!isLookupTool(tool)) return rawArgs;

  const explicitQuery =
    typeof rawArgs.query === "string"
      ? cleanLookupQuery(rawArgs.query)
      : undefined;
  const inferredQuery = inferLookupQueryFromUserRequest(userQuery, tool);
  const query = inferredQuery || explicitQuery;

  return query ? { ...rawArgs, query } : rawArgs;
}

function extractLookupCandidates(result: string): LookupCandidate[] {
  const candidates: LookupCandidate[] = [];
  const wikiMatches = result.matchAll(
    /\[\[[a-z][a-z0-9-]*\/(\d+)\|([^\]]+)\]\]/gi,
  );
  for (const match of wikiMatches) {
    const id = Number(match[1]);
    const name = match[2]?.trim();
    if (Number.isFinite(id) && name) {
      candidates.push({ id, name });
    }
  }
  return candidates;
}

function normalizeResolvedArgs(
  expectedTool: string,
  rawArgs: Record<string, unknown>,
  candidates: LookupCandidate[],
): Record<string, unknown> {
  const args = { ...rawArgs };
  const first = candidates[0];
  if (!first) return args;

  if (expectedTool === "update_company" || expectedTool === "get_company") {
    if (args.id === undefined && args.company_name === undefined) {
      args.id = first.id;
    }
  }
  if (expectedTool === "update_contact" || expectedTool === "get_contact") {
    if (args.id === undefined && args.contact_name === undefined) {
      args.id = first.id;
    }
  }
  if (expectedTool === "update_deal" || expectedTool === "get_deal") {
    if (args.id === undefined && args.deal_name === undefined) {
      args.id = first.id;
    }
  }
  if (expectedTool === "add_note") {
    if (args.deal_id === undefined && args.deal_name === undefined && args.contact_id === undefined && args.contact_name === undefined) {
      args.deal_id = first.id;
    }
  }
  if (expectedTool === "create_note") {
    if (args.contact_id === undefined && args.contact_name === undefined) {
      args.contact_id = first.id;
    }
  }
  if (expectedTool === "create_task") {
    if (args.contact_id === undefined && args.contact_name === undefined && args.company_id === undefined && args.company_name === undefined) {
      args.contact_id = first.id;
    }
  }

  return args;
}

export async function planToolWorkflow(args: {
  gatewayUrl: string;
  gatewayHeaders: Record<string, string>;
  model: string;
  queryText: string;
}): Promise<WorkflowPlan | null> {
  const prompt = [
    "You are a CRM tool workflow planner.",
    "Return ONLY JSON. No prose, no markdown.",
    'Schema: {"mode":"none|single_tool|multi_tool","steps":[{"tool":"tool_name","args":{},"deferred":false}]}',
    "Rules:",
    "- Use multi_tool when the request needs more than one tool call, or when the user requests multiple separate actions.",
    "- Steps must be in execution order.",
    "- If a step depends on a prior lookup result for id or exact record name, set deferred=true on that step.",
    "- Do not invent ids.",
    "- Keep search queries narrow and based only on the CURRENT/original record being referenced.",
    "- For rename requests like 'rename company alpha to beta', search for 'alpha', not 'beta' and not the whole sentence.",
    "- For requests with 'and also', search only for the record reference, not the later requested changes.",
    "- Include any write fields you already know in step args, even when deferred=true.",
    "- Include every requested action from the user. Do not stop after the first successful action.",
    "- Non-deferred steps should include complete args and should be executable immediately.",
    "- IMPORTANT: Use add_note (not create_note) when adding a note to a DEAL. create_note is for contacts only.",
    "- IMPORTANT: When adding a note to a deal by name, first search_deals to get the deal_id, then add_note with deal_id (deferred=true).",
    "- IMPORTANT: Always include a 'title' arg in add_note and create_note — a short 2-5 word summary of the note.",
    "- IMPORTANT: For bulk requests ('create X and Y', 'add contact A and B'), emit one step per record.",
    "- IMPORTANT: For create_contact or create_deal with a company_name, do NOT search for the company first — pass company_name directly. The tool auto-creates the company if it does not exist.",
    "- IMPORTANT: Only plan create_contact or create_deal if the user has provided the company name in the request. If no company is mentioned for a contact or deal, return mode=none so the main assistant can ask for missing details.",
    "- IMPORTANT: For 'move/mark/bump [deal] to [stage]', plan search_deals then update_deal with status (deferred=true).",
    "- IMPORTANT: For 'add a task for [person name]', plan search_contacts then create_task (deferred=true). The task text comes from what follows the colon.",
    "- IMPORTANT: For 'add a note to [person name]', plan search_contacts then create_note (deferred=true). Always generate a title.",
    "- IMPORTANT: For 'add a note to [deal name] deal', plan search_deals then add_note (deferred=true).",
    "- IMPORTANT: For bulk notes ('add notes: for X — ... for Y — ...'), emit search+note pairs for each person/deal.",
    "- Valid tools: " + TOOL_NAMES.join(", "),
    "Examples:",
    "User: update the name of company about toching to touching company",
    'JSON: {"mode":"multi_tool","steps":[{"tool":"search_companies","args":{"query":"about toching"}},{"tool":"update_company","args":{"name":"touching company"},"deferred":true}]}',
    "User: update the name of company about toching to touching company and also change the description to not touching people",
    'JSON: {"mode":"multi_tool","steps":[{"tool":"search_companies","args":{"query":"about toching"}},{"tool":"update_company","args":{"name":"touching company","description":"not touching people"},"deferred":true}]}',
    "User: update the name of company about toching to touching company and also change the description to not touching people also create a new company called speakl",
    'JSON: {"mode":"multi_tool","steps":[{"tool":"search_companies","args":{"query":"about toching"}},{"tool":"update_company","args":{"name":"touching company","description":"not touching people"},"deferred":true},{"tool":"create_company","args":{"name":"speekl"}}]}',
    "User: add a note to the Acme deal: sent term sheet",
    'JSON: {"mode":"multi_tool","steps":[{"tool":"search_deals","args":{"query":"Acme"}},{"tool":"add_note","args":{"title":"Sent term sheet","text":"sent term sheet"},"deferred":true}]}',
    "User: create contacts John Smith and Jane Doe",
    'JSON: {"mode":"none","steps":[]}',
    "User: add a contact named Sarah Johnson",
    'JSON: {"mode":"none","steps":[]}',
    "User: create a contact Amara Brown at Blue Inc",
    'JSON: {"mode":"single_tool","steps":[{"tool":"create_contact","args":{"first_name":"Amara","last_name":"Brown","company_name":"Blue Inc"}}]}',
    "User: create 3 contacts: John Smith at Acme Corp, Sarah Lee at TechFlow, and Marcus Jones at Vertex Labs",
    'JSON: {"mode":"multi_tool","steps":[{"tool":"create_contact","args":{"first_name":"John","last_name":"Smith","company_name":"Acme Corp"}},{"tool":"create_contact","args":{"first_name":"Sarah","last_name":"Lee","company_name":"TechFlow"}},{"tool":"create_contact","args":{"first_name":"Marcus","last_name":"Jones","company_name":"Vertex Labs"}}]}',
    "User: create contact Sarah Lee at Acme Corp and a deal for them worth 10000",
    'JSON: {"mode":"multi_tool","steps":[{"tool":"create_contact","args":{"first_name":"Sarah","last_name":"Lee","company_name":"Acme Corp"}},{"tool":"create_deal","args":{"name":"Sarah Lee Deal","company_name":"Acme Corp","amount":10000}}]}',
    "User: create a deal called Omega Project for 300k",
    'JSON: {"mode":"none","steps":[]}',
    "User: add a task for Lena Park: send onboarding docs by Friday",
    'JSON: {"mode":"multi_tool","steps":[{"tool":"search_contacts","args":{"query":"Lena Park"}},{"tool":"create_task","args":{"text":"send onboarding docs","due_date":"Friday"},"deferred":true}]}',
    "User: move QA Deal Gamma to closed won",
    'JSON: {"mode":"multi_tool","steps":[{"tool":"search_deals","args":{"query":"QA Deal Gamma"}},{"tool":"update_deal","args":{"status":"closed-won"},"deferred":true}]}',
    "User: add a note to Lena Park: discussed enterprise pricing",
    'JSON: {"mode":"multi_tool","steps":[{"tool":"search_contacts","args":{"query":"Lena Park"}},{"tool":"create_note","args":{"title":"Discussed enterprise pricing","text":"discussed enterprise pricing"},"deferred":true}]}',
    "User: add notes: for Jennifer Wu - follow-up Thursday. For Lena Park - budget approved",
    'JSON: {"mode":"multi_tool","steps":[{"tool":"search_contacts","args":{"query":"Jennifer Wu"}},{"tool":"create_note","args":{"title":"Follow-up Thursday","text":"follow-up Thursday"},"deferred":true},{"tool":"search_contacts","args":{"query":"Lena Park"}},{"tool":"create_note","args":{"title":"Budget approved","text":"budget approved"},"deferred":true}]}',
    "",
    `User request: ${args.queryText}`,
  ].join("\n");

  const res = await fetch(`${args.gatewayUrl}/v1/chat/completions`, {
    method: "POST",
    headers: args.gatewayHeaders,
    body: JSON.stringify({
      model: args.model,
      messages: [{ role: "user", content: prompt }],
      stream: false,
      max_tokens: 600,
    }),
  });

  if (!res.ok) {
    await res.text().catch(() => {});
    return null;
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const text = json.choices?.[0]?.message?.content ?? "";
  const rawPlan = parseJsonWithSchema(text, workflowPlanSchema);
  if (!rawPlan) return null;
  const plan: WorkflowPlan = {
    mode: rawPlan.mode,
    steps: (rawPlan.steps ?? []).map((step) => ({
      tool: step.tool,
      args: normalizeLookupStepArgs(args.queryText, step.tool, step.args ?? {}),
      deferred: step.deferred ?? false,
    })),
  };
  if (plan.mode === "multi_tool" && plan.steps.length >= 1) {
    return plan;
  }
  return plan.mode === "single_tool" || plan.mode === "none" ? plan : null;
}

export async function resolveDeferredToolStep(args: {
  gatewayUrl: string;
  gatewayHeaders: Record<string, string>;
  model: string;
  queryText: string;
  expectedTool: string;
  plannedArgs?: Record<string, unknown>;
  lookupTool: string;
  lookupResult: string;
}): Promise<ResolvedWorkflowStep | null> {
  const prompt = [
    "You are a CRM tool-call resolver.",
    "A lookup step has already been executed.",
    "Return ONLY JSON. No prose, no markdown.",
    'If you can produce the next tool call, return: {"mode":"tool","tool":"tool_name","args":{}}',
    'If the request is blocked, return: {"mode":"blocked","message":"short explanation"}',
    "Rules:",
    `- The next tool MUST be ${args.expectedTool}.`,
    "- Reuse ids or exact names from the lookup result.",
    "- For update/get tools, include the record identifier in args. Prefer id from the lookup result.",
    "- Apply all requested updates from the original user request.",
    "- Preserve any planned args that are already correct.",
    "- Do not do another search.",
    "",
    `Original user request: ${args.queryText}`,
    `Required tool: ${args.expectedTool}`,
    `Planned args: ${JSON.stringify(args.plannedArgs ?? {})}`,
    `Lookup tool: ${args.lookupTool}`,
    `Lookup result: ${args.lookupResult}`,
    `Candidates: ${JSON.stringify(extractLookupCandidates(args.lookupResult))}`,
  ].join("\n");

  const res = await fetch(`${args.gatewayUrl}/v1/chat/completions`, {
    method: "POST",
    headers: args.gatewayHeaders,
    body: JSON.stringify({
      model: args.model,
      messages: [{ role: "user", content: prompt }],
      stream: false,
      max_tokens: 300,
    }),
  });

  if (!res.ok) {
    await res.text().catch(() => {});
    return null;
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const text = json.choices?.[0]?.message?.content ?? "";
  const rawResolved = parseJsonWithSchema(text, resolvedStepSchema);
  if (!rawResolved) return null;
  const resolved: ResolvedWorkflowStep =
    rawResolved.mode === "tool"
      ? {
          mode: "tool",
          tool: rawResolved.tool,
          args: normalizeResolvedArgs(
            args.expectedTool,
            rawResolved.args ?? {},
            extractLookupCandidates(args.lookupResult),
          ),
        }
      : { mode: "blocked", message: rawResolved.message };
  if (resolved.mode === "tool" && resolved.tool !== args.expectedTool) {
    return null;
  }
  return resolved;
}
