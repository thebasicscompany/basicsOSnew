export type VoiceCommand =
  | { type: "create_task"; title: string }
  | { type: "search"; query: string }
  | { type: "navigate"; module: string; url: string }
  | { type: "enrich"; transcript: string }
  | { type: "web_search"; transcript: string }
  | { type: "delete"; transcript: string }
  | { type: "report"; transcript: string }
  | { type: "automation"; transcript: string }
  | { type: "view"; transcript: string }
  | null;

export const MODULE_ROUTES: Record<string, string> = {
  tasks: "/tasks",
  task: "/tasks",
  crm: "/crm",
  contacts: "/contacts",
  deals: "/deals",
  companies: "/companies",
  hub: "/",
  assistant: "/chat",
  ai: "/chat",
  chat: "/chat",
  settings: "/settings",
};

export const detectCommand = (text: string): VoiceCommand => {
  const lower = text.trim().toLowerCase();

  const taskMatch =
    lower.match(/^(?:create|add|new) (?:a )?task[: ]+(.*)/i) ??
    lower.match(/^(?:remind me to|todo)[: ]+(.*)/i);
  if (taskMatch?.[1]) return { type: "create_task", title: taskMatch[1].trim() };

  const searchMatch = lower.match(
    /^(?:search|find|look up|look for)[: ]+(.*)/i
  );
  if (searchMatch?.[1])
    return { type: "search", query: searchMatch[1].trim() };

  const openMatch = lower.match(/^(?:open|go to|show)[: ]+(\w+)/i);
  if (openMatch?.[1]) {
    const mod = openMatch[1].toLowerCase();
    const url = MODULE_ROUTES[mod];
    if (url) return { type: "navigate", module: mod, url };
  }

  // AI agent tool intent patterns — these flow through the normal assistant
  // path but allow the pill to show contextual feedback labels.
  if (/\b(enrich|research)\b.*\b(contact|company)\b/i.test(lower))
    return { type: "enrich", transcript: text };

  if (/\b(search the web|google|look up online|research online)\b/i.test(lower))
    return { type: "web_search", transcript: text };

  if (/\b(delete|remove)\b.*\b(contact|company|deal)\b/i.test(lower))
    return { type: "delete", transcript: text };

  if (/\b(create|make|build)\b.*\b(report|chart|graph|breakdown|dashboard)\b/i.test(lower))
    return { type: "report", transcript: text };

  if (/\bwhen\b.*\bthen\b/i.test(lower))
    return { type: "automation", transcript: text };

  if (/\b(create|set up|make)\b.*\b(automation|workflow)\b/i.test(lower) || /\bautomate\b/i.test(lower))
    return { type: "automation", transcript: text };

  if (/\b(create|make|build)\b.*\b(view|filtered view)\b/i.test(lower))
    return { type: "view", transcript: text };

  return null;
};
