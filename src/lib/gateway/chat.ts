/**
 * Gateway chat completions — returns raw Response for streaming or JSON.
 */

import type { ApiClient } from "./client";
import type { ChatRequest } from "./types";

/**
 * POST /v1/chat/completions
 * Returns the raw Response so callers can stream SSE or read JSON.
 */
export async function chatCompletions(
  client: ApiClient,
  request: ChatRequest,
): Promise<Response> {
  return client.fetch("/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
}
