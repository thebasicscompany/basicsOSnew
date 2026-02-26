import { useRef, useEffect } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { useAssistantChat } from "./useAssistantChat";

function getTextContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return (content as Array<{ type: string; text?: string }>)
      .filter((p) => p.type === "text")
      .map((p) => p.text ?? "")
      .join("");
  }
  return "";
}

function MarkdownContent({ content }: { content: string }) {
  const html = DOMPurify.sanitize(marked.parse(content) as string);
  return <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: html }} />;
}

export function AssistantChatPanel() {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    error,
  } = useAssistantChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isStreaming = status === "streaming" || status === "submitted";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  return (
    <Card className="flex flex-1 flex-col overflow-hidden">
      <CardContent className="flex flex-1 flex-col gap-0 p-0">
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {messages.length === 0 && !error && (
            <p className="text-muted-foreground text-sm text-center py-8">
              Ask about your CRM — create tasks, add notes, or update deals.
            </p>
          )}
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error.message}
            </div>
          )}
          {messages
            .filter((m) => m.role !== "system")
            .map((m, i) => (
            <div
              key={(m as { id?: string }).id ?? `msg-${i}`}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {m.role === "user" ? (
                  <p className="text-sm whitespace-pre-wrap">{getTextContent(m.content)}</p>
                ) : (
                  <MarkdownContent content={getTextContent(m.content)} />
                )}
              </div>
            </div>
          ))}
          {isStreaming && (
            <div className="flex justify-start">
              <div className="rounded-lg bg-muted px-3 py-2">
                <Spinner size="small" className="inline" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(e);
          }}
          className="flex gap-2 p-4 border-t"
        >
          <Textarea
            value={input}
            onChange={handleInputChange}
            placeholder="Ask about your CRM..."
            className="min-h-0 resize-none"
            rows={2}
            disabled={isStreaming}
          />
          <Button type="submit" disabled={!input.trim() || isStreaming} size="default" className="shrink-0">
            {isStreaming ? <Spinner size="small" /> : "Send"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
