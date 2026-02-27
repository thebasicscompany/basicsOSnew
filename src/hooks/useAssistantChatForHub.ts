import { useChat } from "@ai-sdk/react";
import { useCallback } from "react";
import { toast } from "sonner";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";

const API_URL = import.meta.env.VITE_API_URL ?? "";

/**
 * useChat hook for the Hub chat page. Uses toast for errors instead of ra-core useNotify,
 * so it works outside the CRM Admin context.
 */
export function useAssistantChatForHub() {
  const session = useSupabaseSession();

  const fetchWithErrorHandling = useCallback(
    async (url: string | URL | Request, init?: RequestInit) => {
      const res = await fetch(url, init);
      if (!res.ok && res.headers.get("content-type")?.includes("application/json")) {
        const json = (await res.json()) as { error?: string };
        const err = new Error(json.error ?? `HTTP ${res.status}`);
        (err as Error & { status?: number }).status = res.status;
        throw err;
      }
      return res;
    },
    []
  );

  const handleError = useCallback((error: Error) => {
    const message = error.message ?? String(error);
    const status = (error as Error & { status?: number }).status;
    if (status === 401 || message.includes("Invalid or expired token")) {
      toast.error("Please log in again");
    } else if (status === 400 || message.includes("Basics API key not configured")) {
      toast.error("Add your Basics API key in Settings to use the assistant");
    } else if (status === 502 || message.includes("AI service")) {
      toast.error("AI service temporarily unavailable");
    } else {
      toast.error(message.slice(0, 100));
    }
  }, []);

  return useChat({
    fetch: fetchWithErrorHandling,
    api: `${API_URL}/assistant`,
    headers: {
      Authorization: `Bearer ${session?.access_token ?? ""}`,
      "Content-Type": "application/json",
    },
    experimental_prepareRequestBody: ({ messages }) => {
      const lastMsg = messages[messages.length - 1];
      const content =
        typeof lastMsg?.content === "string"
          ? lastMsg.content
          : Array.isArray(lastMsg?.content)
            ? (lastMsg.content as Array<{ type: string; text?: string }>)
                .filter((p) => p.type === "text")
                .map((p) => p.text ?? "")
                .join("")
            : "";
      return {
        message: content,
        messages: messages.slice(0, -1).map((m) => ({
          role: m.role,
          content:
            typeof m.content === "string"
              ? m.content
              : Array.isArray(m.content)
                ? (m.content as Array<{ type: string; text?: string }>)
                    .filter((p) => p.type === "text")
                    .map((p) => p.text ?? "")
                    .join("")
                : "",
        })),
      };
    },
    onError: handleError,
  });
}
