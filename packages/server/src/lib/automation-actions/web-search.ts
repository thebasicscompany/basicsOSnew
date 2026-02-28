import { Exa } from "exa-js";

export async function executeWebSearch(
  config: Record<string, unknown>,
  _context: Record<string, unknown>,
  env: { EXA_API_KEY?: string },
): Promise<Array<{ title: string; url: string; text?: string }>> {
  const { query, numResults = 5 } = config as {
    query: string;
    numResults?: number;
  };

  if (!env.EXA_API_KEY) {
    throw new Error("EXA_API_KEY is not configured");
  }

  const exa = new Exa(env.EXA_API_KEY);
  const results = await exa.search(query, { numResults: numResults as number });

  return results.results.map((r) => ({
    title: r.title ?? "",
    url: r.url,
    text: (r as { text?: string }).text,
  }));
}
