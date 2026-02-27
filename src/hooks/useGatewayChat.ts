import { useChat } from "@ai-sdk/react";
import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useGateway } from "@/hooks/useGateway";
import { ALL_CRM_TOOLS } from "@/lib/gateway/tools";

const API_URL = import.meta.env.VITE_API_URL ?? "";

const TOOL_TO_QUERY_KEYS: Record<string, string[]> = {
  search_contacts: ["contacts_summary"],
  get_contact: ["contacts_summary"],
  create_contact: ["contacts_summary"],
  update_contact: ["contacts_summary"],
  search_deals: ["deals"],
  get_deal: ["deals"],
  create_deal: ["deals"],
  update_deal: ["deals"],
  search_companies: ["companies_summary"],
  create_company: ["companies_summary"],
  list_tasks: ["tasks"],
  create_task: ["tasks"],
  complete_task: ["tasks"],
  list_notes: ["contact_notes"],
  create_note: ["contact_notes"],
};

/**
 * useChat hook for the Hub chat page, using the Gateway proxy.
 * Uses Better Auth session, API key from GatewayProvider, CRM tools with client-side execution.
 */
export function useGatewayChat() {
  const { apiKey, hasKey } = useGateway();
  const queryClient = useQueryClient();

  const fetchWithErrorHandling = useCallback(
    async (url: string | URL | Request, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      if (apiKey) {
        headers.set("X-Basics-API-Key", apiKey);
      }
      const res = await fetch(url, {
        ...init,
        headers,
        credentials: "include",
      });
      if (!res.ok && res.headers.get("content-type")?.includes("application/json")) {
        const json = (await res.json()) as { error?: string; code?: string };
        const err = new Error(json.error ?? `HTTP ${res.status}`);
        (err as Error & { status?: number; code?: string }).status = res.status;
        (err as Error & { status?: number; code?: string }).code = json.code;
        throw err;
      }
      return res;
    },
    [apiKey]
  );

  const handleError = useCallback((error: Error) => {
    const message = error.message ?? String(error);
    const status = (error as Error & { status?: number }).status;
    const code = (error as Error & { code?: string }).code;
    if (status === 401 || message.includes("Invalid or expired token")) {
      toast.error("Please log in again");
    } else if (
      status === 400 ||
      message.includes("API key not configured") ||
      code === "invalid_api_key"
    ) {
      toast.error("Add your Basics API key in Settings to use the assistant");
    } else if (code === "billing_canceled" || code === "billing_delinquent") {
      toast.error("Billing issue. Check your Basics subscription.");
    } else if (code === "rate_limit_exceeded" || code === "quota_exceeded") {
      toast.error("Rate limit exceeded. Try again later.");
    } else if (status === 502 || message.includes("AI service")) {
      toast.error("AI service temporarily unavailable");
    } else {
      toast.error(message.slice(0, 100));
    }
  }, []);

  const handleToolCall = useCallback(
    async ({
      toolCall,
    }: {
      toolCall: { toolCallId: string; toolName: string; args: unknown };
    }) => {
      const tool = ALL_CRM_TOOLS.find((t) => t.name === toolCall.toolName);
      if (!tool) {
        return { error: `Unknown tool: ${toolCall.toolName}` };
      }
      try {
        let args: Record<string, unknown> = {};
        if (typeof toolCall.args === "object" && toolCall.args !== null) {
          args = toolCall.args as Record<string, unknown>;
        } else if (typeof toolCall.args === "string") {
          try {
            args = JSON.parse(toolCall.args) as Record<string, unknown>;
          } catch {
            return { error: "Invalid tool arguments" };
          }
        }
        return await tool.execute(args);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { error: msg };
      }
    },
    []
  );

  const handleFinish = useCallback(
    (message: { toolInvocations?: Array<{ toolName?: string }> }) => {
      const names = new Set<string>();
      for (const inv of message.toolInvocations ?? []) {
        if (inv.toolName) names.add(inv.toolName);
      }
      for (const name of names) {
        const keys = TOOL_TO_QUERY_KEYS[name];
        if (keys) {
          for (const key of keys) {
            queryClient.invalidateQueries({ queryKey: [key] });
          }
        }
      }
    },
    [queryClient]
  );

  return useChat({
    api: `${API_URL}/api/gateway-chat`,
    fetch: fetchWithErrorHandling,
    maxSteps: 5,
    onToolCall: handleToolCall,
    onFinish: handleFinish,
    onError: handleError,
  });
}
