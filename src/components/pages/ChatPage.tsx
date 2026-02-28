"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { Shimmer } from "@/components/ai-elements/shimmer";
import {
  Attachment,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from "@/components/ai-elements/attachments";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputFooter,
  PromptInputHeader,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  PromptInputProvider,
  usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { useGatewayChat } from "@/hooks/useGatewayChat";
import { useGateway } from "@/hooks/useGateway";

function getTextContent(
  msg: { content?: unknown; parts?: Array<{ type: string; text?: string }> }
): string {
  if (msg.parts) {
    return msg.parts
      .filter((p) => p.type === "text")
      .map((p) => p.text ?? "")
      .join("");
  }
  const content = msg.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return (content as Array<{ type: string; text?: string }>)
      .filter((p) => p.type === "text")
      .map((p) => p.text ?? "")
      .join("");
  }
  return "";
}

const SUGGESTIONS = [
  "What are my latest deals?",
  "Create a task for following up",
  "Add a note to my top contact",
  "Summarize my pipeline",
  "Who are my hot contacts?",
  "What's the status of my deals?",
];

function PromptInputAttachmentsDisplay() {
  const attachments = usePromptInputAttachments();

  if (attachments.files.length === 0) {
    return null;
  }

  return (
    <Attachments variant="inline">
      {attachments.files.map((attachment) => (
        <Attachment
          data={attachment}
          key={attachment.id}
          onRemove={() => attachments.remove(attachment.id)}
        >
          <AttachmentPreview />
          <AttachmentRemove />
        </Attachment>
      ))}
    </Attachments>
  );
}

export function ChatPage() {
  const { hasKey } = useGateway();
  const { messages, append, status, stop } = useGatewayChat();

  const handleSubmit = useCallback(
    async (message: PromptInputMessage, _event: React.FormEvent<HTMLFormElement>) => {
      if (!hasKey) {
        toast.error("Add your Basics API key in Settings to use the assistant");
        return;
      }
      const hasText = Boolean(message.text?.trim());
      const hasAttachments = Boolean(message.files?.length);

      if (!(hasText || hasAttachments)) {
        return;
      }

      const text = message.text?.trim() || "Sent with attachments";

      if (hasAttachments) {
        toast.success("Files attached", {
          description: `${message.files!.length} file(s) attached. Note: The assistant currently supports text only.`,
        });
      }

      await append({
        role: "user",
        content: text,
      });
    },
    [append, hasKey]
  );

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      append({
        role: "user",
        content: suggestion,
      });
    },
    [append]
  );

  // All user/assistant messages visible in the conversation
  const allVisible = messages.filter(
    (m) => m.role === "user" || m.role === "assistant"
  );

  // Detect the brief window where an assistant message exists but has no text yet
  const lastMsg = allVisible.at(-1);
  const lastAssistantIsEmpty =
    lastMsg?.role === "assistant" && !getTextContent(lastMsg);

  // Show "Thinking..." when submitted (no reply yet) or streaming with no text yet
  const isThinking =
    status === "submitted" ||
    (status === "streaming" && lastAssistantIsEmpty);

  // Drop the empty assistant placeholder while the thinking indicator is shown
  const displayMessages =
    isThinking && lastAssistantIsEmpty
      ? allVisible.slice(0, -1)
      : allVisible;

  const isEmpty = allVisible.length === 0;

  return (
    <div
      className="-m-4 flex min-h-0 flex-col overflow-hidden"
      style={{ height: "calc(100svh - 4rem)" }}
    >
      <PromptInputProvider>
        <Conversation className="min-h-0 flex-1 border-b">
          <ConversationContent>
            {isEmpty && status === "idle" && (
              <div className="flex size-full flex-col items-center justify-center gap-3 p-8 text-center">
                {!hasKey ? (
                  <p className="text-muted-foreground text-sm">
                    Add your Basics API key in Settings to use the assistant.
                  </p>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Ask about your CRM — create tasks, add notes, or update deals.
                  </p>
                )}
              </div>
            )}
            {displayMessages.map((m) => (
              <Message key={m.id} from={m.role as "user" | "assistant"}>
                <MessageContent>
                  <MessageResponse>{getTextContent(m)}</MessageResponse>
                </MessageContent>
              </Message>
            ))}
            {isThinking && (
              <Message from="assistant">
                <MessageContent>
                  <Shimmer className="text-sm">Thinking...</Shimmer>
                </MessageContent>
              </Message>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
        <div className="shrink-0 space-y-4 pt-4">
          {isEmpty && (
            <Suggestions className="px-4">
              {SUGGESTIONS.map((suggestion) => (
                <Suggestion
                  key={suggestion}
                  suggestion={suggestion}
                  onClick={handleSuggestionClick}
                />
              ))}
            </Suggestions>
          )}
          <div className="w-full px-4 pb-4">
            <PromptInput globalDrop multiple onSubmit={handleSubmit}>
              <PromptInputHeader>
                <PromptInputAttachmentsDisplay />
              </PromptInputHeader>
              <PromptInputBody>
                <PromptInputTextarea placeholder="Ask about your CRM..." />
              </PromptInputBody>
              <PromptInputFooter>
                <PromptInputTools>
                  <PromptInputActionMenu>
                    <PromptInputActionMenuTrigger />
                    <PromptInputActionMenuContent>
                      <PromptInputActionAddAttachments />
                    </PromptInputActionMenuContent>
                  </PromptInputActionMenu>
                </PromptInputTools>
                <PromptInputSubmit status={status} onStop={stop} />
              </PromptInputFooter>
            </PromptInput>
          </div>
        </div>
      </PromptInputProvider>
    </div>
  );
}
